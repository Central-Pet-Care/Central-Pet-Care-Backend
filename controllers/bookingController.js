import Booking from "../models/booking.js";
import Service from "../models/service.js";


//  Create a booking (service book + link to payment later)
export async function createBooking(req, res) {
  try {
    const { serviceId, date, notes } = req.body;

    // check service exist
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const newBooking = new Booking({
      bookingId: "BKG-" + Date.now(),
      serviceId,
      userId: req.user?._id || req.body.userId, // take from token or request
      date,
      notes,
      status: "pending",
    });

    const saved = await newBooking.save();

    res.json({
      message: "Booking created successfully. Please complete payment.",
      booking: saved,
      amount: service.price,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

//  Get all bookings (admin/staff)
export async function getBookings(req, res) {
  try {
    const bookings = await Booking.find()
      .populate("serviceId")
      .populate("userId")
      .populate("paymentId");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

//  Get single booking
export async function getBookingById(req, res) {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("serviceId")
      .populate("userId")
      .populate("paymentId");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

//  Update booking status
export async function updateBooking(req, res) {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("paymentId");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({
      message: "Booking updated successfully",
      booking,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

//  Delete booking
export async function deleteBooking(req, res) {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

//  Link payment after payment success
export async function linkPaymentToBooking(req, res) {
  try {
    const { bookingId, paymentId } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { paymentId, status: "confirmed" },
      { new: true }
    ).populate("paymentId");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({
      message: "Payment linked and booking confirmed",
      booking,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
