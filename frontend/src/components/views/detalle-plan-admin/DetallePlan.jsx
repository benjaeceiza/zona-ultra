import { useParams, useNavigate, Link } from 'react-router-dom';
import { getUserWithPlan } from '../../../services/getUserPlan';
import { useEffect, useState } from 'react';
import TrainingCard from './TrainingCard';

const DetallePlan = () => {
    const { id } = useParams();
    const navigate = useNavigate(); // Para el botón volver
    const [usuario, setUsuario] = useState(null);
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getUserWithPlan(id);
                setUsuario(data.user);
                setPlan(data.plan);
            } catch (error) {
                // Manejo de error sutil
                console.error("Error cargando plan");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id]);

    // Calcular estadísticas al vuelo
    const totalSesiones = plan?.entrenamientos?.length || 0;
    const sesionesCompletadas = plan?.entrenamientos?.filter(e => e.completado).length || 0;
    const porcentajeCumplimiento = totalSesiones > 0 ? Math.round((sesionesCompletadas / totalSesiones) * 100) : 0;
    
    // Sumar KMs planificados vs reales (si tenés feedback)
    const kmPlanificados = plan?.entrenamientos?.reduce((acc, curr) => acc + (curr.km || 0), 0) || 0;
    const kmReales = plan?.entrenamientos?.reduce((acc, curr) => acc + (curr.feedback?.kmReal || 0), 0) || 0;

    if (loading) return <div className="detail-loading">Cargando atleta...</div>;

    return (
        <div className="detail-container">
            
            {/* --- HEADER --- */}
            <header className="detail-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    ← Volver
                </button>
                
                <div className="user-info">
                    <div className="avatar-circle">
                        {usuario?.nombre?.charAt(0) || "A"}
                    </div>
                    <div className="user-texts">
                        <span className="label-top">Plan Semanal de</span>
                        <h1 className="user-name">{usuario?.nombre} {usuario?.apellido}</h1>
                    </div>
                </div>
            </header>

            {/* --- STATS ROW (KPIs) --- */}
            {plan && (
                <section className="stats-dashboard">
                    <div className="stat-widget">
                        <span className="stat-title">Cumplimiento</span>
                        <div className="stat-content">
                            <span className={`stat-number ${porcentajeCumplimiento >= 80 ? 'good' : 'bad'}`}>
                                {porcentajeCumplimiento}%
                            </span>
                            <span className="stat-sub">{sesionesCompletadas}/{totalSesiones} Sesiones</span>
                        </div>
                    </div>

                    <div className="stat-widget">
                        <span className="stat-title">Kilómetros Planificados</span>
                        <div className="stat-content">
                            <span className="stat-number">{kmPlanificados} <small>km</small></span>
                        </div>
                    </div>

                    <div className="stat-widget highlight">
                        <span className="stat-title">Kilometraje Real</span>
                        <div className="stat-content">
                            <span className="stat-number">{kmReales} <small>km</small></span>
                            {kmReales > kmPlanificados && <span className="stat-sub">🔥 On fire</span>}
                        </div>
                    </div>
                </section>
            )}

            {/* --- GRID DE TARJETAS --- */}
            <section className="cards-layout">
                {plan?.entrenamientos?.length > 0 ? (
                    plan.entrenamientos.map((entrenamiento) => (
                        <TrainingCard
                            key={entrenamiento._id}
                            entrenamiento={entrenamiento}
                        />
                    ))
                ) : (
                    <div className="empty-plan-message">
                        <p>Este usuario no tiene un plan asignado esta semana.</p>
                        <Link to={`/crear-plan/${id}`} className="create-plan-btn">Crear Plan</Link>
                    </div>
                )}
            </section>
        </div>
    );
}

export default DetallePlan;