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
    
    // Estado donde vive la verdad absoluta del usuario
    const [currentUser, setCurrentUser] = useState(null);

    const token = localStorage.getItem("token");

    // --- 1. CARGA INICIAL ---
    useEffect(() => {
        if (token) {
            try {
                // Decodificamos solo para tener algo rápido que mostrar (placeholders)
                const decoded = jwtDecode(token);
                
                // Seteamos data preliminar del token (puede ser vieja)
                setCurrentUser({
                    _id: decoded.id || decoded._id,
                    nombre: decoded.nombre,
                    rol: decoded.rol,
                    // Si el token no tiene apellido/tel, no pasa nada, el fetch lo arregla
                });

                // Inmediatamente buscamos la data REAL y FRESCA a la base de datos
                refreshUserData(); 

            } catch (error) {
                localStorage.clear();
            }
        }
    }, [token]);

    // --- FUNCIÓN AUXILIAR PARA REFRESCAR DATOS ---
    const refreshUserData = async () => {
        if (!token) return;
        const freshUser = await getUserLogued(token);
        if (freshUser) {
            setCurrentUser(freshUser); // Esto actualiza la UI al instante
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
        setIsOpen(false);
    };

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    // --- 2. ACÁ ESTÁ EL CAMBIO CLAVE ---
    const handleSaveProfile = async (updatedData) => {
        // Guardamos en el backend
        const res = await updateUser(updatedData._id, updatedData, token);

        if (res.success) {
            // EXITO: No deslogueamos.
            
            // 1. Refrescamos los datos del usuario localmente llamando a la API de nuevo
            await refreshUserData(); 

            // 2. Avisamos y cerramos
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
                    user={currentUser} // Le pasamos siempre el usuario actualizado
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
                            <div className="username-nav-row">
                                <span className="username-nav-name">
                                    {/* Acá se verá el nombre nuevo automáticamente */}
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
                        </div>
                    </div>
                ) : (
                    <div className="sidebar-header">
                        <h2>Menu</h2>
                    </div>
                )}

                <ul className="navbarList">
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