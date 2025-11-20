import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export function authRequired(req, res, next) {
  const header = req.headers.authorization;
  console.log("Header:", header);

  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  console.log("Token:", token);

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Payload:", payload);

    req.user = { id: payload.id, email: payload.email, token };
    next();
  } catch (e) {
    console.log("JWT ERROR:", e.message);
    return res.status(401).json({ message: "Invalid token" });
  }
}

