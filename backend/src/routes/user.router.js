import { Router } from "express";
import { usuarioModelo } from "../models/user.model.js"
import { planModelo } from "../models/plan.model.js"
import { authMiddleware } from "../middleware/auth.js"
import { isAdminMiddleware } from "../middleware/isAdminMiddleware.js";
import { updateNextRace } from "../controllers/userController.js";

export const router = Router();


/*Trae todos los usuarios */
router.get("/", authMiddleware, isAdminMiddleware, async (req, res) => {
  try {
    const users = await usuarioModelo.find();

    if (users.length === 0) {
      return res.status(404).json({ message: "No hay usuarios" });
    }

    return res.status(200).json({
      message: "Usuarios obtenidos",
      users,
    });

  } catch (error) {
    return res.status(500).json({
      error: "Error al obtener usuarios",
      details: error.message,
    });
  }
});



/*Trae un usuario por id con su plan */
router.get("/admin/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // 1. Buscamos al usuario
    const user = await usuarioModelo.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // 2. Buscamos el plan que pertenece a este usuario
    // Como un usuario tiene un solo plan activo, usamos findOne
    const plan = await planModelo.findOne({ usuario: userId });

    return res.status(200).json({
      message: "Datos obtenidos",
      user,
      plan // <--- Ahora sí devolvemos el plan
    });

  } catch (error) {
    return res.status(500).json({
      error: "Error al obtener datos",
      details: error.message,
    });
  }
});



/* Trae un usuario logueado + su plan completo */
router.get("/user", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // 🔥 Agregamos .populate('plan')
    // Opcional: .select('-password') para que NO te devuelva la contraseña por seguridad
    const user = await usuarioModelo.findById(userId)
      .populate('plan')
      .select('-password -recoveryCodeHash -recoveryCodeExpires');


    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.status(200).json({
      message: "Usuario obtenido",
      user,
    });

  } catch (error) {
    return res.status(500).json({
      error: "Error al obtener el usuario",
      details: error.message,
    });
  }
});


router.put("/race/:id", authMiddleware, updateNextRace);


