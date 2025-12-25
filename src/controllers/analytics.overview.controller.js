const Order = require("../models/Order");

function rangeToDays(range) {
  if (range === "30d") return 30;
  if (range === "90d") return 90;
  if (range === "1y") return 365;
  return 7;
}

function formatDay(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function getOverviewAnalytics(req, res, next) {
  try {
    const range = String(req.query.range || "7d");
    const days = rangeToDays(range);

    const end = new Date(); // now
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    // Sadece completed (istersen processing de dahil edebilirsin)
    const match = { createdAt: { $gte: start, $lte: end }, status: { $in: ["completed"] } };

    const agg = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            y: { $year: "$createdAt" },
            m: { $month: "$createdAt" },
            d: { $dayOfMonth: "$createdAt" },
          },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
          uniqueCustomers: { $addToSet: "$customer" },
        },
      },
      {
        $project: {
          _id: 0,
          y: "$_id.y",
          m: "$_id.m",
          d: "$_id.d",
          revenue: 1,
          orders: 1,
          customers: { $size: "$uniqueCustomers" },
        },
      },
      { $sort: { y: 1, m: 1, d: 1 } },
    ]);

    // boş günleri doldur (chart düzgün aksın)
    const map = new Map();
    for (const row of agg) {
      const key = `${row.y}-${String(row.m).padStart(2, "0")}-${String(row.d).padStart(2, "0")}`;
      map.set(key, { date: key, revenue: row.revenue, orders: row.orders, customers: row.customers });
    }

    const series = [];
    let totalRevenue = 0, totalOrders = 0;
    const customerSet = new Set();

    // aynı aralığı tekrar query ile unique customer toplayalım (kolay ve doğru)
    const customersAgg = await Order.aggregate([
      { $match: match },
      { $group: { _id: null, customers: { $addToSet: "$customer" }, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
      { $project: { _id: 0, customers: 1, revenue: 1, orders: 1 } },
    ]);

    if (customersAgg[0]) {
      totalRevenue = customersAgg[0].revenue || 0;
      totalOrders = customersAgg[0].orders || 0;
      (customersAgg[0].customers || []).forEach((c) => customerSet.add(String(c)));
    }

    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = formatDay(d);
      series.push(map.get(key) || { date: key, revenue: 0, orders: 0, customers: 0 });
    }

    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    res.json({
      range,
      start: start.toISOString(),
      end: end.toISOString(),
      kpis: {
        revenue: totalRevenue,
        orders: totalOrders,
        customers: customerSet.size,
        aov,
      },
      series,
    });
  } catch (e) {
    next(e);
  }
}

module.exports = { getOverviewAnalytics };
