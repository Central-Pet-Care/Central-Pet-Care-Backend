import mongoose from "mongoose";

const petSchema = new mongoose.Schema({
  petId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  species: {
    type: String,
    required: true,
    enum: ["Dog", "Cat", "Fish", "Bird", "Other"]
  },
  breed: {
    type: String
  },
  sex: {
    type: String,
    enum: ["Male", "Female", "Unknown"],
    default: "Unknown"
  },
  ageYears: {
    type: Number,
    min: 0
  },
  size: {
    type: String,
    enum: ["Small", "Medium", "Large", "Giant", "Unknown"],
    default: "Unknown"
  },
  color: {
    type: String
  },
  description: {
    type: String
  },

  images: {
    type: [String],
    validate: {
      validator: function (value) {
        return Array.isArray(value) && value.length > 0;
      },
      message: "At least one image is required"
    },
    required: true
  },

  price: {
    type: Number,
    required: true,
    min: 1
  },

  adoptionStatus: {
    type: String,
    enum: ["AVAILABLE", "ADOPTED"],
    default: "AVAILABLE"
  },

  isApproved: {
    type: Boolean,
    default: false
  },

  isAdminAdded: { type: Boolean, default: false },


  // 📝 Submitter contact info (only if submitted by public)
  submitterName: {
    type: String
  },
  submitterEmail: {
    type: String
  },
  submitterPhone: {
    type: String
  },

  // 📝 Health records for admin use
  healthRecords: [
    {
      visitDate: {
        type: Date
      },
      vetName: {
        type: String
      },
      type: {
        type: String,
        enum: ["Checkup", "Vaccination", "Surgery", "Medication", "Other"],
        default: "Checkup"
      },
      notes: {
        type: String
      }
    }
  ]
});

// ✅ Proper default export for ES Modules
const Pet = mongoose.model("pets", petSchema);
export default Pet;
