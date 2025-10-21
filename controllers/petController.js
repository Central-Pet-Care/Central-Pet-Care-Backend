// controllers/petController.js
import mongoose from "mongoose";
import Pet from "../models/pet.js";
import { isAdmin } from "./userController.js";

async function generatePetId() {
  const result = await Pet.aggregate([
    { $match: { petId: { $regex: /^PET\d+$/ } } },
    {
      $project: {
        num: {
          $toInt: {
            $substrCP: ["$petId", 3, { $subtract: [{ $strLenCP: "$petId" }, 3] }],
          },
        },
      },
    },
    { $sort: { num: -1 } },
    { $limit: 1 },
  ]);

  const nextNumber =
    result.length && typeof result[0].num === "number"
      ? result[0].num + 1
      : 1;

  return `PET${String(nextNumber).padStart(4, "0")}`;
}

export async function createPet(req, res) {
  try {
    const petId = await generatePetId();
    const adminUser = isAdmin(req);

    const { submitterName, submitterEmail, submitterPhone, ...petDetails } =
      req.body;

    const newPetData = {
      ...petDetails,
      petId,
      isApproved: adminUser,
      isAdminAdded: adminUser,
    };

    if (!adminUser) {
      newPetData.submitterName = submitterName;
      newPetData.submitterEmail = submitterEmail;
      newPetData.submitterPhone = submitterPhone;
    }

    const pet = new Pet(newPetData);
    await pet.save();

    res.json({
      message: adminUser
        ? "✅ Pet created successfully."
        : "✅ Pet submitted for admin review.",
      petId,
    });
  } catch (error) {
    console.error("Pet creation error:", error);
    let msg = "Submission failed.";
    if (error.name === "ValidationError") {
      msg = Object.values(error.errors)
        .map((e) => e.message)
        .join("; ");
    } else if (error.code === 11000) {
      msg = "Duplicate pet ID. Please try again.";
    }
    res.status(400).json({ message: msg });
  }
}

   //Get Pets (Public)
export const getPets = async (req, res) => {
  try {
    const pets = await Pet.find({ isApproved: true });
    res.json(pets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


   //Get Single Pet
export const getPetDetails = async (req, res) => {
  try {
    const { petId } = req.params;
    const pet = await Pet.findOne({ petId });
    if (!pet) return res.status(404).json({ message: "Pet not found" });
    res.json(pet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updatePet = async (req, res) => {
  if (!isAdmin(req))
    return res.status(403).json({ message: "Admin access required" });

  try {
    const pet = await Pet.findOneAndUpdate(
      { petId: req.params.petId },
      req.body,
      { new: true }
    );
    if (!pet) return res.status(404).json({ message: "Pet not found" });
    res.json({ message: "✅ Pet updated successfully", pet });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deletePet = async (req, res) => {
  if (!isAdmin(req))
    return res.status(403).json({ message: "Admin access required" });

  try {
    const result = await Pet.deleteOne({ petId: req.params.petId });
    if (result.deletedCount === 0)
      return res.status(404).json({ message: "Pet not found" });

    res.json({ message: "🗑️ Pet deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const approvePet = async (req, res) => {
  if (!isAdmin(req))
    return res.status(403).json({ message: "Admin access required" });

  try {
    const petId = req.params.petId;
    // Support both _id and petId
    const pet = await Pet.findOneAndUpdate(
      {
        $or: [{ _id: petId }, { petId }],
        isApproved: false,
      },
      { isApproved: true },
      { new: true }
    );

    if (!pet)
      return res
        .status(404)
        .json({ message: "Pet not found or already approved" });

    res.json({ message: "✅ Pet approved successfully", pet });
  } catch (err) {
    console.error("Approve pet error:", err);
    res
      .status(500)
      .json({ message: "Failed to approve pet", error: err.message });
  }
};

export const rejectPet = async (req, res) => {
  if (!isAdmin(req))
    return res.status(403).json({ message: "Admin access required" });

  try {
    const petId = req.params.petId;
    // Support both _id and petId
    const pet = await Pet.findOneAndDelete({
      $or: [{ _id: petId }, { petId }],
      isApproved: false,
    });

    if (!pet)
      return res
        .status(404)
        .json({ message: "Pet not found or already approved" });

    res.json({
      message: `❌ Pet submission "${pet.name}" rejected and removed.`,
      petId: pet.petId,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to reject pet", error: err.message });
  }
};

export const getPendingPets = async (req, res) => {
  try {
    const pendingPets = await Pet.find({ isApproved: false });
    res.json(pendingPets);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch pending pets", error: err.message });
  }
};

export const getPendingPublicPets = async (req, res) => {
  try {
    const pendingPets = await Pet.find({
      isApproved: false,
      isAdminAdded: false,
    });
    res.json(pendingPets);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch public submissions",
      error: err.message,
    });
  }
};

export const addHealthRecord = async (req, res) => {
  if (!isAdmin(req))
    return res.status(403).json({ message: "Admin access required" });

  try {
    const pet = await Pet.findOne({ petId: req.params.petId });
    if (!pet) return res.status(404).json({ message: "Pet not found" });

    pet.healthRecords.push(req.body.record);
    await pet.save();
    res.json(pet);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to add record", error: err.message });
  }
};

export const deleteHealthRecord = async (req, res) => {
  if (!isAdmin(req))
    return res.status(403).json({ message: "Admin access required" });

  try {
    const pet = await Pet.findOne({ petId: req.params.petId });
    if (!pet) return res.status(404).json({ message: "Pet not found" });

    const index = parseInt(req.params.index);
    if (index < 0 || index >= pet.healthRecords.length)
      return res.status(400).json({ message: "Invalid record index" });

    pet.healthRecords.splice(index, 1);
    await pet.save();
    res.json(pet);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete record", error: err.message });
  }
};
