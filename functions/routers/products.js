const { Product } = require("../models/product");
const { Category } = require("../models/category");
const express = require("express");
const multer = require("multer");
const router = express.Router();
const mongoose = require("mongoose");
const parseMultimediaForm = require("../helpers/parse-multimedia-form");

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("invalid image type");

    if (isValid) {
      uploadError = null;
    }

    cb(uploadError, "public/uploads");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.replace(" ", "-");
    const uniqueSuffix = Date.now();
    const extention = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${uniqueSuffix}.${extention}`);
  },
});

const uploadOptions = multer({ storage: storage });
// ==================================================================

router.post("/file", async (req, res) => {
  url = await parseMultimediaForm(req)
    .then((res) => {
      console.log(res);
      return res;
    })
    .catch((e) => {
      return e;
    });
  res.send(url);
});

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
  body = await parseMultimediaForm(req, "products")
    .then((res) => {
      console.log(res);
      return res;
    })
    .catch((e) => {
      return e;
    });

  const category = await Category.findById(body.category);
  if (!category) return res.status(400).send("Invalid category");

  const file = body.signed_urls.length;
  if (!file)
    return res.status(400).send("Please ensure to select product image");

  let product = new Product({
    name: body.name,
    description: body.description,
    richDescription: body.richDescription,
    image: body.signed_urls[0],
    brand: body.brand,
    price: body.price,
    category: body.category,
    countInStock: body.countInStock,
    rating: body.rating,
    numReviews: body.numReviews,
    isFeatured: body.isFeatured,
  });

  product = await product.save();

  if (!product) return res.status(500).send("The product cannot be created");

  return res.status(200).send(product);
});

router.put("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).send("Invalid Product ID");
  }
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(400).send("Invalid Product");

  body = await parseMultimediaForm(req, "products")
    .then((res) => {
      console.log(res);
      return res;
    })
    .catch((e) => {
      return e;
    });

  if (!mongoose.isValidObjectId(body.category)) {
    res.status(400).send("Invalid category ID");
  }

  const category = await Category.findById(body.category);
  if (!category) return res.status(400).send("Invalid category");

  const files = body.signed_urls;
  let imagepath;

  if (files.length) {
    imagepath = files[0];
  } else {
    imagepath = product.image;
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name: body.name,
      description: body.description,
      richDescription: body.richDescription,
      image: imagepath,
      brand: body.brand,
      price: body.price,
      category: body.category,
      countInStock: body.countInStock,
      rating: body.rating,
      numReviews: body.numReviews,
      isFeatured: body.isFeatured,
    },
    { new: true }
  );

  if (!updatedProduct)
    return res.status(400).send("the product cannot be updated");

  res.status(200).send(updatedProduct);
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

router.put("/galleryimages/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).send("Invalid Product ID");
  }

  result = await parseMultimediaForm(req, "products")
    .then((res) => {
      console.log(res);
      return res;
    })
    .catch((e) => {
      return e;
    });

  let imagePaths = result.signed_urls;

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      images: imagePaths,
    },
    { new: true }
  );

  if (!product)
    return res.status(400).send("the product images could not be uploaded");

  res.status(200).send(product);
});

module.exports = router;
