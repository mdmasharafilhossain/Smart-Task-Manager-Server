import { Router } from "express";
import * as taskController from "./task.controller.js";
import { authRequired } from "../../middleware/middleware.js";


const router = Router();

router.post("/", authRequired, taskController.createTask);
router.put("/:taskId", authRequired, taskController.updateTask);
router.delete("/:taskId", authRequired, taskController.deleteTask);
router.get("/", authRequired, taskController.listTasks);
router.get("/member-loads/:projectId", authRequired, taskController.memberLoads);

export default router;
