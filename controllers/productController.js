import Product from "../models/product.js";
import { isAdmin } from "./userController.js";


export async function createProduct(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        message: "Please login as administrator to add products",
      });
    }

  
    const latestProduct = await Product.find().sort({ createdAt: -1 }).limit(1);
    let productId;

    if (latestProduct.length === 0) {
      productId = "PROD0001"; 
    } else {
      const currentId = latestProduct[0].productId;
      const numberString = currentId.replace("PROD", "");
      const number = parseInt(numberString);
      const newNumber = (number + 1).toString().padStart(4, "0");
      productId = "PROD" + newNumber;
    }

    const newProductData = { ...req.body, productId };
    const product = new Product(newProductData);

    await product.save();

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating product",
      error: error.message,
    });
  }
}


export async function getProducts(req, res) {
  try {
    const { category } = req.query; 
    const filter = {};

    if (category) {
      filter.categoryId = category;
    }

    const productList = await Product.find(filter);

    res.json({
      List: productList,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching products",
      error: error.message,
    });
  }
}


export async function getProductsByIds(req, res) {
  try {
    const { ids } = req.body; 

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: "Invalid request, ids array required" });
    }

    const products = await Product.find({ productId: { $in: ids } });

    res.json({ products });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching cart products",
      error: error.message,
    });
  }
}



export async function getProductById(req, res) {
  try {
    const product = await Product.findOne({ productId: req.params.productId });
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }
    res.json({product});
  } catch (error) {
    res.status(500).json({
      message: "Error fetching product",
      error: error.message,
    });
  }
}



export async function updateProduct(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        message: "Only administrators can update products",
      });
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { productId: req.params.productId }, 
      req.body,
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating product",
      error: error.message,
    });
  }
}


export async function deleteProduct(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        message: "Please login as administrator to delete products",
      });
    }

    await Product.deleteOne({ productId: req.params.productId });

    res.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting product",
      error: error.message,
    });
  }
}
