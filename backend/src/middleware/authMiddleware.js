const jwt =require("jsonwebtoken");

const protect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log("Decoded token:", decoded);
        req.user = decoded;
        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({ success: false, message: "Unauthorized" });
    }
};

module.exports = protect;