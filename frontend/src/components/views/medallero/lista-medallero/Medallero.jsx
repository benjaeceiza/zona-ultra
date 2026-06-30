import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMedal, FaCalendarAlt, FaMapMarkerAlt, FaStopwatch, FaTrophy, FaPlus, FaRunning, FaTrashAlt, FaPencilAlt } from 'react-icons/fa';
import { getMedalleroByUser, deleteRaceFromMedallero } from '../../../../services/raceService.js';
import './Medallero.css';

const Medallero = () => {
    const [races, setRaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [triggerRefresh, setTriggerRefresh] = useState(0);
    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    let idUsuario = null;
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            idUsuario = payload._id || payload.id || payload.userId;
        } catch (error) { console.error(error); }
    }

    useEffect(() => {
        const fetchMedallero = async () => {
            if (!idUsuario) { setLoading(false); return; }
            try {
                setLoading(true);
                const resultado = await getMedalleroByUser(idUsuario);
                if (resultado.success) setRaces(resultado.data || []);
            } catch (error) { console.error(error); }
            finally { setLoading(false); }
        };
        fetchMedallero();
    }, [idUsuario, triggerRefresh]);

    const handleDelete = async (id, nombre) => {
        if (window.confirm(`¿Seguro que querés eliminar la carrera "${nombre}" de tu medallero? 😢`)) {
            const res = await deleteRaceFromMedallero(id);
            if (res.success) {
                setTriggerRefresh(prev => prev + 1); // Refrescamos la vista
            } else {
                alert("No se pudo eliminar: " + res.message);
            }
        }
    };

    const getDistanceColor = (km) => {
        if (km < 21) return '#4ae38b';
        if (km < 42) return '#3b82f6';
        if (km === 42) return '#f59e0b';
        return '#a855f7';
    };

    const getTopAchievement = (gen, cat) => {
        const g = Number(gen);
        const c = Number(cat);

        // Prioridad 1: General
        if (g === 1) return { text: "1° GENERAL", type: "gold" };
        if (g === 2) return { text: "2° GENERAL", type: "silver" };
        if (g === 3) return { text: "3° GENERAL", type: "bronze" };
        if (g >= 4 && g <= 10) return { text: "TOP 10 GRAL", type: "elite" };

        // Prioridad 2: Categoría
        if (c === 1) return { text: "1° CATEGORÍA", type: "gold" };
        if (c === 2) return { text: "2° CATEGORÍA", type: "silver" };
        if (c === 3) return { text: "3° CATEGORÍA", type: "bronze" };
        if (c >= 4 && c <= 10) return { text: "TOP 10 CAT", type: "elite" };

        return null; // Si no hay podio ni top 10, no devuelve nada
    };

    // Función para detectar podios y Top 10
    const getPodiumStyle = (pos) => {
        const p = Number(pos);
        if (!p) return { color: '#e5e7eb', label: '', glow: 'none' }; // Sin cargar

        if (p === 1) return { color: '#ffd700', label: 'ORO', glow: 'drop-shadow(0 0 8px rgba(255,215,0,0.6))' };
        if (p === 2) return { color: '#c0c0c0', label: 'PLATA', glow: 'drop-shadow(0 0 8px rgba(192,192,192,0.6))' };
        if (p === 3) return { color: '#cd7f32', label: 'BRONCE', glow: 'drop-shadow(0 0 8px rgba(205,127,50,0.6))' };
        if (p >= 4 && p <= 10) return { color: '#00f2fe', label: 'TOP 10', glow: 'drop-shadow(0 0 5px rgba(0,242,254,0.4))' };

        return { color: '#e5e7eb', label: '', glow: 'none' }; // Más del puesto 10
    };

    return (
        <div className="ultra-page medallero-seccion">
            <svg width="0" height="0">
                <linearGradient id="red-ribbon-grad" x1="0" y1="0" x2="0" y2="0.7">
                    {/* El top 48% es la cinta (Rojo) */}
                    <stop offset="46%" stopColor="#ff3333" /> 
                    {/* El bottom 52% es la moneda (Dorado) */}
                    <stop offset="50%" stopColor="#ffd700" /> 
                </linearGradient>
            </svg>
            <header className="medallero-header">
                <div className="header-content">
                    <h1><FaMedal style={{ fill: 'url(#red-ribbon-grad)', fontSize: '2rem' }} /> Mi Medallero</h1>
                    <p>El registro de tus batallas completadas en la montaña y el asfalto.</p>
                </div>
                {!loading && (
                    <button className="ultra-btn primary" onClick={() => navigate('/medallero/new')}>
                        <FaPlus /> Agregar Carrera
                    </button>
                )}
            </header>

            <main>
                {loading ? (
                    <div className="medallero-loading"><div className="spinner"></div><p>Buscando tus medallas... ⛰️</p></div>
                ) : races.length === 0 ? (
                    <div className="medallero-empty-card">
                        <div className="empty-icon-wrapper">
                            <FaRunning className="empty-running-icon" /><FaMedal className="empty-medal-icon" />
                        </div>
                        <h2>¡Tu vitrina de medallas está esperando!</h2>
                        <p>Todavía no tenés ninguna carrera registrada. Cada meta cruzada merece ser recordada.</p>
                        <button className="ultra-btn outline-accent" onClick={() => navigate('/medallero/new')}>
                            Cargar mi primera carrera 🔥
                        </button>
                    </div>
                ) : (
                    <div className="medallero-grid">
                        {/* 1. Creamos una copia del array y lo ordenamos de más nuevo (b) a más viejo (a) */}
                        {[...races]
                            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                            .map((race) => {
                                const colorD = getDistanceColor(race.distancia);
                                return (
                                    <div key={race._id} className="race-card" style={{ '--border-color': colorD }}>
                                        {/* --- NUEVO: CINTA DE CAMPEÓN EN LA ESQUINA --- */}
                                        {(() => {
                                            const achievement = getTopAchievement(race.posicionGeneral, race.posicionCategoria);
                                            if (achievement) {
                                                return (
                                                    <div className="corner-ribbon-wrapper">
                                                        <span className={`corner-ribbon ${achievement.type}`}>
                                                            {achievement.text}
                                                        </span>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}

                                        {/* ACCIONES DE LA TARJETA */}
                                        <div className="race-card-actions">
                                            <button
                                                className="action-btn-race edit"
                                                onClick={() => navigate(`/medallero/editar/${race._id}`, { state: { race } })}
                                                title="Editar carrera"
                                            >
                                                <FaPencilAlt />
                                            </button>
                                            <button
                                                className="action-btn-race delete"
                                                onClick={() => handleDelete(race._id, race.nombreCarrera)}
                                                title="Eliminar carrera"
                                            >
                                                <FaTrashAlt />
                                            </button>
                                        </div>

                                        {/* IMAGEN O FALLBACK FACHERO DE COLORES */}
                                        {race.fotos && race.fotos.length > 0 ? (
                                            <div className="race-card-image" style={{ backgroundImage: `url(${race.fotos[0]})` }}>
                                                <span className="distance-badge" style={{ backgroundColor: colorD }}>{race.distancia}K</span>
                                            </div>
                                        ) : (
                                            <div className="race-card-fallback-fachero">
                                                <div className="fallback-glow-icon"><FaMedal /></div>
                                                <span className="distance-badge" style={{ backgroundColor: colorD }}>{race.distancia}K</span>
                                            </div>
                                        )}

                                        <div className="race-card-content">
                                            <h3 className="race-title">{race.nombreCarrera}</h3>
                                            <div className="race-metadata">
                                                {/* Invertimos el formato visual si querés, pero dejamos el estándar */}
                                                <span><FaCalendarAlt /> {race.fecha}</span>
                                                <span><FaMapMarkerAlt /> {race.lugar || 'Lugar no especificado'}</span>
                                            </div>

                                            <div className="race-stats-row">
                                                <div className="race-stat-box">
                                                    <FaStopwatch className="icon-time" />
                                                    <p className="stat-label">Tiempo</p>
                                                    <p className="stat-value">{race.tiempoOficial}</p>
                                                </div>
                                                <div className="race-stat-box">
                                                    <FaTrophy className="icon-general" />
                                                    <p className="stat-label">Gral</p>
                                                    <p className="stat-value">#{race.posicionGeneral || '-'}</p>
                                                </div>
                                                <div className="race-stat-box">
                                                    <FaMedal className="icon-cat" />
                                                    <p className="stat-label">Cat ({race.categoria || 'Gen'})</p>
                                                    <p className="stat-value">#{race.posicionCategoria || '-'}</p>
                                                </div>
                                            </div>

                                            {race.comentario && <p className="race-comment">"{race.comentario}"</p>}
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                )}
            </main>
        </div>
    );
};

export default Medallero;