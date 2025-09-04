import express from "express";
import { 
  createService, 
  getServices, 
  getServiceById, 
  updateService, 
  deleteService 
} from "../controllers/serviceController.js";

const serviceRouter = express.Router();

// Create a new service
serviceRouter.post("/", createService);

// Get all services
serviceRouter.get("/", getServices);

// Get a single service by ID
serviceRouter.get("/:id", getServiceById);

// Update a service by ID
serviceRouter.put("/:id", updateService);

// Delete a service by ID
serviceRouter.delete("/:id", deleteService);

export default serviceRouter;
