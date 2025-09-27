import { addHealthRecord, approvePet, createPet, deleteHealthRecord, deletePet, getPetDetails, getPets, updatePet } from "../controllers/petController.js";
import express from "express";


const petRouter = express.Router();

petRouter.post("/",createPet)
petRouter.get("/",getPets)
petRouter.get("/:petId",getPetDetails)
petRouter.put("/:petId",updatePet)
petRouter.delete("/:petId",deletePet)

petRouter.put("/:petId/approve", approvePet);

petRouter.patch("/:petId/healthRecords", addHealthRecord);
petRouter.delete("/:petId/healthRecords/:index", deleteHealthRecord);


export default petRouter;