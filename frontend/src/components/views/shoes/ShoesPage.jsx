import { useState, useEffect } from 'react';
import AddShoeModal from './AddShoeModal';
import { MdDelete } from "react-icons/md";
import { GiRunningShoe } from "react-icons/gi";
import './ShoesPage.css'; 
import ShoesPageSkeleton from '../../skeletons/shoes-page-skeleton/ShoesPageSkeleton';

const ShoesPage = () => {
    const [shoes, setShoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const url = import.meta.env.VITE_API_URL; 

    // Paleta de colores Neón
    const iconColors = [
        'rgba(255, 69, 0, 0.15)',  
        'rgba(0, 210, 190, 0.15)',  
        'rgba(123, 97, 255, 0.15)', 
        'rgba(255, 0, 127, 0.15)',  
        'rgba(255, 215, 0, 0.15)'   
    ];

    const iconBorders = [
        '#FF4500', '#00D2BE', '#7B61FF', '#FF007F', '#FFD700'
    ];

    const fetchShoes = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${url}/api/shoes`, {
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
            const res = await fetch(`${url}/api/shoes/${id}`, {
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
                    <h6 className="shoes-subtitle">Garage</h6>
                    <h1 className="shoes-title">Mis Zapatillas</h1>
                </div>
                <button className="btn-neon" onClick={() => setShowModal(true)}>
                    <span>+ Nueva Zapa</span>
                </button>
            </div>

            {loading ? (
                <div className="shoes-grid">
                    {/* Renderizamos tu componente esqueleto */}
                    {[1, 2, 3, 4].map(i => <ShoesPageSkeleton key={i} />)}
                </div>
            ) : shoes.length === 0 ? (
                <div className="empty-shoes-state">
                    <h3>El garage está vacío 🏃‍♂️</h3>
                    <p>Agregá tus zapatillas para empezar a sumar kilómetros.</p>
                </div>
            ) : (
                <div className="shoes-grid">
                    {shoes.map((shoe, index) => {
                        const percentage = Math.min((shoe.currentKm / shoe.maxKm) * 100, 100);
                        const remaining = shoe.maxKm - shoe.currentKm;

                        // Condicional de colores para la barra de progreso
                       let statusClass = 'zapa-status-good';
                        if (percentage > 50) statusClass = 'zapa-status-mid';
                        if (percentage > 85) statusClass = 'zapa-status-bad';

                        // Rotador de colores para los iconos
                        const bgColor = iconColors[index % iconColors.length];
                        const borderColor = iconBorders[index % iconBorders.length];

                        return (
                            <div key={shoe._id} className="shoe-card">
                                
                                <button
                                    className="btn-delete-absolute"
                                    onClick={() => handleDelete(shoe._id)}
                                    title="Eliminar"
                                >
                                    <MdDelete />
                                </button>

                                <div className="card-top-section">
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

                                    <div className="shoe-main-info">
                                        <span className="shoe-brand-badge">{shoe.brand}</span>
                                        <h3 className="shoe-model" title={shoe.model}>{shoe.model}</h3>
                                    </div>
                                </div>

                                {/* 🔥 BARRA DE PROGRESO RENOVADA Y AISLADA */}
                                <div className="zapa-progress-section">
                                    <div className="zapa-stat-row">
                                        <span className="zapa-stat-label">Vida Útil</span>
                                        <span className="zapa-km-left">{remaining} km rest.</span>
                                    </div>

                                    <div className="zapa-progress-container">
                                        <div
                                            className={`zapa-progress-fill ${statusClass}`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>

                                    <div className="zapa-stat-row mt-2">
                                        <span>{shoe.currentKm} km hechos</span>
                                        <span>Meta: {shoe.maxKm} km</span>
                                    </div>
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