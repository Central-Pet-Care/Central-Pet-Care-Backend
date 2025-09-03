import mongoose from "mongoose";

const productSchema = mongoose.Schema({
     productId : {
        type : String,
        required : true,
        unique : true
    },
    name: {
        type: String,
        required: true
    },

    description: {
        type: String
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "categories",   
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        required: true,
        min: 0
    },
    image: {
        type: String, 
        default: ""
    },
    status: {
        type: String,
        enum: ["Available", "OutOfStock", "Inactive"],
        default: "Available"
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

const Product = mongoose.model("products", productSchema);

export default Product;