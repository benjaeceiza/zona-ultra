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
    FaEllipsisV // Icono de los 3 puntitos verticales
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
    const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false); // Estado para el sub-menú mobile del admin

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
        setIsAdminMenuOpen(false);
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
                VISTA MOBILE: TABBAR INFERIOR Y MENÚ ADMIN
                ========================================= */}
                
            {/* Menú flotante del admin (Igual) */}
            {currentUser?.rol === "admin" && isAdminMenuOpen && (
                <div className="admin-mobile-menu-overlay" onClick={() => setIsAdminMenuOpen(false)}>
                    <div className="admin-mobile-menu" onClick={(e) => e.stopPropagation()}>
                        <NavLink className="admin-menu-item" to="/register" onClick={() => setIsAdminMenuOpen(false)}>
                            <FaUserPlus className="admin-menu-icon" />
                            <span>Alta Usuario</span>
                        </NavLink>
                        <NavLink className="admin-menu-item" to="/crear-plan" onClick={() => setIsAdminMenuOpen(false)}>
                            <FaClipboardList className="admin-menu-icon" />
                            <span>Crear Plan</span>
                        </NavLink>
                        <NavLink className="admin-menu-item" to="/usuarios" onClick={() => setIsAdminMenuOpen(false)}>
                            <FaUsers className="admin-menu-icon" />
                            <span>Lista Usuarios</span>
                        </NavLink>
                    </div>
                </div>
            )}

            <nav className="tabbar">
                {/* 1. Botones base para usuario logueado */}
                {token && currentUser && (
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
                    </>
                )}

                {/* 2. Botones de cuenta (Login o Perfil/Salir) */}
                {!token ? (
                    <NavLink className="tabbar-item" to="/login">
                        <FaSignInAlt className="tabbar-icon" />
                        <span>Login</span>
                    </NavLink>
                ) : (
                    <>
                        <button 
                            className="tabbar-item" 
                            onClick={() => setIsProfileModalOpen(true)}
                        >
                            <FaUserCircle className="tabbar-icon" />
                            <span>Perfil</span>
                        </button>
                        <button className="tabbar-item logout-btn" onClick={handleLogout}>
                            <FaSignOutAlt className="tabbar-icon" />
                            <span>Salir</span>
                        </button>
                    </>
                )}

                {/* 🔥 3. Botón de Admin AHORA AL FINAL (Renderizado a la derecha) */}
                {currentUser?.rol === "admin" && (
                    <button 
                        className={`tabbar-item ${isAdminMenuOpen ? 'active' : ''}`}
                        onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                    >
                        <FaEllipsisV className="tabbar-icon" />
                        <span>Admin</span>
                    </button>
                )}
            </nav>
        </>
    );
};

export default Navbar;