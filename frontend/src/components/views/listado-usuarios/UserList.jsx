import { useEffect, useState } from "react";
import { getUsers } from "../../../services/getUsers";
import { IoMdCreate, IoIosAddCircle } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { FaUserCircle } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import ModalEditUserAdmin from "./ModalEditUserAdmin";
import { updateUserAdmin } from "../../../services/updateUser";
import ModalDeleteUser from "./ModalDeleteUser";
import { deleteUserService } from "../../../services/deleteUser";
import { toast } from "react-toastify";
import './UserList.css';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const navigate = useNavigate();

    const obtenerUsuarios = async () => {
        setLoading(true);
        try {
            const res = await getUsers();
            if (res.users) {
                const usersWithRole = res.users.map(u => ({ ...u, rol: u.rol || 'Runner' }));
                setUsers(usersWithRole);
            }
        } catch (error) {
            toast.error("Error al cargar los usuarios");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { obtenerUsuarios(); }, []);

    // --- FUNCIONES QUE FALTABAN ---
    const handleEditClick = (user) => {
        setSelectedUser(user);
        setIsEditOpen(true);
    };

    const handleSaveUser = async (updatedData) => {
        const token = localStorage.getItem('token');
        const res = await updateUserAdmin(updatedData._id, updatedData, token);
        if (res.success) {
            setUsers(prevUsers => prevUsers.map(user => user._id === updatedData._id ? { ...user, ...updatedData } : user));
            setIsEditOpen(false);
            toast.success("Usuario actualizado");
        } else {
            toast.error(res.message);
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
            toast.success("Usuario eliminado");
        } else {
            toast.error("Error: " + res.message);
        }
    };

    const filteredUsers = users.filter(user =>
        user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.apellido?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                <div>
                    <h1>Gestión de Corredores</h1>
                    <p className="subtitle">Administra tu equipo y planes</p>
                </div>
                <div className="search-box">
                    <IoSearch className="search-icon" />
                    <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </header>

            <section className="user-list-grid">
                {loading ? (
                    [1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton-card"></div>)
                ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((item) => (
                        <div
                            key={item._id}
                            className="user-card"
                            onClick={() => navigate(`/detalle-plan-admin/${item._id}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="user-info">
                                <div className="user-avatar-container">
                                    {item.avatar ? (
                                        <img src={item.avatar} alt={item.nombre} className="user-avatar-img" />
                                    ) : (
                                        <FaUserCircle className="user-avatar-icon" />
                                    )}
                                </div>
                                <div className="text-data">
                                    <h3>{item.nombre} {item.apellido}</h3>
                                    <span className="user-role">{item.rol}</span>
                                    <span className="user-email">{item.email}</span>
                                </div>
                            </div>

                            <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                                <button className="btn-icon btn-plan" title="Asignar Plan" onClick={() => navigate(`/crear-plan/${item._id}`)}>
                                    <IoIosAddCircle />
                                </button>
                                <button className="btn-icon btn-edit" title="Editar" onClick={() => handleEditClick(item)}>
                                    <IoMdCreate />
                                </button>
                                <button className="btn-icon btn-delete" title="Eliminar" onClick={() => handleDeleteClick(item)}>
                                    <MdDelete />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state"><p>No se encontraron corredores.</p></div>
                )}
            </section>
        </main>
    );
};

export default UserList;