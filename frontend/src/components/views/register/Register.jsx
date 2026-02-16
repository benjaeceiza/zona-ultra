import { useState } from 'react';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash, FaUserPlus } from 'react-icons/fa';


const Register = () => {
    
    const API_URL = import.meta.env.VITE_API_URL;

    const initialFormState = {
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        password: '',
        confirmPassword: '',
        rol: 'user' 
    };

    const [formData, setFormData] = useState(initialFormState);
    const [showPass, setShowPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const { nombre, apellido, email, telefono, password, confirmPassword, rol } = formData;

    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e) => {
        e.preventDefault();

        // Validaciones
        if (password.length < 8) {
            return toast.warn("⚠️ La contraseña debe tener al menos 8 caracteres.");
        }

        if (password !== confirmPassword) {
            return toast.error("❌ Las contraseñas no coinciden.");
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token'); 
            const dataToSend = { nombre, apellido, email, telefono, password, rol };

            const response = await fetch(`${API_URL}/api/auth/admin/register`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(dataToSend)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Error al registrar usuario");
            }

            toast.success(`✅ Usuario registrado con éxito!`);
            setFormData(initialFormState); 

        } catch (error) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page-container">
            <div className="register-card">
                
                {/* HEADER */}
                <div className="register-header">
                    <FaUserPlus className="register-header-icon" />
                    <h2 className="register-title">Registrar Usuario</h2>
                </div>

                <form onSubmit={onSubmit} className="register-form">
                    
                    {/* FILA 1: NOMBRE Y APELLIDO */}
                    <div className="register-row">
                        <div className="register-group">
                            <label className="register-label">Nombre</label>
                            <input 
                                className="register-input" 
                                type="text" 
                                name="nombre" 
                                value={nombre} 
                                onChange={onChange} 
                                required 
                                placeholder="Ej: Lionel" 
                            />
                        </div>
                        <div className="register-group">
                            <label className="register-label">Apellido</label>
                            <input 
                                className="register-input" 
                                type="text" 
                                name="apellido" 
                                value={apellido} 
                                onChange={onChange} 
                                required 
                                placeholder="Ej: Messi" 
                            />
                        </div>
                    </div>

                    {/* FILA 2: EMAIL */}
                    <div className="register-group">
                        <label className="register-label">Email</label>
                        <input 
                            className="register-input" 
                            type="email" 
                            name="email" 
                            value={email} 
                            onChange={onChange} 
                            required 
                            placeholder="correo@ejemplo.com" 
                        />
                    </div>

                    {/* FILA 3: TELÉFONO Y ROL */}
                    <div className="register-row">
                        <div className="register-group">
                            <label className="register-label">Teléfono</label>
                            <input 
                                className="register-input" 
                                type="tel" 
                                name="telefono" 
                                value={telefono} 
                                onChange={onChange} 
                                placeholder="+54 9 ..." 
                            />
                        </div>
                        <div className="register-group">
                            <label className="register-label">Rol</label>
                            <select 
                                className="register-input register-select" 
                                name="rol" 
                                value={rol} 
                                onChange={onChange}
                            >
                                <option value="user">Corredor (User)</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                    </div>

                    {/* FILA 4: CONTRASEÑAS (CON OJITO) */}
                    <div className="register-row">
                        <div className="register-group">
                            <label className="register-label">Contraseña</label>
                            <div className="register-password-wrapper">
                                <input 
                                    className="register-input register-input-pass"
                                    type={showPass ? "text" : "password"} 
                                    name="password" 
                                    value={password} 
                                    onChange={onChange} 
                                    required 
                                    placeholder="Mínimo 8 caracteres"
                                />
                                <button 
                                    type="button" 
                                    className="register-eye-btn" 
                                    onClick={() => setShowPass(!showPass)}
                                >
                                    {showPass ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        <div className="register-group">
                            <label className="register-label">Confirmar</label>
                            <div className="register-password-wrapper">
                                <input 
                                    className="register-input register-input-pass"
                                    type={showConfirmPass ? "text" : "password"} 
                                    name="confirmPassword" 
                                    value={confirmPassword} 
                                    onChange={onChange} 
                                    required 
                                    placeholder="Repetir contraseña"
                                />
                                <button 
                                    type="button" 
                                    className="register-eye-btn" 
                                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                                >
                                    {showConfirmPass ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* BOTÓN SUBMIT */}
                    <button type="submit" className="register-btn-submit" disabled={loading}>
                        {loading ? "Creando..." : "Crear Usuario"}
                    </button>

                </form>
            </div>
        </div>
    );
};

export default Register;