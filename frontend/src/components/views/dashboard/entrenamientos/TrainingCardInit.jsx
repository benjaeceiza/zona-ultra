import { Link } from "react-router-dom";
import "./TrainingCardInit.css"

const TrainingCardInit = ({ item, isToday, isSuccess, isFailed, onClick }) => {
    return (
        <div
            className={`training-card-init 
                ${isToday ? 'card-today' : ''} 
                ${isSuccess ? 'card-completed-success' : ''} 
                ${isFailed ? 'card-completed-failed' : ''}
            `}
            onClick={onClick}
        >
            <div className="card-header">
                <span className="day-badge-card-init">
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

                {/* --- NUEVA SECCIÓN DE MÉTRICAS (PLAN VS REAL) --- */}
                <div className="metrics-container" style={{ display: 'flex', justifyContent: "space-between", gap: '8px', marginTop: '10px' }}>

                    {/* Métrica de Tiempo */}
                    <div className="metric-row" style={{ display: 'flex', alignItems: 'center', fontSize: '1rem', color: '#aaa',fontWeight:"bold" }}>
                        <span style={{ marginRight: '5px' }}>⏱</span>
                        <span>
                            {item.duracion} {item.unidad === 'horas' ? 'hs' : 'min'}
                            {/* CORRECCIÓN: Buscamos dentro de item.feedback */}
                            {item.feedback?.duracionReal ? (
                                <span style={{ color: '#fff', fontWeight: '500' }}> / {item.feedback.duracionReal} {item.unidad === 'horas' ? 'hs' : 'min'}</span>
                            ) : (
                                <span style={{ color: '#555' }}> / --</span>
                            )}
                        </span>
                    </div>

                    {/* Métrica de Distancia */}
                    <div className="metric-row" style={{ display: 'flex', alignItems: 'center', fontSize: '1rem', color: '#aaa',fontWeight:"bold" }}>
                        <span style={{ marginRight: '5px' }}>📏</span>
                        <span>
                            {item.km ? `${item.km} km` : '0 km'}
                            {/* CORRECCIÓN: Buscamos dentro de item.feedback */}
                            {item.feedback?.kmReal ? (
                                <span style={{ color: '#fff', fontWeight: '500' }}> / {item.feedback.kmReal} km</span>
                            ) : (
                                <span style={{ color: '#555' }}> / --</span>
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