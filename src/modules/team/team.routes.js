import { Router } from "express";
import * as teamController from "./team.controller.js";
import { authRequired } from "../../middleware/middleware.js";


const router = Router();

router.post("/", authRequired, teamController.createTeam);
router.post("/:teamId/members", authRequired, teamController.addMember);
router.get("/", authRequired, teamController.listTeams);

export default router;
