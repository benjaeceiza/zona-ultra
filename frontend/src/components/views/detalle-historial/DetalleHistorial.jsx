import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TrainingCard from '../detalle-plan-admin/TrainingCard';
import { IoIosArrowBack } from 'react-icons/io';
import './DetalleHistorial.css';

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

    // Función para formatear los minutos a horas y minutos
    const formatTime = (min) => {
        if (!min) return "0m";
        const h = Math.floor(min / 60);
        const m = Math.round(min % 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    if (loading) return <div className="dh-loader">Cargando resumen...</div>;
    if (!plan) return <div className="dh-error">Plan no encontrado.</div>;

    // 🔥 CÁLCULOS ESTRICTOS Y CORREGIDOS
    const entrenamientosValidos = plan.entrenamientos?.filter(e => e.titulo && e.titulo.toLowerCase() !== "descanso") || [];
    const totalSesiones = entrenamientosValidos.length;

    // 🔥 DETECTOR BLINDADO CON CONSOLE.LOG PARA CASAR EL BUG
    const sesionesLogradas = entrenamientosValidos.filter(e => {
        // Si el día está marcado como descanso, no cuenta (por seguridad)
        if (e.titulo?.toLowerCase() === "descanso") return false;

        // Pasamos todo a string y a minúsculas para inspeccionar el feedback
        const feedbackString = e.feedback ? JSON.stringify(e.feedback).toLowerCase() : "";
        const estadoString = e.estado ? String(e.estado).toLowerCase() : "";

        // 🛠️ CONSOLE.LOG DE CONTROL: Abrí la consola del navegador (F12) para ver qué dice acá
        console.log(`Día: ${e.titulo} | completado: ${e.completado} | estado: ${e.estado} | feedback:`, e.feedback);

        // CONDICIÓN AGRESIVA: Si encontrás la palabra "no" o "fallo" pegada a "logrado" en cualquier lado, NO SUMA.
        const esNoLogrado =
            estadoString.includes("no") ||
            feedbackString.includes("no") ||
            feedbackString.includes("fall") ||
            e.logrado === false;

        // Tiene que estar marcado como completado el reporte Y no tener ninguna marca de "no logrado"
        return e.completado === true && !esNoLogrado;
    }).length;

    const porcentajeCumplimiento = totalSesiones > 0 ? Math.round((sesionesLogradas / totalSesiones) * 100) : 0;

    const kmPlanificados = plan.entrenamientos?.reduce((acc, curr) => acc + (curr.km || 0), 0) || 0;
    const kmReales = plan.entrenamientos?.reduce((acc, curr) => acc + (curr.feedback?.kmReal || 0), 0) || 0;

    // 🔥 NUEVO: Cálculo del tiempo real acumulado
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

            {/* WIDGETS DE ESTADÍSTICAS - Ahora con 4 tarjetas */}
            <section className="dh-stats-dashboard">
                {(() => {
                    // Calculamos el color dinámico para el primer cuadro
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

            {/* GRILLA DE TARJETAS */}
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