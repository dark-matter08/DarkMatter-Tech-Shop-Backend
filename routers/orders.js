const express = require("express");
const router = express.Router();
const { OrderItem } = require("../models/order-item");
const { Order } = require("../models/order");
const mongoose = require("mongoose");

router.get("/", async (req, res) => {
  const ordersList = await Order.find()
    .populate("user", "name")
    .sort({ dateOrdered: -1 });
  if (!ordersList) {
    res.status(500).json({ success: false });
  }
  res.send(ordersList);
});

router.post("/", async (req, res) => {
  const orderItemsIds = Promise.all(
    req.body.orderItems.map(async (item) => {
      let newOrderItem = new OrderItem({
        quantity: item.quantity,
        product: item.product,
      });

      newOrderItem = await newOrderItem.save();

      return newOrderItem._id;
    })
  );

  const orderItemsIdsResolved = await orderItemsIds;

  const totalPrices = await Promise.all(
    orderItemsIdsResolved.map(async (itemId) => {
      const orderItem = await OrderItem.findById(itemId).populate(
        "product",
        "price"
      );
      const totalPrice = orderItem.product.price * orderItem.quantity;

      return totalPrice;
    })
  );

  console.log(totalPrices);

  const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

  let order = new Order({
    orderItems: orderItemsIdsResolved,
    shippingAddress1: req.body.shippingAddress1,
    shippingAddress2: req.body.shippingAddress2,
    city: req.body.city,
    zip: req.body.zip,
    country: req.body.country,
    phone: req.body.phone,
    totalPrice: totalPrice,
    user: req.body.user,
  });

  order = await order.save();

  if (!order) return res.status(404).send("the order cannot be created!");

  res.send(order);
});

router.get(`/:id`, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).send("Invalid Order ID");
  }

  const order = await Order.findById(req.params.id)
    .populate("user", "name")
    .populate({
      path: "orderItems",
      populate: { path: "product", populate: "category" },
    });
  if (!order) {
    res.status(500).json({ success: false });
  }
  res.send(order);
});

router.put("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).send("Invalid Order ID");
  }
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
    },
    { new: true }
  );

  if (!order) return res.status(400).send("the order cannot be updated");

  res.status(200).send(order);
});

router.delete("/:id", (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).send("Invalid Order ID");
  }

  Order.findByIdAndRemove(req.params.id)
    .then(async (order) => {
      if (order) {
        await order.orderItems.map(async (item) => {
          await OrderItem.findByIdAndRemove(item);
        });
        return res.status(200).json({
          success: true,
          message: "the order is deleted",
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "order not found",
        });
      }
    })
    .catch((err) => {
      return res.status(400).json({
        success: false,
        message: err,
      });
    });
});

router.get("/get/totalsales", async (req, res) => {
  const totalSales = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalsales: { $sum: "$totalPrice" },
      },
    },
  ]);

  if (!totalSales) {
    return res.status(400).send("The total order sales cammot be generated");
  }

  res.send({ totalsales: totalSales.pop().totalsales });
});

router.get("/get/count", async (req, res) => {
  const orderCount = await Order.countDocuments();

  if (!orderCount) {
    res.status(500).json({ success: false });
  }
  res.send({
    count: orderCount,
  });
});

router.get("/get/userorders/:userid", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.userid)) {
    res.status(400).send("Invalid Order ID");
  }

  const userOrders = await Order.find({ user: req.params.userid })
    .populate({
      path: "orderItems",
      populate: { path: "product", populate: "category" },
    })
    .sort({ dateOrdered: -1 });
  if (!userOrders) {
    res.status(500).json({ success: false });
  }
  res.send(userOrders);
});

module.exports = router;
