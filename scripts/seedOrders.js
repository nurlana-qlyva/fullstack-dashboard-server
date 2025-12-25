require("dotenv").config();
const mongoose = require("mongoose");

const User = require("../src/models/User");
const Product = require("../src/models/Product");
const Order = require("../src/models/Order");

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI missing");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected:", mongoose.connection.name);

  const users = await User.find({}).select("_id");
  const products = await Product.find({ status: { $ne: "archived" } }).select("_id title sku price currency");

  if (users.length === 0) throw new Error("No users found");
  if (products.length === 0) throw new Error("No products found");

  const howMany = Number(process.argv[2] || 50); // default 50 order
  const daysBack = Number(process.argv[3] || 30); // default last 30 days

  const orders = [];
  for (let i = 0; i < howMany; i++) {
    const customer = pick(users)._id;

    const itemsCount = randInt(1, 3);
    const items = [];
    let subtotal = 0;
    const currency = "TRY";

    for (let j = 0; j < itemsCount; j++) {
      const p = pick(products);
      const qty = randInt(1, 3);
      const price = Number(p.price || randInt(50, 2000));

      items.push({
        product: p._id,
        titleSnapshot: p.title || "",
        skuSnapshot: p.sku || "",
        price,
        qty,
      });
      subtotal += price * qty;
    }

    const shipping = randInt(0, 150);
    const discount = randInt(0, 100);
    const total = Math.max(0, subtotal + shipping - discount);

    // random day in last N days
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - randInt(0, daysBack - 1));
    createdAt.setHours(randInt(0, 23), randInt(0, 59), randInt(0, 59), 0);

    orders.push({
      customer,
      items,
      currency,
      subtotal,
      shipping,
      discount,
      total,
      status: "completed",
      createdAt,
      updatedAt: createdAt,
    });
  }

  const inserted = await Order.insertMany(orders);
  console.log("Inserted orders:", inserted.length);

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
