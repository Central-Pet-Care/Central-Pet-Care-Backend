import express from "express";
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  linkPaymentToBooking,
} from "../controllers/bookingController.js";

const bookingRouter = express.Router();

bookingRouter.post("/", createBooking);
bookingRouter.get("/", getBookings);
bookingRouter.get("/:id", getBookingById);
bookingRouter.put("/:id", updateBooking);
bookingRouter.delete("/:id", deleteBooking);

//  special route: link booking with payment
bookingRouter.post("/link-payment", linkPaymentToBooking);

export default bookingRouter;
