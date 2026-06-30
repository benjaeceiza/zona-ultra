import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaTrophy, FaCalendarAlt, FaMapMarkerAlt, FaStopwatch, FaRoute, FaAward, FaComment, FaImage, FaTimes, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import { addRaceToMedallero, updateRaceInMedallero } from '../../../../services/raceService.js';
import { uploadImageToCloudinary } from '../../../../services/cloudinaryService.js';
import './MedalForm.css';

const MedalForm = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Detectamos si es edición
    const raceAEditar = location.state?.race || null;
    const isEditing = !!raceAEditar;
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estados del formulario
    const [nombreCarrera, setNombreCarrera] = useState('');
    const [distancia, setDistancia] = useState('');
    const [fecha, setFecha] = useState('');
    const [lugar, setLugar] = useState('');
    const [categoria, setCategoria] = useState('');
    const [comentario, setComentario] = useState('');
    const [hrs, setHrs] = useState('');
    const [mins, setMins] = useState('');
    const [secs, setSecs] = useState('');
    const [posicionGeneral, setPosicionGeneral] = useState('');
    const [posicionCategoria, setPosicionCategoria] = useState('');
    
    // Estado de fotos unificado: objetos { url, file, isNew }
    const [fotos, setFotos] = useState([]); 
    const [errores, setErrores] = useState([]);

    // Precarga de datos
    useEffect(() => {
        if (isEditing && raceAEditar) {
            setNombreCarrera(raceAEditar.nombreCarrera || '');
            setDistancia(raceAEditar.distancia || '');
            setFecha(raceAEditar.fecha || '');
            setLugar(raceAEditar.lugar || '');
            setCategoria(raceAEditar.categoria || '');
            setComentario(raceAEditar.comentario || '');
            setPosicionGeneral(raceAEditar.posicionGeneral || '');
            setPosicionCategoria(raceAEditar.posicionCategoria || '');
            
            // Cargamos las fotos existentes (isNew: false)
            if (raceAEditar.fotos) {
                setFotos(raceAEditar.fotos.map(url => ({ url, file: null, isNew: false })));
            }

            if (raceAEditar.tiempoOficial) {
                const [h, m, s] = raceAEditar.tiempoOficial.split(':');
                setHrs(Number(h).toString());
                setMins(Number(m).toString());
                setSecs(Number(s).toString());
            }
        }
    }, [isEditing, raceAEditar]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const nuevasFotos = files.map(file => ({
            url: URL.createObjectURL(file), // Preview local
            file: file,                     // Archivo real para subir
            isNew: true                     // Marcador para subir a Cloudinary
        }));
        setFotos(prev => [...prev, ...nuevasFotos]);
    };

    const handleRemoveFoto = (indexToRemove) => {
        setFotos(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrores([]);
        setIsSubmitting(true);

        // 1. Validaciones
        const alertas = [];
        const distNum = Number(distancia) || 0;
        const tiempoTotalSegundos = (Number(hrs) * 3600) + (Number(mins) * 60) + Number(secs);
        
        if (distNum <= 0) alertas.push("La distancia debe ser mayor a 0 Km.");
        if (tiempoTotalSegundos <= 0) alertas.push("El tiempo cronometrado no puede ser cero.");
        if (posicionGeneral && Number(posicionGeneral) <= 0) alertas.push("Posición general inválida.");
        if (posicionCategoria && Number(posicionCategoria) <= 0) alertas.push("Posición en categoría inválida.");

        if (alertas.length > 0) {
            setErrores(alertas);
            setIsSubmitting(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // 2. Procesamiento de imágenes (Cloudinary)
        const urlsFinales = [];
        for (const foto of fotos) {
            if (foto.isNew && foto.file) {
                const urlNube = await uploadImageToCloudinary(foto.file);
                if (urlNube) urlsFinales.push(urlNube);
            } else {
                urlsFinales.push(foto.url); // Ya era una URL de la BD
            }
        }

        // 3. Envío al Backend
        const token = localStorage.getItem('token');
        let idUsuario = null;
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            idUsuario = payload._id || payload.id || payload.userId;
        }

        const carreraData = {
            usuario: idUsuario,
            nombreCarrera,
            distancia: distNum,
            fecha,
            lugar,
            tiempoOficial: `${hrs.padStart(2, '0')}:${mins.padStart(2, '0')}:${secs.padStart(2, '0')}`,
            posicionGeneral: posicionGeneral ? Number(posicionGeneral) : null,
            posicionCategoria: posicionCategoria ? Number(posicionCategoria) : null,
            categoria,
            fotos: urlsFinales,
            comentario
        };

        const res = isEditing 
            ? await updateRaceInMedallero(raceAEditar._id, carreraData)
            : await addRaceToMedallero(carreraData);

        setIsSubmitting(false);

        if (res.success) {
            navigate('/medallero');
        } else {
            setErrores([res.message || "Error al procesar la carrera."]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="ultra-page">
            <header className="ultra-banner banner-success">
                <div className="ultra-container">
                    <button className="ultra-back-btn" onClick={() => navigate(-1)} disabled={isSubmitting}>
                        <FaArrowLeft /> Volver
                    </button>
                    <div className="banner-content">
                        <span className="banner-tag">{isEditing ? 'Modificando Registro' : 'Nueva Carga'}</span>
                        <h1 className="banner-title"><FaTrophy /> {isEditing ? 'Editar Medalla' : 'Colgar Medalla'}</h1>
                    </div>
                </div>
            </header>

            <main className="ultra-container">
                <article className="medal-form-wrapper">
                    {errores.length > 0 && (
                        <div className="form-validation-summary">
                            <div className="validation-summary-header"><FaExclamationTriangle /> <span>Verificá los datos:</span></div>
                            <ul>{errores.map((err, idx) => <li key={idx}>{err}</li>)}</ul>
                        </div>
                    )}

                    <h2 className="form-header-title">✍️ Datos de la Competencia</h2>
                    
                    <form onSubmit={handleSubmit} className="form-fields-grid">
                        <div className="ultra-input-group">
                            <label><FaTrophy /> Nombre de la Carrera *</label>
                            <input type="text" required placeholder="Ej: Amanecer Comechingón..." value={nombreCarrera} onChange={(e) => setNombreCarrera(e.target.value)} disabled={isSubmitting} />
                        </div>

                        <div className="form-row-split">
                            <div className="ultra-input-group w-50">
                                <label><FaRoute /> Distancia (Km) *</label>
                                <input type="number" required min="0.1" step="0.1" value={distancia} onChange={(e) => setDistancia(e.target.value)} disabled={isSubmitting} />
                            </div>
                            <div className="ultra-input-group w-50">
                                <label><FaCalendarAlt /> Fecha *</label>
                                <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} disabled={isSubmitting} />
                            </div>
                        </div>

                        <div className="form-row-split">
                            <div className="ultra-input-group w-50">
                                <label><FaMapMarkerAlt /> Lugar / Provincia</label>
                                <input type="text" placeholder="Ej: San Luis" value={lugar} onChange={(e) => setLugar(e.target.value)} disabled={isSubmitting} />
                            </div>
                            <div className="ultra-input-group w-50">
                                <label><FaAward /> Tu Categoría</label>
                                <input type="text" placeholder="Ej: M 18-29" value={categoria} onChange={(e) => setCategoria(e.target.value)} disabled={isSubmitting} />
                            </div>
                        </div>

                        <div className="ultra-input-group">
                            <label><FaStopwatch /> Tiempo Oficial *</label>
                            <div className="time-input-row">
                                <div className="time-field">
                                    <input type="number" min="0" placeholder="00" value={hrs} onChange={(e) => setHrs(e.target.value)} disabled={isSubmitting} />
                                    <span>hs</span>
                                </div>
                                <div className="time-field">
                                    <input type="number" min="0" max="59" placeholder="00" value={mins} onChange={(e) => setMins(e.target.value)} disabled={isSubmitting} />
                                    <span>min</span>
                                </div>
                                <div className="time-field">
                                    <input type="number" min="0" max="59" placeholder="00" value={secs} onChange={(e) => setSecs(e.target.value)} disabled={isSubmitting} />
                                    <span>seg</span>
                                </div>
                            </div>
                        </div>

                        <div className="form-row-split">
                            <div className="ultra-input-group w-50">
                                <label>📊 Posición General</label>
                                <input type="number" min="1" placeholder="Ej: 45" value={posicionGeneral} onChange={(e) => setPosicionGeneral(e.target.value)} disabled={isSubmitting} />
                            </div>
                            <div className="ultra-input-group w-50">
                                <label>🏅 Posición Categoría</label>
                                <input type="number" min="1" placeholder="Ej: 5" value={posicionCategoria} onChange={(e) => setPosicionCategoria(e.target.value)} disabled={isSubmitting} />
                            </div>
                        </div>

                        <div className="ultra-input-group">
                            <label><FaImage /> Fotos del Recuerdo</label>
                            <div className="file-upload-wrapper">
                                <input type="file" multiple accept="image/*" onChange={handleFileChange} id="race-photos" disabled={isSubmitting} />
                                <label htmlFor="race-photos" className="file-upload-btn">📸 Seleccionar imágenes</label>
                            </div>
                            {fotos.length > 0 && (
                                <div className="form-photos-preview">
                                    {fotos.map((foto, i) => (
                                        <div key={i} className="thumb-container">
                                            <img src={foto.url} alt="preview" className="img-thumb" />
                                            {!isSubmitting && (
                                                <button type="button" className="remove-thumb-btn" onClick={() => handleRemoveFoto(i)}><FaTimes /></button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="ultra-input-group">
                            <label><FaComment /> Reseña / Anécdota <span className="label-optional">(Opcional)</span></label>
                            <textarea rows="4" value={comentario} onChange={(e) => setComentario(e.target.value)} disabled={isSubmitting}></textarea>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="submit-race-btn" disabled={isSubmitting}>
                                {isSubmitting ? <><FaSpinner /> Procesando...</> : (isEditing ? '💾 Guardar Cambios' : '🔥 Guardar Carrera')}
                            </button>
                        </div>
                    </form>
                </article>
            </main>
        </div>
    );
};

export default MedalForm;