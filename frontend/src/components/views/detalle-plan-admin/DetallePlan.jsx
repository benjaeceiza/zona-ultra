import { useParams, useNavigate, Link } from 'react-router-dom';
import { getUserWithPlan } from '../../../services/getUserPlan';
import { useEffect, useState } from 'react';
import TrainingCard from './TrainingCard';
import { IoIosArrowBack } from 'react-icons/io';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import './DetallePlan.css';

const TIPO_MICRO_LABELS = {
    "carga": "🟠 Carga", "descarga": "🟢 Descarga", "ajuste": "🔵 Ajuste",
    "tapering": "🟣 Tapering", "competicion": "🏆 Competición", "mantenimiento": "🟡 Mantenimiento"
};

// 🔥 FUNCIÓN ESTRICTA DE PORCENTAJE
const calcularPorcentajeReal = (entrenamientos) => {
    if (!entrenamientos || entrenamientos.length === 0) return 0;
    const diasExigidos = entrenamientos.filter(e => e?.titulo && e.titulo.trim().toLowerCase() !== "descanso");
    if (diasExigidos.length === 0) return 0;

    const diasCumplidos = diasExigidos.filter(e => {
        if (!e?.completado) return false;
        const estado = String(e.estado || "").toLowerCase().trim();
        if (estado === "no logrado" || estado === "no_logrado" || estado === "incompleto" || e.logrado === false) return false;
        if (e.feedback) {
            const fbEstado = String(e.feedback.estado || "").toLowerCase().trim();
            const comentario = String(e.feedback.comentario || "").toUpperCase();
            if (fbEstado === "no logrado" || e.feedback.noLogrado || comentario.includes('[NO LOGRADO]')) return false;
        }
        return true;
    });
    return Math.round((diasCumplidos.length / diasExigidos.length) * 100);
};

const DetallePlan = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL;

    const [usuario, setUsuario] = useState(null);
    const [planes, setPlanes] = useState([]);
    const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [gruposDePlanes, setGruposDePlanes] = useState([]);
    const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getUserWithPlan(id);
                if (data.user) {
                    setUsuario(data.user);
                    if (data.user.planes && data.user.planes.length > 0) {
                        const todosLosPlanes = data.user.planes.filter(p => p && p._id);
                        const macrociclosVivosIds = todosLosPlanes.filter(p => p.macrociclo && p.estado !== 'finalizado').map(p => (p.macrociclo._id || p.macrociclo).toString());
                        const planesValidos = todosLosPlanes.filter(p => {
                            if (p.macrociclo) {
                                return macrociclosVivosIds.includes((p.macrociclo._id || p.macrociclo).toString());
                            } else {
                                return p.estado !== 'finalizado';
                            }
                        });
                        const planesOrdenados = planesValidos.sort((a, b) => a._id.toString().localeCompare(b._id.toString()));
                        setPlanes(planesOrdenados);

                        const grupos = [];
                        planesOrdenados.forEach(plan => {
                            const esSuelto = !plan.mesociclo;
                            const nombreGrupo = esSuelto ? "Semanales Sueltos" : `📁 ${plan.mesociclo?.titulo || 'Mesociclo'}`;
                            let grupoExistente = grupos.find(g => g.nombre === nombreGrupo);
                            if (!grupoExistente) {
                                grupoExistente = { nombre: nombreGrupo, esSuelto: esSuelto, planes: [] };
                                grupos.push(grupoExistente);
                            }
                            grupoExistente.planes.push(plan);
                        });
                        grupos.sort((a, b) => {
                            if (a.esSuelto && !b.esSuelto) return -1;
                            if (!a.esSuelto && b.esSuelto) return 1;
                            return 0;
                        });
                        setGruposDePlanes(grupos);

                        if (planesOrdenados.length > 0) {
                            let activeIndex = planesOrdenados.findIndex(p => p.estado === 'activo');
                            if (activeIndex === -1) activeIndex = planesOrdenados.length - 1; 
                            setSelectedPlanIndex(activeIndex);
                            const activePlanId = planesOrdenados[activeIndex]._id;
                            const groupIdx = grupos.findIndex(g => g.planes.some(p => p._id === activePlanId));
                            setSelectedGroupIndex(groupIdx !== -1 ? groupIdx : 0);
                        }
                    }
                }
            } catch (error) { console.error("Error", error); } finally { setLoading(false); }
        };
        if (id) fetchData();
    }, [id]);

    const planDisplay = planes.length > 0 ? planes[selectedPlanIndex] : null;

    const handleDeletePlan = async () => {
        if (!planDisplay) return;
        if (!window.confirm("¿Estás seguro que querés eliminar esta semana completa? Esta acción no se puede deshacer.")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiUrl}/api/plans/admin/${planDisplay._id}`, { method: 'DELETE', headers: { "Authorization": `Bearer ${token}` } });
            if (res.ok) { alert("Eliminado."); window.location.reload(); } 
            else { const errorData = await res.json(); alert("Error: " + errorData.message); }
        } catch (error) { console.error(error); alert("Error de conexión."); }
    };

    const handleGroupChange = (e) => {
        const newGroupIdx = Number(e.target.value);
        setSelectedGroupIndex(newGroupIdx);
        const firstPlanOfGroup = gruposDePlanes[newGroupIdx].planes[0];
        const globalIdx = planes.findIndex(p => p._id === firstPlanOfGroup._id);
        setSelectedPlanIndex(globalIdx);
    };

    const porcentajeCumplimiento = planDisplay ? calcularPorcentajeReal(planDisplay.entrenamientos) : 0;
    const kmPlanificados = Number((planDisplay?.entrenamientos?.reduce((acc, curr) => acc + (curr?.km || 0), 0) || 0).toFixed(2));
    const kmReales = Number((planDisplay?.entrenamientos?.reduce((acc, curr) => acc + (curr?.feedback?.kmReal || 0), 0) || 0).toFixed(2));

    const formatTime = (totalMinutos) => {
        if (!totalMinutos) return "0m";
        const h = Math.floor(totalMinutos / 60);
        const m = Math.round(totalMinutos % 60);
        if (h > 0 && m > 0) return `${h}h ${m}m`;
        if (h > 0) return `${h}h`;
        return `${m}m`;
    };

    // 🔥 CÁLCULO DE ACUMULADO DEL MESOCICLO
    const currentGroup = gruposDePlanes[selectedGroupIndex];
    let mensualKmPlanificados = 0;
    let mensualKmReales = 0;
    let mensualMinutosPlanificados = 0;
    let mensualMinutosReales = 0;

    if (currentGroup) {
        currentGroup.planes.forEach(p => {
            p.entrenamientos?.forEach(e => {
                mensualKmPlanificados += (e?.km || 0);
                mensualKmReales += (e?.feedback?.kmReal || 0);
                const dur = Number(e?.duracion) || 0;
                mensualMinutosPlanificados += (e?.unidad === 'horas' ? dur * 60 : dur);
                mensualMinutosReales += (Number(e?.feedback?.duracionReal) || 0);
            });
        });
        mensualKmPlanificados = Number(mensualKmPlanificados.toFixed(2));
        mensualKmReales = Number(mensualKmReales.toFixed(2));
    }

    if (loading) return <div className="dp-container"><h2 style={{color:'#888', textAlign:'center', marginTop:'50px'}}>Cargando Perfil...</h2></div>;

    return (
        <main className="dp-container">
            <header className="dp-header">
                <button className="dp-back-btn" onClick={() => navigate(-1)}>
                    <IoIosArrowBack /> Volver
                </button>
                <div className="dp-title-group">
                    <span className="dp-label-top">Monitor de Progreso</span>
                    <h1>{usuario?.nombre} {usuario?.apellido}</h1>
                </div>
            </header>

            {gruposDePlanes.length > 0 ? (
                <section className="dp-controls-wrapper">
                    <div>
                        <span className="dp-stat-label" style={{color:'#00D2BE', marginBottom:'10px', display:'block'}}>Fase del Plan</span>
                        <select className="dp-select" value={selectedGroupIndex} onChange={handleGroupChange}>
                            {gruposDePlanes.map((grupo, idx) => (
                                <option key={idx} value={idx}>{grupo.nombre} ({grupo.planes.length} Semanas)</option>
                            ))}
                        </select>
                    </div>

                    {gruposDePlanes[selectedGroupIndex] && (
                        <div className="dp-week-tabs">
                            {gruposDePlanes[selectedGroupIndex].planes.map((plan, index) => {
                                const globalIndex = planes.findIndex(p => p._id === plan._id);
                                const nombreTab = gruposDePlanes[selectedGroupIndex].esSuelto ? `Semanal ${index + 1}` : `Micro ${plan.numeroSemana}`;
                                return (
                                    <button key={plan._id} className={`dp-tab ${selectedPlanIndex === globalIndex ? 'active' : ''}`} onClick={() => setSelectedPlanIndex(globalIndex)}>
                                        {nombreTab} <span style={{color: plan.estado==='activo' ? '#00D2BE' : (plan.estado==='pendiente' ? '#f1c40f' : '#666')}}>●</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>
            ) : (
                <div style={{textAlign:'center', padding:'40px', background:'#1e1e1e', borderRadius:'16px', border:'1px dashed #333'}}>
                    <p style={{color:'#888'}}>Este usuario aún no tiene planes activos.</p>
                </div>
            )}

            {/* 🔥 EL ACUMULADO DEL BLOQUE RESTAURADO */}
            {currentGroup && !currentGroup.esSuelto && (
                <div className="dp-block-acumulado">
                    <div className="dp-ba-left">
                        <span className="dp-ba-icon">📊</span>
                        <div>
                            <h4>Acumulado del Bloque</h4>
                            <p>{currentGroup.nombre}</p>
                        </div>
                    </div>

                    <div className="dp-ba-right">
                        <div className="dp-ba-stat">
                            <small>Volumen (KM)</small>
                            <span>
                                {mensualKmReales} <small className="text-muted">/ {mensualKmPlanificados} km</small>
                            </span>
                        </div>
                        <div className="dp-ba-divider"></div>
                        <div className="dp-ba-stat">
                            <small>Tiempo Total</small>
                            <span className="text-yellow">
                                {formatTime(mensualMinutosReales)} <small className="text-muted">/ {formatTime(mensualMinutosPlanificados)}</small>
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {planDisplay && (
                <>
                    {/* ACCIONES Y ENFOQUE */}
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:'10px'}}>
                        <div>
                            {planDisplay.tipoMicrociclo && TIPO_MICRO_LABELS[planDisplay.tipoMicrociclo] && (
                                <span style={{background:'rgba(255,255,255,0.05)', padding:'8px 16px', borderRadius:'20px', fontSize:'0.85rem', fontWeight:'800', border:'1px solid #333'}}>
                                    ENFOQUE: <span style={{color:'#00D2BE'}}>{TIPO_MICRO_LABELS[planDisplay.tipoMicrociclo]}</span>
                                </span>
                            )}
                        </div>
                        <div style={{display:'flex', gap:'10px'}}>
                            <Link to={`/editar-plan/${planDisplay._id}`} className="dp-back-btn" style={{color:'#00D2BE', borderColor:'#00D2BE'}}>
                                <FiEdit /> Editar Plan
                            </Link>
                            {!planDisplay.mesociclo && (
                                <button onClick={handleDeletePlan} className="dp-back-btn" style={{color:'#ff4d4d', borderColor:'#ff4d4d'}} title="Eliminar Semana">
                                    <FiTrash2 />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* STATS RÁPIDOS */}
                    <section className="dp-stats-grid">
                        <div className="dp-stat-card" style={{borderTopColor: porcentajeCumplimiento >= 80 ? '#00D2BE' : '#ff4d4d'}}>
                            <span className="dp-stat-label">Cumplimiento</span>
                            <span className="dp-stat-value" style={{color: porcentajeCumplimiento >= 80 ? '#00D2BE' : '#ff4d4d'}}>{porcentajeCumplimiento}%</span>
                        </div>
                        <div className="dp-stat-card" style={{borderTopColor:'#555'}}>
                            <span className="dp-stat-label">KM Planificados</span>
                            <span className="dp-stat-value">{kmPlanificados} <small>km</small></span>
                        </div>
                        <div className="dp-stat-card" style={{borderTopColor:'#FF4500'}}>
                            <span className="dp-stat-label">KM Reales</span>
                            <span className="dp-stat-value" style={{color:'#FF4500'}}>{kmReales} <small>km</small></span>
                        </div>
                        <div className="dp-stat-card" style={{borderTopColor:'#f1c40f'}}>
                            <span className="dp-stat-label" style={{color:'#f1c40f'}}>Próximo Objetivo</span>
                            <span className="dp-stat-value" style={{fontSize:'1.2rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                                {usuario?.nextRace?.name || "Sin objetivo"}
                            </span>
                        </div>
                    </section>

                    {/* ACORDEÓN DE DÍAS CON SALVAVIDAS */}
                    <section className="dp-cards-layout">
                        {planDisplay.entrenamientos?.length > 0 ? (
                            planDisplay.entrenamientos.map((entrenamiento, index) => (
                                entrenamiento ? (
                                    <TrainingCard key={entrenamiento._id || index} entrenamiento={entrenamiento} />
                                ) : null
                            ))
                        ) : (
                            <p style={{textAlign:'center', color:'#888', padding:'40px', background:'#1e1e1e', borderRadius:'16px'}}>No hay entrenamientos cargados.</p>
                        )}
                    </section>
                </>
            )}
        </main>
    );
};

export default DetallePlan;