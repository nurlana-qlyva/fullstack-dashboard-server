const Product = require("../models/Product");
const Order = require("../models/Order");

async function getProductAnalytics(req, res, next) {
  try {
    const [result] = await Product.aggregate([
      {
        $facet: {
          byCategory: [
            { $group: { _id: "$category", value: { $sum: 1 } } },
            { $sort: { value: -1 } },
            { $limit: 12 },
            { $project: { _id: 0, label: "$_id", value: 1 } },
          ],

          byStatus: [
            { $group: { _id: "$status", value: { $sum: 1 } } },
            { $sort: { value: -1 } },
            { $project: { _id: 0, label: "$_id", value: 1 } },
          ],

          priceBuckets: [
            {
              $bucket: {
                groupBy: "$price",
                boundaries: [
                  0, 10000, 25000, 50000, 100000, 250000, 1000000000,
                ],
                default: "250k+",
                output: { value: { $sum: 1 } },
              },
            },
            {
              $project: {
                _id: 0,
                label: { $toString: "$_id" },
                value: 1,
              },
            },
          ],
        },
      },
    ]);

    res.json({
      byCategory: result.byCategory,
      byStatus: result.byStatus,
      priceBuckets: result.priceBuckets,
    });
  } catch (e) {
    next(e);
  }
}

function rangeToDays(range) {
  if (range === "7d") return 7;
  if (range === "30d") return 30;
  if (range === "90d") return 90;
  if (range === "1y") return 365;
  return 7;
}

async function advancedAnalytics(req, res, next) {
  try {
    const days = rangeToDays(req.query.range);
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // sadece “completed” üzerinden revenue istersen burada filtrele
    const match = { createdAt: { $gte: from } };
    // örn sadece completed: const match = { createdAt: { $gte: from }, status: "completed" };

    // 1) KPI: revenue, orders count, avg order value
    const kpiAgg = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          revenue: { $sum: "$total" },
          avgOrder: { $avg: "$total" },
        },
      },
      { $project: { _id: 0, orders: 1, revenue: 1, avgOrder: 1 } },
    ]);

    const kpi = kpiAgg[0] || { orders: 0, revenue: 0, avgOrder: 0 };

    // 2) Revenue by day (chart)
    const revenueByDay = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, day: "$_id", revenue: 1, orders: 1 } },
    ]);

    // 3) Top customers (by spend)
    const topCustomers = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$customer",
          orders: { $sum: 1 },
          spent: { $sum: "$total" },
        },
      },
      { $sort: { spent: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          customerId: "$_id",
          name: "$customer.name",
          email: "$customer.email",
          orders: 1,
          spent: 1,
        },
      },
    ]);

    // 4) Top products (by qty & revenue)
    const topProducts = await Order.aggregate([
      { $match: match },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          qty: { $sum: "$items.qty" },
          revenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } },
          title: { $last: "$items.titleSnapshot" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, productId: "$_id", title: 1, qty: 1, revenue: 1 } },
    ]);

    res.json({
      range: req.query.range || "7d",
      from,
      kpi,
      revenueByDay,
      topCustomers,
      topProducts,
    });
  } catch (e) {
    next(e);
  }
}

module.exports = { getProductAnalytics, advancedAnalytics };
