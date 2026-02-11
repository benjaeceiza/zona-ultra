import { useState, useEffect } from 'react';
import { getUserShoes } from "../../../services/getUserShoes.js";
import { updateFeedback } from "../../../services/updateFeedback.js"; 
import { useLoader } from '../../../context/LoaderContext.jsx';

const TrainingDetail = ({ training, onClose }) => {

    // Lógica: Si ya tiene feedback guardado, es "Solo Lectura" (isCompleted = true)
    const isCompleted = training.completado;
    const feedbackGuardado = training.feedback || {};

    // --- DETECCIONES DE TIPO ---
    // Normalizamos a minúsculas
    const tipoNormalizado = training.titulo ? training.titulo.toLowerCase() : "";
    const isRestDay = tipoNormalizado === 'descanso';
    // Detectamos si es fuerza (por si dice "entrenamiento de fuerza" o "fuerza")
    const isStrength = tipoNormalizado.includes('fuerza'); 

    // Estados iniciales
    const [rpe, setRpe] = useState(feedbackGuardado.rpe || 5);
    const [comentario, setComentario] = useState(feedbackGuardado.comentario || "");
    const [duracionReal, setDuracionReal] = useState(feedbackGuardado.duracionReal || 0);
    const [userShoes, setUserShoes] = useState([]);
    const [selectedShoe, setSelectedShoe] = useState(feedbackGuardado.shoeId || "");
    const [kmReal, setRealKm] = useState(feedbackGuardado.kmReal || training.km || 0);

    const {showLoader} = useLoader();

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

    const handleSubmitFeedback = async (e) => {
        e.preventDefault();

        const feedbackData = {
            trainingId: training._id,
            // Si es descanso, forzamos valores neutros
            rpe: isRestDay ? 1 : rpe,
            comentario: isRestDay ? "Día de descanso completado" : comentario,
            duracionReal: isRestDay ? 0 : duracionReal,
            shoeId: isRestDay ? null : selectedShoe,
            // LOGICA NUEVA: Si es descanso O es fuerza, los km son 0
            kmReal: (isRestDay || isStrength) ? 0 : Number(kmReal)
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
                <div className={`modal-header ${isCompleted ? 'header-completed' : ''}`}>
                    <button className="close-btn" onClick={onClose}>
                        <span style={{ lineHeight: 0, paddingBottom: '2px' }}>&times;</span>
                    </button>

                    <span className="modal-tag">
                        {training.titulo || "Entrenamiento"}
                    </span>

                    <h2 style={{ textTransform: 'capitalize', textAlign: "center" }}>
                        {isCompleted ? "¡Objetivo Completado!" : training.tipo}
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
                        
                        {/* CONDICIONAL: Solo mostramos la distancia planificada si NO es fuerza */}
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

                    {/* --- DESCRIPCIÓN --- */}
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

                    {/* --- FORMULARIO DE FEEDBACK --- */}
                    <form className="feedback-section" onSubmit={handleSubmitFeedback}>
                        <h3>
                            {isCompleted ? "📝 Tu Reporte (Solo lectura)" : "📝 Reporte de sesión"}
                        </h3>

                        {/* --- LÓGICA CONDICIONAL: SI NO ES DESCANSO --- */}
                        {!isRestDay ? (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                    
                                    {/* CONDICIONAL: Ocultamos input de Distancia si es Fuerza */}
                                    {!isStrength && (
                                        <>
                                            <label className="input-label">Distancia Real (km)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={kmReal}
                                                onChange={(e) => setRealKm(e.target.value)}
                                                disabled={isCompleted}
                                                className={isCompleted ? "input-disabled" : "inputFormTraining"}
                                                required
                                            />
                                        </>
                                    )}

                                    {/* Duración siempre se muestra */}
                                    <label className="input-label">Duración Real (min)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={duracionReal}
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

                                {/* Slider RPE */}
                                <div className="rpe-control">
                                    <label>Esfuerzo (RPE): <span className="rpe-value">{rpe}/10</span></label>
                                    <input
                                        type="range"
                                        min="1" max="10"
                                        value={rpe}
                                        onChange={(e) => setRpe(e.target.value)}
                                        disabled={isCompleted}
                                        className="range-slider"
                                    />
                                    <div className="rpe-labels">
                                        <span>Suave</span>
                                        <span>Mortal</span>
                                    </div>
                                </div>

                                {/* Comentario */}
                                <div>
                                    <label className="input-label">Comentarios / Sensaciones</label>
                                    <textarea
                                        placeholder="Notas: Me sentí pesado, mucho barro, me dolió la rodilla..."
                                        value={comentario}
                                        onChange={(e) => setComentario(e.target.value)}
                                        disabled={isCompleted}
                                        className={isCompleted ? "input-disabled" : ""}
                                    ></textarea>
                                </div>
                            </>
                        ) : (
                            /* --- SI ES DESCANSO --- */
                            <div style={{ textAlign: 'center', padding: '20px', color: '#888', fontStyle: 'italic' }}>
                                <p>🍃 Hoy toca recargar energías. <br/>¡Confirmá tu descanso para completar el día!</p>
                            </div>
                        )}

                        {/* --- BOTONES DE ACCIÓN --- */}
                        {!isCompleted && (
                            <button type="submit" className="action-btn">
                                {isRestDay ? "CONFIRMAR DESCANSO" : "GUARDAR SESIÓN"}
                            </button>
                        )}

                        {isCompleted && (
                            <button type="button" className="action-btn" style={{ background: '#444', color: '#fff' }} onClick={onClose}>
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