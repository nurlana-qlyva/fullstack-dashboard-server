const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true, unique: true, index: true },
    description: { type: String, default: "", trim: true },

    price: { type: Number, required: true, min: 0 },
    cost: { type: Number, default: 0, min: 0 },

    currency: { type: String, default: "TRY", enum: ["TRY", "USD", "EUR"] },

    category: { type: String, default: "general", index: true },
    tags: { type: [String], default: [] },

    stock: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["active", "draft", "archived"], default: "active", index: true },

    images: { type: [String], default: [] },

    // analytics / overview için işimize yarar
    soldCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Search performansı için text index
productSchema.index({ title: "text", description: "text", sku: "text", category: "text" });

module.exports = mongoose.model("Product", productSchema);
