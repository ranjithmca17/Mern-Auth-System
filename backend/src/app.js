const express = require('express');
const cors = require('cors');
const helmet= require('helmet');
const cookieParser = require('cookie-parser');
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const port = process.env.PORT || 3000;
const connectDB = require('./config/db');
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

connectDB();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res,next) => {
  res.status(200).json({
    success: true,
    message: "Authentication API is running"
  });
  next();
});



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});