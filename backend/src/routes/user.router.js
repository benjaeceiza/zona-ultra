import { Router } from "express";
import { usuarioModelo } from "../models/user.model.js"
import { planModelo } from "../models/plan.model.js"
import { authMiddleware } from "../middleware/auth.js"
import { isAdminMiddleware } from "../middleware/isAdminMiddleware.js";

import { deleteUser, updateNextRace, updateUser, updateUserAdmin } from "../controllers/userController.js";
import { checkDemoUser } from "../middleware/checkDemoUser.js";

export const router = Router();

// --- RUTAS DE LECTURA (GET) - NO SE PROTEGEN CON checkDemo ---

/*Trae todos los usuarios (El Admin Demo puede ver el listado) */
router.get("/", authMiddleware, isAdminMiddleware, async (req, res) => {
  try {
    const users = await usuarioModelo.find().select('-password');
    if (users.length === 0) return res.status(404).json({ message: "No hay usuarios" });

    const todosLosPlanes = await planModelo.find();

    const usersConPlanes = users.map(user => {
        const userObj = user.toObject(); 
        userObj.planes = todosLosPlanes.filter(
            plan => plan.usuario.toString() === userObj._id.toString()
        );
        return userObj;
    });

    return res.status(200).json({ message: "Usuarios obtenidos", users: usersConPlanes });
    
  } catch (error) {
    console.error("❌ Error obteniendo usuarios:", error);
    return res.status(500).json({ error: error.message });
  }
});


/* Trae un usuario por id con TODOS sus planes (El Admin Demo puede ver el detalle de un alumno) */
router.get("/admin/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await usuarioModelo.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const todosLosPlanes = await planModelo.find({ usuario: userId }).sort({ createdAt: 1 });

    const userConPlanes = {
      ...user.toObject(),
      planes: todosLosPlanes
    };

    return res.status(200).json({
      message: "Datos obtenidos",
      user: userConPlanes
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Error al obtener datos",
      details: error.message,
    });
  }
});


/* Trae al usuario logueado (El Corredor Demo puede ver su propio perfil) */
router.get("/user", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await usuarioModelo.findById(userId)
      .select('-password -recoveryCodeHash -recoveryCodeExpires');

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const planesDelUsuario = await planModelo.find({ 
        usuario: userId,
        estado: { $in: ['activo', 'pendiente'] } 
    });

    const userConPlanes = {
        ...user.toObject(),
        planes: planesDelUsuario
    };

    return res.status(200).json({
      message: "Usuario obtenido",
      user: userConPlanes 
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Error al obtener el usuario",
      details: error.message,
    });
  }
});


// --- RUTAS DE ESCRITURA (PUT / DELETE) - SE PROTEGEN CON checkDemo ---

// ACTUALIZAR PRÓXIMA CARRERA (El Corredor Demo no guarda la carrera real)
router.put("/race/:id", authMiddleware, checkDemoUser, updateNextRace);

// ACTUALIZAR LA INFORMACION DEL USUARIO (El Admin Demo no guarda la info real)
router.put('/admin-edit/:id', authMiddleware, isAdminMiddleware, checkDemoUser, updateUserAdmin);

// ACTUALIZAR EL PERFIL DEL CORREDOR (El Corredor Demo no guarda la info real)
router.put('/edit/:id', authMiddleware, checkDemoUser, updateUser);

// ELIMINAR USUARIO (El Admin Demo no puede borrar alumnos)
router.delete('/:id', authMiddleware, isAdminMiddleware, checkDemoUser, deleteUser);