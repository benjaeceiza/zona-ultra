import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserShoes } from "../../../services/getUserShoes.js";
import { updateFeedback } from "../../../services/updateFeedback.js";
import { getPlanById } from '../../../services/getPlanById.js';
import { useLoader } from '../../../context/LoaderContext.jsx';
import { FaArrowLeft, FaCalendarAlt, FaCheck, FaTimesCircle, FaClock, FaRoute } from 'react-icons/fa';
import './TrainingDetail.css';

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

const TrainingDetail = ({ isSemanaActiva = true }) => {
    const { idPlan, idEntrenamiento } = useParams();
    const navigate = useNavigate();
    const { showLoader } = useLoader();

    const [training, setTraining] = useState(null);
    const [loadingData, setLoadingData] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [rpe, setRpe] = useState(5);
    const [comentario, setComentario] = useState("");
    const [userShoes, setUserShoes] = useState([]);
    const [selectedShoe, setSelectedShoe] = useState("");
    const [duracionReal, setDuracionReal] = useState("");
    const [kmReal, setRealKm] = useState("");

    useEffect(() => {
        const fetchTrainingData = async () => {
            try {
                const res = await getPlanById(idPlan || idEntrenamiento); 
                const plan = res.data || res.plan || res;
                const entrenamientosDeLaSemana = plan.entrenamientos || (Array.isArray(plan) ? plan : []);
                const entrenamientoEspecifico = entrenamientosDeLaSemana.find(t => t._id === idEntrenamiento) || plan;
                setTraining(entrenamientoEspecifico);
            } catch (error) {
                console.error("Error al cargar:", error);
            } finally {
                setLoadingData(false);
            }
        };
        fetchTrainingData();
    }, [idPlan, idEntrenamiento]);

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
        const fetchShoes = async () => {
            if (!training) return;
            const tipo = training.titulo ? training.titulo.toLowerCase() : "";
            if (tipo !== 'descanso') {
                try {
                    const res = await getUserShoes(training.usuario);
                    if (res.data) setUserShoes(Array.isArray(res.data) ? res.data : (res.data.shoes || []));
                } catch (error) { console.error(error) }
            }
        };
        fetchShoes();
    }, [training]);

    if (loadingData) {
        return <div className="ultra-page loading"><p>⏳ Preparando tu sesión...</p></div>;
    }

    if (!training) {
        return (
            <div className="ultra-page loading">
                <h2 style={{ color: '#ff4d4d' }}>¡Ups! Entrenamiento no encontrado 🕵️‍♂️</h2>
                <button className="ultra-btn secondary" onClick={() => navigate(-1)}>Volver</button>
            </div>
        );
    }

    const isCompleted = training.completado;
    const feedbackGuardado = training.feedback || {};
    const fueNoLogrado = feedbackGuardado.noLogrado || (feedbackGuardado.comentario && feedbackGuardado.comentario.includes('[NO LOGRADO]'));
    const isRestDay = training.titulo ? training.titulo.toLowerCase() === 'descanso' : false;
    const isStrength = training.titulo ? training.titulo.toLowerCase().includes('fuerza') : false;
    const inputsDisabled = isCompleted && !isEditing;


    const bannerClass = isCompleted 
        ? (fueNoLogrado ? 'banner-failed' : 'banner-success') 
        : 'banner-pending';

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
        const comentarioFinal = isNotAchieved ? `[NO LOGRADO] ${comentario}` : (isRestDay ? "Día de descanso completado" : comentario);
        const originalShoeId = feedbackGuardado.shoeId || "";
        
        const feedbackData = {
            trainingId: training._id,
            rpe: isNotAchieved ? 0 : (isRestDay ? 1 : rpe),
            comentario: comentarioFinal,
            duracionReal: (isRestDay || isNotAchieved) ? 0 : Number(Number(duracionReal).toFixed(1)) || 0,
            kmReal: (isRestDay || isStrength || isNotAchieved) ? 0 : Number(Number(kmReal).toFixed(1)) || 0,
            noLogrado: isNotAchieved
        };

        if (isRestDay) feedbackData.shoeId = null;
        else if (!isCompleted || selectedShoe !== originalShoeId) feedbackData.shoeId = selectedShoe;

        const resultado = await updateFeedback(feedbackData);
        if (resultado.success) {
            showLoader();
            navigate(-1);
        } else {
            alert("Error: " + resultado.message);
        }
    };

    const handleDecimalInput = (setter) => (e) => {
        let value = e.target.value;
        if (value && value.includes('.')) {
            const partes = value.split('.');
            if (partes[1].length > 1) value = `${partes[0]}.${partes[1].slice(0, 1)}`;
        }
        setter(value);
    };

    return (
        <div className="ultra-page">
            
            <header className={`ultra-banner ${bannerClass}`}>
                <div className="ultra-container">
                    <button className="ultra-back-btn" onClick={() => navigate(-1)}>
                        <FaArrowLeft /> Volver
                    </button>
                    
                    <div className="banner-content">
                        <span className="banner-tag">{training.titulo || "Entrenamiento"}</span>
                        <h1 className="banner-title">
                            {isCompleted
                                ? (fueNoLogrado 
                                    ? <><FaTimesCircle /> No Logrado</> 
                                    : <><FaCheck /> ¡Completado!</>)
                                : <>{training.tipo} {isRestDay ? '🛋️' : '💪'}</>}
                        </h1>
                        <p className="banner-date"><FaCalendarAlt /> {training.dia}</p>
                    </div>
                </div>
            </header>

            <main className="ultra-container ultra-layout">
                
                {/* COLUMNA IZQUIERDA: INFORMACIÓN */}
                <aside className="ultra-sidebar">
                    <section className="info-section">
                        <h3 className="section-title">📊 Detalles del Plan</h3>
                        <div className="minimal-stats">
                            <div className="min-stat">
                                <FaClock className="stat-icon-detail" />
                                <div>
                                    <p className="stat-label-detail">Duración Planificada</p>
                                    <p className="stat-value-detail">{training.duracion} {training.unidad === 'horas' ? 'hs' : 'min'}</p>
                                </div>
                            </div>
                            {!isStrength && (
                                <div className="min-stat">
                                    <FaRoute className="stat-icon-detail" />
                                    <div>
                                        <p className="stat-label-detail">Distancia Objetivo</p>
                                        <p className="stat-value-detail">{training.km || 0} km</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="info-section mission-section">
                        <h3 className="section-title-entrenamiento">🎯 La Misión de Hoy</h3>
                        <div className="mission-box">
                            <p className="mission-text">{training.descripcion || "Sin descripción detallada. ¡Seguí tu instinto! 🐺"}</p>
                        </div>
                    </section>
                </aside>

                {/* COLUMNA DERECHA: REPORTE/FORMULARIO */}
                <article className="ultra-main-form">
                    <div className="form-header">
                        <h2>{isCompleted && !isEditing ? "📖 Tu Reporte" : "✍️ Reporte de Sesión"}</h2>
                        {isCompleted && !isEditing && isSemanaActiva && (
                            <button type="button" className="ultra-btn outline-accent" onClick={() => setIsEditing(true)}>
                                ✏️ Editar
                            </button>
                        )}
                    </div>

                    <form onSubmit={(e) => handleSubmitFeedback(e, false)}>
                        {!isRestDay ? (
                            <div className="form-fields">
                                <div className="input-row">
                                    {!isStrength && (
                                        <div className="ultra-input-group">
                                            <label>📏 Distancia Real (km)</label>
                                            <input
                                                type="number" step="0.1" onWheel={(e) => e.target.blur()}
                                                placeholder="Ej: 10.5" value={kmReal} onChange={handleDecimalInput(setRealKm)}
                                                disabled={inputsDisabled} required
                                            />
                                        </div>
                                    )}
                                    <div className="ultra-input-group">
                                        <label>⏱ Duración Real (min)</label>
                                        <input
                                            type="number" step="0.1" onWheel={(e) => e.target.blur()}
                                            placeholder="Ej: 45" value={duracionReal} onChange={handleDecimalInput(setDuracionReal)}
                                            disabled={inputsDisabled} required
                                        />
                                    </div>
                                </div>

                                <div className="ultra-input-group">
                                    <label>👟 Zapatillas Usadas</label>
                                    <select value={selectedShoe} onChange={(e) => setSelectedShoe(e.target.value)} disabled={inputsDisabled}>
                                        <option value="">Seleccionar equipo...</option>
                                        {userShoes.map(shoe => (
                                            <option key={shoe._id} value={shoe._id}>{shoe.brand} {shoe.model}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="ultra-input-group borg-group">
                                    <label>🫀 Esfuerzo Percibido (RPE)</label>
                                    <div className="borg-header" style={{ color: BORG_SCALE[rpe].color }}>
                                        <span className="borg-number">{rpe}</span>
                                        <span className="borg-label">{BORG_SCALE[rpe].label}</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="10" step="1"
                                        value={rpe} onChange={(e) => setRpe(e.target.value)}
                                        disabled={inputsDisabled} className="borg-slider"
                                        style={{ background: `linear-gradient(to right, ${BORG_SCALE[rpe].color} 0%, ${BORG_SCALE[rpe].color} ${(rpe / 10) * 100}%, #333 ${(rpe / 10) * 100}%, #333 100%)` }}
                                    />
                                    <div className="borg-ticks">
                                        <span>0</span><span>5</span><span>10</span>
                                    </div>
                                </div>

                                <div className="ultra-input-group">
                                    <label>💭 Comentarios y Sensaciones (Opcional)</label>
                                    <textarea
                                        placeholder="¿Cómo te sentiste hoy? Ritmo controlado, piernas pesadas, la pasaste genial..."
                                        value={comentario} onChange={(e) => setComentario(e.target.value)}
                                        disabled={inputsDisabled} rows="4"
                                    ></textarea>
                                </div>
                            </div>
                        ) : (
                            <div className="rest-day-hero">
                                <p>🧉 Hoy toca recargar energías.<br/>El descanso es parte del entrenamiento. ¡Disfrutalo!</p>
                            </div>
                        )}

                        {/* ACCIONES DEL FORMULARIO */}
                        <div className="form-actions">
                            {(!isCompleted || isEditing) ? (
                                <>
                                    <button type="submit" className="ultra-btn primary full-width">
                                        {isEditing ? "💾 Guardar Cambios" : (isRestDay ? "✅ Confirmar Descanso" : "🔥 Guardar Sesión")}
                                    </button>
                                    
                                    <div className="action-row-split">
                                        {!isRestDay && !isEditing && (
                                            <button type="button" className="ultra-btn danger-outline" onClick={(e) => {
                                                if (window.confirm("¿Seguro que no pudiste completarlo? No pasa nada, ¡mañana es otro día! ❤️‍🩹")) handleSubmitFeedback(e, true);
                                            }}>
                                                No Logrado
                                            </button>
                                        )}
                                        {isEditing && (
                                            <button type="button" className="ultra-btn secondary" onClick={handleCancelEdit}>❌ Cancelar</button>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="completed-message">
                                    <FaCheck style={{color: '#0ba360'}} /> <span>Reporte guardado. ¡Gran trabajo! 🚀</span>
                                </div>
                            )}
                        </div>
                    </form>
                </article>
            </main>
        </div>
    );
};

export default TrainingDetail;