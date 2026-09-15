const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Pizza Base",
        "Sauce",
        "Cheese",
        "Vegetable",
      ],
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    threshold: {
      type: Number,
      required: true,
      min: 0,
      default: 20,
    },

    unit: {
      type: String,
      default: "units",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Inventory", inventorySchema);