import { useParams, useNavigate, Link } from 'react-router-dom';
import { getUserWithPlan } from '../../../services/getUserPlan';
import { useEffect, useState } from 'react';
import TrainingCard from './TrainingCard';
import { IoIosArrowBack } from 'react-icons/io';

// 🔥 Diccionario para mostrar el Enfoque (si querés usarlo visualmente)
const TIPO_MICRO_LABELS = {
    "aerobico": "🔵 Aero",
    "fuerza": "🟠 Fuerza",
    "choque": "🔴 Choque",
    "descarga": "🟢 Descarga",
    "competencia": "🏆 Comp.",
    "hibrido": "🟣 Mixto"
};

const DetallePlan = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL;

    const [usuario, setUsuario] = useState(null);
    const [planes, setPlanes] = useState([]);
    const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    // 🔥 NUEVOS ESTADOS PARA EL DESPLEGABLE
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

                        // 🔥 1. DETECTAMOS QUÉ MACROCICLOS ESTÁN "VIVOS"
                        // Buscamos si el macrociclo tiene al menos UNA semana que NO esté finalizada
                        const macrociclosVivosIds = todosLosPlanes
                            .filter(p => p.macrociclo && p.estado !== 'finalizado')
                            .map(p => (p.macrociclo._id || p.macrociclo).toString());

                        // 🔥 2. APLICAMOS EL FILTRO DESTRUCTIVO (Ocultar lo 100% completado)
                        const planesValidos = todosLosPlanes.filter(p => {
                            if (p.macrociclo) {
                                // Si pertenece a un Plan, SOLO lo mostramos si el plan sigue "Vivo"
                                const macroId = (p.macrociclo._id || p.macrociclo).toString();
                                return macrociclosVivosIds.includes(macroId);
                            } else {
                                // Si es una Semana Suelta, la mostramos si no está finalizada
                                return p.estado !== 'finalizado';
                            }
                        });

                        // 3. ORDENAR CRONOLÓGICAMENTE
                        const planesOrdenados = planesValidos.sort((a, b) =>
                            a._id.toString().localeCompare(b._id.toString())
                        );

                        setPlanes(planesOrdenados);

                        // 3. AGRUPAR PARA EL DESPLEGABLE
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

                        // Forzamos "Semanales Sueltos" siempre arriba de todo
                        grupos.sort((a, b) => {
                            if (a.esSuelto && !b.esSuelto) return -1;
                            if (!a.esSuelto && b.esSuelto) return 1;
                            return 0;
                        });

                        setGruposDePlanes(grupos);

                        // 4. AUTOPOSICIONAMIENTO INICIAL (Busca el activo)
                        if (planesOrdenados.length > 0) {
                            let activeIndex = planesOrdenados.findIndex(p => p.estado === 'activo');
                            if (activeIndex === -1) {
                                activeIndex = planesOrdenados.length - 1; // Si no hay activo, va al último
                            }
                            setSelectedPlanIndex(activeIndex);

                            // Descubrimos a qué grupo pertenece ese plan activo para abrir el dropdown ahí
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

    // 🔥 MANEJADOR CUANDO CAMBIAN DE MESOCICLO EN EL DESPLEGABLE
    const handleGroupChange = (e) => {
        const newGroupIdx = Number(e.target.value);
        setSelectedGroupIndex(newGroupIdx);

        // Al cambiar de carpeta, autoseleccionamos el primer microciclo de esa carpeta
        const firstPlanOfGroup = gruposDePlanes[newGroupIdx].planes[0];
        const globalIdx = planes.findIndex(p => p._id === firstPlanOfGroup._id);
        setSelectedPlanIndex(globalIdx);
    };

    const totalSesiones = planDisplay?.entrenamientos?.filter(e => e.titulo && e.titulo.trim() !== "").length || 0;
    const sesionesCompletadas = planDisplay?.entrenamientos?.filter(e => e.completado && e.titulo && e.titulo.trim() !== "").length || 0;
    const porcentajeCumplimiento = totalSesiones > 0 ? Math.round((sesionesCompletadas / totalSesiones) * 100) : 0;

    const kmPlanificados = planDisplay?.entrenamientos?.reduce((acc, curr) => acc + (curr.km || 0), 0) || 0;
    const kmReales = planDisplay?.entrenamientos?.reduce((acc, curr) => acc + (curr.feedback?.kmReal || 0), 0) || 0;

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
            {/* 🔥 NUEVO: BLOQUE DEL MACROCICLO (TÍTULO Y OBJETIVO) */}
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

            {/* --- NAVEGADOR: DESPLEGABLE + TABS --- */}
            {gruposDePlanes.length > 0 ? (
                <div className="week-selector-container" style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>

                    {/* 🔥 EL DESPLEGABLE MÁGICO DE MESOCICLOS */}
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

                    {/* 🔥 LOS TABS (SOLO MUESTRA LOS DE LA CARPETA SELECCIONADA) */}
                    {gruposDePlanes[selectedGroupIndex] && (
                        <div className="week-tabs" style={{ marginTop: '10px' }}>
                            {gruposDePlanes[selectedGroupIndex].planes.map((plan) => {
                                // Buscamos su índice en el array global
                                const globalIndex = planes.findIndex(p => p._id === plan._id);
                                const nombreTab = gruposDePlanes[selectedGroupIndex].esSuelto ? `Semanal ${plan.numeroSemana}` : `Micro ${plan.numeroSemana}`;

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

            {planDisplay && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', marginBottom: '15px' }}>
                        {/* 🔥 Badge del Tipo de Microciclo (Oculto si no hay) */}
                        <div>
                            {planDisplay.tipoMicrociclo && TIPO_MICRO_LABELS[planDisplay.tipoMicrociclo] && (
                                <div style={{ background: '#1a1a1a', padding: '8px 15px', borderRadius: '20px', border: '1px solid #333', color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                    Enfoque: <span style={{ color: '#00D2BE' }}>{TIPO_MICRO_LABELS[planDisplay.tipoMicrociclo]}</span>
                                </div>
                            )}
                        </div>

                        {/* Botones de acción (Editar / Eliminar) */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Link
                                to={`/editar-plan/${planDisplay._id}`}
                                className="plan-creator-btn-submit"
                                style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#f1c40f', color: '#000', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold' }}
                            >
                                ✏️ Editar {planDisplay.mesociclo ? 'Microciclo' : 'Semana'}
                            </Link>

                            <button
                                onClick={handleDeletePlan}
                                className="plan-creator-btn-submit"
                                style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                🗑️
                            </button>
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