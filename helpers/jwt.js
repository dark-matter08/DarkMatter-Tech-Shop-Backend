const { expressjwt: jwt } = require("express-jwt");

function authJwt() {
  const api = process.env.API_URL;
  const secret = process.env.JWT_SECRET;

  return jwt({
    secret: secret,
    algorithms: ["HS256"],
    isRevoked: isRevokedCallBack,
  }).unless({
    path: [
      { url: /\/api\/v1\/products(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/api\/v1\/categories(.*)/, methods: ["GET", "OPTIONS"] },
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
