export const checkDemoUser = (req, res, next) => {
  // 1. Usamos req.user (que es como lo guarda tu authMiddleware)
  const user = req.user;

  // 2. ESCUDO DE SEGURIDAD: Si por alguna razón no hay usuario, frenamos acá
  // antes de que intente leer el .rol y explote
  if (!user) {
    return res.status(401).json({ message: "Usuario no autenticado" });
  }

  // 3. Ahora sí leemos el rol tranquilos
  if (user.rol === 'demo' || user.email === 'usuario@demo.com') {
    return res.status(403).json({
      error: "Estás en una cuenta de demostración. Esta acción está deshabilitada.",
      message: "Estás en una cuenta de demostración. Esta acción está deshabilitada.",
    });
  }

  // Si no es demo, lo dejamos pasar
  next();
};