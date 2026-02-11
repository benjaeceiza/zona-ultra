import { useEffect, useState } from "react";
import { getUsers } from "../../../services/getUsers";
import { IoMdCreate } from "react-icons/io";
import { IoIosAddCircle } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { FaUserCircle } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";
import { Link } from "react-router-dom";

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const obtenerUsuarios = async () => {
        try {
            const res = await getUsers();
            if (res.users) {
                // Mock de rol si no viene del back, para que veas el diseño
                const usersWithRole = res.users.map(u => ({ ...u, rol: u.rol || 'Runner' }));
                setUsers(usersWithRole);
            } else {
                console.log(res.message || "No se encontraron usuarios");
            }
        } catch (error) {
            console.log("Error del backend");
        }
    };

    useEffect(() => {
        obtenerUsuarios();
    }, []);

    // Filtro simple para el buscador
    const filteredUsers = users.filter(user =>
        user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.apellido?.toLowerCase().includes(searchTerm.toLowerCase())
    );    

    return (
        <main className="admin-container">
            <header className="admin-header">
                <div>
                    <h1>Gestión de Corredores</h1>
                    <p className="subtitle">Administra tu equipo y planes</p>
                </div>

                <div className="search-box">
                    <IoSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar corredor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <section className="user-list-grid">
                {filteredUsers.length > 0 ? (
                    filteredUsers.map((item) => (
                        <Link key={item._id || item.id} className="user-card-link" to={"/detalle-plan/"+item._id}>
                            <div  className="user-card">
                                {/* Columna Izq: Info Usuario */}
                                <div className="user-info">
                                    <div className="avatar-placeholder">
                                        {/* Si tiene foto la mostras, sino icono */}
                                        <FaUserCircle />
                                    </div>
                                    <div className="text-data">
                                        <h3>{item.nombre} {item.apellido}</h3>
                                        <span className="user-role">{item.rol || "Atleta"}</span>
                                        <span className="user-email">{item.email}</span>
                                    </div>
                                </div>

                                {/* Columna Der: Acciones */}
                                <div className="action-buttons">
                                    <button className="btn-icon btn-plan" title="Asignar Plan">
                                        <IoIosAddCircle />
                                    </button>
                                    <button className="btn-icon btn-edit" title="Editar Usuario">
                                        <IoMdCreate />
                                    </button>
                                    <button className="btn-icon btn-delete" title="Eliminar">
                                        <MdDelete />
                                    </button>
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="empty-state">
                        <p>No se encontraron corredores con ese nombre.</p>
                    </div>
                )}
            </section>
        </main>
    );
};

export default UserList;