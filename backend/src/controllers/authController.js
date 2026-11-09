const jwt = require("jsonwebtoken");
const crypto = require("crypto");
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

const refreshTokenController = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    console.log("Refresh Token from Cookie:", refreshToken);

    // 1. Check refresh token
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required"
      });
    }

    // 2. Verify refresh token
    let decoded;

    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );

      console.log("Decoded Refresh Token:", decoded);

    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token"
      });
    }

    // 3. Find user
    const user = await User.findById(decoded.userId)
      .select("+refreshTokenHash");

      console.log("User from DB:", user);

    if (!user || !user.isActive || !user.refreshTokenHash) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh session"
      });
    }

    // 4. Compare refresh token hash
    const incomingHash = hashToken(refreshToken);

    if (incomingHash !== user.refreshTokenHash) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token"
      });
    }

    // 5. Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // 6. Update refresh token hash
    user.refreshTokenHash = hashToken(newRefreshToken);
    await user.save();

    // 7. Send new refresh token cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // 8. Send new access token
    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      accessToken: newAccessToken
    });

  } catch (error) {
    console.error("Refresh token error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
  

const logoutUser = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    // No refresh token? Clear cookie and logout
    if (!refreshToken) {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/"
      });

      return res.status(200).json({
        success: true,
        message: "Logged out successfully"
      });
    }

    // Verify refresh token
    let decoded;

    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
    } catch (error) {
      decoded = null;
    }

    if (decoded) {
      const user = await User.findById(decoded.userId)
        .select("+refreshTokenHash");

      if (user) {
        const incomingHash = hashToken(refreshToken);

        if (incomingHash === user.refreshTokenHash) {
          user.refreshTokenHash = undefined;
          await user.save();
        }
      }
    }

    // Remove refresh token cookie from browser
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/"
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });

  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If the email exists, a reset link will be sent"
      });
    }

    // Generate random reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash the token before storing
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Store hashed token and expiry
    user.resetPasswordToken = hashedToken;

    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

    await user.save();

    // Development testing only
    if (process.env.NODE_ENV !== "production") {
      return res.status(200).json({
        success: true,
        message: "Password reset token generated",
        resetToken
      });
    }

    return res.status(200).json({
      success: true,
      message: "If the email exists, a reset link will be sent"
    });

  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body || {};

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters"
      });
    }
    // 1. Hash incoming reset token
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // 2. Find user using hashed token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    }).select("+resetPasswordToken +resetPasswordExpires");

    // 3. Validate token
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }

    // 4. Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 5. Update password
    user.password = hashedPassword;

    // 6. Remove reset token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // 7. Revoke existing refresh session
    user.refreshTokenHash = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please login again."
    });

  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


module.exports = { registerUser, loginUser, refreshTokenController, logoutUser,forgotPassword,resetPassword };