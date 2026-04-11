import { useEffect, useState } from "react";
import { getUserLogued } from "../../../services/getUserLogued";
import TrainingDetail from "../detalle-plan/TrainingDetail";
import { WeatherWidget, ShoeTracker } from "./Widgets";
import RaceCountdown from "./RaceCountDown";
import logo from "../../../assets/logo-zona-ultra.png";
import Loader from "../../loader/Loader";

// 🔥 Agregamos toastify para las notificaciones
import { toast } from "react-toastify";

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [shoesList, setShoesList] = useState([]);

    // --- ESTADO DEL MODAL CERRAR SEMANA ---
    const [isModalCerrarSemanaOpen, setIsModalCerrarSemanaOpen] = useState(false);

    const url = import.meta.env.VITE_API_URL;

    // --- 1. FUNCIONES DE CARGA DE DATOS ---
    const fetchUser = async (token) => {
        try {
            const res = await getUserLogued(token);
            if (!res) return null;

            if (res.planes && res.planes.length > 0) {
                res.planes.forEach(plan => {
                    if (plan.entrenamientos) {
                        plan.entrenamientos = plan.entrenamientos.map(t => ({
                            ...t,
                            completado: t.completado || false
                        }));
                    }
                });
            }
            return res;
        } catch (e) {
            console.error("Error user:", e);
            return null;
        }
    };

    const fetchShoesData = async (token) => {
        try {
            const res = await fetch(`${url}/api/shoes`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();

            if (Array.isArray(data)) return data;
            if (data.data && Array.isArray(data.data)) return data.data;
            if (data.data) return [data.data];
            return [];
        } catch (e) {
            console.error("Error shoes:", e);
            return [];
        }
    };

    // --- 2. EFECTO DE CARGA INICIAL ---
    useEffect(() => {
        const loadDashboardData = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const [userData, shoesData] = await Promise.all([
                    fetchUser(token),
                    fetchShoesData(token)
                ]);

                if (userData) setUser(userData);
                setShoesList(shoesData);

            } catch (error) {
                console.error("Error cargando dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    const activePlan = user?.planes?.find(plan => plan.estado === 'activo');
    const entrenamientosDisplay = activePlan ? activePlan.entrenamientos : [];

    const totalEntrenamientos = entrenamientosDisplay.length || 0;

    // 1. Entrenamientos que el usuario ya "gestionó" (logrados y NO logrados)
    const resueltos = entrenamientosDisplay.filter(t => t.completado).length || 0;

    // 2. Entrenamientos que efectivamente LOGRÓ (excluimos los no logrados)
    const logrados = entrenamientosDisplay.filter(t => {
        if (!t.completado) return false;

        // Verificamos si tiene la marca de NO LOGRADO en el feedback
        const fueNoLogrado = t.feedback?.noLogrado || (t.feedback?.comentario && t.feedback.comentario.includes('[NO LOGRADO]'));

        return !fueNoLogrado; // Solo lo contamos si NO fue no logrado
    }).length || 0;

    // 🔥 El porcentaje de la barra ahora se basa estrictamente en los LOGRADOS
    const porcentaje = totalEntrenamientos === 0 ? 0 : Math.round((logrados / totalEntrenamientos) * 100);

    // 🔥 Pero la semana se puede cerrar cuando resolvió TODOS (resueltos === total)
    const semanaCompleta = totalEntrenamientos > 0 && resueltos === totalEntrenamientos;

    // --- CÁLCULOS DE KILÓMETROS Y TIEMPO ---
    const kmPlanificados = entrenamientosDisplay.reduce((acc, t) => acc + (Number(t.km) || 0), 0);
    const kmReales = entrenamientosDisplay.reduce((acc, t) => acc + (Number(t.feedback?.kmReal) || 0), 0);

    const minutosPlanificados = entrenamientosDisplay.reduce((acc, t) => {
        const dur = Number(t.duracion) || 0;
        return acc + (t.unidad === 'horas' ? dur * 60 : dur);
    }, 0);

    const minutosReales = entrenamientosDisplay.reduce((acc, t) => {
        return acc + (Number(t.feedback?.duracionReal) || 0);
    }, 0);

    const formatTime = (totalMinutos) => {
        if (!totalMinutos) return "0m";
        const h = Math.floor(totalMinutos / 60);
        const m = Math.round(totalMinutos % 60);
        if (h > 0 && m > 0) return `${h}h ${m}m`;
        if (h > 0) return `${h}h`;
        return `${m}m`;
    };

    // --- 4. FUNCIÓN QUE EJECUTA EL CIERRE ---
    const executeFinishWeek = async () => {
        setIsModalCerrarSemanaOpen(false); 

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${url}/api/plans/complete-week/${user._id}`, {
                method: 'PUT',
                headers: { "Authorization": `Bearer ${token}` }
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || "¡Semana completada con éxito!");
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                toast.error("Error: " + data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error de conexión al cerrar la semana.");
        }
    };

    // --- 5. RENDERIZADO ---
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#121212' }}>
                <Loader />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="error-screen">
                <h2>No se pudo cargar el perfil</h2>
                <p>Por favor inicia sesión nuevamente.</p>
            </div>
        );
    }

    return (
        <main className="dashboard-container">
            {/* HEADER */}
            <header className="dash-header">
                <div className="header-left">
                    <div className="user-welcome">
                        <span>Hola,</span>
                        <h1>{user.nombre}</h1>
                    </div>
                </div>
                <div className="header-center">
                    <img src={logo} alt="App Logo" className="app-logo" />
                </div>
                <div className="header-right">
                    <WeatherWidget />
                </div>
            </header>

            <section className="content-section">

                {/* BARRA DE PROGRESO */}
                <div className="progress-section">
                    <div className="progress-info">
                        <span>Progreso Semanal {activePlan ? `(Semana ${activePlan.numeroSemana || 1})` : ''}</span>
                        <span>{porcentaje}%</span>
                    </div>
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${porcentaje}%` }}></div>
                    </div>
                </div>

                {/* --- 🔥 NUEVA FILA DE ESTADÍSTICAS RÁPIDAS --- */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px',
                    marginTop: '15px',
                    marginBottom: '25px'
                }}>
                    {/* Stat 1: Sesiones */}
                    <div style={{ backgroundColor: '#1e1e1e', padding: '15px 20px', borderRadius: '12px', border: '1px solid #333' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                            Sesiones
                        </span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                            <span style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 'bold', lineHeight: '1' }}>{logrados}</span>
                            <span style={{ color: '#64748b', fontSize: '1rem', fontWeight: 'bold' }}>/ {totalEntrenamientos}</span>
                        </div>
                    </div>

                    {/* Stat 2: Km Planificados */}
                    <div style={{ backgroundColor: '#1e1e1e', padding: '15px 20px', borderRadius: '12px', border: '1px solid #333' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                            Objetivo Km
                        </span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                            <span style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 'bold', lineHeight: '1' }}>{kmPlanificados}</span>
                            <span style={{ color: '#00D2BE', fontSize: '1rem', fontWeight: 'bold' }}>km</span>
                        </div>
                    </div>

                    {/* Stat 3: Km Reales */}
                    <div style={{ backgroundColor: '#1e1e1e', padding: '15px 20px', borderRadius: '12px', border: '1px solid #333' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                            Recorrido
                        </span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                            <span style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 'bold', lineHeight: '1' }}>
                                {kmReales % 1 === 0 ? kmReales : kmReales.toFixed(1)}
                            </span>
                            <span style={{ color: '#00D2BE', fontSize: '1rem', fontWeight: 'bold' }}>km</span>
                        </div>
                    </div>

                    {/* Stat 4: Tiempo en movimiento */}
                    <div style={{ backgroundColor: '#1e1e1e', padding: '15px 20px', borderRadius: '12px', border: '1px solid #333' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                            Tiempo Acumulado
                        </span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                            <span style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 'bold', lineHeight: '1' }}>{formatTime(minutosReales)}</span>
                            <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 'bold' }}>/ {formatTime(minutosPlanificados)}</span>
                        </div>
                    </div>
                </div>

                {/* WIDGETS */}
                <div className="widgets-row">
                    <RaceCountdown
                        initialFecha={user.nextRace?.date}
                        initialNombre={user.nextRace?.name}
                        userId={user._id}
                    />
                    <ShoeTracker userShoes={shoesList} />
                </div>

                <h2 className="section-title">
                    {activePlan ? "Tu Semana de Ultra" : "Sin Plan Activo"}
                </h2>

                {/* GRID DE ENTRENAMIENTOS */}
                <div className="cards-grid">
                    {entrenamientosDisplay.length > 0 ? (
                        entrenamientosDisplay.map((item, index) => (
                            <div
                                className={`training-card ${item.completado ? 'card-completed' : ''}`}
                                key={index}
                                onClick={() => setSelectedTraining(item)}
                                style={{ cursor: "pointer" }}
                            >
                                <div className="card-header">
                                    <span className="day-badge">{item.dia}</span>
                                    <div className="checkbox-container">
                                        {item.completado && (item.feedback?.noLogrado || item.feedback?.comentario?.includes('[NO LOGRADO]')) ? (
                                            <span style={{ color: '#ff4d4d', fontSize: '1.2rem', fontWeight: 'bold' }}>❌</span>
                                        ) : (
                                            <>
                                                <input
                                                    type="checkbox"
                                                    checked={item.completado}
                                                    readOnly
                                                    style={{ pointerEvents: "none" }}
                                                />
                                                <span className="checkmark"></span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="card-body">
                                    <h3 className="training-title">{item.tipo}</h3>
                                    <p className="training-type">{item.titulo}</p>
                                    <div className="divider"></div>
                                    <p className="training-desc">{item.descripcion}</p>
                                    <p className="duration-text">⏱ {item.duracion} {item.unidad === 'horas' ? 'hs' : 'min'}</p>
                                </div>
                                <div className="card-glow"></div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <p>No tienes una semana activa en este momento.</p>
                            {user.planes?.some(p => p.estado === 'pendiente') && (
                                <p style={{ color: '#00D2BE', marginTop: '10px', fontSize: '0.9rem' }}>
                                    (Tienes semanas pendientes. Finaliza la anterior para activar esta.)
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* BOTÓN CERRAR SEMANA CON VALIDACIÓN 100% */}
                {activePlan && (
                    <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        {!semanaCompleta && (
                            <span style={{ color: '#666', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                * Completa todos los entrenamientos para avanzar
                            </span>
                        )}

                        <button
                            className="btn-finish-week"
                            onClick={() => {
                                if (!semanaCompleta) {
                                    toast.warn("⛔ Aún te faltan entrenamientos por completar.");
                                    return;
                                }
                                setIsModalCerrarSemanaOpen(true);
                            }}
                            disabled={!semanaCompleta}
                            style={{
                                background: semanaCompleta ? '#1e1e1e' : '#2a2a2a',
                                border: semanaCompleta ? '1px solid #00D2BE' : '1px solid #444',
                                color: semanaCompleta ? '#00D2BE' : '#555',
                                padding: '12px 30px',
                                borderRadius: '8px',
                                cursor: semanaCompleta ? 'pointer' : 'not-allowed',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                transition: 'all 0.3s ease',
                                opacity: semanaCompleta ? 1 : 0.6,
                                boxShadow: semanaCompleta ? '0 4px 12px rgba(0, 210, 190, 0.1)' : 'none'
                            }}
                            onMouseOver={(e) => {
                                if (semanaCompleta) {
                                    e.target.style.background = '#00D2BE';
                                    e.target.style.color = '#121212';
                                }
                            }}
                            onMouseOut={(e) => {
                                if (semanaCompleta) {
                                    e.target.style.background = '#1e1e1e';
                                    e.target.style.color = '#00D2BE';
                                }
                            }}
                        >
                            {semanaCompleta ? "🏁 Cerrar Semana y Avanzar" : "🔒 Semana Incompleta"}
                        </button>
                    </div>
                )}

            </section>

            {/* --- MODAL NATIVO: CERRAR SEMANA --- */}
            {isModalCerrarSemanaOpen && (
                <div className="modal-cerrar-semana-overlay" onClick={() => setIsModalCerrarSemanaOpen(false)}>
                    <div className="modal-cerrar-semana-card" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-cerrar-semana-title">¿Terminaste tu semana? 🏁</h2>
                        <p className="modal-cerrar-semana-text">
                            Al aceptar, esta semana pasará al historial y se activará la siguiente automáticamente.
                        </p>
                        <div className="modal-cerrar-semana-actions">
                            <button className="modal-cerrar-semana-btn-cancelar" onClick={() => setIsModalCerrarSemanaOpen(false)}>
                                Cancelar
                            </button>
                            <button className="modal-cerrar-semana-btn-aceptar" onClick={executeFinishWeek}>
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DETALLE */}
            {selectedTraining && (
                <TrainingDetail
                    training={selectedTraining}
                    onClose={() => setSelectedTraining(null)}
                />
            )}
        </main>
    )
}

export default Dashboard;