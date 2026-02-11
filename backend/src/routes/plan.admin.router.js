import { Router } from "express";
import { isAdminMiddleware } from "../middleware/isAdminMiddleware.js";
import { authMiddleware } from "../middleware/auth.js";
import { createPlan, toggleTrainingStatus } from "../controllers/planController.js";

export const router = Router();



// Crea un plan y lo asigna a un usuario
// Primero verifica quién eres (auth), luego verifica si tienes permiso (admin)
router.post("/:idUsuario", authMiddleware,isAdminMiddleware,createPlan);

// router.patch porque solo actualizamos una partecita
router.patch('/actualizar-progreso', authMiddleware, toggleTrainingStatus);


