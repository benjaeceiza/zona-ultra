
import "./ModalPlanCompletado.css";

const ModalPlanCompletado = ({ isOpen, onClose }) => {

    if (!isOpen) return null;

    return (
        <div className="modal-overlay-facherito">
            <div className="modal-card-facherito">
                <p className="modal-trophy">🏆</p>
                <h2 className="modal-title-facherito">¡Objetivo Superado!</h2>
                <p className="modal-text-facherito">
                    Has completado tu plan de entrenamiento. ¡Sigue así para alcanzar tus metas!
                </p>
                <button className="modal-btn-facherito" onClick={onClose}>
                    ¡Excelente!
                </button>
            </div>
        </div>
    );
};

export default ModalPlanCompletado;