import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Sidebar from "./Sidebar";

// Iconos
import { 
    FaUserCircle, FaRunning, FaHome, FaSignOutAlt, FaUserPlus, 
    FaClipboardList, FaUsers, FaSignInAlt, FaHistory, FaEllipsisV, FaMedal
} from "react-icons/fa";

import { getUserLogued } from "../../services/getUserLogued"; 

const Navbar = () => {
    const navigate = useNavigate();
    
    // Estados
    const [currentUser, setCurrentUser] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setCurrentUser({
                    _id: decoded.id || decoded._id,
                    nombre: decoded.nombre,
                    rol: decoded.rol,
                });
                refreshUserData(); 
            } catch (error) {
                localStorage.clear();
            }
        }
    }, [token]);

    const refreshUserData = async () => {
        if (!token) return;
        const freshUser = await getUserLogued(token);
        if (freshUser) {
            setCurrentUser(freshUser); 
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        setIsMobileMenuOpen(false);
        navigate("/login");
    };

    return (
        <>
            {/* --- VISTA DESKTOP (> 1024px) --- */}
            <Sidebar 
                token={token}
                currentUser={currentUser}
                onLogout={handleLogout}
            />

            {/* --- VISTA MOBILE (<= 1024px) --- */}
            {token && currentUser && isMobileMenuOpen && (
                <div className="admin-mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="admin-mobile-menu" onClick={(e) => e.stopPropagation()}>
                        
                        {/* 🔥 RUTA ACTUALIZADA A /PERFIL EN MÓVIL */}
                        <NavLink 
                            className="admin-menu-item" 
                            to="/perfil" 
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <FaUserCircle className="admin-menu-icon" />
                            <span>Mi Cuenta</span>
                        </NavLink>

                        {currentUser.rol === "admin" && (
                            <>
                                <div style={{ borderTop: "1px solid #333", margin: "5px 0" }}></div>
                                <NavLink className="admin-menu-item" to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                                    <FaUserPlus className="admin-menu-icon" />
                                    <span>Alta Usuario</span>
                                </NavLink>
                                <NavLink className="admin-menu-item" to="/crear-plan" onClick={() => setIsMobileMenuOpen(false)}>
                                    <FaClipboardList className="admin-menu-icon" />
                                    <span>Crear Plan</span>
                                </NavLink>
                                <NavLink className="admin-menu-item" to="/usuarios" onClick={() => setIsMobileMenuOpen(false)}>
                                    <FaUsers className="admin-menu-icon" />
                                    <span>Lista Usuarios</span>
                                </NavLink>
                            </>
                        )}

                        <div style={{ borderTop: "1px solid #333", margin: "5px 0" }}></div>
                        <div 
                            className="admin-menu-item" 
                            onClick={handleLogout}
                            style={{ cursor: "pointer", color: "#ff4d4d" }}
                        >
                            <FaSignOutAlt className="admin-menu-icon" />
                            <span>Cerrar sesión</span>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TABBAR INFERIOR --- */}
            <nav className="tabbar">
                {token && currentUser ? (
                    <>
                        <NavLink className="tabbar-item" to="/">
                            <FaHome className="tabbar-icon" />
                            <span>Panel</span>
                        </NavLink>
                        
                        <NavLink className="tabbar-item" to={`/historial/${currentUser._id}`}>
                            <FaHistory className="tabbar-icon" />
                            <span>Historial</span>
                        </NavLink>

                        <NavLink className="tabbar-item" to="/mis-zapatillas">
                            <FaRunning className="tabbar-icon" />
                            <span>Zapatillas</span>
                        </NavLink>
                        
                        <NavLink className="tabbar-item" to="/medallero">
                            <FaMedal className="tabbar-icon" />
                            <span>Medallero</span>
                        </NavLink>

                        <button 
                            type="button"
                            className={`tabbar-item ${isMobileMenuOpen ? 'active' : ''}`}
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <FaEllipsisV className="tabbar-icon" />
                            <span>Más</span>
                        </button>
                    </>
                ) : (
                    <NavLink className="tabbar-item" to="/login" style={{ width: "100%" }}>
                        <FaSignInAlt className="tabbar-icon" />
                        <span>Login</span>
                    </NavLink>
                )}
            </nav>
        </>
    );
};

export default Navbar;