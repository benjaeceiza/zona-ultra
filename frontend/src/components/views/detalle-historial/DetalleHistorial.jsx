import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TrainingCard from '../detalle-plan-admin/TrainingCard';
import { IoIosArrowBack } from 'react-icons/io';
import './DetalleHistorial.css';

// 🔥 FUNCIÓN ESTRICTA UNIFICADA (A prueba de espacios y descansos múltiples)
const calcularPorcentajeReal = (entrenamientos) => {
    if (!entrenamientos || entrenamientos.length === 0) return 0;

    // 1. Limpiamos los descansos para tener los días de exigencia real (Ej: 6 días)
    const diasExigidos = entrenamientos.filter(e => 
        e.titulo && e.titulo.trim().toLowerCase() !== "descanso"
    );

    if (diasExigidos.length === 0) return 0;

    // 2. Filtramos cuáles son verdaderos éxitos (Pura lógica de estados)
    const diasCumplidos = diasExigidos.filter(e => {
        // ❌ BARRERA 1: Si no tiene la tilde de completado, falló.
        if (!e.completado) return false;
        
        // ❌ BARRERA 2: Estados directos de la base de datos
        const estado = String(e.estado || "").toLowerCase().trim();
        if (estado === "no logrado" || estado === "no_logrado" || estado === "incompleto" || e.logrado === false) {
            return false;
        }

        // ❌ BARRERA 3: Textos en el Feedback
        if (e.feedback) {
            const fbEstado = String(e.feedback.estado || "").toLowerCase().trim();
            const comentario = String(e.feedback.comentario || "").toUpperCase();
            
            // Si el estado o el comentario gritan que falló, lo rebotamos.
            if (fbEstado === "no logrado" || e.feedback.noLogrado || comentario.includes('[NO LOGRADO]')) {
                return false;
            }
        }

        // ✅ Si tiene la tilde y no dice "no logrado" por ningún lado, es un ÉXITO.
        // Nos olvidamos de cruzar los km planificados vs reales.
        return true;
    });

    // 3. Matemática limpia: (4 / 6) * 100 = 67%
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

    if (loading) return <div className="dh-loader">Cargando resumen...</div>;
    if (!plan) return <div className="dh-error">Plan no encontrado.</div>;

    // 🔥 AHORA SÍ: Usamos la función unificada
    const porcentajeCumplimiento = calcularPorcentajeReal(plan.entrenamientos);

    const kmPlanificados = plan.entrenamientos?.reduce((acc, curr) => acc + (curr.km || 0), 0) || 0;
    
    // 🛠️ FIX DECIMALES: Sumamos y limpiamos la coma flotante con toFixed(2)
    const kmReales = Number(
        (plan.entrenamientos?.reduce((acc, curr) => acc + (curr.feedback?.kmReal || 0), 0) || 0).toFixed(2)
    );

    const tiempoReal = plan.entrenamientos?.reduce((acc, curr) => acc + (Number(curr.feedback?.duracionReal) || 0), 0) || 0;

    return (
        <main className="dh-container">
            <header className="dh-header">
                <button className="dh-back-btn" onClick={() => navigate(-1)}>
                    <IoIosArrowBack /> Volver
                </button>
                <div className="dh-title-group">
                    <h1>{plan.macrociclo ? plan.macrociclo.titulo : "Semana"}</h1>
                    <p>
                        {plan.mesociclo ? `${plan.mesociclo.titulo} • ` : ""}
                        Semana {plan.numeroSemana}
                    </p>
                </div>
            </header>

            <section className="dh-stats-dashboard">
                {(() => {
                    const colorCumplimiento = porcentajeCumplimiento >= 80 ? '#2ecc71' : (porcentajeCumplimiento >= 50 ? '#f1c40f' : '#ff4d4d');

                    return (
                        <>
                            <div className="dh-stat-card" style={{ borderTop: `4px solid ${colorCumplimiento}`, background: `linear-gradient(180deg, ${colorCumplimiento}15 0%, #1e1e1e 80%)` }}>
                                <span className="dh-stat-label">Cumplimiento</span>
                                <h2 style={{ color: colorCumplimiento }}>
                                    {porcentajeCumplimiento}%
                                </h2>
                            </div>
                            <div className="dh-stat-card" style={{ borderTop: '4px solid #00D2BE', backgroundColor: 'rgba(0, 210, 190, 0.08)' }}>
                                <span className="dh-stat-label">Tiempo Hecho</span>
                                <h2 className="text-white">{formatTime(tiempoReal)}</h2>
                            </div>
                            <div className="dh-stat-card" style={{ borderTop: '4px solid #f1c40f', backgroundColor: 'rgba(241, 196, 15, 0.08)' }}>
                                <span className="dh-stat-label">Volumen Hecho</span>
                                <h2 className="text-white">{kmReales} <small>km</small></h2>
                            </div>
                            <div className="dh-stat-card" style={{ borderTop: '4px solid #555', backgroundColor: 'rgba(85, 85, 85, 0.08)' }}>
                                <span className="dh-stat-label">Planificado</span>
                                <h2 className="text-gray">{kmPlanificados} <small>km</small></h2>
                            </div>
                        </>
                    );
                })()}
            </section>

            <section className="dh-cards-layout">
                {plan.entrenamientos?.length > 0 ? (
                    plan.entrenamientos.map((entrenamiento) => (
                        <TrainingCard
                            key={entrenamiento._id}
                            entrenamiento={entrenamiento}
                            isAdminView={false}
                        />
                    ))
                ) : (
                    <p className="dh-empty">No hay entrenamientos cargados para esta semana.</p>
                )}
            </section>
        </main>
    );
}

export default DetalleHistorial;