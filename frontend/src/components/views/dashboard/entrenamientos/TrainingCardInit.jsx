import { Clock, Route, X, HeartPulse } from "lucide-react"; // Importamos los íconos limpios
import "./TrainingCardInit.css";

const BORG_SCALE = {
    0: { label: "MUY MUY SUAVE", color: "#6CA0DC" },
    1: { label: "MUY SUAVE", color: "#FFD700" },
    2: { label: "MUY SUAVE", color: "#FFD700" },
    3: { label: "SUAVE", color: "#FFC107" },
    4: { label: "MODERADO", color: "#FFB300" },
    5: { label: "ALGO DURO", color: "#FF9800" },
    6: { label: "DURO", color: "#F57C00" },
    7: { label: "MUY DURO", color: "#E65100" },
    8: { label: "MUY DURO", color: "#D84315" },
    9: { label: "MUY DURO", color: "#C62828" },
    10: { label: "MUY MUY DURO", color: "#B71C1C" }
};

const TrainingCardInit = ({ item, isToday, isSuccess, isFailed, onClick }) => {
    const unidadTiempo = item.unidad === 'horas' ? 'hs' : 'min';
    const duracionPlan = item.duracion || 0;
    const duracionReal = item.feedback?.duracionReal;
    
    const kmPlan = item.km ? `${item.km} km` : '0 km';
    const kmReal = item.feedback?.kmReal;

    const isDescanso = item.titulo?.trim().toLowerCase() === "descanso";
    const rpeValue = item.feedback?.rpe;
    const hasRpe = rpeValue !== undefined && rpeValue !== null && rpeValue !== "" && BORG_SCALE[rpeValue];
    const borgInfo = hasRpe ? BORG_SCALE[rpeValue] : null;

    return (
        <div
            className={`training-card-init 
                ${isToday ? 'card-today' : ''} 
                ${isSuccess ? 'card-completed-success' : ''} 
                ${isFailed ? 'card-completed-failed' : ''}
            `}
            onClick={onClick}
        >
            {/* HEADER: Día y Checkbox */}
            <div className="card-header">
                <span className="day-badge-card-init">
                    {item.dia} {isToday && "(Hoy)"}
                </span>
                
                <div className="checkbox-container">
                    {isFailed ? (
                        <X size={22} className="failed-icon" strokeWidth={3} />
                    ) : (
                        <>
                            <input
                                type="checkbox"
                                checked={item.completado || false}
                                readOnly
                                tabIndex={-1}
                            />
                            <span className="checkmark"></span>
                        </>
                    )}
                </div>
            </div>

            {/* BODY: Título y Categoría */}
            <div className="card-body">
                <h3 className="training-title">{item.tipo || "Entrenamiento"}</h3>
                <p className="training-type">{item.titulo || "Aeróbico"}</p>

                <div className="divider"></div>

                {/* MÉTRICAS: Planificado vs Real */}
                <div className="metrics-container">
                    
                    {/* Métrica de Tiempo */}
                    <div className="metric-row">
                        <Clock size={16} className="metric-icon" />
                        <span className="metric-text">
                            {duracionPlan} {unidadTiempo}
                            {duracionReal ? (
                                <span className="metric-real"> / {duracionReal} {unidadTiempo}</span>
                            ) : (
                                <span className="metric-empty"> / --</span>
                            )}
                        </span>
                    </div>

                    {/* Métrica de Distancia */}
                    <div className="metric-row">
                        <Route size={16} className="metric-icon" />
                        <span className="metric-text">
                            {kmPlan}
                            {kmReal ? (
                                <span className="metric-real"> / {kmReal} km</span>
                            ) : (
                                <span className="metric-empty"> / --</span>
                            )}
                        </span>
                    </div>

                </div>

                {/* ESFUERZO PERCIBIDO (RPE) - Aparece una vez realizado el ejercicio */}
                {isSuccess && !isDescanso && borgInfo && (
                    <div
                        className="card-init-rpe-box"
                        style={{
                            borderColor: `${borgInfo.color}45`,
                            backgroundColor: `${borgInfo.color}14`
                        }}
                    >
                        <span className="card-init-rpe-title">
                            <HeartPulse size={15} style={{ color: borgInfo.color }} />
                            Esfuerzo (RPE)
                        </span>
                        <div className="card-init-rpe-value" style={{ color: borgInfo.color }}>
                            <strong className="card-init-rpe-number">{rpeValue}</strong>
                            <span className="card-init-rpe-label">{borgInfo.label}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="card-glow"></div>
        </div>
    );
};

export default TrainingCardInit;