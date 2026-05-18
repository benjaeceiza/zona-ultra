import { Router } from "express";
import { isAdminMiddleware } from "../middleware/isAdminMiddleware.js";
import { authMiddleware } from "../middleware/auth.js";
import { 
  createPlan, 
  deleteFullMacro, 
  deletePlan, 
  updatePlan 
  // (toggleTrainingStatus se fue al otro router)
} from "../controllers/planController.js";
import { checkDemoUser } from "../middleware/checkDemoUser.js";

export const router = Router();

// Crea un plan (Mesociclo o Semana suelta) y lo asigna a un usuario
// Orden: 1° Quién sos, 2° Sos admin?, 3° Sos de prueba?, 4° Crealo
router.post("/:idUsuario", authMiddleware, isAdminMiddleware, checkDemoUser, createPlan);

// Edita los días/ejercicios de un plan específico
router.put('/update/:idPlan', authMiddleware, isAdminMiddleware, checkDemoUser, updatePlan);

// Elimina un plan y reordena el calendario
router.delete('/:idPlan', authMiddleware, isAdminMiddleware, checkDemoUser, deletePlan);

// 🔥 RUTA NUEVA RECOMENDADA (Podés agregar su controller después)
// router.get('/mesociclos/:idUsuario', authMiddleware, isAdminMiddleware, getMesociclosDelUsuario);

// ELimina todo el plan de entrenamiento (macrociclo + mesociclo + semanas) - SOLO ADMIN
router.delete('/macrociclo/:idMacro', authMiddleware, isAdminMiddleware, checkDemoUser, deleteFullMacro);