import mongoose from "mongoose";

const adoptionSchema = mongoose.Schema({
  petId: {
    type: String,
    required: true,
  },

  userEmail: {
    type: String,
    required: true,
  },

 alternateEmail: {
    type: String,
    default: null, 
  },

  personalInfo: {
    fullName: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    age: {
      type: Number,
      required: true, 
    },
  },

  homeEnvironment: {
    type: String,
    required: true,
  },

  experience: {
    type: String,
  },

  adoptionStatus: {
    type: String,
    enum: ["Pending", "Approved", "Rejected", "Completed"],
    default: "Pending",
  },

  rejectionReason: {
    type: String,
    default: null,
  },

  applyDate: {
    type: Date,
    default: Date.now, 
  },

  adoptionDate: {
    type: Date, 
    default: null,
  },
});

const Adoption = mongoose.model("adoptions", adoptionSchema);

export default Adoption;
