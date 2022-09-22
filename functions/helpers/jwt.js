const { expressjwt: jwt } = require("express-jwt");
const functions = require("firebase-functions");

function authJwt() {
  const api = functions.config().env_var.api_url;
  const secret = functions.config().env_var.jwt_secret;

  return jwt({
    secret: secret,
    algorithms: ["HS256"],
    isRevoked: isRevokedCallBack,
  }).unless({
    path: [
      { url: /\/public\/uploads(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/v1\/products(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/v1\/categories(.*)/, methods: ["GET", "OPTIONS"] },
      `${api}/users/login`,
      `${api}/users/register`,
    ],
  });
}

async function isRevokedCallBack(req, token) {
  if (!token.payload.isAdmin) {
    return true;
  }

  return false;
}

module.exports = authJwt;
