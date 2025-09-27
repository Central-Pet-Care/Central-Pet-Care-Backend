import Booking from "../models/booking.js";
import Service from "../models/service.js";
import { isAdmin } from "./userController.js";

// ✅ Create booking (Customer only)
export async function createBooking(req, res) {
  try {
    if (req.user.type === "admin") {
      return res.status(403).json({ message: "Admins cannot create bookings" });
    }

    const { serviceId, bookingDate, notes } = req.body;
    const service = await Service.findById(serviceId);

    if (!service) return res.status(404).json({ message: "Service not found" });

    const booking = new Booking({
      serviceId,   
      userEmail: req.user.email,
      bookingDate,
      notes,
      bookingStatus: "Pending",
    });

    await booking.save();

    res.json({
      message: "Booking created successfully ✅",
      booking: booking.toObject(),
      serviceDetails: service.toObject(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ✅ Delete booking (Customer if Pending, Admin always)
export async function deleteBooking(req, res) {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // 🔹 If not admin, enforce customer rules
    if (!isAdmin(req)) {
      if (booking.userEmail !== req.user.email) {
        return res.status(403).json({ message: "Not authorized" });
      }
      if (booking.bookingStatus !== "Pending") {
        return res.status(400).json({ message: "Cannot delete after confirmation" });
      }
    }

    await booking.deleteOne();
    res.json({ message: "Booking deleted ✅" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ✅ Get all bookings (Admin only)
export async function getAllBookings(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Admin only" });
    }

    const bookings = await Booking.find({}).populate("serviceId");
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ✅ Update booking (Customer only if Pending)
export async function updateBooking(req, res) {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.userEmail !== req.user.email) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (booking.bookingStatus !== "Pending") {
      return res.status(400).json({ message: "Only Pending bookings can be updated" });
    }

    const { bookingDate, notes } = req.body;
    if (bookingDate) booking.bookingDate = bookingDate;
    if (notes) booking.notes = notes;

    const saved = await booking.save();
    res.json({ message: "Booking updated successfully ✅", booking: saved });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ✅ Get single booking (Owner or Admin)
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("serviceId");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (!isAdmin(req) && booking.userEmail !== req.user.email) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Track my bookings (Customer only)
export const trackMyBookings = async (req, res) => {
  try {
    if (req.user.type === "admin") {
      return res.status(403).json({ message: "Admins cannot track bookings" });
    }

    const email = req.user.email; // from JWT
    const bookings = await Booking.find({ userEmail: email }) 
    .populate("serviceId", "serviceName price duration images"); 
     
    res.json(bookings);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ✅ Change booking status (Admin only)
export const changeBookingStatus = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Admin only" });
    }

    const { status } = req.body; // "Confirmed", "Cancelled", "Completed"
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.bookingStatus(404).json({ message: "Booking not found" });

    if (!["Confirmed", "Cancelled", "Completed"].includes(status)) {
      return res.bookingStatus(400).json({ message: "Invalid status" });
    }

    booking.bookingStatus = status;
    const saved = await booking.save();

    res.json({ message: `Booking ${status} successfully ✅`, booking: saved });
  } catch (error) {
    res.bookingStatus(500).json({ message: error.message });
  }
};
