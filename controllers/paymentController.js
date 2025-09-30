
import Payment from "../models/payment.js";



// Create a new payment
export async function createPayment(req, res) {
  try {
    const payment = new Payment(req.body);
    await payment.save();
    res.status(201).json({ message: "Payment created successfully", payment });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

// Get all payments
export async function getPayments(req, res) {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Update a payment by ID
export async function updatePayment(req, res) {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    res.json({ message: "Payment updated successfully", payment });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

// Delete a payment by ID
export async function deletePayment(req, res) {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    res.json({ message: "Payment deleted successfully", payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
