import mongoose from "mongoose";

const petSchema = mongoose.Schema({
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
    images: [
        {
            type: String,
            validate: {
            validator: (arr) => arr.length > 0,
            message: "At least one image is required"
  }
        }
    ],
    price :{
        type : Number,
        required : true,
        min: 1
    },
    adoptionStatus: {
        type: String,
        enum: ["AVAILABLE", "ADOPTED"],
        default: "AVAILABLE"
    },

     isApproved: {
    type: Boolean,
    default: false, // Public submissions will stay hidden until admin approves
  },

  
    healthRecords: [
        {
            visitDate: { type: Date },
            vetName: { type: String },
            type: {
                type: String,
                enum: ["Checkup", "Vaccination", "Surgery", "Medication", "Other"],
                default: "Checkup"
            },
            notes: { type: String }
        }
    ]
});

const Pet = mongoose.model("pets", petSchema);

export default Pet;


