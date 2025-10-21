import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true, // avoid duplicates
  },

  serviceId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "services",
  required: true,
},

  userEmail: {
    type: String,
    required: true,
  },

  bookingDate: {
    type: Date,
    required: true,
  },

  notes: {
    type: String,
    default: "",
  },

  bookingStatus: {
    type: String,
    enum: ["Pending", "Confirmed", "Cancelled", "Completed"],
    default: "Pending",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-generate bookingId if not provided
bookingSchema.pre("save", async function (next) {
  if (!this.bookingId) {
    const count = await mongoose.model("bookings").countDocuments();
    this.bookingId = `BKG${(count + 1).toString().padStart(4, "0")}`;
  }
  next();
});

const Booking = mongoose.model("bookings", bookingSchema);

export default Booking;





