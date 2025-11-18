
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