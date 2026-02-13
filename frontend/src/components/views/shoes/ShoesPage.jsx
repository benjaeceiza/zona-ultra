import { useState, useEffect } from 'react';
import AddShoeModal from './AddShoeModal';
import { MdDelete } from "react-icons/md";
import { GiRunningShoe } from "react-icons/gi";

const ShoesPage = () => {
    const [shoes, setShoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Array de colores "Neon" para los fondos de los íconos
    const iconColors = [
        'rgba(255, 69, 0, 0.2)',   // Naranja suave
        'rgba(0, 210, 190, 0.2)',  // Teal suave
        'rgba(123, 97, 255, 0.2)', // Violeta suave
        'rgba(255, 0, 127, 0.2)',  // Rosa fuerte suave
        'rgba(255, 215, 0, 0.2)'   // Amarillo suave
    ];

    const iconBorders = [
        '#FF4500', '#00D2BE', '#7B61FF', '#FF007F', '#FFD700'
    ];

    const fetchShoes = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://:8080/api/shoes', {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();

            if (Array.isArray(data)) {
                setShoes(data);
            } else if (data.data) {
                setShoes(Array.isArray(data.data) ? data.data : [data.data]);
            } else {
                setShoes([]);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchShoes(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("¿Estás seguro de que querés borrar esta zapatilla?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://:8080/api/shoes/${id}`, {
                method: 'DELETE',
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) fetchShoes();
            else alert("No se pudo borrar");
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="shoes-container">
            <div className="page-header-shoes">
                <div>
                    <h6 className="text-uppercase text-muted small fw-bold ls-2">Garage</h6>
                    <h1 className="display-5 mb-0 fw-bold">Mis Zapatillas</h1>
                </div>
                <button className="btn-neon" onClick={() => setShowModal(true)}>
                    <span>+ Nueva Zapa</span>
                </button>
            </div>

            {loading ? (
                <div className="d-flex justify-content-center py-5">
                    <div className="spinner-border text-info" role="status"></div>
                </div>
            ) : shoes.length === 0 ? (
                <div className="text-center py-5 empty-state-box">
                    <h3>El garage está vacío 🏃‍♂️</h3>
                    <p>Agregá tus zapatillas para empezar a sumar kilómetros.</p>
                </div>
            ) : (
                <div className="row g-4">
                    {shoes.map((shoe, index) => {
                        const percentage = Math.min((shoe.currentKm / shoe.maxKm) * 100, 100);
                        const remaining = shoe.maxKm - shoe.currentKm;

                        let statusClass = 'status-good';
                        if (percentage > 50) statusClass = 'status-mid';
                        if (percentage > 85) statusClass = 'status-bad';

                        // Seleccionamos un color basado en el índice (0, 1, 2...)
                        // El operador % hace que si se acaban los colores, vuelva a empezar
                        const bgColor = iconColors[index % iconColors.length];
                        const borderColor = iconBorders[index % iconBorders.length];

                        return (
                            <div key={shoe._id} className="col-12 col-md-6 col-lg-4">
                                <div className="shoe-card">

                                    {/* --- HEADER DE LA CARD (Icono + Textos + Delete) --- */}
                                    <div className="card-top-section">

                                        {/* 1. Icono con fondo dinámico */}
                                        <div
                                            className="shoe-avatar"
                                            style={{
                                                backgroundColor: bgColor,
                                                borderColor: borderColor,
                                                color: borderColor
                                            }}
                                        >
                                            <GiRunningShoe />
                                        </div>

                                        {/* 2. Info Principal */}
                                        <div className="shoe-main-info">
                                            <span className="shoe-brand-badge">{shoe.brand}</span>
                                            <h3 className="shoe-model">{shoe.model}</h3>
                                        </div>

                                        {/* 3. Botón Delete (Arriba derecha absoluto) */}

                                    </div>

                                    {/* --- STATS & PROGRESS (Abajo) --- */}
                                    <div className="mt-4 progress-section">
                                        <div className="d-flex justify-content-between align-items-end mb-2">
                                            <span className="text-muted small text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Vida Útil</span>
                                            <span className="km-left">{remaining} km rest.</span>
                                        </div>

                                        <div className="progress-container">
                                            <div
                                                className={`progress-fill ${statusClass}`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>

                                        <div className="stat-row mt-2">
                                            <span>{shoe.currentKm} km hechos</span>
                                            <span>Meta: {shoe.maxKm} km</span>
                                        </div>
                                    </div>

                                    <button
                                        className="btn-delete-absolute"
                                        onClick={() => handleDelete(shoe._id)}
                                        title="Eliminar"
                                    >
                                        <MdDelete />
                                    </button>
                                </div>

                            </div>
                        );
                    })}
                </div>
            )}

            <AddShoeModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onShoeAdded={() => { fetchShoes(); setShowModal(false); }}
            />
        </div>
    );
};

export default ShoesPage;