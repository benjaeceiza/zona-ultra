import { useState } from 'react';
import { toast } from 'react-toastify';

const AddShoeModal = ({ show, onClose, onShoeAdded }) => {
    if (!show) return null;

    const url = import.meta.env.VITE_API_URL;
    const [formData, setFormData] = useState({
        brand: '',
        model: '',
        maxKm: 800,
        currentKm: 0
    });
    const [loading, setLoading] = useState(false);

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

            toast.success("¡Zapatilla agregada al garage! 👟");
            setFormData({ brand: '', model: '', maxKm: 800, currentKm: 0 });
            if (onShoeAdded) onShoeAdded(data.data);
            onClose();

        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="zapa-modal-overlay" onClick={onClose}>
            <div className="zapa-modal-content" onClick={(e) => e.stopPropagation()}>
                <header className="zapa-modal-header">
                    <h3 className="zapa-modal-title">👟 AGREGAR NUEVA ZAPA</h3>
                    <button type="button" className="zapa-close-btn" onClick={onClose}>
                        &times;
                    </button>
                </header>

                <div className="zapa-modal-body">
                    <form onSubmit={onSubmit} className="zapa-form">
                        <div className="zapa-group">
                            <label className="zapa-label">MARCA</label>
                            <input
                                type="text"
                                className="zapa-input"
                                name="brand"
                                value={brand}
                                onChange={onChange}
                                required
                                placeholder="Ej: Nike, Hoka, Asics..."
                            />
                        </div>

                        <div className="zapa-group">
                            <label className="zapa-label">MODELO</label>
                            <input
                                type="text"
                                className="zapa-input"
                                name="model"
                                value={model}
                                onChange={onChange}
                                required
                                placeholder="Ej: Pegasus 40, Speedgoat 5..."
                            />
                        </div>

                        {/* Fila en 2 columnas para los números */}
                        <div className="zapa-row-numbers">
                            <div className="zapa-group">
                                <label className="zapa-label">KM HECHOS</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    className="zapa-input"
                                    name="currentKm"
                                    value={currentKm}
                                    onChange={onChange}
                                />
                            </div>

                            <div className="zapa-group">
                                <label className="zapa-label">LÍMITE (KM)</label>
                                <input
                                    type="number"
                                    step="10"
                                    className="zapa-input"
                                    name="maxKm"
                                    value={maxKm}
                                    onChange={onChange}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="zapa-btn-save"
                            disabled={loading}
                        >
                            {loading ? 'GUARDANDO...' : 'GUARDAR EN EL GARAGE 🚀'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddShoeModal;