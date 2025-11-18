const dotenv = require('dotenv');
dotenv.config();

const { MongoClient, ServerApiVersion } = require('mongodb');

const MONGO_DB_URL = process.env.DB_URL;

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

async function initDB() {
  if (!client) throw new Error("MongoClient not created");
  
  if (_dbInstance && Users && Teams && Projects && Tasks && Activity) return;

  
  await client.connect();

 
  const db = client.db("smart_task_manager"); 
  _dbInstance = db;


  Users = db.collection("users");
  Teams = db.collection("teams");
  Projects = db.collection("projects");
  Tasks = db.collection("tasks");
  Activity = db.collection("activity");


  try {
    await Users.createIndex({ email: 1 }, { unique: true });
  } catch (e) {}

  try {
    await Tasks.createIndex({ projectId: 1 });
    await Tasks.createIndex({ assigneeId: 1 });
    await Tasks.createIndex({ teamId: 1 });
  } catch (e) {}


  await db.command({ ping: 1 });
  console.log("Connected to MongoDB Succesfully...");
}

function getUsersCollection() {
  if (!Users) throw new Error("Database not initialized. Call initDB() first.");
  return Users;
}
function getTeamsCollection() {
  if (!Teams) throw new Error("Database not initialized. Call initDB() first.");
  return Teams;
}
function getProjectsCollection() {
  if (!Projects) throw new Error("Database not initialized. Call initDB() first.");
  return Projects;
}
function getTasksCollection() {
  if (!Tasks) throw new Error("Database not initialized. Call initDB() first.");
  return Tasks;
}
function getActivityCollection() {
  if (!Activity) throw new Error("Database not initialized. Call initDB() first.");
  return Activity;
}

async function closeDB() {
  try {
    // await client.close();
    Users = Teams = Projects = Tasks = Activity = null;
    _dbInstance = null;
    console.log("MongoDB connection closed.");
  } catch (e) {
    console.warn("Error closing MongoDB connection:", e);
  }
}

module.exports = {
  client,
  initDB,
  closeDB,
  getUsersCollection,
  getTeamsCollection,
  getProjectsCollection,
  getTasksCollection,
  getActivityCollection,
};
