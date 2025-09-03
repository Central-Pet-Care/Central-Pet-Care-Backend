import Product from "../models/product.js";
import { isAdmin } from "./userController.js";


//Create a new product with custom productId
export function createProduct(req, res) {
    if (!isAdmin(req)) {
        res.json({
            message: "Please login as administrator to add products"
        })
        return
    }

    // find the latest product by created date
    Product.find().sort({ createdAt: -1 }).limit(1).then((latestProduct) => {
        let productId;

        if (latestProduct.length === 0) {
            productId = "PROD0001";   // first product
        } else {
            const currentProductId = latestProduct[0].productId; 
            const numberString = currentProductId.replace("PROD", "");
            const number = parseInt(numberString);
            const newNumber = (number + 1).toString().padStart(4, "0"); 
            productId = "PROD" + newNumber;
        }

        const newProductData = req.body;
        newProductData.productId = productId;   // assign generated ID

        const product = new Product(newProductData);

        product.save().then(() => {
            res.json({
                message: "Product Created.",
                productId: productId   // return product id to frontend
            })
        }).catch((error) => {
            res.status(403).json({
                message: error.message
            })
        });

    }).catch((error) => {
        res.status(500).json({
            message: error.message
        })
    });
}

//Get All Products
export function getProducts(req, res){

    Product.find().then(
        (productList)=>{
            res.json({
                List: productList
            })
        }
    ).catch((error)=>{
        res.json({
            message: error
        })
    })
}


// Get Single Product by ID
export function getProductById(req, res) {
  const productId = req.params.id;

  Product.findById(productId)
    .then((product) => {
      if (!product) {
        return res.status(404).json({
          message: "Product not found"
        });
      }
      res.json(product);
    })
    .catch((error) => {
      res.status(500).json({
        message: "Error fetching product",
        error: error.message
      });
    });
}

// Delete Products
export function deleteProduct(req, res){
    if(!isAdmin(req)){
        res.status(403).json({
            message: "Please login a administrator to delete products"
        })
        return
    }
    const productId = req.params.productId

    Product.deleteOne(
        {productId : productId}
    ).then(()=>{
        res.status(200).json({
            message: "Product Deleted."
        })
    }).catch((err)=>{
        res.status(500).json({
            message: err
        })
    })

}

//  Update product
export function updateProduct(req, res) {
    if (!isAdmin(req)) {
        res.json({
            message: "Only administrators can update products"
        })
        return
    }

    const productId = req.params.id
    const updateData = req.body

    Product.findByIdAndUpdate(productId, updateData, { new: true }).then((updatedProduct) => {
        if (!updatedProduct) {
            return res.status(404).json({
                message: "Product not found"
            })
        }
        res.json({
            message: "Product updated successfully",
            product: updatedProduct
        })
    }).catch((error) => {
        res.status(500).json({
            message: "Error updating product",
            error: error.message
        })
    })
}