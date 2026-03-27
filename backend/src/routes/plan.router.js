import { Router } from "express";
import { completeCurrentWeek, getPlan, submitFeedback } from "../controllers/planController.js";
import { authMiddleware } from "../middleware/auth.js";


export const router = Router();

// El usuario demo NO puede guardar feedback real en la BD
router.put('/feedback', authMiddleware, submitFeedback);

// El usuario demo NO puede avanzar la semana real en la BD
// (Le agregué el authMiddleware que faltaba para mayor seguridad)
router.put('/complete-week/:idUsuario', authMiddleware, completeCurrentWeek);

// El usuario demo SÍ puede ver su plan de entrenamiento
router.get('/:idPlan', authMiddleware, getPlan);