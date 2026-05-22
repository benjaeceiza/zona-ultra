import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getHistorialPaginado } from "../../../services/historialService";
import { toast } from "react-toastify";
import "./HistorialEntrenamiento.css";

// 🔥 1. CREAMOS EL COMPONENTE ESQUELETO (Falso layout de carga)
const SkeletonRow = () => {
    return (
        <div className="historial-row" style={{ borderColor: '#222', borderLeftColor: '#333', cursor: 'default' }}>
            <div className="row-meta" style={{ gap: '8px' }}>
                <div className="skeleton" style={{ width: '60px', height: '16px', borderRadius: '4px' }}></div>
                <div className="skeleton" style={{ width: '180px', height: '24px', borderRadius: '4px' }}></div>
                <div className="skeleton" style={{ width: '120px', height: '14px', borderRadius: '4px' }}></div>
            </div>
            
            <div className="row-data">
                <div className="data-item" style={{ gap: '6px' }}>
                    <div className="skeleton" style={{ width: '60px', height: '12px', borderRadius: '4px' }}></div>
                    <div className="skeleton" style={{ width: '40px', height: '22px', borderRadius: '4px' }}></div>
                </div>
                <div className="data-item" style={{ gap: '6px' }}>
                    <div className="skeleton" style={{ width: '60px', height: '12px', borderRadius: '4px' }}></div>
                    <div className="skeleton" style={{ width: '40px', height: '22px', borderRadius: '4px' }}></div>
                </div>
                <div className="data-item" style={{ gap: '6px' }}>
                    <div className="skeleton" style={{ width: '60px', height: '12px', borderRadius: '4px' }}></div>
                    <div className="skeleton" style={{ width: '40px', height: '22px', borderRadius: '4px' }}></div>
                </div>
                <div className="skeleton" style={{ width: '24px', height: '24px', borderRadius: '50%', marginLeft: '10px' }}></div>
            </div>
        </div>
    );
};

// 🔥 FUNCIÓN ESTRICTA PARA CALCULAR EL PORCENTAJE REAL (Aduana Anti-DB Vieja)
const calcularPorcentajeReal = (entrenamientos) => {
    if (!entrenamientos || entrenamientos.length === 0) return 0;

    // Filtramos los entrenamientos válidos (que no sean "descanso")
    const entrenamientosValidos = entrenamientos.filter(e => 
        e.titulo && e.titulo.toLowerCase() !== "descanso"
    );

    const totalSesiones = entrenamientosValidos.length;
    if (totalSesiones === 0) return 0;

    const sesionesLogradas = entrenamientosValidos.filter(e => {
        // 1. Si ni siquiera está marcado como completado en la app, descartado.
        if (!e.completado) return false;

        // 2. Si tiene el flag explícito de fallo, descartado.
        const esNoLogradoExplicito = 
            e.estado === "no logrado" || 
            e.estado === "no_logrado" || 
            e.logrado === false || 
            e.feedback?.estado === "no logrado" ||
            e.feedback?.noLogrado ||
            (e.feedback?.comentario && e.feedback.comentario.toUpperCase().includes('[NO LOGRADO]'));
            
        if (esNoLogradoExplicito) return false;

        // 3. LA PRUEBA MATEMÁTICA: Cruzamos los KM planificados vs reales
        const kmPlanificados = Number(e.km) || 0;
        
        if (e.feedback && e.feedback.kmReal !== undefined) {
            const kmHechos = Number(e.feedback.kmReal);
            
            // Si el plan exigía KM y el usuario corrió menos de la mitad (o 0), es un fallo técnico.
            if (kmPlanificados > 0 && kmHechos < (kmPlanificados * 0.5)) {
                return false; 
            }
        }

        // Si sobrevivió a todo, es un logro real.
        return true;
    }).length;

    return Math.round((sesionesLogradas / totalSesiones) * 100);
};

const HistorialEntrenamiento = () => {
    const { idUsuario } = useParams();
    const navigate = useNavigate();
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalHistorico, setTotalHistorico] = useState(0);
    const limit = 5;

    useEffect(() => {
        const cargarHistorial = async () => {
            setLoading(true);
            const res = await getHistorialPaginado(idUsuario, currentPage, limit);
            if (res.success) {
                const soloFinalizados = res.planes.filter(p => p.estado === 'finalizado');
                setHistorial(soloFinalizados);
                setTotalPages(res.totalPages);
                setTotalHistorico(res.totalHistorico);
            } else {
                toast.error("Error al cargar el historial");
            }
            setLoading(false);
        };
        cargarHistorial();
    }, [idUsuario, currentPage]);

    const formatTime = (min) => {
        const h = Math.floor(min / 60);
        const m = Math.round(min % 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    return (
        <main className="historial-main">
            <header className="historial-top">
                <button className="btn-back" onClick={() => navigate(-1)}>← Volver</button>
                <div className="historial-title-group">
                    <h1>Historial de Logros</h1>
                    <p>Semanas completadas: {totalHistorico}</p>
                </div>
            </header>

            {loading ? (
                <div className="historial-list">
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                </div>
            ) : historial.length === 0 ? (
                <div className="historial-empty">
                    <h3>Aún no tenés entrenamientos finalizados en tu historial.</h3>
                </div>
            ) : (
                <div className="historial-list">
                    {historial.map((plan) => {
                        const km = plan.entrenamientos.reduce((a, b) => a + (b.feedback?.kmReal || 0), 0);
                        const time = plan.entrenamientos.reduce((a, b) => a + (Number(b.feedback?.duracionReal) || 0), 0);
                        
                        // 🔥 Usamos la función estricta para obtener el porcentaje real
                        const porcentajeCumplimiento = calcularPorcentajeReal(plan.entrenamientos);

                        let badgeText = "Incompleto";
                        let badgeColor = "#f1c40f"; 

                        if (porcentajeCumplimiento === 100) {
                            badgeText = "Completo"; 
                            badgeColor = "#2ecc71"; 
                        } else if (porcentajeCumplimiento >= 75) {
                            badgeText = "Logrado";
                            badgeColor = "#00D2BE"; 
                        } else if (porcentajeCumplimiento === 0) {
                            badgeText = "Fallido";
                            badgeColor = "#ff4d4d"; 
                        }

                        return (
                            <section 
                                key={plan._id} 
                                className="historial-row"
                                onClick={() => navigate(`/detalle-historial/${plan._id}`)}
                                style={{ cursor: 'pointer' }}
                                title="Ver detalles de la semana"
                            >
                                <div className="row-meta">
                                    <span className="row-date-badge" style={{ color: badgeColor }}>
                                        {badgeText}
                                    </span>
                                    
                                    <h3>{plan.macrociclo ? plan.macrociclo.titulo : "Semana"}</h3>
                                    
                                    <p className="row-subtitle">
                                        {plan.mesociclo ? `${plan.mesociclo.titulo}` : ""}
                                        {plan.macrociclo && ` • Microciclo ${plan.numeroSemana}`}
                                    </p>
                                </div>
                                
                                <div className="row-data">
                                    {plan.tipoMicrociclo && (
                                        <span className="tag-type-historial">{plan.tipoMicrociclo}</span>
                                    )}
                                    
                                    <div className="data-item">
                                        <small>Cumplimiento</small>
                                        <strong style={{ color: badgeColor }}>
                                            {porcentajeCumplimiento}%
                                        </strong>
                                    </div>

                                    <div className="data-item">
                                        <small>Volumen</small>
                                        <strong>{km} <small>km</small></strong>
                                    </div>
                                    
                                    <div className="data-item">
                                        <small>Tiempo total</small>
                                        <strong>{formatTime(time)}</strong>
                                    </div>

                                    <div className="row-arrow">➔</div>
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}

            {totalPages > 1 && (
                <div className="historial-pagination">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                        disabled={currentPage === 1}
                        className="pagination-btn"
                    >
                        Anterior
                    </button>
                    <span className="pagination-info">Página {currentPage} de {totalPages}</span>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
                        disabled={currentPage === totalPages}
                        className="pagination-btn"
                    >
                        Siguiente
                    </button>
                </div>
            )}
        </main>
    );
};

export default HistorialEntrenamiento;