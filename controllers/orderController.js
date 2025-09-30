import Order from "../models/order.js";
import Product from "../models/product.js";
// import Pet from "../models/pet.js";         
// import Service from "../models/service.js"; 
import { isAdmin, isCustomer } from "./userController.js"; 


export async function createOrder(req, res) {
    if (!isCustomer(req)) {
        return res.status(401).json({
            message: "Please login as customer to create orders"
        });
    }

    try {
        // take the latest order id
        const latestOrder = await Order.find().sort({ date: -1 }).limit(1);

        let orderId;
        if (latestOrder.length === 0) {
            orderId = "CBC0001"; // first order
        } else {
            const currentOrderId = latestOrder[0].orderId;
            const numberString = currentOrderId.replace("CBC", "");
            const number = parseInt(numberString);
            const newNumber = (number + 1).toString().padStart(4, "0");
            orderId = "CBC" + newNumber;
        }

        const newOrderData = req.body;
        const newItemsArray = [];
        let totalAmount = 0;

        for (let i = 0; i < newOrderData.orderedItems.length; i++) {
            const orderedItem = newOrderData.orderedItems[i];
            let item = null;

            // 🔹 check type & find from correct model
            if (orderedItem.itemType === "product") {
                item = await Product.findOne({ productId: orderedItem.itemId });

                if (!item) {
                    return res.status(404).json({
                        message: "Product with id " + orderedItem.itemId + " not found."
                    });
                }

                // check stock
                if (item.stock < orderedItem.quantity) {
                    return res.status(400).json({
                        message: `Not enough stock for ${item.name}`
                    });
                }

                // reduce stock
                item.stock -= orderedItem.quantity;
                await item.save();

            } else if (orderedItem.itemType === "pet") {
                item = await Pet.findOne({ petId: orderedItem.itemId });

                if (!item) {
                    return res.status(404).json({
                        message: "Pet with id " + orderedItem.itemId + " not found."
                    });
                }

                if (item.adopted) {
                    return res.status(400).json({
                        message: `${item.name} is already adopted`
                    });
                }

                item.adopted = true;
                await item.save();

            } else if (orderedItem.itemType === "service") {
                item = await Service.findOne({ serviceId: orderedItem.itemId });

                if (!item) {
                    return res.status(404).json({
                        message: "Service with id " + orderedItem.itemId + " not found."
                    });
                }
                // service walata stock na

            } else {
                return res.status(400).json({
                    message: "Invalid itemType: " + orderedItem.itemType
                });
            }

            // item total calculate
            const itemTotal = item.price * orderedItem.quantity;
            totalAmount += itemTotal;

            newItemsArray.push({
                itemType: orderedItem.itemType,
                itemId: orderedItem.itemId,
                name: item.name,
                price: item.price,
                quantity: orderedItem.quantity,
                image: item.image // ✅ product model eken single "image" field
            });
        }

        newOrderData.orderedItems = newItemsArray;
        newOrderData.orderId = orderId;
        newOrderData.email = req.user.email;
        newOrderData.totalAmount = totalAmount;

        const order = new Order(newOrderData);
        await order.save();

        res.status(201).json({
            message: "Order Created.",
            orderId: orderId,
            totalAmount: totalAmount
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
}


export function getOrders(req, res) {

    // Guest check
    if (req.user == null) {
        res.status(403).json({
            message: "Please login to view orders"
        });
        return;
    }

    let query = {};

    // Admin nam → okkoma orders
    if (req.user.type === "admin") {
        query = {};
    } 
    // Customer nam → eya ge orders witharai
    else if (req.user.type === "customer") {
        query = { email: req.user.email };
    } 
    // Other user roles
    else {
        res.status(403).json({
            message: "You are not authorized to view orders"
        });
        return;
    }

    // DB query (populate nathuwa, direct data return karanawa)
    Order.find(query)
        .sort({ date: -1 })
        .then((orderList) => {
            res.status(200).json({
                count: orderList.length,
                orders: orderList
            });
        })
        .catch((error) => {
            res.status(500).json({
                message: error.message
            });
        });
}

export function getOrderById(req, res) {

    // Guest check
    if (req.user == null) {
        res.status(403).json({
            message: "Please login to view order details"
        });
        return;
    }

    const orderId = req.params.orderId;

    Order.findOne({ orderId: orderId }).then((order) => {

        // Order not found
        if (!order) {
            res.status(404).json({
                message: "Order not found"
            });
            return;
        }

        // If customer → can only view own orders
        if (req.user.type === "customer" && order.email !== req.user.email) {
            res.status(403).json({
                message: "You are not authorized to view this order"
            });
            return;
        }
        // Success
        res.status(200).json(order);

    }).catch((error) => {
        res.status(500).json({
            message: error.message
        });
    });
}


export function updateOrder(req, res) {
    // Only admins can update
    if (!isAdmin(req)) {
        res.json({
            message: "Only administrators can update orders"
        });
        return;
    }

    const orderId = req.params.orderId;   // URL param → /orders/:id
    const updateData = req.body;     // e.g. { name, address, phone, orderedItems }

    Order.findOneAndUpdate(
        { orderId: orderId },        // search by orderId (not _id)
        updateData, { new: true }    // return updated order

    ).then((updatedOrder) => {
        if (!updatedOrder) {
            return res.status(404).json({
                message: "Order not found"
            });
        }
        res.json({
            message: "Order updated successfully",
            order: updatedOrder
        });

    }).catch((error) => {
        res.status(500).json({
            message: "Error updating order",
            error: error.message
        });
    });
}


export function deleteOrder(req, res) {

    // Only admins can delete orders
    if (!isAdmin(req)) {
        res.status(403).json({
            message: "Only administrators can delete orders"
        });
        return;
    }

    const orderId = req.params.orderId;  // /orders/:id

    Order.findOneAndDelete({ orderId: orderId })
        .then((deletedOrder) => {
            if (!deletedOrder) {
                return res.status(404).json({
                    message: "Order not found"
                });
            }

            res.status(200).json({
                message: "Order deleted successfully",
                order: deletedOrder
            });
        })
        .catch((error) => {
            res.status(500).json({
                message: "Error deleting order",
                error: error.message
            });
        });
}
