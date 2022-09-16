const express = require("express");
const { restart } = require("nodemon");
const router = express.Router();
const { Category } = require("../models/category");
const mongoose = require("mongoose");

router.get("/", async (req, res) => {
  const categoryList = await Category.find();

  if (!categoryList) {
    res.status(500).json({ success: false });
  }
  res.status(200).send(categoryList);
});

router.get("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).send("Invalid Category ID");
  }
  const category = await Category.findById(req.params.id);

  if (!category)
    return res.status(404).send("the category with the id given was not found");

  res.status(200).send(category);
});

router.post("/", async (req, res) => {
  let category = new Category({
    name: req.body.name,
    icon: req.body.icon,
    color: req.body.color,
  });

  category = await category.save();

  if (!category) return res.status(404).send("the category cannot be created!");

  res.send(category);
});

router.put("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).send("Invalid Category ID");
  }
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      icon: req.body.icon,
      color: req.body.color,
    },
    { new: true }
  );

  if (!category) return res.status(400).send("the category cannot be updated");

  res.status(200).send(category);
});

router.delete("/:id", (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).send("Invalid Category ID");
  }

  Category.findByIdAndRemove(req.params.id)
    .then((category) => {
      if (category) {
        return res.status(200).json({
          success: true,
          message: "the category is deleted",
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "category not found",
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

module.exports = router;
