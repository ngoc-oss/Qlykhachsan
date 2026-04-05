const jwt = require("jsonwebtoken");

const taoToken = (payload, loai = "access") => {
  const secret =
    loai === "refresh"
      ? process.env.JWT_REFRESH_SECRET
      : process.env.JWT_SECRET;

  const thoiGianHetHan =
    loai === "refresh"
      ? process.env.JWT_REFRESH_EXPIRE
      : process.env.JWT_EXPIRE;

  return jwt.sign(payload, secret, { expiresIn: thoiGianHetHan });
};

const giaiMaToken = (token, loai = "access") => {
  const secret =
    loai === "refresh"
      ? process.env.JWT_REFRESH_SECRET
      : process.env.JWT_SECRET;

  return jwt.verify(token, secret);
};

module.exports = { taoToken, giaiMaToken };
