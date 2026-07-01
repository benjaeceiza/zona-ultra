import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMedal, FaCalendarAlt, FaMapMarkerAlt, FaStopwatch, FaTrophy, FaPlus, FaRunning, FaTrashAlt, FaPencilAlt, FaSortAmountDown } from 'react-icons/fa';
import { getMedalleroByUser, deleteRaceFromMedallero } from '../../../../services/raceService.js';
import './Medallero.css';

const Medallero = () => {
    const [races, setRaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [triggerRefresh, setTriggerRefresh] = useState(0);
    
    // 🔥 MAGIA ACÁ: Inicializamos leyendo lo que guardamos (o por defecto la más nueva)
    const [sortBy, setSortBy] = useState(() => {
        return localStorage.getItem('ultra_medallero_sort') || 'fecha-desc';
    }); 
    
    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    let idUsuario = null;
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            idUsuario = payload._id || payload.id || payload.userId;
        } catch (error) { console.error(error); }
    }

    // 🔥 OTRO TOQUE MÁGICO: Cada vez que cambian el selector, lo guardamos en el navegador
    useEffect(() => {
        localStorage.setItem('ultra_medallero_sort', sortBy);
    }, [sortBy]);

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
                setTriggerRefresh(prev => prev + 1);
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

        if (g === 1) return { text: "1° GENERAL", type: "gold" };
        if (g === 2) return { text: "2° GENERAL", type: "silver" };
        if (g === 3) return { text: "3° GENERAL", type: "bronze" };
        if (g >= 4 && g <= 10) return { text: "TOP 10 GRAL", type: "elite" };

        if (c === 1) return { text: "1° CATEGORÍA", type: "gold" };
        if (c === 2) return { text: "2° CATEGORÍA", type: "silver" };
        if (c === 3) return { text: "3° CATEGORÍA", type: "bronze" };
        if (c >= 4 && c <= 10) return { text: "TOP 10 CAT", type: "elite" };

        return null;
    };

    const formatearFechaArg = (fechaString) => {
        if (!fechaString) return '';
        // Cortamos por las dudas si MongoDB le agrega la 'T' de la hora
        const soloFecha = fechaString.split('T')[0]; 
        const [anio, mes, dia] = soloFecha.split('-');
        return `${dia}-${mes}-${anio}`;
    };

    return (
        <div className="ultra-page medallero-seccion">
            <svg width="0" height="0">
                <linearGradient id="red-ribbon-grad" x1="0" y1="0" x2="0" y2="0.7">
                    <stop offset="46%" stopColor="#ff3333" /> 
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
                {!loading && races.length > 0 && (
                    <div className="medallero-filters-container">
                        <div className="medallero-filters">
                            <FaSortAmountDown className="filter-icon" />
                            <select 
                                className="ultra-select"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="fecha-desc">Más recientes primero</option>
                                <option value="fecha-asc">Más antiguas primero</option>
                                <option value="dist-desc">Mayor a menor distancia (Km)</option>
                                <option value="dist-asc">Menor a mayor distancia (Km)</option>
                            </select>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="medallero-loading"><div className="spinner"></div><p>Buscando tus medallas... ⛰️</p></div>
                ) : races.length === 0 ? (
                    <div className="medallero-empty-card">
                        <div className="empty-icon-wrapper">
                            <FaRunning className="empty-running-icon" /><FaMedal className="empty-medal-icon" />
                        </div>
                        <h2>¡Tu vitrina de medallas está esperando!</h2>
                        <p>Todavía no tenés ninguna carrera registrada. Cada meta cruzada merece ser recordada.</p>
                        <button className="ultra-btn outline-accent" onClick={() => navigate('/medallero/nueva')}>
                            Cargar mi primera carrera 🔥
                        </button>
                    </div>
                ) : (
                    <div className="medallero-grid">
                        {[...races]
                            .sort((a, b) => {
                                if (sortBy === 'fecha-desc') return new Date(b.fecha) - new Date(a.fecha);
                                if (sortBy === 'fecha-asc') return new Date(a.fecha) - new Date(b.fecha);
                                if (sortBy === 'dist-desc') return Number(b.distancia) - Number(a.distancia);
                                if (sortBy === 'dist-asc') return Number(a.distancia) - Number(b.distancia);
                                return 0;
                            })
                            .map((race) => {
                                const colorD = getDistanceColor(race.distancia);
                                return (
                                    <div key={race._id} className="race-card" style={{ '--border-color': colorD }}>
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
                                                <span><FaCalendarAlt /> {formatearFechaArg(race.fecha)}</span>
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