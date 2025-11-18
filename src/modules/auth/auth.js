import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export async function hashPassword(password) {
  const saltRounds = Number(process.env.SALT_ROUNDS) || 10;
  const salt = await bcrypt.genSalt(saltRounds);
  return bcrypt.hash(password, salt);
}
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}
export function signToken(user) {
  const uid = user._id?.toString ? user._id.toString() : String(user.id || user._id);
  return jwt.sign({ id: uid, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
}
