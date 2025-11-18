import { Router } from "express";

import * as dashboardController from "./dashboard.controller.js";
import { authRequired } from "../../middleware/middleware.js";

const router = Router();

router.get("/", authRequired, dashboardController.getDashboard);
router.post("/reassign", authRequired, dashboardController.reassignTasks);

export default router;
