import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // 1. Agregamos el import con llaves

const LoginRoute = ({ children }) => {
    const token = localStorage.getItem("token");

    // Si no hay token, lo mandamos a loguearse
    if (!token) {
        return <Navigate to="/login" />;
    }

    try {
        const decoded = jwtDecode(token);

        // 2. IMPORTANTE: Aquí verificamos si el token expiró
        // El token guarda la fecha de expiración en 'exp' (en segundos)
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp < currentTime) {
            console.log("El token expiró");
            localStorage.removeItem("token");
            return <Navigate to="/login" />;
        }

         
        // Si el token es válido, dejamos pasar a cualquiera (User o Admin).
        return children;

    } catch (error) {
        // Si el token es falso o está corrupto
        localStorage.removeItem("token");
        return <Navigate to="/login" />;
    }
};

export default LoginRoute;