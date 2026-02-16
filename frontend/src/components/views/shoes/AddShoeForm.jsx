import { useState } from 'react';

const AddShoeForm = ({ onShoeAdded }) => {

    const url  = import.meta.env.VITE_API_URL;

    const [formData, setFormData] = useState({
        brand: '',
        model: '',
        maxKm: 800,
        currentKm: 0
    });
    const [error, setError] = useState('');

    const { brand, model, maxKm, currentKm } = formData;

    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');

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

            setFormData({ brand: '', model: '', maxKm: 800, currentKm: 0 });
            if (onShoeAdded) onShoeAdded(data.data);

        } catch (err) {
            console.error(err);
            setError(err.message);
        }
    };

    return (
        <div className="zapa-form-wrapper">
            {error && <div className="zapa-error-msg">{error}</div>}

            <form onSubmit={onSubmit}>
                {/* MARCA */}
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

                {/* MODELO */}
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

                {/* FILA DE DOS COLUMNAS */}
                <div className="zapa-row">
                    <div className="zapa-col">
                        <label className="zapa-label">KM ACTUALES</label>
                        <input
                            type="number"
                            className="zapa-input"
                            name="currentKm"
                            value={currentKm}
                            onChange={onChange}
                        />
                    </div>

                    <div className="zapa-col">
                        <label className="zapa-label">VIDA ÚTIL (LÍMITE)</label>
                        <input
                            type="number"
                            className="zapa-input"
                            name="maxKm"
                            value={maxKm}
                            onChange={onChange}
                        />
                    </div>
                </div>

                <button type="submit" className="zapa-btn-save">
                    GUARDAR EQUIPO 👟
                </button>
            </form>
        </div>
    );
};

export default AddShoeForm;