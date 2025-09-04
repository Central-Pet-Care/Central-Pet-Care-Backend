import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  serviceId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true, // e.g. "Vet", "Grooming", "Training", "Emergency"
  },
  description: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
  duration: {
    type: String, // e.g. "30 mins", "1 hour"
  },
  image: {
    type: String,
    default: "https://via.placeholder.com/150",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Service = mongoose.model("services", serviceSchema);

export default Service;
