import { 
    addHealthRecord, 
    approvePet, 
    createPet, 
    deleteHealthRecord, 
    deletePet, 
    getPetDetails, 
    getPets, 
    updatePet,
    rejectPet, 
    getPendingPets,
    getPendingPublicPets
} from "../controllers/petController.js";
import express from "express";

const petRouter = express.Router();

// --- Admin Review Actions (Public Pet Submission) ---
// Place these before dynamic :petId routes to avoid conflicts
petRouter.get("/pending/public", getPendingPublicPets);
petRouter.get("/pending", getPendingPets);
petRouter.put("/:petId/approve", approvePet);
petRouter.delete("/:petId/reject", rejectPet);

// --- Core Pet Management ---
petRouter.post("/", createPet); // Admin create (approved) or public submit (unapproved)
petRouter.get("/", getPets);
petRouter.get("/:petId", getPetDetails);
petRouter.put("/:petId", updatePet);
petRouter.delete("/:petId", deletePet);

// --- Health Records Management ---
petRouter.patch("/:petId/healthRecords", addHealthRecord);
petRouter.delete("/:petId/healthRecords/:index", deleteHealthRecord);

export default petRouter;
