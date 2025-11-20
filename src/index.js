import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { initDB } from "./config/db.js";
dotenv.config();
const app = express();
app.use(cookieParser());
    app.use(cors({
        origin: "http://localhost:5173",        
  credentials: true,
    }));
    app.use(express.json()); 
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION", err);
});
process.on("unhandledRejection", (reason, p) => {
  console.error("UNHANDLED REJECTION at Promise:", p, "reason:", reason);
});

import authRoutes from './modules/auth/auth.routes.js'
import teamRoutes from './modules/team/team.routes.js'
import projectRoutes from './modules/project/project.routes.js'
import taskRoutes from './modules/task/task.routes.js'
import dashboardRoutes from './modules/dashboard/dashboard.routes.js'
const PORT = process.env.PORT || 5005;

async function start() {
  try {
    app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url, "auth-header:", req.headers.authorization, "cookie:", req.headers.cookie);
  if (req.method !== "GET") console.log("body:", req.body);
  next();
});
    await initDB(); 

   
    // app.use((req, res, next) => {
    //   console.log(new Date().toISOString(), req.method, req.url);
    //   if (req.method !== "GET") console.log("body:", req.body);
    //   next();
    // });

    app.use("/api/auth", authRoutes);
    app.use("/api/teams", teamRoutes);
    app.use("/api/projects", projectRoutes);
    app.use("/api/tasks", taskRoutes);
    app.use("/api/dashboard", dashboardRoutes);

  
    app.use((err, req, res, next) => {
      console.error("Unhandled error:", err);
      res.status(500).json({ message: err.message || "Internal Server Error" });
    });

    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
