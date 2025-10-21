
import Payment from "../models/payment.js";
import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";
import multer from "multer";

// Initialize GridFS bucket for storing bank receipts
let bucket;

// Function to initialize GridFS bucket after MongoDB connection
export function initializeGridFS() {
  if (mongoose.connection.readyState === 1) {
    bucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: "bankReceipts"
    });
  }
}

// Initialize when connection is ready
mongoose.connection.once("open", () => {
  initializeGridFS();
});

// Configure multer for PDF uploads (memory storage)
const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  }
});

// Upload bank receipt to GridFS
export async function uploadBankReceipt(req, res) {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(403).json({ message: "Authentication required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { orderId, paymentId, bankName, accountNumber } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    // Verify bucket is initialized
    if (!bucket) {
      initializeGridFS();
      if (!bucket) {
        return res.status(500).json({ message: "File storage not initialized" });
      }
    }

    // Create upload stream with metadata
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: "application/pdf",
      metadata: {
        orderId: orderId,
        paymentId: paymentId || null,
        bankName: bankName || null,
        accountNumber: accountNumber || null,
        uploadedBy: req.user.email || req.user.userId,
        uploadedAt: new Date()
      }
    });

    // Write file buffer to GridFS
    uploadStream.end(req.file.buffer);

    uploadStream.on("finish", async () => {
      try {
        // Update payment record with receipt information
        let updateResult = null;
        
        if (paymentId) {
          // Update by payment ID if provided
          updateResult = await Payment.findByIdAndUpdate(paymentId, {
            bankReceiptId: uploadStream.id,
            bankReceiptFilename: req.file.originalname,
            'bankDetails.bankName': bankName,
            'bankDetails.accountNumber': accountNumber,
            'bankDetails.transferDate': new Date(),
            updatedAt: new Date()
          });
        } else if (orderId) {
          // Update by order ID if payment ID not provided
          updateResult = await Payment.findOneAndUpdate(
            { orderId: orderId },
            {
              bankReceiptId: uploadStream.id,
              bankReceiptFilename: req.file.originalname,
              'bankDetails.bankName': bankName,
              'bankDetails.accountNumber': accountNumber,
              'bankDetails.transferDate': new Date(),
              updatedAt: new Date()
            }
          );
          console.log(updateResult ? `  ✅ Payment found and updated by orderId` : `  ❌ Payment NOT found by orderId: ${orderId}`);
        }

        if (!updateResult) {
          console.log(`⚠️ WARNING: Receipt saved but no payment record exists yet!`);
          console.log(`💡 Receipt will need to be linked when payment is created.`);
        }

        res.status(200).json({
          message: "Bank receipt uploaded successfully",
          receiptId: uploadStream.id,
          filename: req.file.originalname,
          orderId: orderId,
          paymentUpdated: !!updateResult,
          warning: updateResult ? null : "Payment record not found - receipt uploaded but not linked"
        });
      } catch (error) {
        res.status(500).json({ 
          message: "Receipt uploaded but failed to update payment record", 
          error: error.message 
        });
      }
    });

    uploadStream.on("error", (error) => {
      res.status(500).json({ 
        message: "Upload failed", 
        error: error.message 
      });
    });

  } catch (error) {
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
}

// Download bank receipt from GridFS
export async function downloadBankReceipt(req, res) {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(403).json({ message: "Authentication required" });
    }

    const { receiptId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(receiptId)) {
      return res.status(400).json({ message: "Invalid receipt ID" });
    }

    // Verify bucket is initialized
    if (!bucket) {
      initializeGridFS();
      if (!bucket) {
        return res.status(500).json({ message: "File storage not initialized" });
      }
    }

    const fileId = new mongoose.Types.ObjectId(receiptId);
    
    // Get file info first to set proper headers
    const files = await bucket.find({ _id: fileId }).toArray();
    
    if (files.length === 0) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    const file = files[0];

    // Set response headers
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${file.filename}"`,
      "Content-Length": file.length
    });

    // Create download stream
    const downloadStream = bucket.openDownloadStream(fileId);

    downloadStream.on("data", (chunk) => {
      res.write(chunk);
    });

    downloadStream.on("error", (error) => {
      if (!res.headersSent) {
        res.status(404).json({ message: "Receipt not found" });
      }
    });

    downloadStream.on("end", () => {
      res.end();
    });

  } catch (error) {
    res.status(500).json({ 
      message: "Download failed", 
      error: error.message 
    });
  }
}

// Get receipt metadata
export async function getReceiptMetadata(req, res) {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(403).json({ message: "Authentication required" });
    }

    const { receiptId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(receiptId)) {
      return res.status(400).json({ message: "Invalid receipt ID" });
    }

    // Verify bucket is initialized
    if (!bucket) {
      initializeGridFS();
      if (!bucket) {
        return res.status(500).json({ message: "File storage not initialized" });
      }
    }

    const fileId = new mongoose.Types.ObjectId(receiptId);
    
    const files = await bucket.find({ _id: fileId }).toArray();
    
    if (files.length === 0) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    const file = files[0];

    res.status(200).json({
      receiptId: file._id,
      filename: file.filename,
      uploadDate: file.uploadDate,
      length: file.length,
      contentType: file.contentType,
      metadata: file.metadata
    });

  } catch (error) {
    res.status(500).json({ 
      message: "Error retrieving receipt metadata", 
      error: error.message 
    });
  }
}

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
