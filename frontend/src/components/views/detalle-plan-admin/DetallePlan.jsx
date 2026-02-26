import { useParams, useNavigate, Link } from 'react-router-dom';
import { getUserWithPlan } from '../../../services/getUserPlan';
import { useEffect, useState } from 'react';
import TrainingCard from './TrainingCard';
import { IoIosArrowBack } from 'react-icons/io';

const DetallePlan = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [usuario, setUsuario] = useState(null);
    const [planes, setPlanes] = useState([]);
    const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getUserWithPlan(id);
                if (data.user) {
                    setUsuario(data.user);

                    if (data.user.planes && data.user.planes.length > 0) {
                        // --- 1. FILTRADO DE SEGURIDAD (FIX PRODUCCIÓN) ---
                        // Ignora planes que sean null o no tengan _id (evita el error de toString)
                        const planesValidos = data.user.planes.filter(p => p && p._id);

                        // --- 2. ORDENAMIENTO CRONOLÓGICO ---
                        const planesOrdenados = planesValidos.sort((a, b) =>
                            a._id.toString().localeCompare(b._id.toString())
                        );

                        // --- 3. DIVIDIR EN BLOQUES DE 4 (MESES) ---
                        const bloquesDeMes = [];
                        for (let i = 0; i < planesOrdenados.length; i += 4) {
                            bloquesDeMes.push(planesOrdenados.slice(i, i + 4));
                        }

                        // --- 4. FILTRAR MESES VIEJOS (Solo mostrar lo actual/futuro) ---
                        // Ocultamos bloques donde TODAS las semanas estén finalizadas
                        let bloquesVisibles = bloquesDeMes.filter(bloque =>
                            !bloque.every(p => p.estado === 'finalizado')
                        );

                        // Si todo está finalizado, mostramos el último bloque por defecto
                        if (bloquesVisibles.length === 0 && bloquesDeMes.length > 0) {
                            bloquesVisibles = [bloquesDeMes[bloquesDeMes.length - 1]];
                        }

                        const planesAMostrar = bloquesVisibles.flat();
                        setPlanes(planesAMostrar);

                        // --- 5. SELECCIÓN AUTOMÁTICA ---
                        if (planesAMostrar.length > 0) {
                            const activeIndex = planesAMostrar.findIndex(p => p.estado === 'activo');
                            setSelectedPlanIndex(activeIndex !== -1 ? activeIndex : planesAMostrar.length - 1);
                        }
                    }
                }
            } catch (error) {
                console.error("Error cargando plan", error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchData();
    }, [id]);
    
    const planDisplay = planes.length > 0 ? planes[selectedPlanIndex] : null;

    const totalSesiones = planDisplay?.entrenamientos?.length || 0;
    const sesionesCompletadas = planDisplay?.entrenamientos?.filter(e => e.completado).length || 0;
    const porcentajeCumplimiento = totalSesiones > 0 ? Math.round((sesionesCompletadas / totalSesiones) * 100) : 0;

    const kmPlanificados = planDisplay?.entrenamientos?.reduce((acc, curr) => acc + (curr.km || 0), 0) || 0;
    const kmReales = planDisplay?.entrenamientos?.reduce((acc, curr) => acc + (curr.feedback?.kmReal || 0), 0) || 0;

    if (loading) return <div className="detail-loading">Cargando atleta...</div>;

    return (
        <div className="detail-container">

            <header className="detail-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <IoIosArrowBack /> Volver
                </button>

                <div className="user-info-block">
                    <div>
                        <span className="label-top">Monitor de Progreso</span>
                        <h1 className="user-name">{usuario?.nombre} {usuario?.apellido}</h1>
                    </div>
                </div>
            </header>

            {/* --- SELECTOR DE SEMANAS (TABS) --- */}
            {planes.length > 0 ? (
                <div className="week-selector-container">
                    <div className="week-tabs">
                        {planes.map((plan, index) => (
                            <button
                                key={plan._id}
                                className={`week-tab ${selectedPlanIndex === index ? 'active' : ''} ${plan.estado}`}
                                onClick={() => setSelectedPlanIndex(index)}
                            >
                                <span className="week-num">Semana {plan.numeroSemana}</span>
                                <span className={`status-dot ${plan.estado}`}></span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="no-plans-alert" style={{ marginTop: '20px', textAlign: 'center', color: '#888' }}>
                    <p>No hay planes en curso.</p>
                    <Link to={`/crear-plan/${id}`} className="link-create" style={{ color: '#00D2BE', fontWeight: 'bold' }}>
                        + Asignar Nuevo Plan
                    </Link>
                </div>
            )}

            {/* --- CONTENIDO DEL PLAN SELECCIONADO --- */}
            {planDisplay && (
                <>
                    {/* 🔥 BOTÓN DE EDITAR (Solo Activo o Pendiente) */}
                    {(planDisplay.estado === 'activo' || planDisplay.estado === 'pendiente') && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                            <Link
                                to={`/editar-plan/${planDisplay._id}`}
                                className="plan-creator-btn-submit"
                                style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#f1c40f', color: '#000', textDecoration: 'none', borderRadius: '5px' }}
                            >
                                ✏️ Editar esta Semana
                            </Link>
                        </div>
                    )}
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
                            <span className="stat-title">KM Planificados</span>
                            <div className="stat-content">
                                <span className="stat-number">{kmPlanificados} <small>km</small></span>
                            </div>
                        </div>

                        <div className="stat-widget highlight">
                            <span className="stat-title">KM Reales</span>
                            <div className="stat-content">
                                <span className="stat-number">{kmReales} <small>km</small></span>
                                {kmReales > 0 && (
                                    <span className={`stat-delta ${kmReales >= kmPlanificados ? 'positive' : 'negative'}`}>
                                        {kmReales >= kmPlanificados ? '🔥' : '▼'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="cards-layout">
                        {planDisplay.entrenamientos?.length > 0 ? (
                            planDisplay.entrenamientos.map((entrenamiento) => (
                                <TrainingCard
                                    key={entrenamiento._id}
                                    entrenamiento={entrenamiento}
                                    isAdminView={true}
                                />
                            ))
                        ) : (
                            <div className="empty-plan-message">
                                <p>Plan sin entrenamientos cargados.</p>
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

export default DetallePlan;