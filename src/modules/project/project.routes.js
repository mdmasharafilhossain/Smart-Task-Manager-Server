import { Router } from "express";
import * as projectController from "./project.controller.js";
import { authRequired } from "../../middleware/middleware.js";


const router = Router();

router.post("/", authRequired, projectController.createProject);
router.get("/", authRequired, projectController.listProjects);

export default router;
