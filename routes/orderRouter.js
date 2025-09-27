import express from "express";
import { createOrder, deleteOrder, getOrderById, getOrders, updateOrder } from "../controllers/orderController.js";

const orderRouter = express.Router();

orderRouter.post("/", createOrder);
orderRouter.get("/", getOrders);
orderRouter.get("/", getOrderById);
orderRouter.put("/", updateOrder);
orderRouter.delete("/", deleteOrder);



export default orderRouter;
