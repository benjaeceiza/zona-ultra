import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import logo from "../../assets/logo-zona-ultra.png"; 

const Sidebar = ({ token, currentUser, onLogout }) => {
    // Estado para controlar si la foto ya terminó de cargar de Cloudinary
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
        <aside className="fixed-sidebar-desktop">
            
            {/* --- ARRIBA: LOGO DE LA APP --- */}
            <div className="sidebar-brand">
                <img 
                    src={logo} 
                    alt="Zona Ultra" 
                    className="sidebar-logo-img" 
                    onError={(e) => e.target.style.display = 'none'} 
                />
            </div>

            {/* --- AL MEDIO: NAVEGACIÓN --- */}
            <nav className="sidebar-nav-links">
                {token && currentUser && (
                    <>
                        <NavLink className="sidebar-link" to="/">Panel de control</NavLink>
                        <NavLink className="sidebar-link" to={`/historial/${currentUser._id}`}>Historial</NavLink>
                        <NavLink className="sidebar-link" to="/medallero">Medallero</NavLink>
                        <NavLink className="sidebar-link" to="/mis-zapatillas">Mis Zapatillas</NavLink>
                    </>
                )}

                {/* Sección exclusiva para el Administrador */}
                {currentUser?.rol === "admin" && (
                    <div className="sidebar-admin-section">
                        <span className="sidebar-section-title">ADMINISTRACIÓN</span>
                        <NavLink className="sidebar-link" to="/register">Registrar Usuario</NavLink>
                        <NavLink className="sidebar-link" to="/crear-plan">Crear Plan</NavLink>
                        <NavLink className="sidebar-link" to="/usuarios">Lista Usuarios</NavLink>
                    </div>
                )}

                {!token && (
                    <NavLink className="sidebar-link" to="/login">Iniciar Sesión</NavLink>
                )}
            </nav>

            {/* --- ABAJO: ACCIONES DE USUARIO Y LOGOUT --- */}
            {token && currentUser ? (
                <div className="sidebar-footer-user">
                    
                    {/* 🔥 ENLACE DIRECTO AL PERFIL (REEMPLAZA AL LÁPIZ) */}
                    <Link to="/perfil" className="sidebar-user-section-link">
                        <div className="sidebar-user-avatar">
                            {currentUser.avatar ? (
                                <>
                                    {/* ☠️ Skeleton Loader mientras carga la imagen */}
                                    {!imageLoaded && <div className="avatar-skeleton"></div>}
                                    
                                    {/* 📸 Foto Real */}
                                    <img 
                                        src={currentUser.avatar} 
                                        alt="Perfil" 
                                        onLoad={() => setImageLoaded(true)}
                                        style={{ display: imageLoaded ? 'block' : 'none' }}
                                    />
                                </>
                            ) : (
                                <FaUserCircle />
                            )}
                        </div>
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-name">
                                {currentUser.nombre || "Runner"} 
                            </span>
                            <span className="sidebar-user-role">
                                {currentUser.rol === 'admin' ? 'Admin ⚡' : 'Runner'}
                            </span>
                        </div>
                    </Link>

                    <div className="sidebar-logout-wrapper">
                        <button className="sidebar-link logout-link-btn" onClick={onLogout}>
                            <FaSignOutAlt style={{ marginRight: '8px' }} /> Cerrar sesión
                        </button>
                    </div>
                </div>
            ) : (
                <div className="sidebar-footer-user" style={{ textAlign: 'center', padding: '15px' }}>
                    <span className="sidebar-user-role">Menú Principal</span>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;