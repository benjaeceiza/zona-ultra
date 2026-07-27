import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getUserLogued } from '../../../services/getUserLogued';
import { updateUser } from '../../../services/updateUser';
import { uploadProfileAvatarToCloudinary } from '../../../services/cloudinaryService';
import { IoIosArrowBack } from 'react-icons/io';
import { FiUser, FiActivity, FiLock, FiSave, FiMail, FiPhone, FiCalendar, FiShield, FiCamera, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi';
import { FaUserCircle, FaRunning, FaSignOutAlt } from 'react-icons/fa';
import ProfileSkeleton from '../../skeletons/profile-skeletons/ProfileSkeleton';
import Cropper from 'react-easy-crop';
import './ProfilePage.css';


// ============================================================================
// 🛠️ UTILIDAD: Canvas HTML5 para recortar
// ============================================================================
const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

async function getCroppedImg(imageSrc, pixelCrop) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/jpeg');
    });
}

// ============================================================================
// 🏃‍♂️ COMPONENTE PRINCIPAL
// ============================================================================
const ProfilePage = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('personal');

    // Estados para el Cropper
    const fileInputRef = useRef(null);
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropping, setIsCropping] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        _id: '', nombre: '', apellido: '', email: '', telefono: '',
        fechaNacimiento: '', peso: '', altura: '', fcMax: '',
        nivel: 'intermedio', avatar: '', password: '', newPassword: '', confirmPassword: ''
    });

    useEffect(() => {
        const fetchUserData = async () => {
            if (!token) return navigate('/login');
            try {
                const data = await getUserLogued(token);
                if (data) {
                    setFormData({
                        _id: data._id || '', nombre: data.nombre || '', apellido: data.apellido || '',
                        email: data.email || '', telefono: data.telefono || '',
                        fechaNacimiento: data.fechaNacimiento ? data.fechaNacimiento.split('T')[0] : '',
                        peso: data.peso || '', altura: data.altura || '', fcMax: data.fcMax || '',
                        nivel: data.nivel || 'intermedio', avatar: data.avatar || '',
                        password: '', newPassword: '', confirmPassword: ''
                    });
                }
            } catch (error) { toast.error("Error al cargar los datos"); }
            finally { setLoading(false); }
        };
        fetchUserData();
    }, [token, navigate]);

    // 🔥 PATOVICA DE INPUTS
    const handleChange = (e) => {
        let { name, value } = e.target;
        const regexTresDigitosDosDecimales = /^\d{0,3}(\.\d{0,2})?$/;

        if (name === 'peso' || name === 'altura') {
            if (value && !regexTresDigitosDosDecimales.test(value)) return;
        }
        if (name === 'fcMax') {
            if (value && !/^\d{0,3}$/.test(value)) return;
        }

        setFormData({ ...formData, [name]: value });
    };

    // ============================================================================
    // 📸 LÓGICA DE FOTO Y CLOUDINARY
    // ============================================================================
    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.addEventListener('load', () => setImageSrc(reader.result));
            reader.readAsDataURL(e.target.files[0]);
            setIsCropping(true);
            e.target.value = null;
        }
    };

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const uploadAvatar = async () => {
        try {
            setSaving(true);
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            const imageFile = new File([croppedImageBlob], "avatar_profile.jpg", { type: "image/jpeg" });
            const secureUrl = await uploadProfileAvatarToCloudinary(imageFile);

            if (secureUrl) {
                setFormData(prev => ({ ...prev, avatar: secureUrl }));

                const payloadToSave = { ...formData, avatar: secureUrl };
                if (!payloadToSave.newPassword) {
                    delete payloadToSave.password;
                    delete payloadToSave.newPassword;
                    delete payloadToSave.confirmPassword;
                }

                await updateUser(formData._id, payloadToSave, token);

                toast.success("Foto guardada en tu perfil con éxito 📸");
                setIsCropping(false);
                setImageSrc(null);
            } else {
                toast.error("Error al subir la imagen a Cloudinary");
            }

        } catch (e) {
            console.error(e);
            toast.error("Error procesando el recorte");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAvatar = async (e) => {
        e.stopPropagation();

        if (!window.confirm("¿Seguro que querés eliminar tu foto de perfil?")) return;

        try {
            setSaving(true);
            setFormData(prev => ({ ...prev, avatar: '' }));

            const payloadToSave = { ...formData, avatar: '' };
            if (!payloadToSave.newPassword) {
                delete payloadToSave.password;
                delete payloadToSave.newPassword;
                delete payloadToSave.confirmPassword;
            }

            await updateUser(formData._id, payloadToSave, token);
            toast.success("Foto eliminada correctamente 🗑️");
        } catch (error) {
            toast.error("Error al eliminar la foto");
        } finally {
            setSaving(false);
        }
    };

    // ============================================================================
    // 💾 GUARDAR DATOS DEL PERFIL
    // ============================================================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (activeTab === 'security' && formData.newPassword !== formData.confirmPassword) {
            return toast.error("Las nuevas contraseñas no coinciden ❌");
        }
        setSaving(true);
        try {
            const payload = { ...formData };
            if (!payload.newPassword) { delete payload.password; delete payload.newPassword; delete payload.confirmPassword; }

            const res = await updateUser(formData._id, payload, token);
            if (res.success || res.ok) {
                toast.success("¡Perfil actualizado con éxito! ⚡");
                setFormData(prev => ({ ...prev, password: '', newPassword: '', confirmPassword: '' }));
            } else { toast.error(res.message || "Error al actualizar"); }
        } catch (error) { toast.error("Error de conexión"); }
        finally { setSaving(false); }
    };
    if (loading) return <ProfileSkeleton />;

    const handleLogout = () => {
        if (window.confirm("¿Estás seguro que querés cerrar sesión, atleta? 🏃‍♂️")) {
            localStorage.clear();
            navigate('/login');
        }
    };

    return (
        <main className="profile-container">
            <header className="profile-header">
                <button className="profile-back-btn" onClick={() => navigate(-1)}><IoIosArrowBack /> Volver</button>
                <div className="profile-title-group">
                    <span className="profile-label-top">Configuración de Cuenta</span>
                    <h1>Perfil de Atleta</h1>
                </div>
            </header>

            <div className="profile-grid">

                {/* --- COLUMNA IZQUIERDA: TARJETA DE IDENTIDAD --- */}
                <aside className="profile-id-card">
                    <div className="id-card-top">

                        <div className="id-avatar-container">
                            <div className="id-avatar-wrapper" onClick={() => fileInputRef.current.click()}>
                                {formData.avatar ? (
                                    <img src={formData.avatar} alt="Avatar Atleta" className="id-avatar-img" />
                                ) : (
                                    <FaUserCircle className="id-avatar-icon" />
                                )}
                                <div className="id-avatar-overlay">
                                    <FiCamera className="camera-icon" />
                                    <span>Cambiar Foto</span>
                                </div>
                            </div>

                            {formData.avatar && (
                                <button type="button" className="btn-delete-avatar" onClick={handleDeleteAvatar}>
                                    <FiTrash2 /> Eliminar
                                </button>
                            )}
                        </div>

                        {/* 🔥 EL INPUT INVISIBLE QUE SE SUELE BORRAR POR ERROR 🔥 */}
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} hidden />

                        <span className="id-role-badge">{formData.nivel ? `Corredor ${formData.nivel}` : "Corredor"}</span>
                        <h2 className="id-name">{formData.nombre} {formData.apellido}</h2>
                        <span className="id-email">{formData.email}</span>
                    </div>

                    <div className="id-card-divider"></div>

                    <div className="id-stats-summary">
                        <div className="id-stat-box">
                            <small>PESO</small>
                            <span>{formData.peso ? `${formData.peso} kg` : '-'}</span>
                        </div>
                        <div className="id-stat-box">
                            <small>ALTURA</small>
                            <span>{formData.altura ? `${formData.altura} cm` : '-'}</span>
                        </div>
                        <div className="id-stat-box">
                            <small>FC MÁX</small>
                            <span className="text-teal">{formData.fcMax ? `${formData.fcMax} bpm` : '-'}</span>
                        </div>
                    </div>
                    <div className="profile-logout-wrapper">
                        <button type="button" className="btn-logout-profile" onClick={handleLogout}>
                            <FaSignOutAlt /> Cerrar Sesión
                        </button>
                    </div>
                </aside>

                {/* --- COLUMNA DERECHA: PANEL DE EDICIÓN --- */}
                <section className="profile-editor-section">
                    <nav className="profile-tabs">
                        <button type="button" className={`profile-tab ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}><FiUser /> Personales</button>
                        <button type="button" className={`profile-tab ${activeTab === 'running' ? 'active' : ''}`} onClick={() => setActiveTab('running')}><FiActivity /> Métricas</button>
                        <button type="button" className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}><FiLock /> Seguridad</button>
                    </nav>

                    <form onSubmit={handleSubmit} className="profile-form-body">
                        {activeTab === 'personal' && (
                            <div className="tab-pane fade-in">
                                <h3 className="pane-title">Información Básica</h3>
                                <div className="form-row">
                                    <div className="form-group"><label>NOMBRE</label><input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required /></div>
                                    <div className="form-group"><label>APELLIDO</label><input type="text" name="apellido" value={formData.apellido} onChange={handleChange} required /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label><FiMail /> EMAIL</label><input type="email" name="email" value={formData.email} disabled className="input-disabled" /></div>
                                    <div className="form-group"><label><FiPhone /> TELÉFONO</label><input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label><FiCalendar /> FECHA NACIMIENTO</label><input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} /></div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'running' && (
                            <div className="tab-pane fade-in">
                                <h3 className="pane-title">Perfil Biométrico y Deportivo</h3>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>PESO (KG)</label>
                                        <input type="number" step="0.01" name="peso" value={formData.peso} onChange={handleChange} placeholder="Ej: 68.50" />
                                        <small className="field-hint">Máx: 3 dígitos, 2 decimales</small>
                                    </div>
                                    <div className="form-group">
                                        <label>ALTURA (CM)</label>
                                        <input type="number" step="0.01" name="altura" value={formData.altura} onChange={handleChange} placeholder="Ej: 175.50" />
                                        <small className="field-hint">Máx: 3 dígitos, 2 decimales</small>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>FC MÁXIMA (BPM)</label>
                                        <input type="number" step="1" name="fcMax" value={formData.fcMax} onChange={handleChange} placeholder="Ej: 185" />
                                    </div>
                                    <div className="form-group">
                                        <label><FaRunning /> NIVEL DE EXPERIENCIA</label>
                                        <select name="nivel" value={formData.nivel} onChange={handleChange} className="select-custom">
                                            <option value="principiante">Principiante (0 - 1 año)</option>
                                            <option value="intermedio">Intermedio (1 - 3 años)</option>
                                            <option value="avanzado">Avanzado (3 - 5 años)</option>
                                            <option value="elite">Élite / Ultra (5+ años)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="tab-pane fade-in">
                                <h3 className="pane-title">Seguridad</h3>

                                {/* NUEVA CONTRASEÑA */}
                                <div className="form-group mt-3 password-input-container">
                                    <label>NUEVA CONTRASEÑA</label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        placeholder="Mínimo 8 caracteres..."
                                    />
                                    <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <FiEyeOff /> : <FiEye />}
                                    </button>
                                </div>

                                {/* CONFIRMAR CONTRASEÑA */}
                                <div className="form-group mt-3 password-input-container">
                                    <label>CONFIRMAR CONTRASEÑA</label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Repetí tu nueva contraseña..."
                                    />
                                    {/* El mismo estado showPassword controla ambos */}
                                    <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <FiEyeOff /> : <FiEye />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="profile-form-footer">
                            <button type="submit" className="btn-save-profile" disabled={saving}>
                                <FiSave className="icon-save" /> {saving ? 'GUARDANDO...' : 'GUARDAR PERFIL ⚡'}
                            </button>
                        </div>
                    </form>
                </section>
            </div>

            {/* ✂️ MODAL FLOTANTE DE RECORTE DE IMAGEN */}
            {isCropping && (
                <div className="cropper-overlay">
                    <div className="cropper-modal">
                        <h3>Ajustá tu Foto de Perfil</h3>
                        <div className="cropper-container">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>
                        <div className="cropper-controls">
                            <input type="range" value={zoom} min={1} max={3} step={0.1} aria-labelledby="Zoom" onChange={(e) => setZoom(e.target.value)} className="zoom-slider" />
                        </div>
                        <div className="cropper-actions">
                            <button className="btn-cancel-crop" onClick={() => { setIsCropping(false); setImageSrc(null); }}>Cancelar</button>
                            <button className="btn-save-crop" onClick={uploadAvatar} disabled={saving}>{saving ? 'Procesando...' : 'Aplicar Foto 📸'}</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default ProfilePage;