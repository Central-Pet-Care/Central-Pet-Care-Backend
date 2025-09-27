import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: false
    },
    email: {
        type: String,
        required: true
    },
    orderedItems: [
        {
            itemType: {
                type: String,
                enum: ["product", "pet", "service"],
                required: true
            },
            itemId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                refPath: "orderedItems.itemType" 
            },
            name: {
                type: String,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                default: 1
            },
            image: {
                type: String,
                default: ""
            }
        }
    ],
    totalAmount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment"
    },
    status: {
        type: String,
        enum: ["Preparing", "Processing", "Shipped", "Delivered", "Cancelled"],
        default: "Preparing"
    },
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Auto-update `updatedAt` before save
orderSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

const Order = mongoose.model("orders", orderSchema);

export default Order;
