import express from 'express';
import { createProduct, deleteProduct, getProductById, getProducts, updateProduct } from '../controllers/productController.js';

const productRouter = express.Router();

productRouter.post("/", createProduct);
productRouter.get("/", getProducts);
productRouter.get("/:productId", getProductById);
productRouter.put("/:productId", updateProduct);
productRouter.delete("/:productId", deleteProduct)


export default productRouter;