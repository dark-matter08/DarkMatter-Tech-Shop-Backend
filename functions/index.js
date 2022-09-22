require("dotenv/config");
const functions = require("firebase-functions");
const express = require("express");
const morgan = require("morgan");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");

const productsRouter = require("./routers/products");
const usersRouter = require("./routers/users");
const ordersRouter = require("./routers/orders");
const categoriesRouter = require("./routers/categories");

const authJwt = require("./helpers/jwt");
const errorHandler = require("./helpers/error-handler");

app.use(cors());
app.options("*", cors());

const api = functions.config().env_var.api_url;

//  ============================== Middleware ==========================
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(authJwt());
app.use(errorHandler);

//  ===============================  routers ============================
app.use(`${api}/categories`, categoriesRouter);
app.use(`${api}/products`, productsRouter);
app.use(`${api}/users`, usersRouter);
app.use(`${api}/orders`, ordersRouter);

mongoose
  .connect(functions.config().env_var.connection_string)
  .then(() => {
    console.log("Database connection is ready...");
  })
  .catch((err) => {
    console.log(err);
  });

// app.listen(3000, () => {
//   console.log("Server is running on http://localhost:8080");
// });

exports.api = functions.https.onRequest(app);
