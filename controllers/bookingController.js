import Booking from "../models/booking.js";
import Service from "../models/service.js";
import { isAdmin } from "./userController.js";
import nodemailer from "nodemailer"; //  Nodemailer import

//  Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // .env file 
    pass: process.env.EMAIL_PASS,
  },
});

//  Helper Function: Send Email
const sendConfirmationEmail = (to, serviceName, bookingDate) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `✅ Your booking for ${serviceName} is Confirmed!`,
    text: `Hello,\n\nYour booking for the "${serviceName}" service on ${new Date(
      bookingDate
    ).toLocaleDateString()} has been confirmed.\n\nThank you for choosing Central Pet Care!\n\n🐾 Central Pet Care Team`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) console.log("❌ Email sending failed:", err);
    else console.log("📩 Email sent:", info.response);
  });
};

// Helper: Send cancellation email
const sendCancellationEmail = (to, serviceName, bookingDate) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `❌ Your booking for ${serviceName} has been Cancelled`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #E53935;">❌ Booking Cancelled</h2>
        <p>Hello,</p>
        <p>We're sorry to inform you that your booking for the <b>${serviceName}</b> service on 
        <b>${new Date(bookingDate).toLocaleDateString()}</b> has been cancelled.</p>
        <p>If you have any questions or want to reschedule, please contact us.</p>
        <p>Thank you for choosing <b>Central Pet Care</b>! 🐾</p>
        <p style="margin-top: 20px;">— Central Pet Care Team</p>
      </div>
    `,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) console.log("❌ Email sending failed (cancellation):", err);
    else console.log("📩 Cancellation email sent:", info.response);
  });
};

//  Create booking (Customer only)
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

//  Delete booking (Customer if Pending, Admin always)
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

//  Get all bookings (Admin only)
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

//  Update booking (Customer only if Pending)
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

//  Get single booking (Owner or Admin)
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

//  Track my bookings (Customer only)
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


export const changeBookingStatus = async (req, res) => {
  try {
    // Check if the user is an Admin
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Admin only" });
    }

    const { status } = req.body; // "Confirmed", "Cancelled", "Completed"
    const booking = await Booking.findById(req.params.id).populate("serviceId", "serviceName");  // Populate the serviceName

    // If booking is not found
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Validate the status
    if (!["Confirmed", "Cancelled", "Completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Update the booking status
    booking.bookingStatus = status;
    const saved = await booking.save();

    // If status is "Confirmed", send the confirmation email
    if (status === "Confirmed") {
      const serviceName = booking.serviceId?.serviceName || "Unknown Service";  // Ensure serviceName is available
      sendConfirmationEmail(
        booking.userEmail,
        serviceName,
        booking.bookingDate
      );
    }

    // If status is "Cancelled", send the cancellation email
    if (status === "Cancelled") {
      const serviceName = booking.serviceId?.serviceName || "Unknown Service";  // Ensure serviceName is available
      sendCancellationEmail(
        booking.userEmail,
        serviceName,
        booking.bookingDate
      );
    }

    // Send response with booking status
    res.json({ message: `Booking ${status} successfully ✅`, booking: saved });
  } catch (error) {
    console.error("❌ Error in changeBookingStatus:", error);
    res.status(500).json({ message: error.message });
  }
};


