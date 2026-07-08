import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Sidebar from "./Sidebar";

import { 
    FaUserCircle, FaRunning, FaHome, FaUserPlus, 
    FaClipboardList, FaUsers, FaSignInAlt, FaHistory, FaEllipsisV, FaMedal
} from "react-icons/fa";

import { getUserLogued } from "../../services/getUserLogued"; 

const Navbar = () => {
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
        if (freshUser) setCurrentUser(freshUser); 
    };

    return (
        <>
            {/* --- VISTA DESKTOP (> 1024px) --- */}
            <Sidebar token={token} currentUser={currentUser} />

            {/* --- MENÚ FLOTANTE MÓVIL (EXCLUSIVO ADMIN: SIN LOGOUT NI "MI CUENTA") --- */}
            {token && currentUser && currentUser.rol === "admin" && isMobileMenuOpen && (
                <div className="admin-mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="admin-mobile-menu" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-menu-header">Gestión Admin ⚡</div>
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

                        {/* 🔥 3 PUNTITOS: SOLO SE MUESTRAN SI EL USUARIO ES ADMIN */}
                        {currentUser.rol === "admin" && (
                            <button 
                                type="button"
                                className={`tabbar-item ${isMobileMenuOpen ? 'active' : ''}`}
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                <FaEllipsisV className="tabbar-icon" />
                                <span>Admin</span>
                            </button>
                        )}

                        {/* 🔥 FOTO DE PERFIL EN EL TABBAR (PARA TODOS) */}
                        <NavLink className="tabbar-item" to="/perfil">
                            <div className="tabbar-user-avatar">
                                {currentUser.avatar ? (
                                    <img src={currentUser.avatar} alt="Perfil" />
                                ) : (
                                    <FaUserCircle className="tabbar-icon" style={{ marginBottom: 0 }} />
                                )}
                            </div>
                            <span>Perfil</span>
                        </NavLink>

                        
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