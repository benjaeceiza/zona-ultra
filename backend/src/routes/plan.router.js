import { Router } from "express";
import { 
  completeCurrentWeek, 
  getPlan, 
  submitFeedback, 
  toggleTrainingStatus // <-- Lo mudamos acá
} from "../controllers/planController.js";
import { authMiddleware } from "../middleware/auth.js";
import { checkDemoUser } from "../middleware/checkDemoUser.js";

export const router = Router();

// Actualiza el progreso de un entrenamiento (El check del día a día)
router.patch('/actualizar-progreso', authMiddleware, checkDemoUser, toggleTrainingStatus);

// El usuario guarda feedback real de cómo se sintió (RPE, km, zapas)
router.put('/feedback', authMiddleware, checkDemoUser, submitFeedback);

// Avanzar la semana real en la BD
router.put('/complete-week/:idUsuario', authMiddleware, checkDemoUser, completeCurrentWeek);

// El usuario puede ver su plan de entrenamiento activo
router.get('/:idPlan', authMiddleware, getPlan);

