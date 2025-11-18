import { getUsersCollection, initDB } from "../../config/db.js";
import { comparePassword, hashPassword, signToken } from "./auth.js";


export async function registerUser({ name, email, password }) {
  await initDB(); 
  const Users = getUsersCollection();

  try {
    const passwordHash = await hashPassword(password);
    const data = { name, email, passwordHash, createdAt: new Date() };
    const result = await Users.insertOne(data);
    const user = { _id: result.insertedId, name, email };
    const token = signToken({ _id: user._id, email });
    return { token, user };
  } catch (err) {
   
    throw err; 
  }
}

export async function loginUser({ email, password }) {
  await initDB();
  const Users = getUsersCollection();

  try {
    const user = await Users.findOne({ email });
    if (!user) throw new Error("No user found with this email");

    const checkCredintials = await comparePassword(password, user.passwordHash);
    if (!checkCredintials) throw new Error("Invalid credentials");

    const token = signToken(user);
    return { token, user: { id: user._id, name: user.name, email: user.email } };
  } catch (err) {
   
    throw err;
  }
}