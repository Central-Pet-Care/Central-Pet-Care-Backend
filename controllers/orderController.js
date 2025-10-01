import Order from "../models/order.js";
import Product from "../models/product.js";
import Pet from "../models/pet.js";
import Service from "../models/service.js";
import { isAdmin, isCustomer } from "./userController.js";


export async function createOrder(req, res) {
  if (!isCustomer(req)) {
    return res.status(401).json({
      message: "Please login as customer to create orders",
    });
  }

  try {
    // ✅ Get count of existing orders to generate new unique orderId
    const orderCount = await Order.countDocuments();
    const newNumber = (orderCount + 1).toString().padStart(4, "0");
    const orderId = "CBC" + newNumber;

    const newOrderData = req.body;
    const newItemsArray = [];
    let totalAmount = 0;

    for (let i = 0; i < newOrderData.orderedItems.length; i++) {
      const orderedItem = newOrderData.orderedItems[i];
      let item = null;

      if (orderedItem.itemType === "product") {
        item = await Product.findOne({ productId: orderedItem.itemId });
        if (!item) {
          return res.status(404).json({
            message: "Product with id " + orderedItem.itemId + " not found.",
          });
        }
        if (item.stock < orderedItem.quantity) {
          return res.status(400).json({
            message: `Not enough stock for ${item.name}`,
          });
        }
        item.stock -= orderedItem.quantity;
        await item.save();
      } else if (orderedItem.itemType === "pet") {
        item = await Pet.findOne({ petId: orderedItem.itemId });
        if (!item) {
          return res.status(404).json({
            message: "Pet with id " + orderedItem.itemId + " not found.",
          });
        }
        if (item.adopted) {
          return res.status(400).json({
            message: `${item.name} is already adopted`,
          });
        }
        item.adopted = true;
        await item.save();
      } else if (orderedItem.itemType === "service") {
        item = await Service.findOne({ serviceId: orderedItem.itemId });
        if (!item) {
          return res.status(404).json({
            message: "Service with id " + orderedItem.itemId + " not found.",
          });
        }
      } else {
        return res.status(400).json({
          message: "Invalid itemType: " + orderedItem.itemType,
        });
      }

      const itemTotal = item.price * orderedItem.quantity;
      totalAmount += itemTotal;

      newItemsArray.push({
        itemType: orderedItem.itemType,
        itemId: orderedItem.itemId,
        name: item.name,
        price: item.price,
        quantity: orderedItem.quantity,
        image: item.images?.[0] || item.image || "",
      });
    }

    // ✅ Required fields fill / fallback
    newOrderData.orderedItems = newItemsArray;
    newOrderData.orderId = orderId;
    newOrderData.email = req.user.email;
    newOrderData.totalAmount = totalAmount;
    newOrderData.name = newOrderData.name || req.user.name || "Unknown Customer";
    newOrderData.address = newOrderData.address || "Not Provided";
    newOrderData.phone = newOrderData.phone || "Not Provided";
    newOrderData.status = newOrderData.status || "Pending";

    const order = new Order(newOrderData);
    await order.save();

    res.status(201).json({
      message: "Order Created.",
      orderId: orderId,
      totalAmount: totalAmount,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
}


// ------------------ GET ALL ORDERS ------------------
export function getOrders(req, res) {
  if (!req.user) {
    return res.status(403).json({ message: "Please login to view orders" });
  }

  let query = {};
  if (req.user.type === "admin") {
    query = {}; // all orders
  } else if (req.user.type === "customer") {
    query = { email: req.user.email }; // only own orders
  } else {
    return res.status(403).json({ message: "You are not authorized to view orders" });
  }

  Order.find(query)
    .sort({ createdAt: -1 })
    .then((orderList) => {
      res.status(200).json({
        count: orderList.length,
        orders: orderList,
      });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
}

// ------------------ GET ORDER BY ID ------------------
export function getOrderById(req, res) {
  if (!req.user) {
    return res.status(403).json({ message: "Please login to view order details" });
  }

  const orderId = req.params.orderId;

  Order.findOne({ orderId: orderId })
    .populate("user", "firstName lastName email phone") // 👈 මෙතනට user details ගන්න
    .then((order) => {
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      if (req.user.type === "customer" && order.email !== req.user.email) {
        return res.status(403).json({ message: "You are not authorized to view this order" });
      }
      res.status(200).json(order);
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
}

// ------------------ UPDATE ORDER ------------------
export function updateOrder(req, res) {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Only administrators can update orders" });
  }

  const orderId = req.params.orderId;
  const updateData = req.body;

  Order.findOneAndUpdate({ orderId: orderId }, updateData, { new: true })
    .then((updatedOrder) => {
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json({
        message: "Order updated successfully",
        order: updatedOrder,
      });
    })
    .catch((error) => {
      res.status(500).json({ message: "Error updating order", error: error.message });
    });
}

// ------------------ DELETE ORDER ------------------
export function deleteOrder(req, res) {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Only administrators can delete orders" });
  }

  const orderId = req.params.orderId;

  Order.findOneAndDelete({ orderId: orderId })
    .then((deletedOrder) => {
      if (!deletedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.status(200).json({
        message: "Order deleted successfully",
        order: deletedOrder,
      });
    })
    .catch((error) => {
      res.status(500).json({ message: "Error deleting order", error: error.message });
    });
}
