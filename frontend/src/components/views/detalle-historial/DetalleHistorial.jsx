import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IoIosArrowBack } from 'react-icons/io';
import './DetalleHistorial.css';

// 🔥 FUNCIÓN ESTRICTA UNIFICADA
const calcularPorcentajeReal = (entrenamientos) => {
    if (!entrenamientos || entrenamientos.length === 0) return 0;
    const diasExigidos = entrenamientos.filter(e => 
        e.titulo && e.titulo.trim().toLowerCase() !== "descanso"
    );
    if (diasExigidos.length === 0) return 0;

    const diasCumplidos = diasExigidos.filter(e => {
        if (!e.completado) return false;
        const estado = String(e.estado || "").toLowerCase().trim();
        if (estado === "no logrado" || estado === "no_logrado" || estado === "incompleto" || e.logrado === false) {
            return false;
        }
        if (e.feedback) {
            const fbEstado = String(e.feedback.estado || "").toLowerCase().trim();
            const comentario = String(e.feedback.comentario || "").toUpperCase();
            if (fbEstado === "no logrado" || e.feedback.noLogrado || comentario.includes('[NO LOGRADO]')) {
                return false;
            }
        }
        return true;
    });
    return Math.round((diasCumplidos.length / diasExigidos.length) * 100);
};

const DetalleHistorial = () => {
    const { idPlan } = useParams();
    const navigate = useNavigate();
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${apiUrl}/api/plans/${idPlan}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success || data.plan) {
                    setPlan(data.plan || data);
                }
            } catch (error) {
                console.error("Error cargando detalle", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlan();
    }, [idPlan, apiUrl]);

    const formatTime = (min) => {
        if (!min) return "0m";
        const h = Math.floor(min / 60);
        const m = Math.round(min % 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    if (loading) return <div className="dh-loader">Cargando resumen de la semana...</div>;
    if (!plan) return <div className="dh-error">Plan no encontrado.</div>;

    const porcentajeCumplimiento = calcularPorcentajeReal(plan.entrenamientos);
    const kmPlanificados = plan.entrenamientos?.reduce((acc, curr) => acc + (Number(curr.km) || 0), 0) || 0;
    const kmReales = Number(
        (plan.entrenamientos?.reduce((acc, curr) => acc + (Number(curr.feedback?.kmReal) || 0), 0) || 0).toFixed(2)
    );
    const tiempoReal = plan.entrenamientos?.reduce((acc, curr) => acc + (Number(curr.feedback?.duracionReal) || 0), 0) || 0;

    const colorCumplimiento = porcentajeCumplimiento >= 80 ? '#00D2BE' : (porcentajeCumplimiento >= 50 ? '#f1c40f' : '#ff4d4d');

    return (
        <main className="dh-container">
            <header className="dh-header">
                <button className="dh-back-btn" onClick={() => navigate(-1)}>
                    <IoIosArrowBack /> Volver al Historial
                </button>
                <div className="dh-title-group">
                    <h1>{plan.macrociclo ? plan.macrociclo.titulo : "Resumen Semanal"}</h1>
                    <p>
                        {plan.mesociclo ? `${plan.mesociclo.titulo} • ` : ""}
                        Microciclo {plan.numeroSemana}
                    </p>
                </div>
            </header>

            {/* --- DASHBOARD DE 4 STATS MINIMALISTA --- */}
            <section className="dh-stats-dashboard">
                <div className="dh-stat-card" style={{ borderTopColor: colorCumplimiento }}>
                    <span className="dh-stat-label">Cumplimiento</span>
                    <h2 style={{ color: colorCumplimiento }}>{porcentajeCumplimiento}%</h2>
                </div>
                <div className="dh-stat-card" style={{ borderTopColor: '#00D2BE' }}>
                    <span className="dh-stat-label">Tiempo Total</span>
                    <h2 className="text-white">{formatTime(tiempoReal)}</h2>
                </div>
                <div className="dh-stat-card" style={{ borderTopColor: '#f1c40f' }}>
                    <span className="dh-stat-label">Volumen Hecho</span>
                    <h2 className="text-white">{kmReales} <small>km</small></h2>
                </div>
                <div className="dh-stat-card" style={{ borderTopColor: '#555' }}>
                    <span className="dh-stat-label">Planificado</span>
                    <h2 className="text-gray">{kmPlanificados} <small>km</small></h2>
                </div>
            </section>

            <h3 className="dh-section-title">Desglose de la Semana</h3>

            {/* --- LISTA MINIMALISTA DE DÍAS --- */}
            <section className="dh-days-list">
                {plan.entrenamientos?.length > 0 ? (
                    plan.entrenamientos.map((entrenamiento) => {
                        const isDescanso = entrenamiento.titulo?.trim().toLowerCase() === "descanso";
                        const kmPlan = Number(entrenamiento.km || 0);
                        const kmReal = Number(entrenamiento.feedback?.kmReal || 0);
                        const durReal = Number(entrenamiento.feedback?.duracionReal || 0);

                        // Lógica para determinar estado visual
                        let badgeText = "Pendiente";
                        let badgeClass = "badge-pending";

                        if (isDescanso) {
                            badgeText = "Descanso";
                            badgeClass = "badge-rest";
                        } else if (entrenamiento.completado) {
                            const estado = String(entrenamiento.estado || "").toLowerCase().trim();
                            const fbEstado = String(entrenamiento.feedback?.estado || "").toLowerCase().trim();
                            const comentario = String(entrenamiento.feedback?.comentario || "").toUpperCase();

                            if (estado === "no logrado" || estado === "no_logrado" || fbEstado === "no logrado" || entrenamiento.feedback?.noLogrado || comentario.includes('[NO LOGRADO]')) {
                                badgeText = "No Logrado";
                                badgeClass = "badge-failed";
                            } else {
                                badgeText = "Logrado";
                                badgeClass = "badge-success";
                            }
                        }

                        return (
                            <article
                                key={entrenamiento._id}
                                className={`dh-day-row ${badgeClass}`}
                                onClick={() => navigate(`/entrenamiento/${plan._id}/${entrenamiento._id}`)}
                                title="Hacé clic para ver el análisis completo de este día"
                            >
                                <div className="day-row-left">
                                    <span className="day-name">{entrenamiento.dia || "Día"}</span>
                                    <div className="day-titles">
                                        <h4>{entrenamiento.tipo || "Entrenamiento"}</h4>
                                        <p>{entrenamiento.titulo || entrenamiento.subtitulo || "General"}</p>
                                    </div>
                                </div>

                                {!isDescanso ? (
                                    <div className="day-row-metrics">
                                        <div className="metric-box">
                                            <small>Distancia</small>
                                            <span><strong>{kmReal}</strong> / {kmPlan} km</span>
                                        </div>
                                        <div className="metric-box">
                                            <small>Tiempo Hecho</small>
                                            <span><strong>{formatTime(durReal)}</strong></span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="day-row-metrics">
                                        <span className="rest-text">Día de recuperación</span>
                                    </div>
                                )}

                                <div className="day-row-right">
                                    <span className={`status-badge ${badgeClass}`}>{badgeText}</span>
                                    <span className="row-arrow">➔</span>
                                </div>
                            </article>
                        );
                    })
                ) : (
                    <p className="dh-empty">No hay entrenamientos cargados para esta semana.</p>
                )}
            </section>
        </main>
    );
};

export default DetalleHistorial;