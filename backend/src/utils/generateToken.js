const jwt = require("jsonwebtoken");

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "15m"
    }
  );
};

module.exports = generateAccessToken;