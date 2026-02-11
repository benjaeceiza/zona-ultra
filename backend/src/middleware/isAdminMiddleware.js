

export const isAdminMiddleware = async (req, res, next) => {
  try {
    // 1. Ya no verificamos token aquí. Confiamos en req.user
    // Si req.user no existe, es porque nos saltamos el authMiddleware (error de programador)
    if (!req.user || !req.user.id) {
        return res.status(500).json({ message: "Error: No user data found in request" });
    }



 

    // 3. Verificamos el rol
    if (req.user.rol !== "admin") { 
      return res.status(403).json({ message: "Acceso denegado: Requiere rol de Administrador" });
    }

    // 4. Todo bien, pasa al controlador
    next();

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error al verificar permisos de administrador" });
  }
};