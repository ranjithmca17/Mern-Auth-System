const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const { getProfile } = require("../controllers/userController");

// Protected route
router.get("/profile", protect, getProfile);

module.exports = router;