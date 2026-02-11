import { Router } from "express";
import { submitFeedback } from "../controllers/planController.js";
import { authMiddleware } from "../middleware/auth.js";

export const router = Router();



router.put('/feedback', authMiddleware, submitFeedback);
