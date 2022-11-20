const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models/user");
const mongoose = require("mongoose");
const functions = require("firebase-functions");

router.get("/", async (req, res) => {
  const usersList = await User.find().select("-passwordhash");
  if (!usersList) {
    res.status(500).json({ success: false });
  }
  res.send(usersList);
});

router.get("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).send("Invalid user ID");
  }
  const user = await User.findById(req.params.id).select("-passwordhash");

  if (!user)
    return res.status(404).send("the user with the id given was not found");

  res.status(200).send(user);
});

router.post("/", async (req, res) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  let user = new User({
    name: req.body.name,
    email: req.body.email,
    passwordhash: hashedPassword,
    phone: req.body.phone,
    isAdmin: req.body.isAdmin,
    street: req.body.street,
    apartment: req.body.apartment,
    zip: req.body.zip,
    city: req.body.city,
    country: req.body.country,
  });

  user = await user.save();

  if (!user) return res.status(404).send("the user cannot be registered!");

  res.send(user);
});

router.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  const secret = functions.config().env_var.jwt_secret;

  if (!user) {
    return res.status(400).send("No user with this email was found");
  }

  if (user && bcrypt.compareSync(req.body.password, user.passwordhash)) {
    const token = jwt.sign(
      {
        userId: user.id,
        isAdmin: user.isAdmin,
      },
      secret,
      {
        expiresIn: "1d",
      }
    );
    return res.status(200).send({ user: user.email, token: token });
  } else {
    return res.status(400).send("Incorrect Password");
  }
});

router.post("/register", async (req, res) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  let user = new User({
    name: req.body.name,
    email: req.body.email,
    passwordhash: hashedPassword,
    phone: req.body.phone,
    isAdmin: req.body.isAdmin,
    street: req.body.street,
    apartment: req.body.apartment,
    zip: req.body.zip,
    city: req.body.city,
    country: req.body.country,
  });

  user = await user.save();

  if (!user) return res.status(404).send("the user cannot be registered!");

  res.send(user);
});

router.get("/get/count", async (req, res) => {
  const usersCount = await User.countDocuments();

  if (!usersCount) {
    res.status(500).json({ success: false });
  }
  res.send({
    count: usersCount,
  });
});

router.delete("/:id", (req, res) => {
  User.findByIdAndRemove(req.params.id)
    .then((user) => {
      if (user) {
        return res.status(200).json({
          success: true,
          message: "the user is deleted",
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "user not found",
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
