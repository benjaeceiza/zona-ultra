import { Router } from "express";
import { usuarioModelo } from "../models/user.model.js"
import { planModelo } from "../models/plan.model.js"
import { authMiddleware } from "../middleware/auth.js"
import { isAdminMiddleware } from "../middleware/isAdminMiddleware.js";
import { deleteUser, updateNextRace, updateUser, updateUserAdmin } from "../controllers/userController.js";

export const router = Router();


/*Trae todos los usuarios */
router.get("/", authMiddleware, isAdminMiddleware, async (req, res) => {
  try {
    // 🔥 POPULATE OBLIGATORIO: Llena el array de IDs con objetos reales
    const users = await usuarioModelo.find().populate('planes');

    if (users.length === 0) return res.status(404).json({ message: "No hay usuarios" });

    return res.status(200).json({ message: "Usuarios obtenidos", users });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});



/*Trae un usuario por id con su plan */
/* Trae un usuario por id con TODOS sus planes (Array) */
router.get("/admin/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // 1. Buscamos al usuario Y le decimos a Mongoose que llene el array 'planes'
    const user = await usuarioModelo.findById(userId)
        .populate('planes') // <--- LA CLAVE ESTÁ ACÁ
        .select('-password'); // Opcional: ocultamos password por seguridad

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // 2. Devolvemos el usuario
    // Ahora 'user.planes' es un array con todos los planes (activo, pendientes, finalizados)
    return res.status(200).json({
      message: "Datos obtenidos",
      user
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Error al obtener datos",
      details: error.message,
    });
  }
});




/* Trae un usuario logueado + su HISTORIAL DE PLANES */
router.get("/user", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await usuarioModelo.findById(userId)
      .populate('planes') 
      .select('-password -recoveryCodeHash -recoveryCodeExpires');

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // 🔥 CORRECCIÓN: Devolvemos el objeto dentro de la propiedad "user"
    return res.status(200).json({
      message: "Usuario obtenido",
      user: user // <--- ¡Así es como lo espera tu frontend!
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Error al obtener el usuario",
      details: error.message,
    });
  }
});


router.put("/race/:id", authMiddleware, updateNextRace);


//ACTUALIZAR LA INFORMACION DEL USUARIO;
router.put('/admin-edit/:id',authMiddleware,isAdminMiddleware, updateUserAdmin);

router.put('/edit/:id',authMiddleware, updateUser);

//ELIMINAR USUARIO
router.delete('/:id',authMiddleware, isAdminMiddleware, deleteUser);


