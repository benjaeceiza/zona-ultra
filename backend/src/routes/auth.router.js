import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { isAdminMiddleware } from "../middleware/isAdminMiddleware.js";
import { loginUser, registerUser, resetPassword, sendRecoveryCode, verifyRecoveryCode } from "../controllers/authController.js";



export const router = Router();

//Solo el admin puede crear usuarios
// Register
router.post("/admin/register",authMiddleware,isAdminMiddleware,registerUser);


//Login
router.post("/login", loginUser);

router.post("/recover",sendRecoveryCode);

router.post('/verify-code', verifyRecoveryCode);

router.post("/reset",resetPassword );

