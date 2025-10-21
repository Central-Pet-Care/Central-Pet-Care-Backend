import express from "express";
import dotenv from "dotenv";
import { 
  processDirectPayment, 
  getTestCards,
  getOrderData
} from "../controllers/PayValidationController.js";

import { 
  createPayment, 
  getPayments, 
  updatePayment, 
  deletePayment,
  uploadBankReceipt,
  downloadBankReceipt,
  getReceiptMetadata,
  upload
} from "../controllers/paymentController.js";

dotenv.config();

const paymentRouter = express.Router();

// --- Existing PayHere validation routes ---
paymentRouter.get("/config", (req, res) => {
  res.json({
    success: true,
    message: "PayHere payment gateway configured"
  });
});

paymentRouter.get("/test-cards", getTestCards);
paymentRouter.get("/order/:orderId", getOrderData);
paymentRouter.post("/process-direct", processDirectPayment);

// --- Your CRUD payment routes ---
paymentRouter.get("/", getPayments);            // GET all payments
paymentRouter.post("/", createPayment);         // Create payment
paymentRouter.put("/:id", updatePayment);       // Update payment
paymentRouter.delete("/:id", deletePayment);    // Delete payment

// --- Bank receipt upload routes ---
paymentRouter.post("/upload-receipt", upload.single("receipt"), uploadBankReceipt);  // Upload bank receipt PDF
paymentRouter.get("/receipt/:receiptId", downloadBankReceipt);                       // Download receipt PDF
paymentRouter.get("/receipt/:receiptId/info", getReceiptMetadata);                   // Get receipt metadata

export default paymentRouter;
