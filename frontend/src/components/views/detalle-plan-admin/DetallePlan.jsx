import { useParams, useNavigate, Link } from 'react-router-dom';
import { getUserWithPlan } from '../../../services/getUserPlan';
import { useEffect, useState } from 'react';
import TrainingCard from './TrainingCard';
import { IoIosArrowBack } from 'react-icons/io';

// 🔥 Diccionario para mostrar el Enfoque
const TIPO_MICRO_LABELS = {
    "carga": "🟠 Carga",
    "descarga": "🟢 Descarga",
    "ajuste": "🔵 Ajuste",
    "tapering": "🟣 Tapering",
    "competicion": "🏆 Competición",
    "mantenimiento": "🟡 Mantenimiento"
};

// 🔥 FUNCIÓN ESTRICTA DEFINITIVA (Sincronizada con el perfil del usuario)
const calcularPorcentajeReal = (entrenamientos) => {
    if (!entrenamientos || entrenamientos.length === 0) return 0;

    const diasExigidos = entrenamientos.filter(e =>
        e.titulo && e.titulo.trim().toLowerCase() !== "descanso"
    );

    if (diasExigidos.length === 0) return 0;

    const diasCumplidos = diasExigidos.filter(e => {
        if (!e.completado) return false;

        const estado = String(e.estado || "").toLowerCase().trim();
        if (estado === "no logrado" || estado === "no_logrado" || estado === "incompleto" || e.logrado === false) {
            return false;
        }

        if (e.feedback) {
            const fbEstado = String(e.feedback.estado || "").toLowerCase().trim();
            const comentario = String(e.feedback.comentario || "").toUpperCase();

            if (fbEstado === "no logrado" || e.feedback.noLogrado || comentario.includes('[NO LOGRADO]')) {
                return false;
            }
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

                        const macrociclosVivosIds = todosLosPlanes
                            .filter(p => p.macrociclo && p.estado !== 'finalizado')
                            .map(p => (p.macrociclo._id || p.macrociclo).toString());

                        const planesValidos = todosLosPlanes.filter(p => {
                            if (p.macrociclo) {
                                const macroId = (p.macrociclo._id || p.macrociclo).toString();
                                return macrociclosVivosIds.includes(macroId);
                            } else {
                                return p.estado !== 'finalizado';
                            }
                        });

                        const planesOrdenados = planesValidos.sort((a, b) =>
                            a._id.toString().localeCompare(b._id.toString())
                        );

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
                            if (activeIndex === -1) {
                                activeIndex = planesOrdenados.length - 1; 
                            }
                            setSelectedPlanIndex(activeIndex);

                            const activePlanId = planesOrdenados[activeIndex]._id;
                            const groupIdx = grupos.findIndex(g => g.planes.some(p => p._id === activePlanId));
                            setSelectedGroupIndex(groupIdx !== -1 ? groupIdx : 0);
                        }
                    }
                }
            } catch (error) {
                console.error("Error cargando plan", error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchData();
    }, [id]);

    const planDisplay = planes.length > 0 ? planes[selectedPlanIndex] : null;

    const handleDeletePlan = async () => {
        if (!planDisplay) return;

        const confirmDelete = window.confirm("¿Estás seguro que querés eliminar esta semana completa? Esta acción no se puede deshacer.");
        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiUrl}/api/plans/admin/${planDisplay._id}`, {
                method: 'DELETE',
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                alert("Eliminado correctamente.");
                window.location.reload();
            } else {
                const errorData = await res.json();
                alert("Error al eliminar: " + errorData.message);
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión al servidor.");
        }
    };

    const handleGroupChange = (e) => {
        const newGroupIdx = Number(e.target.value);
        setSelectedGroupIndex(newGroupIdx);

        const firstPlanOfGroup = gruposDePlanes[newGroupIdx].planes[0];
        const globalIdx = planes.findIndex(p => p._id === firstPlanOfGroup._id);
        setSelectedPlanIndex(globalIdx);
    };

    // 🔥 USAMOS LA FUNCIÓN ESTRICTA PARA EL PORCENTAJE
    const porcentajeCumplimiento = planDisplay ? calcularPorcentajeReal(planDisplay.entrenamientos) : 0;
    
    // Solo para mostrar el texto "X/Y Sesiones" en la tarjeta
    const totalSesiones = planDisplay?.entrenamientos?.filter(e => e.titulo && e.titulo.trim().toLowerCase() !== "descanso").length || 0;
    const sesionesCompletadas = planDisplay?.entrenamientos?.filter(e => e.completado && e.titulo && e.titulo.trim().toLowerCase() !== "descanso").length || 0;

    // 🔥 FIX DECIMALES SEMANALES
    const kmPlanificados = Number((planDisplay?.entrenamientos?.reduce((acc, curr) => acc + (curr.km || 0), 0) || 0).toFixed(2));
    const kmReales = Number((planDisplay?.entrenamientos?.reduce((acc, curr) => acc + (curr.feedback?.kmReal || 0), 0) || 0).toFixed(2));

    const formatTime = (totalMinutos) => {
        if (!totalMinutos) return "0m";
        const h = Math.floor(totalMinutos / 60);
        const m = Math.round(totalMinutos % 60);
        if (h > 0 && m > 0) return `${h}h ${m}m`;
        if (h > 0) return `${h}h`;
        return `${m}m`;
    };

    // 🔥 FIX DECIMALES MENSUALES (Acumulado)
    const currentGroup = gruposDePlanes[selectedGroupIndex];
    let mensualKmPlanificados = 0;
    let mensualKmReales = 0;
    let mensualMinutosPlanificados = 0;
    let mensualMinutosReales = 0;

    if (currentGroup) {
        currentGroup.planes.forEach(p => {
            p.entrenamientos?.forEach(e => {
                mensualKmPlanificados += (e.km || 0);
                mensualKmReales += (e.feedback?.kmReal || 0);

                const dur = Number(e.duracion) || 0;
                mensualMinutosPlanificados += (e.unidad === 'horas' ? dur * 60 : dur);
                mensualMinutosReales += (Number(e.feedback?.duracionReal) || 0);
            });
        });
        
        // Limpiamos los resultados finales del mes
        mensualKmPlanificados = Number(mensualKmPlanificados.toFixed(2));
        mensualKmReales = Number(mensualKmReales.toFixed(2));
    }

    if (loading) return <div className="detail-loading">Cargando atleta...</div>;

    return (
        <div className="detail-container">

            <header className="detail-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <IoIosArrowBack /> Volver
                </button>

                <div className="user-info-block">
                    <div>
                        <span className="label-top">Monitor de Progreso</span>
                        <h1 className="user-name">{usuario?.nombre} {usuario?.apellido}</h1>
                    </div>
                </div>
            </header>
            
            {planDisplay?.macrociclo && (
                <div style={{
                    background: 'linear-gradient(90deg, #1a1a1a 0%, #111 100%)',
                    padding: '15px 20px',
                    borderRadius: '10px',
                    border: '1px solid #333',
                    borderLeft: '4px solid #f1c40f',
                    marginBottom: '20px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                }}>
                    <h3 style={{ margin: 0, color: '#f1c40f', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🏆 {planDisplay.macrociclo.titulo || "Plan de Entrenamiento General"}
                    </h3>
                    {planDisplay.macrociclo.objetivo && (
                        <p style={{ margin: '8px 0 0 0', color: '#ccc', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            🎯 <strong style={{ color: '#888' }}>Objetivo:</strong> {planDisplay.macrociclo.objetivo}
                        </p>
                    )}
                </div>
            )}

            {gruposDePlanes.length > 0 ? (
                <div className="week-selector-container" style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                            Fase del Plan:
                        </label>
                        <select
                            value={selectedGroupIndex}
                            onChange={handleGroupChange}
                            style={{
                                background: '#111', color: '#00D2BE', border: '1px solid #333',
                                padding: '12px 15px', borderRadius: '8px', fontSize: '1.1rem',
                                fontWeight: 'bold', cursor: 'pointer', outline: 'none'
                            }}
                        >
                            {gruposDePlanes.map((grupo, idx) => (
                                <option key={idx} value={idx}>
                                    {grupo.nombre} ({grupo.planes.length} Semanas)
                                </option>
                            ))}
                        </select>
                    </div>

                    {gruposDePlanes[selectedGroupIndex] && (
                        <div className="week-tabs" style={{ marginTop: '10px' }}>
                            {gruposDePlanes[selectedGroupIndex].planes.map((plan, index) => {
                                const globalIndex = planes.findIndex(p => p._id === plan._id);

                                const nombreTab = gruposDePlanes[selectedGroupIndex].esSuelto
                                    ? `Semanal ${index + 1}`
                                    : `Micro ${plan.numeroSemana}`;

                                return (
                                    <button
                                        key={plan._id}
                                        className={`week-tab ${selectedPlanIndex === globalIndex ? 'active' : ''} ${plan.estado}`}
                                        onClick={() => setSelectedPlanIndex(globalIndex)}
                                    >
                                        <span className="week-num">{nombreTab}</span>
                                        <span className={`status-dot ${plan.estado}`}></span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <div className="no-plans-alert" style={{ marginTop: '20px', textAlign: 'center', color: '#888' }}>
                    <p>No hay planes cargados para este usuario.</p>
                    <Link to={`/crear-plan/${id}`} className="link-create" style={{ color: '#00D2BE', fontWeight: 'bold' }}>
                        + Asignar / Editar Plan
                    </Link>
                </div>
            )}

            {currentGroup && !currentGroup.esSuelto && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(0, 210, 190, 0.08) 0%, rgba(0, 0, 0, 0.2) 100%)',
                    border: '1px solid rgba(0, 210, 190, 0.2)',
                    borderRadius: '10px',
                    padding: '15px 20px',
                    marginTop: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '15px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '2rem' }}>📊</span>
                        <div>
                            <h4 style={{ color: '#00D2BE', margin: '0 0 5px 0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Acumulado del Bloque
                            </h4>
                            <p style={{ margin: 0, color: '#aaa', fontSize: '0.8rem' }}>
                                {currentGroup.nombre}
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ display: 'block', color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Volumen (KM)</span>
                            <span style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 'bold' }}>
                                {mensualKmReales} <small style={{ color: '#555', fontSize: '1rem' }}>/ {mensualKmPlanificados} km</small>
                            </span>
                        </div>
                        <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }}></div>
                        <div style={{ textAlign: 'left' }}>
                            <span style={{ display: 'block', color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Tiempo Total</span>
                            <span style={{ color: '#f1c40f', fontSize: '1.4rem', fontWeight: 'bold' }}>
                                {formatTime(mensualMinutosReales)} <small style={{ color: '#555', fontSize: '1rem' }}>/ {formatTime(mensualMinutosPlanificados)}</small>
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {planDisplay && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', marginBottom: '15px' }}>
                        <div>
                            {planDisplay.tipoMicrociclo && TIPO_MICRO_LABELS[planDisplay.tipoMicrociclo] && (
                                <div style={{ background: '#1a1a1a', padding: '8px 15px', borderRadius: '20px', border: '1px solid #333', color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                    Enfoque: <span style={{ color: '#00D2BE' }}>{TIPO_MICRO_LABELS[planDisplay.tipoMicrociclo]}</span>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Link
                                to={`/editar-plan/${planDisplay._id}`}
                                className="plan-creator-btn-submit"
                                style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#029183', color: 'white', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}
                            >
                                👁️ {planDisplay.mesociclo ? 'Ver / Editar Plan' : 'Ver / Editar Semana'}
                            </Link>

                            {!planDisplay.mesociclo && (
                                <button
                                    onClick={handleDeletePlan}
                                    className="plan-creator-btn-submit"
                                    style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                                    title="Eliminar Semana Suelta"
                                >
                                    🗑️
                                </button>
                            )}
                        </div>
                    </div>

                    <section className="stats-dashboard">
                        <div className="stat-widget">
                            <span className="stat-title">Cumplimiento</span>
                            <div className="stat-content">
                                <span className={`stat-number ${porcentajeCumplimiento >= 80 ? 'good' : 'bad'}`}>
                                    {porcentajeCumplimiento}%
                                </span>
                                <span className="stat-sub">{sesionesCompletadas}/{totalSesiones} Sesiones</span>
                            </div>
                        </div>

                        <div className="stat-widget">
                            <span className="stat-title">KM Planificados</span>
                            <div className="stat-content">
                                <span className="stat-number">{kmPlanificados} <small>km</small></span>
                            </div>
                        </div>

                        <div className="stat-widget highlight">
                            <span className="stat-title">KM Reales</span>
                            <div className="stat-content">
                                <span className="stat-number">{kmReales} <small>km</small></span>
                                {kmReales > 0 && (
                                    <span className={`stat-delta ${kmReales >= kmPlanificados ? 'positive' : 'negative'}`}>
                                        {kmReales >= kmPlanificados ? '🔥' : '▼'}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="stat-widget" style={{ borderLeft: '4px solid #f1c40f', background: 'rgba(241, 196, 15, 0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <span className="stat-title" style={{ color: '#f1c40f' }}>Próximo Objetivo 🎯</span>
                            <div className="stat-content" style={{ marginTop: '5px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {usuario?.nextRace?.name ? (
                                    <>
                                        <span className="stat-number" style={{ fontSize: '1.1rem', color: '#fff', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>
                                            {usuario.nextRace.name}
                                        </span>
                                        <span className="stat-sub" style={{ fontSize: '0.85rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            📅 {
                                                usuario.nextRace.date
                                                    ? new Date(usuario.nextRace.date.split('T')[0] + "T12:00:00").toLocaleDateString('es-AR', {
                                                        day: '2-digit', month: '2-digit', year: 'numeric'
                                                    })
                                                    : "Fecha sin definir"
                                            }
                                        </span>
                                    </>
                                ) : (
                                    <span className="stat-sub" style={{ fontStyle: 'italic', marginTop: '10px' }}>
                                        Sin objetivo definido aún.
                                    </span>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="cards-layout">
                        {planDisplay.entrenamientos?.length > 0 ? (
                            planDisplay.entrenamientos.map((entrenamiento) => (
                                <TrainingCard
                                    key={entrenamiento._id}
                                    entrenamiento={entrenamiento}
                                    isAdminView={true}
                                />
                            ))
                        ) : (
                            <div className="empty-plan-message">
                                <p>Plan sin entrenamientos cargados.</p>
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

export default DetallePlan;