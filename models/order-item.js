const mongoose = require("mongoose");

const orderItemSchema = mongoose.Schema({
  quantity: {
    type: Number,
    require: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Products",
  },
});

exports.OrderItem = mongoose.model("Order", orderItemSchema);
