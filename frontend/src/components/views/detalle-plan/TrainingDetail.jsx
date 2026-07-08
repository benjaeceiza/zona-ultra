import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserShoes } from "../../../services/getUserShoes.js";
import { updateFeedback } from "../../../services/updateFeedback.js";
import { getPlanById } from '../../../services/getPlanById.js';
import { useLoader } from '../../../context/LoaderContext.jsx';
// 🔥 Importamos Lucide Icons (Chao react-icons y emojis)
import { ArrowLeft, Calendar, CheckCircle2, XCircle, Clock, Route, AlertTriangle, Footprints, HeartPulse, MessageSquare, Activity, Check, Edit2, Save, X, Coffee } from 'lucide-react';
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

// Función de validación de lógica de negocio (Se mantiene intacta)
const validarLogicaEntrenamiento = (distanciaKm, horas, minutos, isStrength) => {
    const errores = [];
    const h = Number(horas) || 0;
    const m = Number(minutos) || 0;
    const km = Number(distanciaKm) || 0;
    const tiempoTotalMinutos = (h * 60) + m;

    if (tiempoTotalMinutos <= 0) {
        errores.push("El tiempo total de entrenamiento no puede ser cero.");
    }
    if (h < 0 || m < 0 || km < 0) {
        errores.push("No se permiten números negativos.");
    }
    if (m > 59) {
        errores.push("Los minutos no pueden superar el valor 59. (Ejemplo: para 1h 20m, poné 1 en horas y 20 en minutos).");
    }
    if (h > 48) {
        errores.push("¿200 horas de fondo? 🐺 El límite máximo por sesión es de 48 horas. Verificá no haber puesto los minutos en el campo de horas.");
    }

    if (!isStrength) {
        if (km > 160) {
            errores.push("Estás registrando más de 160 km. Verificá la distancia ingresada.");
        }
        if (h >= 10 && km < 30 && km > 0) {
            errores.push("El tiempo parece muy alto para esa distancia. ¿Pusiste los minutos totales en el campo de horas?");
        }
        if (km > 0 && tiempoTotalMinutos > 0) {
            const ritmo = tiempoTotalMinutos / km;
            if (ritmo < 2.5) {
                errores.push("Ritmo irreal detectado (menos de 2:30 min/km). ¿Invertiste los kilómetros con el tiempo?");
            }
            if (ritmo > 40) {
                errores.push("Ritmo detectado mayor a 40 min/km. ¿Seguro que los kilómetros y el tiempo están bien cargados?");
            }
        }
    }
    return errores;
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

    const [horas, setHoras] = useState("");
    const [minutos, setMinutos] = useState("");
    const [kmReal, setRealKm] = useState("");
    const [erroresGuardado, setErroresGuardado] = useState([]);

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

            const duracionTotal = feedback.duracionReal || 0;
            if (duracionTotal > 0) {
                setHoras(Math.floor(duracionTotal / 60).toString());
                setMinutos((duracionTotal % 60).toString());
            } else {
                setHoras("");
                setMinutos("");
            }

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
                <h2 style={{ color: '#ff4d4d' }}>¡Ups! Entrenamiento no encontrado <AlertTriangle size={24} /></h2>
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
        setErroresGuardado([]);
        setRpe(feedbackGuardado.rpe || 5);
        setComentario((feedbackGuardado.comentario || "").replace('[NO LOGRADO] ', ''));

        const duracionTotal = feedbackGuardado.duracionReal || 0;
        setHoras(duracionTotal > 0 ? Math.floor(duracionTotal / 60).toString() : "");
        setMinutos(duracionTotal > 0 ? (duracionTotal % 60).toString() : "");

        setSelectedShoe(feedbackGuardado.shoeId || "");
        setRealKm(feedbackGuardado.kmReal || "");
    };

    const handleSubmitFeedback = async (e, isNotAchieved = false) => {
        if (e) e.preventDefault();
        setErroresGuardado([]);

        const h = Number(horas) || 0;
        const m = Number(minutos) || 0;
        const duracionRealTotal = (h * 60) + m;
        const km = Number(kmReal) || 0;

        if (!isRestDay && !isNotAchieved) {
            const alertas = validarLogicaEntrenamiento(km, h, m, isStrength);
            if (alertas.length > 0) {
                setErroresGuardado(alertas);
                return; 
            }
        }

        const comentarioFinal = isNotAchieved ? `[NO LOGRADO] ${comentario}` : (isRestDay ? "Día de descanso completado" : comentario);
        const originalShoeId = feedbackGuardado.shoeId || "";

        const feedbackData = {
            trainingId: training._id,
            rpe: isNotAchieved ? 0 : (isRestDay ? 1 : rpe),
            comentario: comentarioFinal,
            duracionReal: (isRestDay || isNotAchieved) ? 0 : duracionRealTotal,
            kmReal: (isRestDay || isStrength || isNotAchieved) ? 0 : Number(km.toFixed(1)) || 0,
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

    const handleKeyDownNumeric = (e) => {
        if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
    };

    const handleIntegerInput = (setter, maxLimit = 999) => (e) => {
        let value = e.target.value;
        if (value === "") { setter(""); return; }
        value = value.replace(/[^0-9]/g, '');
        if (value !== "") {
            let num = parseInt(value, 10);
            if (num < 0) num = 0;
            if (num > maxLimit) num = maxLimit;
            setter(num.toString());
        } else { setter(""); }
    };

    const handleDecimalInput = (setter, maxLimit = 160) => (e) => {
        let value = e.target.value;
        if (value === "") { setter(""); return; }
        value = value.replace(/[^0-9.]/g, '');
        const parts = value.split('.');
        if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
        if (value.includes('.')) {
            const partes = value.split('.');
            if (partes[1].length > 1) value = `${partes[0]}.${partes[1].slice(0, 1)}`;
        }
        if (Number(value) > maxLimit) value = maxLimit.toString();
        setter(value);
    };

    return (
        <div className="ultra-page">
            <header className={`ultra-banner ${bannerClass}`}>
                <div className="ultra-container">
                    <button className="ultra-back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} /> Volver
                    </button>

                    <div className="banner-content">
                        <span className="banner-tag">{training.titulo || "Entrenamiento"}</span>
                        <h1 className="banner-title">
                            {isCompleted
                                ? (fueNoLogrado
                                    ? <><XCircle size={40} /> No Logrado</>
                                    : <><CheckCircle2 size={40} /> ¡Completado!</>)
                                : <>{training.tipo} {isRestDay ? <Coffee size={36} /> : <Activity size={36} />}</>}
                        </h1>
                        <p className="banner-date"><Calendar size={18} /> {training.dia}</p>
                    </div>
                </div>
            </header>

            <main className="ultra-container ultra-layout">
                {/* COLUMNA IZQUIERDA: INFORMACIÓN */}
                <aside className="ultra-sidebar">
                    <div className="premium-card info-section">
                        <h3 className="section-title-entrenamiento">Detalles del Plan</h3>
                        <div className="minimal-stats">
                            <div className="min-stat">
                                <div className="stat-icon-wrapper">
                                    <Clock size={28} />
                                </div>
                                <div>
                                    <p className="stat-label-detail">Duración Planificada</p>
                                    <p className="stat-value-detail">{training.duracion} {training.unidad === 'horas' ? 'hs' : 'min'}</p>
                                </div>
                            </div>
                            {!isStrength && (
                                <div className="min-stat">
                                    <div className="stat-icon-wrapper">
                                        <Route size={28} />
                                    </div>
                                    <div>
                                        <p className="stat-label-detail">Distancia Objetivo</p>
                                        <p className="stat-value-detail">{training.km || 0} km</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="premium-card mission-section">
                        <h3 className="section-title-entrenamiento">La Misión de Hoy</h3>
                        <div className="mission-box">
                            <p className="mission-text">{training.descripcion || "Sin descripción detallada. ¡Seguí tu instinto! 🐺"}</p>
                        </div>
                    </div>
                </aside>

                {/* COLUMNA DERECHA: REPORTE/FORMULARIO */}
                <article className="premium-card ultra-main-form">
                    <div className="form-header">
                        <h2>{isCompleted && !isEditing ? "Tu Reporte" : "Reporte de Sesión"}</h2>
                        {isCompleted && !isEditing && isSemanaActiva && (
                            <button type="button" className="ultra-btn outline-accent" onClick={() => setIsEditing(true)}>
                                <Edit2 size={14} /> Editar
                            </button>
                        )}
                    </div>

                    <form onSubmit={(e) => handleSubmitFeedback(e, false)}>
                        {!isRestDay ? (
                            <div className="form-fields">
                                <div className="input-row">
                                    {!isStrength && (
                                        <div className="ultra-input-group">
                                            <label><Route size={16} /> Distancia Real (km)</label>
                                            <div className="input-wrapper">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="160"
                                                    onWheel={(e) => e.target.blur()}
                                                    onKeyDown={handleKeyDownNumeric}
                                                    placeholder="Ej: 10.5"
                                                    value={kmReal}
                                                    onChange={handleDecimalInput(setRealKm, 160)}
                                                    disabled={inputsDisabled}
                                                    required
                                                />
                                                <span className="input-unit">km</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="ultra-input-group">
                                        <label><Clock size={16} /> Duración Real</label>
                                        <div className="time-inputs-container">
                                            <div className="input-wrapper">
                                                <input
                                                    type="number"
                                                    step="1"
                                                    min="0"
                                                    max="48"
                                                    onWheel={(e) => e.target.blur()}
                                                    onKeyDown={handleKeyDownNumeric}
                                                    placeholder="0"
                                                    value={horas}
                                                    onChange={handleIntegerInput(setHoras, 48)}
                                                    disabled={inputsDisabled}
                                                    required={!isStrength}
                                                />
                                                <span className="input-unit">hs</span>
                                            </div>
                                            <div className="input-wrapper">
                                                <input
                                                    type="number"
                                                    step="1"
                                                    min="0"
                                                    max="59"
                                                    onWheel={(e) => e.target.blur()}
                                                    onKeyDown={handleKeyDownNumeric}
                                                    placeholder="0"
                                                    value={minutos}
                                                    onChange={handleIntegerInput(setMinutos, 59)}
                                                    disabled={inputsDisabled}
                                                    required
                                                />
                                                <span className="input-unit">min</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="ultra-input-group">
                                    <label><Footprints size={16} /> Zapatillas Usadas</label>
                                    <select value={selectedShoe} onChange={(e) => setSelectedShoe(e.target.value)} disabled={inputsDisabled} className="premium-select">
                                        <option value="">Seleccionar equipo...</option>
                                        {userShoes.map(shoe => (
                                            <option key={shoe._id} value={shoe._id}>{shoe.brand} {shoe.model}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="ultra-input-group borg-group">
                                    <label><HeartPulse size={16} /> Esfuerzo Percibido (RPE)</label>
                                    <div className="borg-header" style={{ color: BORG_SCALE[rpe].color }}>
                                        <span className="borg-number">{rpe}</span>
                                        <span className="borg-label">{BORG_SCALE[rpe].label}</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="10" step="1"
                                        value={rpe} onChange={(e) => setRpe(e.target.value)}
                                        disabled={inputsDisabled} className="borg-slider"
                                        style={{ background: `linear-gradient(to right, ${BORG_SCALE[rpe].color} 0%, ${BORG_SCALE[rpe].color} ${(rpe / 10) * 100}%, #2a2a2a ${(rpe / 10) * 100}%, #2a2a2a 100%)` }}
                                    />
                                    <div className="borg-ticks">
                                        <span>0 (Nada)</span>
                                        <span>5 (Moderado)</span>
                                        <span>10 (Máximo)</span>
                                    </div>
                                </div>

                                <div className="ultra-input-group">
                                    <label><MessageSquare size={16} /> Comentarios y Sensaciones</label>
                                    <textarea
                                        placeholder="¿Cómo te sentiste hoy? Ritmo controlado, piernas pesadas..."
                                        value={comentario} onChange={(e) => setComentario(e.target.value)}
                                        disabled={inputsDisabled} rows="4"
                                        className="premium-textarea"
                                    ></textarea>
                                </div>
                            </div>
                        ) : (
                            <div className="rest-day-hero">
                                <Coffee size={48} className="rest-icon" />
                                <h3>Hoy toca recargar energías</h3>
                                <p>El descanso es parte vital del entrenamiento. ¡Disfrutalo!</p>
                            </div>
                        )}

                        {erroresGuardado.length > 0 && (
                            <div className="error-alert-box">
                                <div className="error-alert-header">
                                    <AlertTriangle size={20} />
                                    <span>Hay datos que no cuadran:</span>
                                </div>
                                <ul>
                                    {erroresGuardado.map((err, idx) => <li key={idx}>{err}</li>)}
                                </ul>
                            </div>
                        )}

                        <div className="form-actions">
                            {(!isCompleted || isEditing) ? (
                                <>
                                    <button type="submit" className="ultra-btn primary full-width">
                                        {isEditing ? <><Save size={18}/> Guardar Cambios</> : (isRestDay ? <><Check size={18}/> Confirmar Descanso</> : <><CheckCircle2 size={18}/> Guardar Sesión</>)}
                                    </button>

                                    <div className="action-row-split">
                                        {!isRestDay && !isEditing && (
                                            <button type="button" className="ultra-btn danger-outline" onClick={(e) => {
                                                if (window.confirm("¿Seguro que no pudiste completarlo? No pasa nada, ¡mañana es otro día! ❤️‍🩹")) handleSubmitFeedback(e, true);
                                            }}>
                                                <X size={18} /> No Logrado
                                            </button>
                                        )}
                                        {isEditing && (
                                            <button type="button" className="ultra-btn secondary" onClick={handleCancelEdit}>
                                                <X size={18} /> Cancelar
                                            </button>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="completed-message">
                                    <CheckCircle2 size={24} color="#0ba360" /> 
                                    <span>Reporte guardado con éxito.</span>
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