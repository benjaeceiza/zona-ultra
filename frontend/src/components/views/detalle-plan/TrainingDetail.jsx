import { useState, useEffect } from 'react';
import { getUserShoes } from "../../../services/getUserShoes.js";
import { updateFeedback } from "../../../services/updateFeedback.js";
import { useLoader } from '../../../context/LoaderContext.jsx';

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

const TrainingDetail = ({ training, onClose }) => {

    const isCompleted = training.completado;
    const feedbackGuardado = training.feedback || {};

    // 🔥 DETECCIÓN DE NO LOGRADO
    const fueNoLogrado = feedbackGuardado.noLogrado || (feedbackGuardado.comentario && feedbackGuardado.comentario.includes('[NO LOGRADO]'));

    // --- DETECCIONES DE TIPO ---
    const tipoNormalizado = training.titulo ? training.titulo.toLowerCase() : "";
    const isRestDay = tipoNormalizado === 'descanso';
    const isStrength = tipoNormalizado.includes('fuerza');

    const [rpe, setRpe] = useState(feedbackGuardado.rpe || 5);
    const [comentario, setComentario] = useState((feedbackGuardado.comentario || "").replace('[NO LOGRADO] ', ''));
    const [duracionReal, setDuracionReal] = useState(feedbackGuardado.duracionReal || 0);
    const [userShoes, setUserShoes] = useState([]);
    const [selectedShoe, setSelectedShoe] = useState(feedbackGuardado.shoeId || "");
    const [kmReal, setRealKm] = useState(feedbackGuardado.kmReal || training.km || 0);

    const { showLoader } = useLoader();

    useEffect(() => {
        if (training && !isRestDay) {
            const fetchShoes = async () => {
                try {
                    const res = await getUserShoes(training.usuario);
                    if (res.data) {
                        const lista = Array.isArray(res.data) ? res.data : (res.data.shoes || []);
                        setUserShoes(lista);
                    }
                } catch (error) { console.error(error) }
            };
            fetchShoes();
        }
    }, [training, isRestDay]);

    if (!training) return null;

    const handleSubmitFeedback = async (e, isNotAchieved = false) => {
        if (e) e.preventDefault();

        const comentarioFinal = isNotAchieved 
            ? `[NO LOGRADO] ${comentario}` 
            : (isRestDay ? "Día de descanso completado" : comentario);

        // 🔥 LÓGICA ACTUALIZADA: RPE, Duración y Km se van a 0 si no lo logró
        const feedbackData = {
            trainingId: training._id,
            rpe: isNotAchieved ? 0 : (isRestDay ? 1 : rpe), // <-- ACÁ ESTÁ EL FIX
            comentario: comentarioFinal,
            duracionReal: (isRestDay || isNotAchieved) ? 0 : duracionReal,
            shoeId: isRestDay ? null : selectedShoe,
            kmReal: (isRestDay || isStrength || isNotAchieved) ? 0 : Number(kmReal),
            noLogrado: isNotAchieved
        };

        const resultado = await updateFeedback(feedbackData);

        if (resultado.success) {
            onClose();
            showLoader();
            window.location.reload();
        } else {
            alert("Error: " + resultado.message);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>

                {/* --- HEADER --- */}
                <div className={`modal-header ${isCompleted ? (fueNoLogrado ? 'header-failed' : 'header-completed') : ''}`} style={fueNoLogrado ? { background: '#ff4d4d' } : {}}>
                    <button className="close-btn" onClick={onClose}>
                        <span style={{ lineHeight: 0, paddingBottom: '2px' }}>&times;</span>
                    </button>

                    <span className="modal-tag">
                        {training.titulo || "Entrenamiento"}
                    </span>

                    <h2 style={{ textTransform: 'capitalize', textAlign: "center" }}>
                        {isCompleted 
                            ? (fueNoLogrado ? "Entrenamiento No Logrado ❌" : "¡Objetivo Completado! ✅") 
                            : training.tipo}
                    </h2>

                    <div className="header-meta">
                        <span style={{ textTransform: 'capitalize' }}>📅 {training.dia}</span>
                    </div>
                </div>

                <div className="modal-body">

                    {/* --- KPI GRID --- */}
                    <div className="stats-grid">
                        <div className="stat-box">
                            <span className="stat-label">Duración</span>
                            <span className="stat-value">
                                ⏱ {training.duracion} {training.unidad === 'horas' ? 'hs' : 'min'}
                            </span>
                        </div>

                        {!isStrength && (
                            <div className="stat-box">
                                <span className="stat-label">Distancia Plan</span>
                                <span className="stat-value">📏 {training.km || 0} km</span>
                            </div>
                        )}

                        <div className="stat-box">
                            <span className="stat-label">Objetivo</span>
                            <span className="stat-value">
                                {isRestDay ? '💤 Recuperar' : '🔥 Entrenar'}
                            </span>
                        </div>
                    </div>

                    <div className="workout-structure">
                        <h3>📋 La Misión</h3>
                        <div className="structure-item">
                            <div className={`timeline-dot ${isRestDay ? 'rest' : 'warm'}`}></div>
                            <p style={{ whiteSpace: 'pre-line', color: '#ccc', fontSize: '0.9rem', margin: 0 }}>
                                {training.descripcion || "Sin descripción detallada."}
                            </p>
                        </div>
                    </div>

                    <hr className="modal-divider" />

                    <form className="feedback-section" onSubmit={(e) => handleSubmitFeedback(e, false)}>
                        <h3>
                            {isCompleted ? "📝 Tu Reporte (Solo lectura)" : "📝 Reporte de sesión"}
                        </h3>

                        {!isRestDay ? (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                    {!isStrength && (
                                        <>
                                            <label className="input-label input-number">Distancia Real (km)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                onWheel={(e) => e.target.blur()}
                                                placeholder='Km'
                                                onChange={(e) => setRealKm(e.target.value)}
                                                disabled={isCompleted}
                                                className={isCompleted ? "input-disabled" : "inputFormTraining"}
                                                required
                                            />
                                        </>
                                    )}

                                    <label className="input-label input-number">Duración Real (min)</label>
                                    <input
                                        type="number"
                                        placeholder='Minutos'
                                        onWheel={(e) => e.target.blur()}
                                        step="0.01"
                                        onChange={(e) => setDuracionReal(e.target.value)}
                                        disabled={isCompleted}
                                        className={isCompleted ? "input-disabled" : "inputFormTraining"}
                                        required
                                    />

                                    <label className="input-label">Zapatillas Usadas</label>
                                    <select
                                        value={selectedShoe}
                                        onChange={(e) => setSelectedShoe(e.target.value)}
                                        disabled={isCompleted}
                                        className={isCompleted ? "input-disabled" : "inputFormTraining"}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {userShoes.map(shoe => (
                                            <option key={shoe._id} value={shoe._id}>
                                                {shoe.brand} {shoe.model}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="borg-wrapper">
                                    <label className="completion-label">Esfuerzo Percibido (RPE)</label>
                                    <div className="borg-feedback" style={{ color: BORG_SCALE[rpe].color }}>
                                        <span className="borg-number">{rpe}</span>
                                        <span className="borg-text">{BORG_SCALE[rpe].label}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        step="1"
                                        value={rpe}
                                        onChange={(e) => setRpe(e.target.value)}
                                        disabled={isCompleted}
                                        className="borg-slider"
                                        style={{ background: `linear-gradient(to right, ${BORG_SCALE[rpe].color} 0%, ${BORG_SCALE[rpe].color} ${(rpe / 10) * 100}%, #333 ${(rpe / 10) * 100}%, #333 100%)` }}
                                    />
                                    <div className="borg-ticks">
                                        <span>0</span><span>5</span><span>10</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="input-label">Comentarios / Sensaciones</label>
                                    <textarea
                                        placeholder="Notas: Me sentí pesado, me dolió la rodilla, no tuve tiempo..."
                                        value={comentario}
                                        onChange={(e) => setComentario(e.target.value)}
                                        disabled={isCompleted}
                                        className={isCompleted ? "input-disabled" : ""}
                                    ></textarea>
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#888', fontStyle: 'italic' }}>
                                <p>🍃 Hoy toca recargar energías. <br />¡Confirmá tu descanso para completar el día!</p>
                            </div>
                        )}

                        {/* --- BOTONES DE ACCIÓN --- */}
                        {!isCompleted && (
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button type="submit" className="action-btn" style={{ flex: 1 }}>
                                    {isRestDay ? "CONFIRMAR DESCANSO" : "GUARDAR SESIÓN"}
                                </button>
                                
                                {!isRestDay && (
                                    <button 
                                        type="button" 
                                        className="action-btn" 
                                        style={{ flex: 1, background: 'transparent', border: '1px solid #ff4d4d', color: '#ff4d4d' }}
                                        onClick={(e) => {
                                            const confirmar = window.confirm("¿Estás seguro que querés marcar este entrenamiento como NO LOGRADO?");
                                            if (confirmar) handleSubmitFeedback(e, true);
                                        }}
                                    >
                                        NO LOGRADO
                                    </button>
                                )}
                            </div>
                        )}

                        {isCompleted && (
                            <button type="button" className="action-btn" style={{ background: '#444', color: '#fff', marginTop: '20px' }} onClick={onClose}>
                                CERRAR
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TrainingDetail;