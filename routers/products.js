const { Product } = require("../models/product");
const { Category } = require("../models/category");
const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");

router.get(`/`, async (req, res) => {
  let filter = {};

  if (req.query.categories) {
    const cat_filter = req.query.categories.split(",");
    filter = { category: cat_filter };
  }

  const productList = await Product.find(filter).populate("category");
  // const productList = await Product.find().select("name image -_id");

  if (!productList) {
    res.status(500).json({ success: false });
  }
  res.send(productList);
});

router.get(`/:id`, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).send("Invalid Product ID");
  }
  const product = await Product.findById(req.params.id).populate("category");

  if (!product) {
    res.status(500).json({
      success: false,
      message:
        "No product with that id was found in the database. it may have been deleted",
    });
  }
  res.send(product);
});

router.post(`/`, async (req, res) => {
  const category = await Category.findById(req.body.category);

  if (!category) return res.status(400).send("Invalid category");

  let product = new Product({
    name: req.body.name,
    description: req.body.description,
    richDescription: req.body.richDescription,
    image: req.body.image,
    brand: req.body.brand,
    price: req.body.price,
    category: req.body.category,
    countInStock: req.body.countInStock,
    rating: req.body.rating,
    numReviews: req.body.numReviews,
    isFeatured: req.body.isFeatured,
  });

  product = await product.save();

  if (!product) return res.status(500).send("The product cannot be created");

  return res.status(200).send(product);
});

router.put("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).send("Invalid Product ID");
  }
  if (!mongoose.isValidObjectId(req.body.category)) {
    res.status(400).send("Invalid category ID");
  }

  const category = await Category.findById(req.body.category);

  if (!category) return res.status(400).send("Invalid category");

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: req.body.image,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
    },
    { new: true }
  );

  if (!product) return res.status(400).send("the product cannot be updated");

  res.status(200).send(product);
});

router.delete("/:id", (req, res) => {
  Product.findByIdAndRemove(req.params.id)
    .then((product) => {
      if (product) {
        return res.status(200).json({
          success: true,
          message: "the product is deleted",
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "product not found",
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

router.get("/get/count", async (req, res) => {
  const productCount = await Product.countDocuments();

  if (!productCount) {
    res.status(500).json({ success: false });
  }
  res.send({
    count: productCount,
  });
});

router.get("/get/featured/:count", async (req, res) => {
  const count = req.params.count ? req.params.count : 1;
  const featuredProducts = await Product.find({ isFeatured: true }).limit(
    parseInt(count)
  );

  if (!featuredProducts) {
    res.status(500).json({ success: false });
  }
  res.send(featuredProducts);
});

module.exports = router;
