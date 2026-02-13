
import { MdDeleteForever } from "react-icons/md"; // Asegurate de tener react-icons

const ModalDeleteUser = ({ isOpen, onClose, onConfirm, user }) => {
    
    if (!isOpen) return null;

    return (
        <div className="modal-delete-overlay" onClick={onClose}>
            <div 
                className="modal-delete-card" 
                onClick={(e) => e.stopPropagation()}
            >
                {/* Ícono animado */}
                <div className="modal-delete-icon-wrapper">
                    <MdDeleteForever className="modal-delete-icon" />
                </div>

                <h2 className="modal-delete-title">¿Eliminar Usuario?</h2>
                
                <p className="modal-delete-description">
                    Estás a punto de eliminar a <span className="modal-delete-user-highlight">{user?.nombre || "este usuario"}</span>. 
                    <br />
                    Esta acción <strong>no se puede deshacer</strong> y se perderán todos sus planes y estadísticas.
                </p>

                <div className="modal-delete-actions">
                    <button 
                        className="modal-delete-btn modal-delete-btn-cancel" 
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                    
                    <button 
                        className="modal-delete-btn modal-delete-btn-confirm" 
                        onClick={() => onConfirm(user._id)}
                    >
                        Sí, eliminar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalDeleteUser;