import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: false,
  },

  email: {
    type: String,
    required: true,
  },

  orderedItems: [
    {
      itemType: {
        type: String,
        enum: ["product", "service", "pet"], // ✅ 3 types
        required: true,
      },
      itemId: {
        type: String, // ex: PROD0001, SERV0001, PET0001
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
      },
      image: {
        type: String,
        default: "",
      },
    },
  ],

  totalAmount: {
    type: Number,
    required: true,
  },

  status: {
    type: String,
    enum: ["Pending", "Preparing", "Processing", "Shipped", "Delivered", "Cancelled"], // 🟢 Fixed
    default: "Pending", // 🟢 default = Pending
  },

  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Auto-update updatedAt before save
orderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Order = mongoose.model("orders", orderSchema);

export default Order;
