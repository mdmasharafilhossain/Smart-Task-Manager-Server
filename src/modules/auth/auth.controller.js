
import { getUsersCollection, initDB } from "../../config/db.js";
import * as authService from "./auth.service.js";

export async function register(req, res) {
  try {
    
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
     
      return res.status(400).json({ message: "Missing fields" });
    }

    const data = await authService.registerUser({ name, email, password });
   
    return res.json(data);
  } catch (e) {
   
    if (e && e.code === 11000) return res.status(409).json({ message: "Email already exists" });
    return res.status(500).json({ message: e?.message || "Server error" });
  }
}

export async function login(req, res) {
  try {
   
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Missing fields" });

    const data = await authService.loginUser({ email, password });
    return res.json(data);
  } catch (e) {
  
    return res.status(400).json({ message: e?.message || "Login failed" });
  }
}

export async function myProfile(req, res) {
  try {
    // ensure DB ready
    await initDB();
    const Users = getUsersCollection();

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await Users.findOne({ _id: new (await import("mongodb")).ObjectId(userId) });
    if (!user) return res.status(404).json({ message: "User not found" });

    // remove sensitive fields
    const { passwordHash, ...safe } = user;
    // optionally attach token info if you want:
    // safe.token = req.user.token;

    return res.json({ user: safe });
  } catch (err) {
    console.error("myProfile error:", err);
    return res.status(500).json({ message: err?.message || "Server error" });
  }
}