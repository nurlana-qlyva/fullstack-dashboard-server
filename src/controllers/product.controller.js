const Product = require("../models/Product");
const { AppError } = require("../utils/AppError");
const { buildProductQuery } = require("../utils/buildProductQuery");

async function createProduct(req, res, next) {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (e) {
    // unique sku hatası
    if (e.code === 11000) return next(new AppError("SKU already exists", 409));
    next(e);
  }
}

async function getProductById(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return next(new AppError("Product not found", 404));
    res.json(product);
  } catch (e) {
    next(e);
  }
}

async function updateProduct(req, res, next) {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return next(new AppError("Product not found", 404));
    res.json(updated);
  } catch (e) {
    if (e.code === 11000) return next(new AppError("SKU already exists", 409));
    next(e);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return next(new AppError("Product not found", 404));
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

async function listProducts(req, res, next) {
  try {
    const { page, limit, skip, sort, filter, q } = buildProductQuery(req.query);

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select("_id title sku price currency category tags stock status soldCount createdAt updatedAt"),
      Product.countDocuments(filter),
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      q,
      items,
    });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  listProducts,
};
