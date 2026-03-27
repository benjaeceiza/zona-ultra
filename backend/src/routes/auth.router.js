import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { isAdminMiddleware } from "../middleware/isAdminMiddleware.js";
import { loginUser, registerUser, resetPassword, sendRecoveryCode, verifyRecoveryCode } from "../controllers/authController.js";
import { checkDemoUser } from "../middleware/checkDemoUser.js";

export const router = Router();

// Solo el admin REAL puede crear usuarios. El Admin Demo rebota acá.
// Register
router.post("/admin/register", authMiddleware, isAdminMiddleware, checkDemoUser, registerUser);

// --- RUTAS PÚBLICAS (No se protegen con el checkDemo) ---

// Login
router.post("/login", loginUser);

// Recuperación de contraseña
router.post("/recover", sendRecoveryCode);
router.post('/verify-code', verifyRecoveryCode);
router.post("/reset", resetPassword);