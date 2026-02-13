import { useEffect, useState } from "react";
import { getUsers } from "../../../services/getUsers";
import { IoMdCreate, IoIosAddCircle } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { FaUserCircle } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom"; // Importamos useNavigate
import ModalEditUserAdmin from "./ModalEditUserAdmin";
import { updateUserAdmin } from "../../../services/updateUser";
import ModalDeleteUser from "./ModalDeleteUser";
import { deleteUserService } from "../../../services/deleteUser";


const UserList = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const navigate = useNavigate(); // Hook para navegar programáticamente

    const obtenerUsuarios = async () => {
        try {
            const res = await getUsers();
            if (res.users) {
                const usersWithRole = res.users.map(u => ({ ...u, rol: u.rol || 'Runner' }));
                setUsers(usersWithRole);
            }
        } catch (error) {
            console.log("Error del backend");
        }
    };

    useEffect(() => {
        obtenerUsuarios();
    }, []);

    const filteredUsers = users.filter(user =>
        user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.apellido?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEditClick = (user) => {
        setSelectedUser(user);
        setIsEditOpen(true);
    };

    const handleSaveUser = async (updatedData) => {
        // 1. Obtener token (si usás auth)
        const token = localStorage.getItem('token');

        // 2. Llamar al servicio
        const res = await updateUserAdmin(updatedData._id, updatedData, token);

        if (res.success) {
            // 3. EXITO: Actualizamos la lista VISUALMENTE sin recargar pag
            // Recorremos el array de usuarios y reemplazamos solo el que se editó
            setUsers(prevUsers => prevUsers.map(user =>
                user._id === updatedData._id ? { ...user, ...updatedData } : user
            ));

            // 4. Cerramos modal y avisamos
            setIsEditOpen(false);
            alert("Usuario actualizado correctamente!"); // O un toast lindo
        } else {
            alert("Error: " + res.message);
        }
    };

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setIsDeleteOpen(true);
    };

    const confirmDelete = async (id) => {
        // 1. Obtener token
        const token = localStorage.getItem('token');

        // 2. Llamar al servicio
        const res = await deleteUserService(id, token);

        if (res.success) {
            // 3. ACTUALIZAR UI: Filtramos la lista para sacar al usuario borrado
            // Esto hace que desaparezca de la pantalla instantáneamente sin recargar
            setUsers(prevUsers => prevUsers.filter(user => user._id !== id));

            // 4. Cerrar modal y avisar
            setIsDeleteOpen(false);
            // Opcional: un toast o alert
            // alert("Usuario eliminado con éxito");
        } else {
            alert("Error al eliminar: " + res.message);
        }
    };


    // Esta función recibe el evento (e), lo detiene y ejecuta la acción
    const handleAction = (e, action) => {
        e.preventDefault(); // Evita que el Link padre navegue
        e.stopPropagation(); // Detiene la propagación del click hacia arriba
        action();
    };

    return (
        <main className="admin-container">
            <ModalEditUserAdmin
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                user={selectedUser}
                onSave={handleSaveUser}
            />
            <ModalDeleteUser
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={confirmDelete}
                user={userToDelete}
            />

            <header className="admin-header">
                {/* ... tu header ... */}
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
                        // EL LINK PADRE (Envuelve toda la card)
                        <Link
                            key={item._id}
                            className="user-card-link"
                            to={"/detalle-plan/" + item._id}
                        >
                            <div className="user-card">
                                {/* Info Usuario */}
                                <div className="user-info">
                                    <div className="avatar-placeholder">
                                        <FaUserCircle />
                                    </div>
                                    <div className="text-data">
                                        <h3>{item.nombre} {item.apellido}</h3>
                                        <span className="user-role">{item.rol || "Atleta"}</span>
                                        <span className="user-email">{item.email}</span>
                                    </div>
                                </div>

                                {/* Acciones (BOTONES HIJOS) */}
                                <div className="action-buttons">

                                    {/* Botón 1: Crear Plan */}
                                    <button
                                        className="btn-icon btn-plan"
                                        title="Asignar Plan"
                                        onClick={(e) => handleAction(e, () => navigate(`/crear-plan/${item._id}`))}
                                    >
                                        <IoIosAddCircle />
                                    </button>

                                    {/* Botón 2: Editar Usuario */}
                                    <button
                                        className="btn-icon btn-edit"
                                        title="Editar Usuario"
                                        onClick={(e) => handleAction(e, () => handleEditClick(item))}
                                    >
                                        <IoMdCreate />
                                    </button>

                                    {/* Botón 3: Eliminar */}
                                    <button
                                        className="btn-icon btn-delete"
                                        title="Eliminar"
                                        onClick={(e) => handleAction(e, () => handleDeleteClick(item))}
                                    >
                                        <MdDelete />
                                    </button>
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="empty-state">
                        <p>No se encontraron corredores.</p>
                    </div>
                )}
            </section>
        </main>
    );
};

export default UserList;