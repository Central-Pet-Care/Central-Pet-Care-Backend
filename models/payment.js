import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    
    currency: {
      type: String,
      default: 'LKR',
      uppercase: true,
    },
    
    method: {
      type: String,
      required: true,
      enum: ['payhere_direct', 'COD', 'bank_transfer', 'test'],
    },
    
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    
    transactionId: {
      type: String,
      unique: true,
      sparse: true, // allows multiple null values but unique non-null values
    },
    
    paymentDate: {
      type: Date,
    },
    
    customerInfo: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      postalCode: {
        type: String,
        required: true,
        trim: true,
      },
      province: {
        type: String,
        required: true,
        trim: true,
      },
    },
    
    items: [{
      itemType: {
        type: String,
        required: true,
        enum: ['product', 'service'],
      },
      itemId: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      price: {
        type: Number,
        required: true,
        min: 0,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      image: {
        type: String,
        trim: true,
      },
    }],
    
    paymentDetails: {
      cardLast4: {
        type: String,
        trim: true,
      },
      cardholderName: {
        type: String,
        trim: true,
      },
      statusMessage: {
        type: String,
        trim: true,
      },
      paymentMethod: {
        type: String,
        trim: true,
      },
      processingResult: {
        status: {
          type: String,
          enum: ['completed', 'failed', 'pending', 'cancelled'],
        },
        reason: {
          type: String,
          trim: true,
        },
        processingTime: {
          type: String,
          trim: true,
        },
        cardLast4: {
          type: String,
          trim: true,
        },
        realistic: {
          type: Boolean,
          default: true,
        },
      }
    },
    
    // Bank receipt fields for bank transfer payments
    bankReceiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'bankReceipts.files', // GridFS reference
    },
    
    bankReceiptFilename: {
      type: String,
      trim: true,
    },
    
    bankDetails: {
      accountNumber: {
        type: String,
        trim: true,
      },
      bankName: {
        type: String,
        trim: true,
      },
      transferDate: {
        type: Date,
      },
      referenceNumber: {
        type: String,
        trim: true,
      },
    }
  },
  { 
    timestamps: true,
    collection: 'payments' // explicitly set collection name
  }
);

const Payment = mongoose.model("payments", paymentSchema);
export default Payment;
