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

// 🔥 MODIFICADO: Agregamos una prop opcional `isSemanaActiva` (por defecto true) 
// para que desde el componente padre controles si se puede editar o no.
const TrainingDetail = ({ training, onClose, isSemanaActiva = true }) => {

    const isCompleted = training.completado;
    const feedbackGuardado = training.feedback || {};

    const fueNoLogrado = feedbackGuardado.noLogrado || (feedbackGuardado.comentario && feedbackGuardado.comentario.includes('[NO LOGRADO]'));

    const tipoNormalizado = training.titulo ? training.titulo.toLowerCase() : "";
    const isRestDay = tipoNormalizado === 'descanso';
    const isStrength = tipoNormalizado.includes('fuerza');

    // 🔥 NUEVO: Estado para controlar el modo edición
    const [isEditing, setIsEditing] = useState(false);

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

    // 🔥 NUEVO: Función para cancelar la edición y resetear los valores originales
    const handleCancelEdit = () => {
        setIsEditing(false);
        setRpe(feedbackGuardado.rpe || 5);
        setComentario((feedbackGuardado.comentario || "").replace('[NO LOGRADO] ', ''));
        setDuracionReal(feedbackGuardado.duracionReal || 0);
        setSelectedShoe(feedbackGuardado.shoeId || "");
        setRealKm(feedbackGuardado.kmReal || training.km || 0);
    };

    const handleSubmitFeedback = async (e, isNotAchieved = false) => {
        if (e) e.preventDefault();

        const comentarioFinal = isNotAchieved
            ? `[NO LOGRADO] ${comentario}`
            : (isRestDay ? "Día de descanso completado" : comentario);

        // 🔥 NUEVO: Comparamos el ID original con el que está seleccionado ahora
        const originalShoeId = feedbackGuardado.shoeId || "";
        const calzadoModificado = selectedShoe !== originalShoeId;

        // Armamos la data base sin la propiedad shoeId
        const feedbackData = {
            trainingId: training._id,
            rpe: isNotAchieved ? 0 : (isRestDay ? 1 : rpe),
            comentario: comentarioFinal,
            duracionReal: (isRestDay || isNotAchieved) ? 0 : Number(Number(duracionReal).toFixed(1)) || 0,
            kmReal: (isRestDay || isStrength || isNotAchieved) ? 0 : Number(Number(kmReal).toFixed(1)) || 0,
            noLogrado: isNotAchieved
        };

        // 🔥 LÓGICA DE CALZADO: 
        if (isRestDay) {
            feedbackData.shoeId = null;
        } else if (!isCompleted || calzadoModificado) {
            // Solo enviamos el calzado si es la primera vez que se guarda (!isCompleted)
            // o si estábamos editando y el usuario eligió otra zapatilla.
            feedbackData.shoeId = selectedShoe;
        }
        // Si ya estaba completado y NO modificó el calzado, la propiedad shoeId 
        // simplemente no se envía en el objeto feedbackData.

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

        // Si el texto tiene un punto y más de un dígito después del punto, lo cortamos
        if (value && value.includes('.')) {
            const partes = value.split('.');
            if (partes[1].length > 1) {
                value = `${partes[0]}.${partes[1].slice(0, 1)}`; // Deja solo el primer decimal
            }
        }

        setter(value);
    };

    // 🔥 MODIFICADO: Variable auxiliar para saber si los campos deben estar bloqueados
    const inputsDisabled = isCompleted && !isEditing;




    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>

                <div className={`modal-header ${isCompleted ? (fueNoLogrado ? 'header-failed' : 'header-completed') : ''}`} style={fueNoLogrado ? { background: '#ff4d4d' } : {}}>
                    <button className="close-btn" onClick={onClose}>
                        <span style={{ lineHeight: 0, paddingBottom: '2px' }}>&times;</span>
                    </button>

                    <span className="modal-tag">
                        {training.titulo || "Entrenamiento"}
                    </span>

                    <h2 style={{ textTransform: 'capitalize', textAlign: "center" }}>
                        {isCompleted
                            ? (fueNoLogrado ? "Entrenamiento No Logrado" : "¡Objetivo Completado!")
                            : training.tipo}
                    </h2>

                    <div className="header-meta">
                        <span style={{ textTransform: 'capitalize' }}>📅 {training.dia}</span>
                    </div>
                </div>

                <div className="modal-body">

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

                        {/* 🔥 MODIFICADO: Header del form con botón de edición */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0 }}>
                                {isCompleted && !isEditing ? "📝 Tu Reporte (Solo lectura)" : "📝 Reporte de sesión"}
                            </h3>

                            {/* Mostrar botón de editar solo si está completado, no estamos editando ya, y la semana sigue activa */}
                            {isCompleted && !isEditing && isSemanaActiva && (
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                                    title="Editar reporte"
                                >
                                    ✏️
                                </button>
                            )}
                        </div>

                        {!isRestDay ? (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                    {!isStrength && (
                                        <>
                                            <label className="input-label input-number">Distancia Real (km)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                onWheel={(e) => e.target.blur()}
                                                placeholder='Km'
                                                value={kmReal}
                                                onChange={handleDecimalInput(setRealKm)}
                                                disabled={inputsDisabled}
                                                className={inputsDisabled ? "input-disabled" : "inputFormTraining"}
                                                required
                                            />
                                        </>
                                    )}
                                    <label className="input-label input-number">Duración Real (min)</label>
                                    <input
                                        type="number"
                                        placeholder='Minutos'
                                        step="0.1"
                                        onWheel={(e) => e.target.blur()}
                                        value={duracionReal}
                                        onChange={handleDecimalInput(setDuracionReal)}
                                        disabled={inputsDisabled}
                                        className={inputsDisabled ? "input-disabled" : "inputFormTraining"}
                                        required
                                    />

                                    <label className="input-label">Zapatillas Usadas</label>
                                    <select
                                        value={selectedShoe}
                                        onChange={(e) => setSelectedShoe(e.target.value)}
                                        disabled={inputsDisabled}
                                        className={inputsDisabled ? "input-disabled" : "inputFormTraining"}
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
                                        disabled={inputsDisabled}
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
                                        disabled={inputsDisabled}
                                        className={inputsDisabled ? "input-disabled" : ""}
                                    ></textarea>
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#888', fontStyle: 'italic' }}>
                                <p>🍃 Hoy toca recargar energías. <br />¡Confirmá tu descanso para completar el día!</p>
                            </div>
                        )}

                        {/* 🔥 MODIFICADO: Botones de Acción (Se muestran si NO está completado, o si está en modo EDICIÓN) */}
                        {(!isCompleted || isEditing) && (
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                                <button type="submit" className="action-btn" style={{ flex: 1, minWidth: '150px' }}>
                                    {isEditing ? "ACTUALIZAR SESIÓN" : (isRestDay ? "CONFIRMAR DESCANSO" : "GUARDAR SESIÓN")}
                                </button>

                                {!isRestDay && !isEditing && (
                                    <button
                                        type="button"
                                        className="action-btn"
                                        style={{ flex: 1, minWidth: '150px', background: 'transparent', border: '1px solid #ff4d4d', color: '#ff4d4d' }}
                                        onClick={(e) => {
                                            const confirmar = window.confirm("¿Estás seguro que querés marcar este entrenamiento como NO LOGRADO?");
                                            if (confirmar) handleSubmitFeedback(e, true);
                                        }}
                                    >
                                        NO LOGRADO
                                    </button>
                                )}

                                {/* Botón para cancelar la edición */}
                                {isEditing && (
                                    <button
                                        type="button"
                                        className="action-btn"
                                        style={{ flex: 1, minWidth: '150px', background: '#444', color: '#fff' }}
                                        onClick={handleCancelEdit}
                                    >
                                        CANCELAR
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Botón cerrar genérico (solo visible si está completado y NO se está editando) */}
                        {(isCompleted && !isEditing) && (
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