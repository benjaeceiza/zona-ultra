import { useEffect, useState } from "react";
import { getUsers } from "../../../services/getUsers";
import { IoMdCreate, IoIosAddCircle } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { FaUserCircle } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom"; 
import ModalEditUserAdmin from "./ModalEditUserAdmin";
import { updateUserAdmin } from "../../../services/updateUser";
import ModalDeleteUser from "./ModalDeleteUser";
import { deleteUserService } from "../../../services/deleteUser";
import { toast } from "react-toastify"; // 1. IMPORTAR TOAST

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const navigate = useNavigate(); 

    const obtenerUsuarios = async () => {
        try {
            const res = await getUsers();
            if (res.users) {
                const usersWithRole = res.users.map(u => ({ ...u, rol: u.rol || 'Runner' }));
                setUsers(usersWithRole);
            }
        } catch (error) {
            console.log("Error del backend");
            toast.error("Error al cargar los usuarios"); // Feedback visual
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
        const token = localStorage.getItem('token');
        const res = await updateUserAdmin(updatedData._id, updatedData, token);

        if (res.success) {
            setUsers(prevUsers => prevUsers.map(user =>
                user._id === updatedData._id ? { ...user, ...updatedData } : user
            ));

            setIsEditOpen(false);
            toast.success("Usuario actualizado correctamente"); // Toast de éxito
        } else {
            toast.error("Error al actualizar el usuario"); // Toast de error
        }
    };

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setIsDeleteOpen(true);
    };

    const confirmDelete = async (id) => {
        const token = localStorage.getItem('token');
        const res = await deleteUserService(id, token);

        if (res.success) {
            setUsers(prevUsers => prevUsers.filter(user => user._id !== id));
            setIsDeleteOpen(false);
            toast.success("Usuario eliminado con éxito"); // Toast de éxito
        } else {
            toast.error("Error al eliminar: " + res.message); // Toast de error (antes era alert)
        }
    };

    const handleAction = (e, action) => {
        e.preventDefault(); 
        e.stopPropagation(); 
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
                        <Link
                            key={item._id}
                            className="user-card-link"
                            to={"/detalle-plan/" + item._id}
                        >
                            <div className="user-card">
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

                                <div className="action-buttons">
                                    <button
                                        className="btn-icon btn-plan"
                                        title="Asignar Plan"
                                        onClick={(e) => handleAction(e, () => navigate(`/crear-plan/${item._id}`))}
                                    >
                                        <IoIosAddCircle />
                                    </button>

                                    <button
                                        className="btn-icon btn-edit"
                                        title="Editar Usuario"
                                        onClick={(e) => handleAction(e, () => handleEditClick(item))}
                                    >
                                        <IoMdCreate />
                                    </button>

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