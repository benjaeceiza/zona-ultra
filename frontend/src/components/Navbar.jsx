import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const Navbar = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false); // Estado para abrir/cerrar

    // --- Lógica de Auth (Igual que antes) ---
    const token = localStorage.getItem("token");
    let role = null;

    if (token) {
        try {
            const decoded = jwtDecode(token);
            role = decoded.rol;
        } catch (error) {
            localStorage.clear();
        }
    }

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
        setIsOpen(false); // Cerramos el menú al salir
    };

    // --- Funciones del Menú ---
    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    return (
        <>
            {/* 1. BOTÓN HAMBURGUESA (Siempre visible arriba a la izquierda) */}
            <button className="hamburger-btn" onClick={toggleMenu}>
                ☰
            </button>

            {/* 2. OVERLAY (Fondo negro semitransparente) */}
            {/* Solo se muestra si isOpen es true */}
            <div
                className={`overlay ${isOpen ? "active" : ""}`}
                onClick={closeMenu}
            ></div>

            {/* 3. SIDEBAR (El menú lateral) */}
            <nav className={`sidebar ${isOpen ? "open" : ""}`}>

                {/* Botón para cerrar dentro del menú (la 'X') */}
                <button className="close-btn" onClick={closeMenu}>&times;</button>

                <div className="sidebar-header">
                    <h2>Menu</h2>
                </div>

                <ul className="navbarList">

                    {token && (
                        <>
                            <li className="navbarItem">
                                <NavLink className="navbarLink" to="/" onClick={closeMenu}>
                                    Dashboard
                                </NavLink>
                                <NavLink className="navbarLink" to="/mis-zapatillas" onClick={closeMenu}>
                                    Mis Zapatillas
                                </NavLink>
                            </li>
                        </>
                    )}

                    {role === "admin" && (
                        <>
                            <li className="navbarItem">
                                <NavLink className="navbarLink" to="/register" onClick={closeMenu}>
                                    Registrar Usuario
                                </NavLink>
                            </li>
                            <li className="navbarItem">
                                <NavLink className="navbarLink" to="/crear-plan" onClick={closeMenu}>
                                    Crear Plan
                                </NavLink>
                            </li>
                            <li className="navbarItem">
                                <NavLink className="navbarLink" to="/usuarios" onClick={closeMenu}>
                                    Lista Usuarios
                                </NavLink>
                            </li>
                        </>
                    )}

                    {!token ? (
                        <li className="navbarItem">
                            <NavLink className="navbarLink" to="/login" onClick={closeMenu}>
                                Login
                            </NavLink>
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