import { Router } from "express";
import { isAdminMiddleware } from "../middleware/isAdminMiddleware.js";
import { authMiddleware } from "../middleware/auth.js";
import { createPlan, deletePlan, toggleTrainingStatus, updatePlan } from "../controllers/planController.js";
import { checkDemoUser } from "../middleware/checkDemoUser.js";

export const router = Router();

// Crea un plan y lo asigna a un usuario
// Orden: 1° Quién sos, 2° Sos admin?, 3° Sos de prueba?, 4° Crealo
router.post("/:idUsuario", authMiddleware, isAdminMiddleware, checkDemoUser, createPlan);

// Actualiza el progreso de un entrenamiento
router.patch('/actualizar-progreso', authMiddleware, checkDemoUser, toggleTrainingStatus);

// Edita el plan completo
router.put('/update/:idPlan', authMiddleware, isAdminMiddleware, checkDemoUser, updatePlan);

// Elimina el plan
router.delete('/:idPlan', authMiddleware, isAdminMiddleware, checkDemoUser, deletePlan);