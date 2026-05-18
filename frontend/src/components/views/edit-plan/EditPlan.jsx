import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getPlanById } from "../../../services/getPlanById";
import { getUserWithPlan } from "../../../services/getUserPlan";
import { updatePlanService } from "../../../services/updatePlanService";

const DESCRIPCIONES_AUTO = {
    "pasadas aerobicas": "Cambios de ritmo graduales",
    "rodaje suave": "Ritmo cómodo continuo",
    "rodaje largo": "Ritmo suave – medio constante",
    "pasadas anaerobicas": "Cambios de ritmo bruscos",
    "entrenamiento por desnivel": "Subida a ritmo controlado",
    "Entrenamiento pro desnivel-escaleras": "Subida de escaleras a ritmo controlado",
    "ritmo umbral aerobico": "Ritmo exigente pero sostenido",
    "fartlek aerobico en montana": "Cambio de ritmo según el terreno",
    "power hiking": "Caminar Fuerte con bastones o sin ellos",
    "descanso": "Recuperación"
};

const TIPO_MICRO_LABELS = {
    "aerobico": "🔵 Aeróbico",
    "fuerza": "🟠 Fuerza",
    "choque": "🔴 Choque",
    "descarga": "🟢 Descarga",
    "competencia": "🏆 Competencia",
    "hibrido": "🟣 Híbrido"
};

const EditPlan = () => {
    const { idPlan } = useParams();
    const navigate = useNavigate();

    const [planes, setPlanes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [tituloPlan, setTituloPlan] = useState("Cargando...");
    const [macrocicloId, setMacrocicloId] = useState(null);
    const [esPlanCompleto, setEsPlanCompleto] = useState(false);

    const [expandedMicroId, setExpandedMicroId] = useState(idPlan);

    useEffect(() => {
        const fetchTodoElArbol = async () => {
            try {
                const resPlan = await getPlanById(idPlan);
                const planClickeado = resPlan.plan || resPlan.data || resPlan;
                const idUsuario = planClickeado.usuario;

                const macroIdDelPlan = planClickeado.macrociclo ? (planClickeado.macrociclo._id || planClickeado.macrociclo) : null;

                const resUser = await getUserWithPlan(idUsuario);

                if (resUser.user && resUser.user.planes) {
                    let todosLosPlanes = resUser.user.planes;
                    let planesA_Mostrar = [];

                    if (macroIdDelPlan) {
                        planesA_Mostrar = todosLosPlanes.filter(p => {
                            const pMacroId = p.macrociclo ? (p.macrociclo._id || p.macrociclo) : null;
                            return pMacroId && pMacroId.toString() === macroIdDelPlan.toString();
                        });

                        const planPoblado = planesA_Mostrar.find(p => p.macrociclo && p.macrociclo.titulo);
                        setTituloPlan(planPoblado?.macrociclo?.titulo || "Plan de Entrenamiento Completo");
                        setMacrocicloId(macroIdDelPlan);
                        setEsPlanCompleto(true);
                    } else {
                        planesA_Mostrar = todosLosPlanes.filter(p => p._id.toString() === idPlan.toString());
                        setTituloPlan("Semana Individual / Suelta");
                        setMacrocicloId(null);
                        setEsPlanCompleto(false);
                    }

                    planesA_Mostrar.sort((a, b) => a._id.toString().localeCompare(b._id.toString()));
                    setPlanes(planesA_Mostrar);
                }
            } catch (error) {
                toast.error("Error al cargar la vista de edición");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        if (idPlan) fetchTodoElArbol();
    }, [idPlan]);

    const handleChangeTipoMicrociclo = (planId, valor) => {
        setPlanes(prevPlanes => prevPlanes.map(plan => {
            if (plan._id !== planId) return plan;
            return { ...plan, tipoMicrociclo: valor };
        }));
    };

    const handleChange = (planId, dayIndex, campo, valor) => {
        setPlanes(prevPlanes => prevPlanes.map(plan => {
            if (plan._id !== planId) return plan;
            const nuevaSemana = [...plan.entrenamientos];
            nuevaSemana[dayIndex] = { ...nuevaSemana[dayIndex], [campo]: valor };
            if (campo === "titulo") {
                nuevaSemana[dayIndex].tipo = ""; nuevaSemana[dayIndex].km = ""; nuevaSemana[dayIndex].descripcion = "";
                if (valor === "descanso") {
                    nuevaSemana[dayIndex].tipo = "descanso"; nuevaSemana[dayIndex].descripcion = "Recuperación";
                    nuevaSemana[dayIndex].duracion = "0"; nuevaSemana[dayIndex].km = "0";
                }
            }
            return { ...plan, entrenamientos: nuevaSemana };
        }));
    };

    const handleTipoChange = (planId, dayIndex, valor) => {
        setPlanes(prevPlanes => prevPlanes.map(plan => {
            if (plan._id !== planId) return plan;
            const nuevaSemana = [...plan.entrenamientos];
            nuevaSemana[dayIndex].tipo = valor;
            if (DESCRIPCIONES_AUTO[valor]) nuevaSemana[dayIndex].descripcion = DESCRIPCIONES_AUTO[valor];
            return { ...plan, entrenamientos: nuevaSemana };
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const peticionesDeGuardado = planes.map(plan =>
                updatePlanService(plan._id, {
                    entrenamientos: plan.entrenamientos,
                    tipoMicrociclo: plan.tipoMicrociclo
                }, token)
            );
            await Promise.all(peticionesDeGuardado);
            toast.success("✅ ¡Cambios guardados con éxito!");
            navigate(-1);
        } catch (error) {
            console.error(error);
            toast.error("❌ Error al guardar los datos.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteFullPlan = async () => {
        const confirmDelete = window.confirm(`⚠️ Estás por eliminar TODO el plan "${tituloPlan}". Esto borrará todos los mesociclos y microciclos asociados. ¿Estás seguro?`);
        if (!confirmDelete) return;
        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const apiUrl = import.meta.env.VITE_API_URL;
            const res = await fetch(`${apiUrl}/api/plans/admin/macrociclo/${macrocicloId}`, {
                method: 'DELETE',
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("🗑️ Plan completo erradicado.");
                navigate(-1);
            } else {
                toast.error("Error al intentar eliminar el plan. Revisa la ruta en tu backend.");
            }
        } catch (error) {
            console.error(error); toast.error("❌ Error de conexión con el servidor.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSingleWeek = async (idSemana) => {
        const confirmDelete = window.confirm("⚠️ ¿Eliminar esta semana individual?");
        if (!confirmDelete) return;
        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const apiUrl = import.meta.env.VITE_API_URL;
            const res = await fetch(`${apiUrl}/api/plans/admin/${idSemana}`, {
                method: 'DELETE',
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("🗑️ Semana eliminada.");
                navigate(-1);
            } else {
                toast.error("Error al eliminar la semana.");
            }
        } catch (error) {
            console.error(error); toast.error("❌ Error de conexión.");
        } finally {
            setSaving(false);
        }
    };

    // 🔥 LA MAGIA DE LOS COLORES ESTÁ ACÁ
    const getMicroColorInfo = (plan) => {
        // Obtenemos todos los días que tengan título asignado (sacando los vacíos y los días de solo descanso para el cálculo de completado)
        const entrenamientosActivos = plan.entrenamientos.filter(dia => dia.titulo && dia.titulo.trim() !== "" && dia.titulo !== "descanso");
        
        // Pero para saber si está 100% vacía, miramos todos los días (incluso los descansos)
        const estaTotalmenteVacio = plan.entrenamientos.filter(dia => dia.titulo && dia.titulo.trim() !== "").length === 0;

        if (estaTotalmenteVacio) {
            return { bg: "#1a1a1a", border: "#333", text: "#888", tag: "VACÍO" };
        }

        if (plan.estado === 'activo') {
            return { bg: "rgba(0, 210, 190, 0.1)", border: "#00D2BE", text: "#00D2BE", tag: "SEMANA ACTIVA" }; // Celeste de la App
        }

        if (plan.estado === 'pendiente') {
            return { bg: "rgba(241, 196, 15, 0.08)", border: "#f1c40f", text: "#f1c40f", tag: "PENDIENTE" }; // Amarillo
        }

        if (plan.estado === 'finalizado') {
            const totalSesiones = entrenamientosActivos.length;
            const sesionesCompletadas = entrenamientosActivos.filter(e => e.completado).length;

            // Si el alumno marcó como "completado" todas sus sesiones fuertes (sin contar descansos)
            if (totalSesiones === 0 || sesionesCompletadas >= totalSesiones) {
                return { bg: "rgba(46, 204, 113, 0.1)", border: "#2ecc71", text: "#2ecc71", tag: "COMPLETADA" }; // Verde Lindo
            } else {
                return { bg: "rgba(255, 77, 77, 0.08)", border: "#ff4d4d", text: "#ff4d4d", tag: "FINALIZADA INCOMPLETA" }; // Rojo
            }
        }

        return { bg: "#1a1a1a", border: "#333", text: "#888", tag: "SIN ESTADO" };
    };

    const gruposDePlanes = [];
    planes.forEach(plan => {
        const esSuelto = !plan.mesociclo;
        const nombreGrupo = esSuelto ? "Semanales Sueltos" : `📁 ${plan.mesociclo?.titulo || 'Mesociclo'}`;
        let grupo = gruposDePlanes.find(g => g.nombre === nombreGrupo);
        if (!grupo) {
            grupo = { nombre: nombreGrupo, esSuelto: esSuelto, planes: [] };
            gruposDePlanes.push(grupo);
        }
        grupo.planes.push(plan);
    });

    if (loading) return <div className="plan-creator-container"><h2 style={{ color: '#00D2BE', marginTop: '2rem' }}>Cargando datos...</h2></div>;

    return (
        <main className="plan-creator-container">
            <div className="plan-creator-header" style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'flex-start', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div>
                        <h4 style={{ color: '#888', margin: '0 0 5px 0', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                            {esPlanCompleto ? "Editando Plan de Entrenamiento:" : "Editando Semana Suelta:"}
                        </h4>
                        <h1 className="plan-creator-title" style={{ margin: 0, color: '#00D2BE' }}>{tituloPlan}</h1>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="button" className="plan-creator-btn-auto-fill" onClick={() => navigate(-1)}>← Volver</button>

                        {esPlanCompleto && macrocicloId && (
                            <button type="button" onClick={handleDeleteFullPlan} disabled={saving} style={{ background: '#ff4d4d', color: '#fff', border: '1px solid #cc0000', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(255, 77, 77, 0.2)' }}>
                                🗑️ ELIMINAR TODO EL ENTRENAMIENTO
                            </button>
                        )}

                        {!esPlanCompleto && (
                            <button type="button" onClick={() => handleDeleteSingleWeek(idPlan)} disabled={saving} style={{ background: '#ff4d4d', color: '#fff', border: '1px solid #cc0000', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                🗑️ ELIMINAR SEMANA
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="plan-creator-form">
                {gruposDePlanes.map(grupo => (
                    <div key={grupo.nombre} style={{ marginBottom: '30px', marginTop: '20px' }}>
                        {esPlanCompleto && (
                            <h2 style={{ color: '#00D2BE', fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '15px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                                {grupo.nombre}
                            </h2>
                        )}

                        {grupo.planes.map(plan => {
                            const colors = getMicroColorInfo(plan);
                            const tipoLabel = plan.tipoMicrociclo ? TIPO_MICRO_LABELS[plan.tipoMicrociclo] : null;

                            return (
                                <div key={plan._id} style={{ marginBottom: '10px' }}>
                                    <div
                                        onClick={() => setExpandedMicroId(expandedMicroId === plan._id ? null : plan._id)}
                                        style={{
                                            background: colors.bg,
                                            padding: '15px 20px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            border: `1px solid ${expandedMicroId === plan._id ? '#fff' : colors.border}`,
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                {grupo.esSuelto ? 'Semanal' : 'Microciclo'} {plan.numeroSemana}

                                                {tipoLabel && (
                                                    <span style={{ color: '#aaa', fontSize: '0.9rem', marginLeft: '12px', fontWeight: 'normal' }}>
                                                        {tipoLabel}
                                                    </span>
                                                )}
                                            </span>
                                            <span style={{ color: colors.text, fontSize: '0.85rem', fontWeight: 'bold', border: `1px solid ${colors.text}`, padding: '4px 10px', borderRadius: '12px' }}>
                                                {colors.tag}
                                            </span>
                                        </div>
                                        <span style={{ color: colors.text, fontWeight: 'bold' }}>
                                            {expandedMicroId === plan._id ? '▼ Ocultar Formulario' : '▶ Editar Días'}
                                        </span>
                                    </div>

                                    {expandedMicroId === plan._id && (
                                        <div className="plan-creator-days-grid" style={{ padding: '20px 0' }}>

                                            <div style={{ gridColumn: '1 / -1', marginBottom: '15px', padding: '15px', background: 'rgba(0, 210, 190, 0.05)', borderRadius: '8px', borderLeft: '4px solid #00D2BE', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <label style={{ color: '#fff', fontWeight: 'bold' }}>Enfoque de la Semana:</label>
                                                <select
                                                    className="plan-creator-select"
                                                    style={{ margin: 0, width: 'auto', minWidth: '200px' }}
                                                    value={plan.tipoMicrociclo || ""}
                                                    onChange={(e) => handleChangeTipoMicrociclo(plan._id, e.target.value)}
                                                >
                                                    <option value="">⚪ Sin especificar</option>
                                                    <option value="aerobico">🔵 Aeróbico / Acumulación</option>
                                                    <option value="fuerza">🟠 Fuerza / Musculación</option>
                                                    <option value="choque">🔴 Choque / Alta Intensidad</option>
                                                    <option value="descarga">🟢 Descarga / Recuperación</option>
                                                    <option value="competencia">🏆 Competencia (Tapering)</option>
                                                    <option value="hibrido">🟣 Mixto / Híbrido</option>
                                                </select>
                                            </div>

                                            {plan.entrenamientos.map((diaInfo, index) => (
                                                <div key={diaInfo.dia || index} className={`plan-creator-day-card ${diaInfo.tipo === 'descanso' ? 'plan-creator-is-rest' : ''}`}>
                                                    <h3 className="plan-creator-day-title">{diaInfo.dia}</h3>

                                                    <div className="plan-creator-inputs-wrapper">
                                                        <select className="plan-creator-select" value={diaInfo.titulo || ""} onChange={(e) => handleChange(plan._id, index, "titulo", e.target.value)}>
                                                            <option value="">-- Objetivo del Día --</option>
                                                            <option value="entrenamiento aerobico">Aeróbico (Running)</option>
                                                            <option value="entrenamiento de fuerza">Fuerza / Gym</option>
                                                            <option value="descanso">Descanso</option>
                                                        </select>

                                                        {diaInfo.titulo === "entrenamiento aerobico" && (
                                                            <>
                                                                <select className="plan-creator-select" value={diaInfo.tipo || ""} onChange={(e) => handleTipoChange(plan._id, index, e.target.value)}>
                                                                    <option value="">-- Tipo de Ejercicio --</option>
                                                                    <option value="pasadas aerobicas">Pasadas aeróbicas</option>
                                                                    <option value="rodaje suave">Rodaje Suave</option>
                                                                    <option value="rodaje largo">Rodaje Largo</option>
                                                                    <option value="pasadas anaerobicas">Pasadas anaeróbicas</option>
                                                                    <option value="entrenamiento por desnivel">Entrenamiento por desnivel</option>
                                                                    <option value="Entrenamiento pro desnivel-escaleras">Entrenamiento por desnivel - escaleras</option>
                                                                    <option value="ritmo umbral aerobico">Ritmo umbral aeróbico</option>
                                                                    <option value="fartlek aerobico en montana">Fartlek aeróbico en montaña</option>
                                                                    <option value="power hiking">Power Hiking</option>
                                                                </select>
                                                                <input className="plan-creator-input" type="number" placeholder="Distancia (km)" onWheel={(e) => e.target.blur()} value={diaInfo.km || ""} onChange={(e) => handleChange(plan._id, index, "km", e.target.value)} />
                                                            </>
                                                        )}

                                                        {diaInfo.titulo === "entrenamiento de fuerza" && (
                                                            <select className="plan-creator-select" value={diaInfo.tipo || ""} onChange={(e) => handleTipoChange(plan._id, index, e.target.value)}>
                                                                <option value="">-- Rutina de Fuerza --</option>
                                                                <option value="full body">Full body</option>
                                                                <option value="tren superior">Tren superior</option>
                                                                <option value="tren inferior">Tren inferior</option>
                                                                <option value="streching">Stretching</option>
                                                            </select>
                                                        )}

                                                        {diaInfo.titulo !== "descanso" && diaInfo.titulo !== "" && (
                                                            <div className="plan-creator-duration-group">
                                                                <input className="plan-creator-input" type="number" placeholder="Duración" onWheel={(e) => e.target.blur()} value={diaInfo.duracion || ""} onChange={(e) => handleChange(plan._id, index, "duracion", e.target.value)} />
                                                                <div className="plan-creator-toggle-group">
                                                                    <button type="button" className={`plan-creator-toggle-btn ${diaInfo.unidad === "minutos" ? "plan-creator-active" : ""}`} onClick={() => handleChange(plan._id, index, "unidad", "minutos")}>Min</button>
                                                                    <button type="button" className={`plan-creator-toggle-btn ${diaInfo.unidad === "horas" ? "plan-creator-active" : ""}`} onClick={() => handleChange(plan._id, index, "unidad", "horas")}>Hs</button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <textarea className="plan-creator-textarea" placeholder="Instrucciones..." value={diaInfo.descripcion || ""} onChange={(e) => handleChange(plan._id, index, "descripcion", e.target.value)} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}

                <div className="plan-creator-submit-section" style={{ marginTop: '40px', position: 'sticky', bottom: '20px', zIndex: 10 }}>
                    <button type="submit" className="plan-creator-btn-submit" disabled={saving} style={{ boxShadow: '0 10px 30px rgba(0, 210, 190, 0.3)' }}>
                        {saving ? "GUARDANDO..." : "💾 GUARDAR CAMBIOS"}
                    </button>
                </div>
            </form>
        </main>
    );
};

export default EditPlan;