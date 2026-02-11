import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; 

const AdminRoute = ({ children }) => {
    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/login" />;
    }

    try {
        const decoded = jwtDecode(token);

        // Verifica que tu rol sea 'admin'
        if (decoded.rol !== "admin") {
            return (
                <div style={{ textAlign: "center", marginTop: "50px" }}>
                    <h1>⛔ Acceso Denegado</h1>
                    <p>No tienes permisos para ver esta sección.</p>
                    <button onClick={() => window.location.href = "/"}>Volver al inicio</button>
                </div>
            );
        }

        return children;

    } catch (error) {
        localStorage.removeItem("token");
        return <Navigate to="/login" />;
    }
};

export default AdminRoute;