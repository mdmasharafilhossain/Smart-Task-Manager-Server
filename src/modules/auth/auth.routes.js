import { Router } from "express";
import * as authController from "./auth.controller.js";
import { authRequired } from "../../middleware/middleware.js";


const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me",authRequired, authController.getMe);

export default router;
