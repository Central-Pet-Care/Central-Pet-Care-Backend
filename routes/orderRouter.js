import express from "express";
import { createOrder, deleteOrder, getOrderByEmail, getOrderById, getOrders, updateOrder } from "../controllers/orderController.js";

const orderRouter = express.Router();

orderRouter.post("/", createOrder);
orderRouter.get("/", getOrders);
orderRouter.get("/:orderId", getOrderById);
orderRouter.get("/:email", getOrderByEmail);
orderRouter.put("/:orderId", updateOrder);
orderRouter.delete("/:orderId", deleteOrder);



export default orderRouter;
