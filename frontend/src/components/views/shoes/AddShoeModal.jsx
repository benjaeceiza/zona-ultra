import AddShoeForm from "./AddShoeForm";

const AddShoeModal = ({ show, onClose, onShoeAdded }) => {
    if (!show) return null;

    return (
        // Fondo oscuro con blur (reutilizamos la lógica pero con clase propia)
        <div className="zapa-modal-overlay" onClick={onClose}>
            
            {/* Contenedor de la tarjeta */}
            <div className="zapa-modal-content" onClick={(e) => e.stopPropagation()}>
                
                {/* HEADER VIOLETA FACHERITO */}
                <div className="zapa-modal-header">
                    <h5 className="zapa-modal-title">👟 NUEVO EQUIPO</h5>
                    <button type="button" className="zapa-close-btn" onClick={onClose}>
                        &times;
                    </button>
                </div>

                {/* CUERPO DEL MODAL */}
                <div className="zapa-modal-body">
                    <AddShoeForm
                        onShoeAdded={(newShoe) => {
                            onShoeAdded(newShoe);
                            onClose();
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default AddShoeModal;