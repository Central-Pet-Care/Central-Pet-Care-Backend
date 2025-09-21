import express from "express";
import { createCategory, deleteCategory, getCategories, getCategoryById, updateCategory } from "../controllers/categoryController.js";


const categoryRouter = express.Router();

categoryRouter.post("/", createCategory);
categoryRouter.get("/", getCategories);
categoryRouter.get("/", getCategoryById);
categoryRouter.put("/", updateCategory);
categoryRouter.delete("/", deleteCategory);




export default categoryRouter;