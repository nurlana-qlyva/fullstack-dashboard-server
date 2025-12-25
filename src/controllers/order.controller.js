const Order = require("../models/Order");
const Product = require("../models/Product");
const { AppError } = require("../utils/AppError");
const mongoose = require("mongoose");

async function createOrder(req, res, next) {
  try {
    const {
      customer,
      items,
      currency = "TRY",
      shipping = 0,
      discount = 0,
      status = "pending",
    } = req.body;

    if (!customer) return next(new AppError("customer is required", 400));
    if (!Array.isArray(items) || items.length === 0)
      return next(new AppError("items is required", 400));

    // ürün snapshot + fiyat doğrulama (basit)
    const productIds = items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: productIds } }).select(
      "_id title sku price currency"
    );
    const byId = new Map(products.map((p) => [String(p._id), p]));

    let subtotal = 0;
    const normalized = items.map((i) => {
      const p = byId.get(String(i.product));
      if (!p) throw new AppError("Invalid product in items", 400);

      const qty = Number(i.qty || 1);
      if (!Number.isFinite(qty) || qty < 1)
        throw new AppError("Invalid qty", 400);

      const price = Number(i.price ?? p.price); // istersen sadece p.price kullan
      subtotal += price * qty;

      return {
        product: p._id,
        titleSnapshot: p.title,
        skuSnapshot: p.sku,
        price,
        qty,
      };
    });

    const total = Math.max(
      0,
      subtotal + Number(shipping || 0) - Number(discount || 0)
    );

    const order = await Order.create({
      customer,
      items: normalized,
      currency,
      subtotal,
      shipping,
      discount,
      total,
      status,
    });

    res.status(201).json(order);
  } catch (e) {
    next(e);
  }
}

async function listOrders(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [items, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("_id customer total currency status createdAt")
        .populate("customer", "name email"),
      Order.countDocuments(filter),
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      items,
    });
  } catch (e) {
    next(e);
  }
}

async function recentOrders(req, res, next) {
  try {
    const limit = Math.min(10, Math.max(1, Number(req.query.limit || 5)));

    const items = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("_id total currency status createdAt customer")
      .populate("customer", "name email");

    res.json(items);
  } catch (e) {
    next(e);
  }
}

async function getOrderById(req, res, next) {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer", "name email role")
      .populate(
        "items.product",
        "title sku category stock status price currency"
      );

    if (!order) return next(new AppError("Order not found", 404));
    res.json(order);
  } catch (e) {
    next(e);
  }
}

// ✅ PATCH /api/orders/:id/status
async function updateOrderStatus(req, res, next) {
  const session = await mongoose.startSession();

  try {
    const { status } = req.body;

    const allowed = [
      "pending",
      "processing",
      "completed",
      "cancelled",
      "refunded",
    ];
    if (!allowed.includes(status)) {
      return next(new AppError("Invalid status", 400));
    }

    await session.withTransaction(async () => {
      const order = await Order.findById(req.params.id).session(session);
      if (!order) throw new AppError("Order not found", 404);

      const prevStatus = order.status;
      if (prevStatus === status) return;

      // ❌ completed → pending/processing geri dönmesin
      if (
        prevStatus === "completed" &&
        ["pending", "processing"].includes(status)
      ) {
        throw new AppError("Completed order cannot be reverted", 400);
      }

      const toCompleted = prevStatus !== "completed" && status === "completed";
      const fromCompleted =
        prevStatus === "completed" &&
        ["cancelled", "refunded"].includes(status);

      // 🔁 STOCK SYNC
      if (toCompleted || fromCompleted) {
        for (const item of order.items) {
          const qty = Number(item.qty || 0);
          if (!qty) continue;

          const productId = item.product?._id || item.product;
          const product = await Product.findById(productId).session(session);

          if (!product) {
            throw new AppError("Product not found for order item", 400);
          }

          if (toCompleted) {
            if ((product.stock ?? 0) < qty) {
              throw new AppError(
                `Insufficient stock for ${product.title}`,
                400
              );
            }
            product.stock = (product.stock ?? 0) - qty;
          }

          if (fromCompleted) {
            product.stock = (product.stock ?? 0) + qty;
          }

          await product.save({ session });
        }
      }

      order.status = status;
      await order.save({ session });
    });

    const updated = await Order.findById(req.params.id)
      .populate("customer", "name email")
      .populate("items.product", "title sku stock");

    res.json(updated);
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
}

module.exports = {
  createOrder,
  listOrders,
  getOrderById,
  updateOrderStatus,
  recentOrders,
};
