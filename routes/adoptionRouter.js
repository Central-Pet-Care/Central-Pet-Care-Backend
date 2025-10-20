import express from "express";

import { applyForAdoption } from "../controllers/adoptionController.js";
import { deleteAdoptionRequest,updateAdoption,updateAdoptionStatus, getAllAdoptionRequests, trackAdoptionStatus,getAdoptionById,getAdoptionRequestByPetId,getMyAdoptionByPetId} from "../controllers/adoptionController.js";


const router = express.Router();

router.post("/apply", applyForAdoption);

router.put("/pet/:petId", updateAdoption);

router.delete("/pet/:petId", deleteAdoptionRequest);

router.patch("/:id/status", updateAdoptionStatus);

router.get("/", getAllAdoptionRequests);

router.get("/my", trackAdoptionStatus);

router.get("/pet/:petId", getAdoptionRequestByPetId);

router.get("/:id", getAdoptionById);

router.get("/my/pet/:petId", getMyAdoptionByPetId);



export default router;
