import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    categoryId: {
      type: String, // ex: "CAT0001"
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },
    lastPrice: {
     type: Number,
      default: null,  

    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },

    images: {
      type: [String], // Array of image URLs
      required: true,
    },

    status: {
      type: String,
      enum: ["Available", "OutOfStock", "Inactive"],
      default: "Available",
    },

    
    brand: { type: String, default: "" },
    weight: { type: String, default: "" },
    size: { type: [String], default: [] },
    material: { type: String, default: "" },
    ageGroup: { type: String, default: "" },

    
    expiryDate: { type: Date },
    origin: { type: String, default: "" },

    
    features: { type: [String], default: [] },
    tags: { type: [String], default: [] },

    
    ingredients: { type: [String], default: [] },
    nutrition: {
      protein: { type: String, default: "" },
      fat: { type: String, default: "" },
      fiber: { type: String, default: "" },
      moisture: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("products", productSchema);

export default Product;
