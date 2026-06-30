import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

// Iconos para Desktop
import { FaUserCircle } from "react-icons/fa";
import { IoMdCreate } from "react-icons/io";

// Iconos para el TabBar Mobile
import { 
    FaHome, 
    FaRunning, 
    FaSignOutAlt, 
    FaUserPlus, 
    FaClipboardList, 
    FaUsers,
    FaSignInAlt,
    FaHistory,
    FaEllipsisV, // Icono de los 3 puntitos verticales
    FaMedal      // NUEVO: Icono del medallero
} from "react-icons/fa";

import ModalEditNormal from "./ModalEditNormal";
import { updateUser } from "../../services/updateUser";
import { getUserLogued } from "../../services/getUserLogued"; 

const Navbar = () => {
    const navigate = useNavigate();
    
    // Estados
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    
    // Unificamos el estado del menú flotante para todos los usuarios
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
        navigate("/login");
        setIsOpen(false); 
        setIsMobileMenuOpen(false); // Cerramos el menú al salir
    };

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    const handleSaveProfile = async (updatedData) => {
        const res = await updateUser(updatedData._id, updatedData, token);

        if (res.success) {
            await refreshUserData(); 
            alert("¡Perfil actualizado con éxito!");
            setIsProfileModalOpen(false);
        } else {
            alert("Error al actualizar: " + res.message);
        }
    };

    return (
        <>
            {token && currentUser && (
                <ModalEditNormal
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                    user={currentUser} 
                    onSave={handleSaveProfile}
                />
            )}

            {/* =========================================
                VISTA DESKTOP: MENÚ HAMBURGUESA Y SIDEBAR (Igual)
                ========================================= */}
            <div className="desktop-navigation">
                <button className="hamburger-btn" onClick={toggleMenu}>
                    ☰
                </button>

                <div
                    className={`overlay ${isOpen ? "active" : ""}`}
                    onClick={closeMenu}
                ></div>

                <nav className={`sidebar ${isOpen ? "open" : ""}`}>
                    <button className="close-btn-nav" onClick={closeMenu}>&times;</button>

                    {token && currentUser ? (
                        <div className="username-nav-profile">
                            <div className="username-nav-avatar">
                                <FaUserCircle />
                            </div>
                            <div className="username-nav-info">
                                <div className="username-nav-row">
                                    <span className="username-nav-name">
                                        {currentUser.nombre || "Corredor"} 
                                    </span>
                                    <button
                                        className="username-nav-edit-btn"
                                        title="Editar mi perfil"
                                        onClick={() => setIsProfileModalOpen(true)}
                                    >
                                        <IoMdCreate />
                                    </button>
                                </div>
                                <span className="username-nav-role">
                                    {currentUser.rol === 'admin' ? 'Admin' : 'User'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="sidebar-header">
                            <h2>Menu</h2>
                        </div>
                    )}

                    <ul className="navbarList">
                        {token && currentUser && (
                            <li className="navbarItem">
                                <NavLink className="navbarLink" to="/" onClick={closeMenu}>Panel de control</NavLink>
                                <NavLink className="navbarLink" to={`/historial/${currentUser._id}`} onClick={closeMenu}>Historial</NavLink>
                                <NavLink className="navbarLink" to={`/medallero`} onClick={closeMenu}>Medallero</NavLink>
                                <NavLink className="navbarLink" to="/mis-zapatillas" onClick={closeMenu}>Mis Zapatillas</NavLink>
                            </li>
                        )}

                        {currentUser?.rol === "admin" && (
                            <>
                                <li className="navbarItem"><NavLink className="navbarLink" to="/register" onClick={closeMenu}>Registrar Usuario</NavLink></li>
                                <li className="navbarItem"><NavLink className="navbarLink" to="/crear-plan" onClick={closeMenu}>Crear Plan</NavLink></li>
                                <li className="navbarItem"><NavLink className="navbarLink" to="/usuarios" onClick={closeMenu}>Lista Usuarios</NavLink></li>
                            </>
                        )}

                        {!token ? (
                            <li className="navbarItem">
                                <NavLink className="navbarLink" to="/login" onClick={closeMenu}>Login</NavLink>
                            </li>
                        ) : (
                            <li className="navbarItem logout-item" onClick={handleLogout}>
                                <span className="navbarLink">Cerrar sesion</span>
                            </li>
                        )}
                    </ul>
                </nav>
            </div>

            {/* =========================================
                VISTA MOBILE: TABBAR INFERIOR Y MENÚ MÁS (3 PUNTITOS)
                ========================================= */}
                
            {/* Menú flotante (Para TODOS los usuarios) */}
            {token && currentUser && isMobileMenuOpen && (
                <div className="admin-mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="admin-mobile-menu" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Opción para TODOS: Mi Cuenta */}
                        <div 
                            className="admin-menu-item" 
                            onClick={() => { setIsProfileModalOpen(true); setIsMobileMenuOpen(false); }}
                            style={{ cursor: "pointer" }}
                        >
                            <FaUserCircle className="admin-menu-icon" />
                            <span>Mi Cuenta</span>
                        </div>

                        {/* Opciones exclusivas del Admin */}
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

                        {/* Opción para TODOS: Salir */}
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

            <nav className="tabbar">
                {/* 1. Botones base para usuario logueado */}
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
                        
                        {/* NUEVO: Botón de Medallero */}
                        <NavLink className="tabbar-item" to="/medallero">
                            <FaMedal className="tabbar-icon" />
                            <span>Medallero</span>
                        </NavLink>

                        {/* Botón de "Más opciones" (3 puntitos) para TODOS los usuarios */}
                        <button 
                            className={`tabbar-item ${isMobileMenuOpen ? 'active' : ''}`}
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <FaEllipsisV className="tabbar-icon" />
                            <span>Más</span>
                        </button>
                    </>
                ) : (
                    /* Si no está logueado, solo mostramos el Login */
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