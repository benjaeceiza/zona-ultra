import { useEffect, useState } from "react";
import { getUserLogued } from "../../../services/getUserLogued";
// Borramos updateTrainingStatus porque ya no lo usaremos directamente desde aquí
import TrainingDetail from "../detalle-plan/TrainingDetail";
import { WeatherWidget, ShoeTracker } from "./Widgets";
import RaceCountdown from "./RaceCountDown";
import logo from "../../../assets/logo-zona-ultra.png";

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [shoesList, setShoesList] = useState([]);
    const url  = import.meta.env.VITE_API_URL;

    const fetchShoes = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${url}/api/shoes`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();

            if (Array.isArray(data)) {
                setShoesList(data);
            } else if (data.data) {
                setShoesList(Array.isArray(data.data) ? data.data : [data.data]);
            } else {
                setShoesList([]);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        const obtenerUsuario = async (tokenParaUsar) => {
            if (!tokenParaUsar) return;
            try {
                const res = await getUserLogued(tokenParaUsar);

                if (res.plan && res.plan.entrenamientos) {
                    res.plan.entrenamientos = res.plan.entrenamientos.map(t => ({
                        ...t,
                        completado: t.completado || false
                    }));
                }
                setUser(res);
            } catch (error) {
                console.error("Error al obtener usuario:", error);
            } finally {
                setLoading(false);
            }
        }
        obtenerUsuario(token);
        fetchShoes();
    }, []);

    // --- LÓGICA DE PROGRESO ---
    const totalEntrenamientos = user?.plan?.entrenamientos.length || 0;
    const completados = user?.plan?.entrenamientos.filter(t => t.completado).length || 0;
    const porcentaje = totalEntrenamientos === 0 ? 0 : Math.round((completados / totalEntrenamientos) * 100);


    if (loading) return <div className="loading-screen">Cargando tu plan...</div>;
    if (!user) return <div className="error-screen">No hay usuario registrado.</div>;

    return (
        <main className="dashboard-container">
            {/* --- 1. HEADER --- */}
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
                {/* --- 2. BARRA DE PROGRESO --- */}
                <div className="progress-section">
                    <div className="progress-info">
                        <span>Progreso Semanal</span>
                        <span>{porcentaje}%</span>
                    </div>
                    <div className="progress-bar-bg">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${porcentaje}%` }}
                        ></div>
                    </div>
                </div>

                {/* --- 3. WIDGETS --- */}
                <div className="widgets-row">
                    <RaceCountdown
                        initialFecha={user.nextRace?.date}
                        initialNombre={user.nextRace?.name}
                        userId={user._id}
                    />
                    <ShoeTracker userShoes={shoesList} />
                </div>

                <h2 className="section-title">Tu Semana de Ultra</h2>

                {/* --- 4. GRID DE TARJETAS --- */}
                <div className="cards-grid">
                    {user.plan && user.plan.entrenamientos.length > 0 ? (
                        user.plan.entrenamientos.map((item, index) => (
                            <div
                                className={`training-card ${item.completado ? 'card-completed' : ''}`}
                                key={index}
                                // AHORA: Cualquier click en la tarjeta abre el modal
                                onClick={() => setSelectedTraining(item)}
                                style={{ cursor: "pointer" }}
                            >
                                <div className="card-header">
                                    <span className="day-badge">{item.dia}</span>

                                    {/* CHECKBOX: Ahora es solo visual */}
                                    <div className="checkbox-container">
                                        <input
                                            type="checkbox"
                                            checked={item.completado}
                                            readOnly // Importante: React no se queja y el usuario no puede cambiarlo directo
                                            style={{ pointerEvents: "none" }} // Evita que el click lo capture el input
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

            {/* --- 5. MODAL DE DETALLE --- */}
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