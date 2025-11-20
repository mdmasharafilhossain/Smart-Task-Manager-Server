
import * as authService from "./auth.service.js";



const COOKIE_NAME = "token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; 

function cookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: true,           
    sameSite: "none",
    maxAge: COOKIE_MAX_AGE,
    path: "/",               
  };
}

export async function register(req, res) {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }
    const { token, user } = await authService.registerUser({ name, email, password });

    // set httpOnly cookie
    res.cookie(COOKIE_NAME, token, cookieOptions());

    // send user object (no passwordHash)
    return res.json({ user });
  } catch (e) {
    if (e && e.code === 11000) return res.status(409).json({ message: "Email already exists" });
    return res.status(500).json({ message: e?.message || "Server error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Missing fields" });

    const { token, user } = await authService.loginUser({ email, password });

   
    res.cookie(COOKIE_NAME, token, cookieOptions());

  
    return res.json({ user ,token});
  } catch (e) {
    console.error("login error:", e);
    return res.status(400).json({ message: e?.message || "Login failed" });
  }
}

export async function logout(req, res) {
  try {
   
    res.clearCookie(COOKIE_NAME, { path: "/" });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ message: "Logout failed" });
  }
}

export async function getMe(req, res) {
  try {
   
    const { id, email } = req.user || {};
    console.log(req.user);
    if (!id) return res.status(401).json({ message: "Unauthorized" });
    return res.json({ user: { id, email } });
  } catch (e) {
    console.error("getMe error:", e);
    return res.status(500).json({ message: "Server error" });
  }
}
