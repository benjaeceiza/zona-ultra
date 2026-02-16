import { useEffect, useState } from "react";
import { getUserLogued } from "../../../services/getUserLogued";
import TrainingDetail from "../detalle-plan/TrainingDetail";
import { WeatherWidget, ShoeTracker } from "./Widgets";
import RaceCountdown from "./RaceCountDown";
import logo from "../../../assets/logo-zona-ultra.png";

import Loader from "../../loader/Loader";

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Arranca cargando
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [shoesList, setShoesList] = useState([]);
    const url = import.meta.env.VITE_API_URL;

    // --- FUNCIONES AUXILIARES (Para que el useEffect quede limpio) ---
    const fetchUser = async (token) => {
        try {
            const res = await getUserLogued(token);
            if (res.plan && res.plan.entrenamientos) {
                res.plan.entrenamientos = res.plan.entrenamientos.map(t => ({
                    ...t,
                    completado: t.completado || false
                }));
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

    // --- EFECTO DE CARGA OPTIMIZADO ---
    useEffect(() => {
        const loadDashboardData = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                // Promise.all para esperar a ambos datos
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

    // --- LÓGICA DE PROGRESO ---
    const totalEntrenamientos = user?.plan?.entrenamientos.length || 0;
    const completados = user?.plan?.entrenamientos.filter(t => t.completado).length || 0;
    const porcentaje = totalEntrenamientos === 0 ? 0 : Math.round((completados / totalEntrenamientos) * 100);

    // --- RENDERIZADO ---

    // 2. ACÁ USAMOS TU LOADER PROPIO
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#121212' }}>
                <Loader />
            </div>
        );
    }

    // Si terminó de cargar y no hay usuario (token inválido o error)
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
            {/* ... Todo tu contenido del dashboard igual que antes ... */}
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
                {/* ... Barra de progreso ... */}
                <div className="progress-section">
                    <div className="progress-info">
                        <span>Progreso Semanal</span>
                        <span>{porcentaje}%</span>
                    </div>
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${porcentaje}%` }}></div>
                    </div>
                </div>

                {/* ... Widgets ... */}
                <div className="widgets-row">
                    <RaceCountdown
                        initialFecha={user.nextRace?.date}
                        initialNombre={user.nextRace?.name}
                        userId={user._id}
                    />
                    <ShoeTracker userShoes={shoesList} />
                </div>

                <h2 className="section-title">Tu Semana de Ultra</h2>

                {/* ... Grid de Tarjetas ... */}
                <div className="cards-grid">
                    {user.plan && user.plan.entrenamientos.length > 0 ? (
                        user.plan.entrenamientos.map((item, index) => (
                            <div
                                className={`training-card ${item.completado ? 'card-completed' : ''}`}
                                key={index}
                                onClick={() => setSelectedTraining(item)}
                                style={{ cursor: "pointer" }}
                            >
                                <div className="card-header">
                                    <span className="day-badge">{item.dia}</span>
                                    <div className="checkbox-container">
                                        <input
                                            type="checkbox"
                                            checked={item.completado}
                                            readOnly
                                            style={{ pointerEvents: "none" }}
                                        />
                                        <span className="checkmark"></span>
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
                            <p>No tienes plan asignado.</p>
                        </div>
                    )}
                </div>
            </section>

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