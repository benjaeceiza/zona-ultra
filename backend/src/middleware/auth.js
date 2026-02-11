import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verificamos el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ¡IMPORTANTE! Aquí guardamos los datos del usuario en la request
    // para que el siguiente middleware (isAdmin) pueda usarlos.
    req.user = decoded; 
    
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};