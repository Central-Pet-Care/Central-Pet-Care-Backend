import express from "express";
import {
  createBooking,
  deleteBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  changeBookingStatus,
  trackMyBookings,
} from "../controllers/bookingController.js";

const router = express.Router();

// Customer creates booking
router.post("/", createBooking);

// Customer deletes their booking
router.delete("/:id", deleteBooking);

// Admin gets all bookings
router.get("/", getAllBookings);

// Customer tracks their bookings
router.get("/user/me", trackMyBookings);

// Customer updates their booking
router.put("/:id", updateBooking);


// Get single booking (Customer/Admin)
router.get("/:id", getBookingById);

// Admin changes booking status
router.patch("/:id/status", changeBookingStatus);

export default router;
