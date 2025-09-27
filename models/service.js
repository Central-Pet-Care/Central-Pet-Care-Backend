import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  serviceId: {
    type: String,
    required: true,
    unique: true,
  },
  serviceName: {   // ✅ new single field
    type: String,
    required: true,
  },
  miniDescription: {
    type: String,
    maxlength: 100, // short description (limit for UI cards)
  },
  description: {
    type: String, // full details
  },
  price: {
    type: Number,
    required: true,
  },
  duration: {
    type: String, // e.g. "30 mins", "1 hour"
  },
  images: [
    {
      type: String,
      default: "https://via.placeholder.com/150", // default placeholder
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Service = mongoose.model("services", serviceSchema);

export default Service;
