function errorHandler(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    return res
      .status(401)
      .json({ message: "The user is not authorized - Invalid Token" });
  }
  if (err.name === "ValidationError") {
    return res.status(401).json({ message: "The user is not validated" });
  }

  return res.status(500).json(err);
}

module.exports = errorHandler;
