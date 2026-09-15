const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // =========================================
    // ORDER INFORMATION
    // =========================================

    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    pincode: {
      type: String,
      required: true,
      trim: true,
    },

    // =========================================
    // ORDER TOTAL
    // =========================================

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    // =========================================
    // ORDER ITEMS
    // =========================================

    items: {
      type: Array,
      required: true,
      default: [],
    },

    // =========================================
    // ORDER STATUS
    // =========================================

    status: {
      type: String,
      enum: [
        "Pending",
        "Preparing",
        "Out for Delivery",
        "Delivered",
      ],
      default: "Pending",
    },

    // =========================================
    // INVENTORY PROTECTION
    // =========================================

    inventoryDeducted: {
      type: Boolean,
      default: false,
    },

    // =========================================
    // PAYMENT INFORMATION
    // =========================================

    paymentStatus: {
      type: String,
      enum: [
        "Pending",
        "Paid",
        "Failed",
      ],
      default: "Pending",
    },

    razorpayOrderId: {
      type: String,
      default: "",
      trim: true,
    },

    razorpayPaymentId: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Order",
  orderSchema
);