import { useEffect, useState } from "react";
import { getUserLogued } from "../../../services/getUserLogued";
import TrainingDetail from "../detalle-plan/TrainingDetail";
import { WeatherWidget, ShoeTracker } from "./Widgets";
import RaceCountdown from "./RaceCountDown";
import logo from "../../../assets/logo-zona-ultra.png";
import Loader from "../../loader/Loader";
import { toast } from "react-toastify";

// 🔥 NUEVO: Importamos iconos para las estadísticas
import { FaRunning, FaMapMarkerAlt, FaRoute, FaClock } from "react-icons/fa";

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [shoesList, setShoesList] = useState([]);
    const [isModalCerrarSemanaOpen, setIsModalCerrarSemanaOpen] = useState(false);

    // 🔥 NUEVO: Obtenemos el día actual (0 = Domingo, 1 = Lunes, etc.)
    const todayIndex = new Date().getDay();
    // Mapeamos a los días de la semana (Lunes a Domingo)
    const daysOfWeek = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
    const currentDayName = daysOfWeek[todayIndex === 0 ? 6 : todayIndex - 1]; // Ajuste para que Lunes sea 0

    const url = import.meta.env.VITE_API_URL;

    // --- 1. FUNCIONES DE CARGA DE DATOS --- (Sin cambios) [cite: 59, 60, 61, 62, 63, 64, 65, 66, 67]
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

    // --- 2. EFECTO DE CARGA INICIAL --- (Sin cambios) [cite: 67, 68, 69, 70]
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

    // --- 3. CÁLCULOS --- (Sin cambios lógicos) [cite: 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82]
    const activePlan = user?.planes?.find(plan => plan.estado === 'activo');
    const entrenamientosDisplay = activePlan ? activePlan.entrenamientos : [];
    const totalEntrenamientos = entrenamientosDisplay.length || 0;
    const resueltos = entrenamientosDisplay.filter(t => t.completado).length || 0;

    const logrados = entrenamientosDisplay.filter(t => {
        if (!t.completado) return false;
        const fueNoLogrado = t.feedback?.noLogrado || (t.feedback?.comentario && t.feedback.comentario.includes('[NO LOGRADO]'));
        return !fueNoLogrado;
    }).length || 0;

    const porcentaje = totalEntrenamientos === 0 ? 0 : Math.round((logrados / totalEntrenamientos) * 100);
    const semanaCompleta = totalEntrenamientos > 0 && resueltos === totalEntrenamientos;

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

    // --- 4. FUNCIÓN QUE EJECUTA EL CIERRE --- (Sin cambios) [cite: 83, 84, 85, 86, 87, 88, 89, 90]
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

    // --- 5. RENDERIZADO --- [cite: 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158]
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

                {/* --- 🔥 NUEVA FILA DE ESTADÍSTICAS RÁPIDAS (CON ICONOS Y COLORES) --- */}
                <div className="stats-grid">
                    {/* Stat 1: Sesiones (Teal) */}
                    <div className="stat-card stat-teal">
                        <div className="stat-header">
                            <FaRunning className="stat-icon" />
                            <span className="stat-title">Sesiones</span>
                        </div>
                        <div className="stat-values">
                            <span className="stat-main">{logrados}</span>
                            <span className="stat-sub">/ {totalEntrenamientos}</span>
                        </div>
                    </div>

                    {/* Stat 2: Km Planificados (Naranja) */}
                    <div className="stat-card stat-orange">
                        <div className="stat-header">
                            <FaMapMarkerAlt className="stat-icon" />
                            <span className="stat-title">Objetivo Km</span>
                        </div>
                        <div className="stat-values">
                            <span className="stat-main">{kmPlanificados}</span>
                            <span className="stat-unit">km</span>
                        </div>
                    </div>

                    {/* Stat 3: Km Reales (Verde) */}
                    <div className="stat-card stat-green">
                        <div className="stat-header">
                            <FaRoute className="stat-icon" />
                            <span className="stat-title">Recorrido</span>
                        </div>
                        <div className="stat-values">
                            <span className="stat-main">
                                {kmReales % 1 === 0 ? kmReales : kmReales.toFixed(1)}
                            </span>
                            <span className="stat-unit">km</span>
                        </div>
                    </div>

                    {/* Stat 4: Tiempo en movimiento (Amarillo/Dorado) */}
                    <div className="stat-card stat-yellow">
                        <div className="stat-header">
                            <FaClock className="stat-icon" />
                            <span className="stat-title">Tiempo Acumulado</span>
                        </div>
                        <div className="stat-values">
                            <span className="stat-main">{formatTime(minutosReales)}</span>
                            <span className="stat-sub">/ {formatTime(minutosPlanificados)}</span>
                        </div>
                    </div>
                </div>

                {/* --- 🔥 REORDENAMIENTO: GRILLA DE ENTRENAMIENTOS PRIMERO --- */}
                <h2 className="section-title">
                    {activePlan ? "Tu Semana de Ultra" : "Sin Plan Activo"}
                </h2>

                <div className="cards-grid">
                    {entrenamientosDisplay.length > 0 ? (
                        entrenamientosDisplay.map((item, index) => {
                            // Validaciones visuales
                            const isToday = item.dia.toLowerCase() === currentDayName;
                            const isFailed = item.completado && (item.feedback?.noLogrado || item.feedback?.comentario?.includes('[NO LOGRADO]'));
                            const isSuccess = item.completado && !isFailed;

                            return (
                                <div
                                    className={`training-card 
                                        ${isToday ? 'card-today' : ''} 
                                        ${isSuccess ? 'card-completed-success' : ''} 
                                        ${isFailed ? 'card-completed-failed' : ''}
                                    `}
                                    key={index}
                                    onClick={() => setSelectedTraining(item)}
                                >
                                    <div className="card-header">
                                        <span className="day-badge">
                                            {item.dia} {isToday && "(Hoy)"}
                                        </span>
                                        <div className="checkbox-container">
                                            {isFailed ? (
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
                            );
                        })
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

                {/* BOTÓN CERRAR SEMANA MEJORADO */}
                {activePlan && (
                    <div className="finish-week-container">
                        <button
                            className="btn-finish-week"
                            onClick={() => {
                                if (!semanaCompleta) return;
                                setIsModalCerrarSemanaOpen(true);
                            }}
                            disabled={!semanaCompleta}
                        >
                            {semanaCompleta ? "🏁 Cerrar Semana y Avanzar" : "🔒 Semana Incompleta"}
                        </button>
                        {!semanaCompleta && (
                            <span className="finish-week-hint">
                                Te faltan {totalEntrenamientos - resueltos} entrenamientos para cerrar la semana
                            </span>
                        )}
                    </div>
                )}

                {/* --- 🔥 REORDENAMIENTO: WIDGETS DEBAJO --- */}
                <div className="widgets-row">
                    <RaceCountdown
                        initialFecha={user.nextRace?.date}
                        initialNombre={user.nextRace?.name}
                        userId={user._id}
                    />
                    <ShoeTracker userShoes={shoesList} />
                </div>

            </section>

            {/* --- MODALES --- */}
            {isModalCerrarSemanaOpen && (
                <div className="modal-cerrar-semana-overlay" onClick={() => setIsModalCerrarSemanaOpen(false)}>
                    {/* Contenido del modal sin cambios */}
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

            {selectedTraining && (
                <TrainingDetail
                    training={selectedTraining}
                    onClose={() => setSelectedTraining(null)}
                />
            )}
        </main>
    );
};

export default Dashboard;