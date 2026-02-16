import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { FaUserCircle } from "react-icons/fa";
import { IoMdCreate } from "react-icons/io";

import ModalEditNormal from "./ModalEditNormal";
import { updateUser } from "../../services/updateUser";
import { getUserLogued } from "../../services/getUserLogued"; 

const Navbar = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    
    const [currentUser, setCurrentUser] = useState(null);

    const token = localStorage.getItem("token");

    // --- 1. CARGA INICIAL ---
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
                            
                            {/* FILA 1: Nombre + Botón Editar */}
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

                            {/* FILA 2: ROL (Agregado aquí abajo) */}
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
                    {/* ... (El resto de tu lista de links sigue igual) ... */}
                    {token && (
                        <li className="navbarItem">
                            <NavLink className="navbarLink" to="/" onClick={closeMenu}>Dashboard</NavLink>
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
        </>
    );
};

export default Navbar;