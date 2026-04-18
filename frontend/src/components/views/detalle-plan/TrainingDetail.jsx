import { useState, useEffect } from 'react';
import { getUserShoes } from "../../../services/getUserShoes.js";
import { updateFeedback } from "../../../services/updateFeedback.js";
import { useLoader } from '../../../context/LoaderContext.jsx';
// Importamos algunos íconos para darle onda
import { FaTimes, FaCalendarAlt, FaCheck, FaTimesCircle } from 'react-icons/fa';

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

const TrainingDetail = ({ training, onClose, isSemanaActiva = true }) => {

    const isCompleted = training.completado;
    const feedbackGuardado = training.feedback || {};

    const fueNoLogrado = feedbackGuardado.noLogrado || (feedbackGuardado.comentario && feedbackGuardado.comentario.includes('[NO LOGRADO]'));

    const tipoNormalizado = training.titulo ? training.titulo.toLowerCase() : "";
    const isRestDay = tipoNormalizado === 'descanso';
    const isStrength = tipoNormalizado.includes('fuerza');

    const [isEditing, setIsEditing] = useState(false);

    const [rpe, setRpe] = useState(feedbackGuardado.rpe || 5);
    const [comentario, setComentario] = useState((feedbackGuardado.comentario || "").replace('[NO LOGRADO] ', ''));
    const [userShoes, setUserShoes] = useState([]);
    const [selectedShoe, setSelectedShoe] = useState(feedbackGuardado.shoeId || "");
    const [duracionReal, setDuracionReal] = useState(feedbackGuardado.duracionReal || "");
    const [kmReal, setRealKm] = useState(feedbackGuardado.kmReal || "");

    const { showLoader } = useLoader();

    useEffect(() => {
        if (training) {
            const feedback = training.feedback || {};
            setRpe(feedback.rpe || 5);
            setComentario((feedback.comentario || "").replace('[NO LOGRADO] ', ''));
            setDuracionReal(feedback.duracionReal || "");
            setRealKm(feedback.kmReal || "");
            setSelectedShoe(feedback.shoeId || "");
        }
    }, [training]);

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

    const handleCancelEdit = () => {
        setIsEditing(false);
        setRpe(feedbackGuardado.rpe || 5);
        setComentario((feedbackGuardado.comentario || "").replace('[NO LOGRADO] ', ''));
        setDuracionReal(feedbackGuardado.duracionReal || "");
        setSelectedShoe(feedbackGuardado.shoeId || "");
        setRealKm(feedbackGuardado.kmReal || "");
    };

    const handleSubmitFeedback = async (e, isNotAchieved = false) => {
        if (e) e.preventDefault();

        const comentarioFinal = isNotAchieved
            ? `[NO LOGRADO] ${comentario}`
            : (isRestDay ? "Día de descanso completado" : comentario);

        const originalShoeId = feedbackGuardado.shoeId || "";
        const calzadoModificado = selectedShoe !== originalShoeId;

        const feedbackData = {
            trainingId: training._id,
            rpe: isNotAchieved ? 0 : (isRestDay ? 1 : rpe),
            comentario: comentarioFinal,
            duracionReal: (isRestDay || isNotAchieved) ? 0 : Number(Number(duracionReal).toFixed(1)) || 0,
            kmReal: (isRestDay || isStrength || isNotAchieved) ? 0 : Number(Number(kmReal).toFixed(1)) || 0,
            noLogrado: isNotAchieved
        };

        if (isRestDay) {
            feedbackData.shoeId = null;
        } else if (!isCompleted || calzadoModificado) {
            feedbackData.shoeId = selectedShoe;
        }

        const resultado = await updateFeedback(feedbackData);

        if (resultado.success) {
            onClose();
            showLoader();
            window.location.reload();
        } else {
            alert("Error: " + resultado.message);
        }
    };

    const handleDecimalInput = (setter) => (e) => {
        let value = e.target.value;
        if (value && value.includes('.')) {
            const partes = value.split('.');
            if (partes[1].length > 1) {
                value = `${partes[0]}.${partes[1].slice(0, 1)}`;
            }
        }
        setter(value);
    };

    const inputsDisabled = isCompleted && !isEditing;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>

                {/* HEADER REDISEÑADO */}
                <div className={`modal-header ${isCompleted ? (fueNoLogrado ? 'header-failed' : 'header-completed') : 'header-default'}`}>
                    <button className="close-btn" onClick={onClose} aria-label="Cerrar modal">
                        <FaTimes />
                    </button>

                    {/* Contenedor centralizado para el contenido del header */}
                    <div className="header-content-wrapper">
                        <span className="modal-tag">
                            {training.titulo || "Entrenamiento"}
                        </span>

                        <h2 className="modal-main-title">
                            {isCompleted
                                ? (fueNoLogrado ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                        <FaTimesCircle /> No Logrado
                                    </span>
                                ) : (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                        <FaCheck /> ¡Completado!
                                    </span>
                                ))
                                : training.tipo}
                        </h2>

                        <div className="header-meta">
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <FaCalendarAlt /> {training.dia}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="modal-body">

                    {/* STATS RÁPIDOS */}
                    <div className="detail-stats-container">
                        <div className="detail-stat">
                            <span className="detail-stat-label">Duración</span>
                            <span className="detail-stat-value">⏱ {training.duracion} {training.unidad === 'horas' ? 'hs' : 'min'}</span>
                        </div>

                        {!isStrength && (
                            <div className="detail-stat">
                                <span className="detail-stat-label">Distancia Plan</span>
                                <span className="detail-stat-value">📏 {training.km || 0} km</span>
                            </div>
                        )}

                     
                    </div>

                    <div className="workout-structure">
                        <h3>📋 La Misión</h3>
                        <div className="structure-item">
                            <div className={`timeline-dot ${isRestDay ? 'rest' : 'warm'}`}></div>
                            <p className="mission-text">
                                {training.descripcion || "Sin descripción detallada."}
                            </p>
                        </div>
                    </div>

                    <hr className="modal-divider" />

                    <form className="feedback-section" onSubmit={(e) => handleSubmitFeedback(e, false)}>
                        <div className="feedback-header">
                            <h3>{isCompleted && !isEditing ? "📝 Tu Reporte (Lectura)" : "📝 Reporte de sesión"}</h3>
                            {isCompleted && !isEditing && isSemanaActiva && (
                                <button
                                    type="button"
                                    className="edit-report-btn"
                                    onClick={() => setIsEditing(true)}
                                    title="Editar reporte"
                                >
                                    ✏️ Editar
                                </button>
                            )}
                        </div>

                        {!isRestDay ? (
                            <>
                                <div className="inputs-grid">
                                    {!isStrength && (
                                        <div className="input-group">
                                            <label className="input-label">Distancia Real (km)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                onWheel={(e) => e.target.blur()}
                                                placeholder='Km'
                                                value={kmReal}
                                                onChange={handleDecimalInput(setRealKm)}
                                                disabled={inputsDisabled}
                                                className={inputsDisabled ? "inputFormTraining input-disabled" : "inputFormTraining"}
                                                required
                                            />
                                        </div>
                                    )}
                                    <div className="input-group">
                                        <label className="input-label">Duración Real (min)</label>
                                        <input
                                            type="number"
                                            placeholder='Minutos'
                                            step="0.1"
                                            onWheel={(e) => e.target.blur()}
                                            value={duracionReal}
                                            onChange={handleDecimalInput(setDuracionReal)}
                                            disabled={inputsDisabled}
                                            className={inputsDisabled ? "inputFormTraining input-disabled" : "inputFormTraining"}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="input-group" style={{ marginBottom: '20px' }}>
                                    <label className="input-label">Zapatillas Usadas</label>
                                    <select
                                        value={selectedShoe}
                                        onChange={(e) => setSelectedShoe(e.target.value)}
                                        disabled={inputsDisabled}
                                        className={inputsDisabled ? "inputFormTraining input-disabled" : "inputFormTraining"}
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
                                    <label className="input-label" style={{ marginTop: 0 }}>Esfuerzo Percibido (RPE)</label>
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
                                        disabled={inputsDisabled}
                                        className="borg-slider"
                                        style={{ background: `linear-gradient(to right, ${BORG_SCALE[rpe].color} 0%, ${BORG_SCALE[rpe].color} ${(rpe / 10) * 100}%, #333 ${(rpe / 10) * 100}%, #333 100%)` }}
                                    />
                                    <div className="borg-ticks">
                                        <span>0</span><span>5</span><span>10</span>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Comentarios / Sensaciones</label>
                                    <textarea
                                        placeholder="Notas: Me sentí pesado, me dolió la rodilla..."
                                        value={comentario}
                                        onChange={(e) => setComentario(e.target.value)}
                                        disabled={inputsDisabled}
                                        className={inputsDisabled ? "inputFormTraining input-disabled" : "inputFormTraining"}
                                    ></textarea>
                                </div>
                            </>
                        ) : (
                            <div className="rest-day-message">
                                <p>🍃 Hoy toca recargar energías. <br />¡Confirmá tu descanso para completar el día!</p>
                            </div>
                        )}

                        {/* BOTONERA DE ACCIÓN */}
                        <div className="modal-actions-container">
                            {(!isCompleted || isEditing) ? (
                                <>
                                    <button type="submit" className="action-btn btn-primary">
                                        {isEditing ? "ACTUALIZAR SESIÓN" : (isRestDay ? "CONFIRMAR DESCANSO" : "GUARDAR SESIÓN")}
                                    </button>

                                    {!isRestDay && !isEditing && (
                                        <button
                                            type="button"
                                            className="action-btn btn-danger-outline"
                                            onClick={(e) => {
                                                const confirmar = window.confirm("¿Estás seguro que querés marcar este entrenamiento como NO LOGRADO?");
                                                if (confirmar) handleSubmitFeedback(e, true);
                                            }}
                                        >
                                            NO LOGRADO
                                        </button>
                                    )}

                                    {isEditing && (
                                        <button type="button" className="action-btn btn-secondary" onClick={handleCancelEdit}>
                                            CANCELAR
                                        </button>
                                    )}
                                </>
                            ) : (
                                <button type="button" className="action-btn btn-secondary" onClick={onClose}>
                                    CERRAR REPORTE
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TrainingDetail;