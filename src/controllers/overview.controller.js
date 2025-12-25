const Product = require("../models/Product");

async function getOverview(req, res, next) {
  try {
    const lowStockThreshold = Number(req.query.lowStock ?? 5);

    const [result] = await Product.aggregate([
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalProducts: { $sum: 1 },
                activeProducts: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
                draftProducts: { $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] } },
                archivedProducts: { $sum: { $cond: [{ $eq: ["$status", "archived"] }, 1, 0] } },
                totalStock: { $sum: "$stock" },
              },
            },
            { $project: { _id: 0 } },
          ],

          lowStock: [
            { $match: { stock: { $lte: lowStockThreshold }, status: { $ne: "archived" } } },
            {
              $project: {
                _id: 1,
                title: 1,
                sku: 1,
                stock: 1,
                status: 1,
                category: 1,
                updatedAt: 1,
              },
            },
            { $sort: { stock: 1, updatedAt: -1 } },
            { $limit: 10 },
          ],

          byCategory: [
            {
              $group: {
                _id: "$category",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 8 },
            { $project: { _id: 0, category: "$_id", count: 1 } },
          ],
        },
      },
      {
        $project: {
          totals: { $ifNull: [{ $arrayElemAt: ["$totals", 0] }, {}] },
          lowStock: 1,
          byCategory: 1,
        },
      },
    ]);

    res.json({
      lowStockThreshold,
      ...result,
    });
  } catch (e) {
    next(e);
  }
}

module.exports = { getOverview };
