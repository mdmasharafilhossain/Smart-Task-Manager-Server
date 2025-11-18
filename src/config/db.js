// server/src/config/db.js
import dotenv from "dotenv";
dotenv.config();

import { MongoClient, ServerApiVersion } from "mongodb";

const MONGO_DB_URL = process.env.DB_URL;
if (!MONGO_DB_URL) {
  console.error("DB_URL is not defined in .env");
  process.exit(1);
}

const client = new MongoClient(MONGO_DB_URL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let Users = null;
let Teams = null;
let Projects = null;
let Tasks = null;
let Activity = null;
let _dbInstance = null;

export async function initDB() {
  if (!client) throw new Error("MongoClient not created");
  if (_dbInstance && Users && Teams && Projects && Tasks && Activity) return;

  await client.connect();
  // ping optional (after connect)
  await client.db("admin").command({ ping: 1 });

  const db = client.db("smart_task_manager");
  _dbInstance = db;

  Users = db.collection("users");
  Teams = db.collection("teams");
  Projects = db.collection("projects");
  Tasks = db.collection("tasks");
  Activity = db.collection("activity");

  try { await Users.createIndex({ email: 1 }, { unique: true }); } catch (e) { /* ignore */ }
  try {
    await Tasks.createIndex({ projectId: 1 });
    await Tasks.createIndex({ assigneeId: 1 });
    await Tasks.createIndex({ teamId: 1 });
  } catch (e) { /* ignore */ }

  console.log("Connected to MongoDB successfully.");
}

export function getUsersCollection() {
  if (!Users) throw new Error("Database not initialized. Call initDB() first.");
  return Users;
}
export function getTeamsCollection() {
  if (!Teams) throw new Error("Database not initialized. Call initDB() first.");
  return Teams;
}
export function getProjectsCollection() {
  if (!Projects) throw new Error("Database not initialized. Call initDB() first.");
  return Projects;
}
export function getTasksCollection() {
  if (!Tasks) throw new Error("Database not initialized. Call initDB() first.");
  return Tasks;
}
export function getActivityCollection() {
  if (!Activity) throw new Error("Database not initialized. Call initDB() first.");
  return Activity;
}

export async function closeDB() {
  try {
    await client.close();
    Users = Teams = Projects = Tasks = Activity = null;
    _dbInstance = null;
    console.log("MongoDB connection closed.");
  } catch (e) {
    console.warn("Error closing MongoDB connection:", e);
  }
}
