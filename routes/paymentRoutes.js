import express from "express";
import dotenv from "dotenv";
import { 
  processDirectPayment, 
  getTestCards,
  getOrderData
} from "../controllers/PayValidationController.js";

dotenv.config();

const paymentRouter = express.Router();

// Essential routes only
paymentRouter.get("/config", (req, res) => {
  res.json({
    success: true,
    message: "PayHere payment gateway configured"
  });
});

paymentRouter.get("/test-cards", getTestCards);
paymentRouter.get("/order/:orderId", getOrderData);
paymentRouter.post("/process-direct", processDirectPayment);

export default paymentRouter;
