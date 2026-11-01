const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [3, "Name must contain at least 3 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"]
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must contain at least 8 characters"],
      select: false
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },

    isEmailVerified: {
      type: Boolean,
      default: false
    },

    isActive: {
      type: Boolean,
      default: true
    },
    refreshTokenHash: {
    type: String,
    select: false
    },
  },

  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;