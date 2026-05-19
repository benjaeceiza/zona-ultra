import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getHistorialPaginado } from "../../../services/historialService";
import { toast } from "react-toastify";
import "./HistorialEntrenamiento.css";

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
                // Filtramos para asegurarnos de listar únicamente lo finalizado
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
                <div className="historial-loader">Cargando tus bitácoras...</div>
            ) : historial.length === 0 ? (
                <div className="historial-empty">
                    <h3>Aún no tenés entrenamientos finalizados en tu historial.</h3>
                </div>
            ) : (
                <div className="historial-list">
                    {historial.map((plan) => {
                        // 1. Cálculos de volumen y tiempo
                        const km = plan.entrenamientos.reduce((a, b) => a + (b.feedback?.kmReal || 0), 0);
                        const time = plan.entrenamientos.reduce((a, b) => a + (Number(b.feedback?.duracionReal) || 0), 0);
                        
                        // 2. Cálculo exacto de cumplimiento
                        const entrenamientosValidos = plan.entrenamientos?.filter(e => 
                            e.titulo && e.titulo.toLowerCase() !== "descanso"
                        ) || [];
                        
                       const totalSesiones = entrenamientosValidos.length;

                        const sesionesLogradas = entrenamientosValidos.filter(e => {
                            if (e.titulo?.toLowerCase() === "descanso") return false;
                            
                            const feedbackString = e.feedback ? JSON.stringify(e.feedback).toLowerCase() : "";
                            const estadoString = e.estado ? String(e.estado).toLowerCase() : "";

                            const esNoLogrado = 
                                estadoString.includes("no") || 
                                feedbackString.includes("no") ||
                                feedbackString.includes("fall") || 
                                e.logrado === false;

                            return e.completado === true && !esNoLogrado;
                        }).length;

                        const porcentajeCumplimiento = totalSesiones > 0 ? Math.round((sesionesLogradas / totalSesiones) * 100) : 0;

                        // Cartel (Badge) dinámico con texto actualizado
                        let badgeText = "Incompleto";
                        let badgeColor = "#f1c40f"; 

                        if (porcentajeCumplimiento === 100) {
                            badgeText = "Completo"; // 🔥 Cambiado acá
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

            {/* CONTROLES DE PAGINACIÓN COMPLETA */}
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