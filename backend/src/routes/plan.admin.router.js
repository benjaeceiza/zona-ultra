import { Router } from "express";
import { isAdminMiddleware } from "../middleware/isAdminMiddleware.js";
import { authMiddleware } from "../middleware/auth.js";
import { 
  addMicrociclo,
  createPlan, 
  deleteFullMacro, 
  deleteMicrociclo, 
  deletePlan, 
  updatePlan 
} from "../controllers/planController.js";
import { checkDemoUser } from "../middleware/checkDemoUser.js";

export const router = Router();

// ========================================================
// 1. RUTAS ESTÁTICAS / ESPECÍFICAS (Van arriba de todo)
// ========================================================

// Agrega un microciclo a un mesociclo específico y reordena el plan
router.post("/add-microcycle", authMiddleware, isAdminMiddleware, checkDemoUser, addMicrociclo);

// Elimina un microciclo específico y reordena el plan
router.delete("/delete-microcycle/:idPlan", authMiddleware, isAdminMiddleware, checkDemoUser, deleteMicrociclo);

// Edita los días/ejercicios de un plan específico
router.put('/update/:idPlan', authMiddleware, isAdminMiddleware, checkDemoUser, updatePlan);

// Elimina todo el plan de entrenamiento (macrociclo + mesociclo + semanas) - SOLO ADMIN
router.delete('/macrociclo/:idMacro', authMiddleware, isAdminMiddleware, checkDemoUser, deleteFullMacro);


// ========================================================
// 2. RUTAS DINÁMICAS / COMODINES (Van abajo del todo)
// ========================================================

// Crea un plan (Mesociclo o Semana suelta) y lo asigna a un usuario
router.post("/:idUsuario", authMiddleware, isAdminMiddleware, checkDemoUser, createPlan);

// Elimina un plan y reordena el calendario
router.delete('/:idPlan', authMiddleware, isAdminMiddleware, checkDemoUser, deletePlan);

// 🔥 RUTA NUEVA RECOMENDADA (Podés agregar su controller después)
// router.get('/mesociclos/:idUsuario', authMiddleware, isAdminMiddleware, getMesociclosDelUsuario);