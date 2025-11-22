import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export function authRequired(req, res, next) {
  try {
    
    let token = null;
    if (req.cookies && req.cookies.token) token = req.cookies.token;

    
    const header = req.headers.authorization || "";
    if (!token && header.toLowerCase().startsWith("bearer ")) {
      token = header.slice(7).trim();
    }

    if (!token) return res.status(401).json({ message: "Unauthorized: token missing" });

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: payload.id, email: payload.email };
      req.token = token;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Unauthorized: invalid token" });
    }
  } catch (err) {
  
    return res.status(500).json({ message: "Server error" });
  }
}
