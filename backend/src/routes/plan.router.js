import { Router } from "express";
import { completeCurrentWeek, getPlan, submitFeedback } from "../controllers/planController.js";
import { authMiddleware } from "../middleware/auth.js";

export const router = Router();



router.put('/feedback', authMiddleware, submitFeedback);

router.put('/complete-week/:idUsuario', completeCurrentWeek);

router.get('/:idPlan', authMiddleware, getPlan);