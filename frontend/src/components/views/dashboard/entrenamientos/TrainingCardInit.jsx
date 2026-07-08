import { Clock, Route, X } from "lucide-react"; // Importamos los íconos limpios
import "./TrainingCardInit.css";

const TrainingCardInit = ({ item, isToday, isSuccess, isFailed, onClick }) => {
    const unidadTiempo = item.unidad === 'horas' ? 'hs' : 'min';
    const duracionPlan = item.duracion || 0;
    const duracionReal = item.feedback?.duracionReal;
    
    const kmPlan = item.km ? `${item.km} km` : '0 km';
    const kmReal = item.feedback?.kmReal;

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
            </div>

            <div className="card-glow"></div>
        </div>
    );
};

export default TrainingCardInit;