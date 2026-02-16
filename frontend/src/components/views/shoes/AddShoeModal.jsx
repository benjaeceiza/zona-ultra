import { useState } from 'react';
import { toast } from 'react-toastify';

const AddShoeModal = ({ show, onClose, onShoeAdded }) => {

    // Si no está visible, ni renderizamos (Early return)
    if (!show) return null;

    const url = import.meta.env.VITE_API_URL;
    const [formData, setFormData] = useState({
        brand: '',
        model: '',
        maxKm: 800,
        currentKm: 0
    });
    

    const [loading, setLoading] = useState(false); // Agregué un loading para mejor UX

    const { brand, model, maxKm, currentKm } = formData;

    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${url}/api/shoes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al guardar la zapatilla');
            }

            toast.success("¡Zapatilla guardada correctamente! 👟");

            // Éxito: Limpiamos, notificamos al padre y cerramos
            setFormData({ brand: '', model: '', maxKm: 800, currentKm: 0 });
            if (onShoeAdded) onShoeAdded(data.data);
            onClose(); // Cerramos el modal automáticamente

        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoading(false);
        }
    };

    return (
        // Overlay (Fondo oscuro)
        <div className="zapa-modal-overlay" onClick={onClose}>

            {/* Contenido del Modal (Click propagation stop para no cerrar al tocar adentro) */}
            <div className="zapa-modal-content" onClick={(e) => e.stopPropagation()}>

                {/* HEADER */}
                <div className="zapa-modal-header">
                    <h5 className="zapa-modal-title">👟 NUEVO EQUIPO</h5>
                    <button type="button" className="zapa-close-btn" onClick={onClose}>
                        &times;
                    </button>
                </div>

                {/* BODY / FORMULARIO */}
                <div className="zapa-modal-body">
                    <form onSubmit={onSubmit}>
                        {/* Marca */}
                        <div className="zapa-group">
                            <label className="zapa-label">MARCA</label>
                            <input
                                type="text"
                                className="zapa-input"
                                name="brand"
                                value={brand}
                                onChange={onChange}
                                required
                                placeholder="Ej: Hoka, Nike..."
                            />
                        </div>

                        {/* Modelo */}
                        <div className="zapa-group">
                            <label className="zapa-label">MODELO</label>
                            <input
                                type="text"
                                className="zapa-input"
                                name="model"
                                value={model}
                                onChange={onChange}
                                required
                                placeholder="Ej: Speedgoat 5"
                            />
                        </div>

                        {/* Fila Doble: KM y Vida Útil */}
                        <div className="zapa-group">
                            <label className="zapa-label">KM ACTUALES</label>
                            <input
                                type="number"
                                className="zapa-input"
                                name="currentKm"
                                value={currentKm}
                                onChange={onChange}
                            />
                        </div>

                        <div className='zapa-group'>
                            <label className="zapa-label">VIDA ÚTIL (LÍMITE)</label>
                            <input
                                type="number"
                                className="zapa-input"
                                name="maxKm"
                                value={maxKm}
                                onChange={onChange}
                            />
                        </div>

                        {/* Botón Guardar */}
                        <button
                            type="submit"
                            className="zapa-btn-save"
                            disabled={loading}
                        >
                            {loading ? 'GUARDANDO...' : 'GUARDAR EQUIPO 👟'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddShoeModal;