const express = require("express");
const router = express.Router();
const { Order } = require("../models/order");

router.get(`/`, async (req, res) => {
  const ordersList = await Order.find();
  if (!ordersList) {
    res.status(500).json({ success: false });
  }
  res.send(ordersList);
});

module.exports = router;
