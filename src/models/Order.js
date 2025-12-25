const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    titleSnapshot: { type: String, default: "" }, // ürün adı değişse bile siparişte kalsın
    skuSnapshot: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    items: { type: [orderItemSchema], default: [] },

    currency: { type: String, default: "TRY", enum: ["TRY", "USD", "EUR"] },

    subtotal: { type: Number, required: true, min: 0 },
    shipping: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ["pending", "processing", "completed", "cancelled", "refunded"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: 1, status: 1 });

module.exports = mongoose.model("Order", orderSchema);
