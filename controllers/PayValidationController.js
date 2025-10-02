import Order from "../models/order.js";
import User from "../models/user.js";  
import Payment from "../models/payment.js";
import dotenv from "dotenv";

dotenv.config();

const TEST_CARDS = {
  "4916217501611292": { status: "success", message: "Payment completed successfully" },
  "5307732125531191": { status: "success", message: "Payment completed successfully" },
  "4024007194349121": { status: "failed", message: "Insufficient funds" },
  "4929119799365646": { status: "failed", message: "Transaction limit exceeded" }
};

export async function getTestCards(req, res) {
  res.json({ success: true, testCards: TEST_CARDS });
}

export async function getOrderData(req, res) {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({ orderId: orderId }).lean();
    
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    let customerName, customerPhone, customerAddress, customerCity, customerPostalCode, customerProvince;
    
    if (order.shipping && order.shipping.firstName) {
      customerName = `${order.shipping.firstName} ${order.shipping.lastName}`;
      customerPhone = order.shipping.phone;
      customerAddress = order.shipping.address;
      customerCity = order.shipping.city;
      customerPostalCode = order.shipping.postalCode;
      customerProvince = order.shipping.province;
    } else {
      customerName = order.name || 'Customer';
      customerPhone = order.phone || '0000000000';
      customerAddress = order.address || 'Address not provided';
      customerCity = order.city || 'City not provided';
      customerPostalCode = order.postalCode || '00000';
      customerProvince = order.province || 'Province not provided';
    }

    res.json({
      success: true,
      order: {
        orderId: order.orderId,
        email: order.email,
        totalAmount: order.totalAmount,
        status: order.status,
        orderedItems: order.orderedItems || [],
        customerInfo: {
          name: customerName,
          email: order.email,
          phone: customerPhone,
          address: customerAddress,
          city: customerCity,
          postalCode: customerPostalCode,
          province: customerProvince
        },
        shipping: order.shipping
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
}

export async function processDirectPayment(req, res) {
  try {
    const { orderId, cardDetails, paymentMethod } = req.body;
    
    const order = await Order.findOne({ orderId: orderId }).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    let customerName, customerPhone, customerAddress, customerCity, customerPostalCode, customerProvince;
    
    if (order.shipping && order.shipping.firstName) {
      customerName = `${order.shipping.firstName} ${order.shipping.lastName}`;
      customerPhone = order.shipping.phone;
      customerAddress = order.shipping.address;
      customerCity = order.shipping.city;
      customerPostalCode = order.shipping.postalCode;
      customerProvince = order.shipping.province;
    } else {
      customerName = order.name || 'Customer';
      customerPhone = order.phone || '0000000000';
      customerAddress = order.address || 'Address not provided';
      customerCity = order.city || 'City not provided';
      customerPostalCode = order.postalCode || '00000';
      customerProvince = order.province || 'Province not provided';
    }

    // Handle COD
    if (paymentMethod === 'cod') {
      const payment = new Payment({
        orderId: orderId,
        email: order.email,
        amount: order.totalAmount,
        currency: 'LKR',
        method: 'COD',
        status: 'pending',
        customerInfo: {
          name: customerName,
          email: order.email,
          phone: customerPhone,
          address: customerAddress,
          city: customerCity,
          postalCode: customerPostalCode,
          province: customerProvince
        },
        items: (order.orderedItems || []).map(item => ({
          itemType: item.itemType || 'product',
          itemId: item.itemId || item._id?.toString() || 'UNKNOWN',
          name: item.name || 'Unknown Item',
          price: item.price || 0,
          quantity: item.quantity || 1,
          image: item.image || ''
        })),
        paymentDetails: {
          paymentMethod: 'cash_on_delivery',
          statusMessage: 'Cash on Delivery - Pay when you receive your order'
        }
      });

      await payment.save();
      await Order.findOneAndUpdate(
        { orderId: orderId }, 
        { paymentId: payment._id, status: 'Processing' }
      );

      return res.json({
        success: true,
        message: 'Order confirmed - Cash on Delivery',
        paymentMethod: 'cod',
        status: 'confirmed'
      });
    }

    // Handle Bank Transfer
    if (paymentMethod === 'bank_transfer') {
      const payment = new Payment({
        orderId: orderId,
        email: order.email,
        amount: order.totalAmount,
        currency: 'LKR',
        method: 'bank_transfer',
        status: 'pending',
        customerInfo: {
          name: customerName,
          email: order.email,
          phone: customerPhone,
          address: customerAddress,
          city: customerCity,
          postalCode: customerPostalCode,
          province: customerProvince
        },
        items: (order.orderedItems || []).map(item => ({
          itemType: item.itemType || 'product',
          itemId: item.itemId || item._id?.toString() || 'UNKNOWN',
          name: item.name || 'Unknown Item',
          price: item.price || 0,
          quantity: item.quantity || 1,
          image: item.image || ''
        })),
        paymentDetails: {
          paymentMethod: 'bank_transfer',
          statusMessage: 'Please transfer to Account: 9535942775533 (ABC Bank)'
        }
      });

      await payment.save();
      await Order.findOneAndUpdate(
        { orderId: orderId }, 
        { paymentId: payment._id, status: 'Processing' }
      );

      return res.json({
        success: true,
        message: 'Bank transfer details provided',
        paymentMethod: 'bank_transfer',
        bankDetails: {
          accountNumber: '9535942775533',
          bankName: 'ABC Bank'
        }
      });
    }

    // Handle PayHere Card Payment
    if (paymentMethod === 'payhere' && cardDetails) {
      const cardNumber = cardDetails.cardNumber.replace(/\s/g, '');
      const cardConfig = TEST_CARDS[cardNumber];
      const isSuccess = cardConfig && cardConfig.status === "success";

      if (isSuccess) {
        const transactionId = `PH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const payment = new Payment({
          orderId: orderId,
          email: order.email,
          amount: order.totalAmount,
          currency: 'LKR',
          method: 'payhere_direct',
          status: 'completed',
          transactionId: transactionId,
          paymentDate: new Date(),
          customerInfo: {
            name: customerName,
            email: order.email,
            phone: customerPhone,
            address: customerAddress,
            city: customerCity,
            postalCode: customerPostalCode,
            province: customerProvince
          },
          items: (order.orderedItems || []).map(item => ({
            itemType: item.itemType || 'product',
            itemId: item.itemId || item._id?.toString() || 'UNKNOWN',
            name: item.name || 'Unknown Item',
            price: item.price || 0,
            quantity: item.quantity || 1,
            image: item.image || ''
          })),
          paymentDetails: {
            cardLast4: cardNumber.slice(-4),
            cardholderName: cardDetails.cardholderName,
            paymentMethod: 'payhere_card',
            statusMessage: "Payment completed successfully"
          }
        });
        
        await payment.save();
        await Order.findOneAndUpdate(
          { orderId: orderId }, 
          { paymentId: payment._id, status: 'Processing' }
        );

        return res.json({
          success: true,
          message: "Payment completed successfully",
          paymentId: transactionId,
          status: "completed",
          data: {
            orderId: order.orderId,
            amount: order.totalAmount,
            transactionId: transactionId,
            cardLast4: cardNumber.slice(-4)
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: cardConfig ? cardConfig.message : "Card declined",
          status: "failed"
        });
      }
    }

    return res.status(400).json({
      success: false,
      message: "Invalid payment method"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Payment system error',
      error: error.message
    });
  }
}