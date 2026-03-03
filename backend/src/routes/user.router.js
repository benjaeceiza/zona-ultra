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
    // 1. Buscamos TODOS los usuarios (sin el populate, obviamente) y ocultamos passwords
    const users = await usuarioModelo.find().select('-password');

    if (users.length === 0) return res.status(404).json({ message: "No hay usuarios" });

    // 2. Buscamos TODOS los planes de la base de datos de una sola vez 
    // (Esto es muchísimo más rápido que hacer un 'find' por cada usuario)
    const todosLosPlanes = await planModelo.find();

    // 3. Cruzamos los datos en memoria: le inyectamos a cada usuario sus propios planes
    const usersConPlanes = users.map(user => {
        const userObj = user.toObject(); // Lo pasamos a objeto puro de JS
        
        // Filtramos solo los planes donde el ID del usuario coincida
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




/* Trae un usuario por id con TODOS sus planes (Array) */
router.get("/admin/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // 1. Buscamos al usuario de forma simple y le sacamos la password
    const user = await usuarioModelo.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // 2. Buscamos TODOS los planes de este usuario y los ordenamos por fecha
    // Así tenemos la historia completa (activos, pendientes y finalizados)
    const todosLosPlanes = await planModelo.find({ usuario: userId }).sort({ createdAt: 1 });

    // 3. Metemos los planes adentro del usuario de forma virtual (en memoria)
    const userConPlanes = {
      ...user.toObject(),
      planes: todosLosPlanes
    };

    // 4. Devolvemos la data con la misma estructura que esperaba React
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



router.get("/user", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Buscamos al usuario SIN el populate (Mucho más rápido y liviano)
    const user = await usuarioModelo.findById(userId)
      .select('-password -recoveryCodeHash -recoveryCodeExpires');

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // 2. Buscamos SOLO las semanas que el alumno necesita en el Dashboard (Activas o Pendientes)
    // Esto evita cargarle el celular con planes viejos de hace meses
    const planesDelUsuario = await planModelo.find({ 
        usuario: userId,
        estado: { $in: ['activo', 'pendiente'] } 
    });

    // 3. Unimos los datos en memoria para no romper el Frontend
    const userConPlanes = {
        ...user.toObject(),
        planes: planesDelUsuario
    };

    // 🔥 Devolvemos el objeto dentro de la propiedad "user" tal cual lo espera tu Frontend
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

router.put("/race/:id", authMiddleware, updateNextRace);


//ACTUALIZAR LA INFORMACION DEL USUARIO;
router.put('/admin-edit/:id',authMiddleware,isAdminMiddleware, updateUserAdmin);

router.put('/edit/:id',authMiddleware, updateUser);

//ELIMINAR USUARIO
router.delete('/:id',authMiddleware, isAdminMiddleware, deleteUser);


