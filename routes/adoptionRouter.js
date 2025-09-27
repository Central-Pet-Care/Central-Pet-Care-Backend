import express from "express";
import { applyForAdoption } from "../controllers/adoptionController.js";
import { deleteAdoptionRequest,updateAdoption,updateAdoptionStatus, getAllAdoptionRequests, trackAdoptionStatus,getAdoptionById,getAdoptionRequestByPetId,getMyAdoptionByPetId} from "../controllers/adoptionController.js";


const router = express.Router();

//apply for adoption
router.post("/apply", applyForAdoption);

//update adoption form
router.put("/pet/:petId", updateAdoption);

// Delete adoption request
router.delete("/pet/:petId", deleteAdoptionRequest);

// routes/adoptionRoutes.js
router.patch("/:id/status", updateAdoptionStatus);

// admin fetch all adoption requests
router.get("/", getAllAdoptionRequests);

// Track their own adoption requests
router.get("/my", trackAdoptionStatus);

// fetch one request by ID (with pet + user details)
router.get("/pet/:petId", getAdoptionRequestByPetId);

// Correct route → single adoption by ID
router.get("/:id", getAdoptionById);

router.get("/my/pet/:petId", getMyAdoptionByPetId);


export default router;
