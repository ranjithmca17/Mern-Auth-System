const express = require("express");
const router = express.Router();
const { registerValidator ,loginValidator} = require("../validators/authValidator");
const validateRequest = require("../middleware/validateRequest");
const { registerUser,loginUser,refreshTokenController,logoutUser ,forgotPassword,resetPassword} = require("../controllers/authController");

router.post("/register", registerValidator, validateRequest, registerUser);

router.post("/login", loginValidator, validateRequest, loginUser);

// Refresh token route
router.post("/refresh", refreshTokenController);

// Logout route
router.post("/logout", logoutUser);

//forgot password
router.post("/forgot-password", forgotPassword);

router.post("/reset-password/:token", resetPassword);

module.exports = router;