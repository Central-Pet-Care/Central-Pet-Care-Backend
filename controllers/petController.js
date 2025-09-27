import Pet from "../models/pet.js";
import { isAdmin } from "./userController.js";

// Create a new pet
export async function createPet(req, res) {
    try {
        // Count existing pets
        const count = await Pet.countDocuments();

        // Auto-generate Pet ID => PET0001, PET0002, ...
        const petId = `PET${String(count + 1).padStart(4, "0")}`;

        // ✅ Combine with incoming data and set isApproved (false if public, true if admin)
        const newPetData = {
            ...req.body,
            petId,
            isApproved: isAdmin(req) ? true : false 
        };

        const pet = new Pet(newPetData);
        await pet.save();

        res.json({
            message: isAdmin(req)
                ? "Pet created successfully"
                : "Pet submitted for admin review",
            petId: pet.petId // return generated ID
        });

    } catch (error) {
        res.status(403).json({ message: error });
    }
}

// Get all pets
export function getPets(req, res) {
    // ✅ Only return approved pets for public
    Pet.find({ isApproved: true })
        .then((pets) => {
            res.json(pets);
        })
        .catch((error) => {
            res.status(500).json({ message: error });
        });
}

// Get single pet details
export function getPetDetails(req, res) {
    const petId = req.params.petId;

    Pet.findOne({ petId: petId })
        .then((pet) => {
            if (!pet) {
                return res.status(404).json({ message: "Pet not found" });
            }
            res.json(pet);
        })
        .catch((error) => {
            res.status(500).json({ message: error });
        });
}

// Update a pet
export function updatePet(req, res) {
    if (!isAdmin(req)) {
        res.status(403).json({ message: "Please login as administrator to update a pet" });
        return;
    }

    const petId = req.params.petId;
    const updatedData = req.body;

    Pet.findOneAndUpdate({ petId: petId }, updatedData, { new: true })
        .then((updatedPet) => {
            if (!updatedPet) {
                return res.status(404).json({ message: "Pet not found" });
            }
            res.json({
                message: "Pet updated successfully",
                pet: updatedPet
            });
        })
        .catch((error) => {
            res.status(500).json({ message: error });
        });
}

// Delete a pet
export function deletePet(req, res) {
    if (!isAdmin(req)) {
        res.status(403).json({ message: "Please login as administrator to delete a pet" });
        return;
    }

    const petId = req.params.petId;

    Pet.deleteOne({ petId: petId })
        .then(() => {
            res.json({ message: "Pet deleted" });
        })
        .catch((error) => {
            res.status(403).json({ message: error });
        });
}

// ✅ NEW: Approve a pet (Admin only)
export async function approvePet(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({ message: "Admin access required" });
    }

    try {
        const pet = await Pet.findOne({ petId: req.params.petId });
        if (!pet) return res.status(404).json({ message: "Pet not found" });

        pet.isApproved = true;
        await pet.save();

        res.json({ message: "Pet approved successfully", pet });
    } catch (err) {
        res.status(500).json({ message: "Failed to approve pet", error: err.message });
    }
}

//add health record
export const addHealthRecord = async (req, res) => {
  try {
    const pet = await Pet.findOne({ petId: req.params.petId });
    if (!pet) return res.status(404).json({ message: "Pet not found" });

    pet.healthRecords.push(req.body.record);
    await pet.save();

    res.json(pet);
  } catch (err) {
    res.status(500).json({ message: "Failed to add record", error: err.message });
  }
};

//delete health record
export const deleteHealthRecord = async (req, res) => {
  try {
    const pet = await Pet.findOne({ petId: req.params.petId });
    if (!pet) return res.status(404).json({ message: "Pet not found" });

    const index = parseInt(req.params.index, 10);
    if (index >= 0 && index < pet.healthRecords.length) {
      pet.healthRecords.splice(index, 1);
      await pet.save();
    }

    res.json(pet);
  } catch (err) {
    res.status(500).json({ message: "Failed to delete record", error: err.message });
  }
};
