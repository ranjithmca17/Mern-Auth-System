const express = require("express");
const router = express.Router();
const { registerValidator ,loginValidator} = require("../validators/authValidator");
const validateRequest = require("../middleware/validateRequest");
const { registerUser } = require("../controllers/authController");
const { loginUser } = require("../controllers/authController");

router.post("/register", registerValidator, validateRequest, registerUser);

router.post("/login", loginValidator, validateRequest, loginUser);

module.exports = router;