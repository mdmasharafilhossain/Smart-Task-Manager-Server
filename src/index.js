// index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDB } from "./db.js";

// import authRoutes from "./routes/auth.routes.js";
// import teamRoutes from "./routes/team.routes.js";
// import projectRoutes from "./routes/project.routes.js";
// import taskRoutes from "./routes/task.routes.js";
// import dashboardRoutes from "./routes/dashboard.routes.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => res.send("Smart Task Manager API Running..."));

// app.use("/api/auth", authRoutes);
// app.use("/api/teams", teamRoutes);
// app.use("/api/projects", projectRoutes);
// app.use("/api/tasks", taskRoutes);
// app.use("/api/dashboard", dashboardRoutes);

const PORT = process.env.PORT || 5001;

initDB().then(() => {
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}).catch(err => {
  console.error("DB connection failed:", err);
  process.exit(1);
});
