const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateAccessToken = require("../utils/generateToken");
const hashToken = require("../utils/hashToken");
const generateRefreshToken = require("../utils/generateRefreshToken");

// Register a new user
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try{
    const existingUser = await User.findOne({email});
    if(existingUser){
      return res.status(400).json({success: false, message: "Email already exists"});
    }

    const hashedPassword = await bcrypt.hash(password,12);
    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({success: true,
         message: "User registered successfully",
         user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email
         }
    });


  } catch (error) {
    console.error(error);
    res.status(500).json({success: false, message: "Server error"});    

  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid password" });
    }

    // Generate Access Token
    const token = generateAccessToken(user);
    
    console.log("User logged in Token :", token);

    // Generate Refresh Token
    const refreshToken = generateRefreshToken(user);
    console.log("User logged in Refresh Token :", refreshToken);

    // Hash Refresh Token before storing
    const refreshTokenHash = hashToken(refreshToken);
    console.log("User logged in Refresh Token Hash :", refreshTokenHash);

    // Store hashed refresh token in the database
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      sameSite: "Strict", // Adjust based on your requirements
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { registerUser, loginUser };
