import { useState, useEffect } from "react";
import { userLogin } from "../../../services/login.js";
import { useNavigate } from "react-router-dom";
import Loader from "../../loader/Loader";

const Login = () => {
    // --- ESTADOS DE LOGIN ---
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL;

    // --- ESTADOS DE RECUPERACIÓN ---
    const [isRecoverOpen, setIsRecoverOpen] = useState(false);
    const [recoverStep, setRecoverStep] = useState(1); 
    const [recoverEmail, setRecoverEmail] = useState("");
    const [recoveryCode, setRecoveryCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState(""); 
    const [recoverStatus, setRecoverStatus] = useState("");
    
    // 🔥 NUEVO ESTADO: Loader exclusivo para los botones del modal
    const [isRecoverLoading, setIsRecoverLoading] = useState(false);

    // --- ESTADOS DE FONDO ---
    const [bgLoaded, setBgLoaded] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const fondoDesktop = "https://res.cloudinary.com/dmnksm3th/image/upload/v1772080976/fondo-login_11zon_vp6r1p.webp";
    const fondoMobile = "https://res.cloudinary.com/dmnksm3th/image/upload/v1772080976/Gemini_Generated_Image_plvz32plvz32plvz_11zon_ikdlu8.webp";

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const submitUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMensaje("");
        try {
            const res = await userLogin(email, password);
            if (res?.token) navigate("/");
            else setMensaje(res || "Credenciales incorrectas");
        } catch (err) {
            console.error(err);
            setMensaje("Error al iniciar sesión");
        } finally {
            setLoading(false);
        }
    };

    // --- PASO 1: PEDIR MAIL Y ENVIAR CÓDIGO ---
    const handleRequestCode = async (e) => {
        e.preventDefault();
        setIsRecoverLoading(true); // Arranca el spinner
        setRecoverStatus("");
        try {
            const res = await fetch(`${apiUrl}/api/auth/recover`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: recoverEmail })
            });
            const data = await res.json();
            
            if (res.ok) {
                setRecoverStep(2); 
            } else {
                setRecoverStatus("❌ " + data.message);
            }
        } catch (error) {
            setRecoverStatus("❌ Error de conexión.");
        } finally {
            setIsRecoverLoading(false); // Frena el spinner
        }
    };

    // --- PASO 2: VERIFICAR SOLO EL CÓDIGO ---
    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setIsRecoverLoading(true);
        setRecoverStatus("");
        try {
            const res = await fetch(`${apiUrl}/api/auth/verify-code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: recoverEmail, code: recoveryCode })
            });
            const data = await res.json();
            
            if (res.ok) {
                setRecoverStep(3); 
            } else {
                setRecoverStatus("❌ " + data.message);
            }
        } catch (error) {
            setRecoverStatus("❌ Error de conexión.");
        } finally {
            setIsRecoverLoading(false);
        }
    };

    // --- PASO 3: ENVIAR LAS NUEVAS CONTRASEÑAS ---
    const handleResetPassword = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            return setRecoverStatus("⚠️ Las contraseñas no coinciden.");
        }
        if (newPassword.length < 8) {
            return setRecoverStatus("⚠️ La clave debe tener mínimo 8 caracteres.");
        }
        
        setIsRecoverLoading(true);
        setRecoverStatus("");
        try {
            const res = await fetch(`${apiUrl}/api/auth/reset`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: recoverEmail, code: recoveryCode, newPassword })
            });
            const data = await res.json();
            
            if (res.ok) {
                setRecoverStatus("✅ ¡Contraseña actualizada!");
                // Dejamos que el usuario vea el tilde verde y a los 2 segundos cerramos el modal
                setTimeout(() => {
                    closeRecoverModal();
                }, 2000);
            } else {
                setRecoverStatus("❌ " + data.message);
            }
        } catch (error) {
            setRecoverStatus("❌ Error de conexión.");
        } finally {
            setIsRecoverLoading(false);
        }
    };

    const closeRecoverModal = () => {
        setIsRecoverOpen(false);
        setRecoverStep(1);
        setRecoverEmail("");
        setRecoveryCode("");
        setNewPassword("");
        setConfirmPassword("");
        setRecoverStatus("");
    };

    const currentBgImage = isMobile ? fondoMobile : fondoDesktop;

    return (
        <div style={{ position: 'relative', minHeight: '100vh', width: '100%', overflow: 'hidden' }}>

            <img
                src={currentBgImage}
                key={isMobile ? 'mobile' : 'desktop'}
                alt="Fondo de Login"
                onLoad={() => setBgLoaded(true)}
                style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    objectFit: 'cover', zIndex: -1, opacity: bgLoaded ? 1 : 0, transition: 'opacity 0.5s ease-in-out'
                }}
            />

            {!bgLoaded && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%', background: '#121212', position: 'absolute', zIndex: 10 }}>
                    <Loader />
                </div>
            )}

            {bgLoaded && (
                <main id="loginContainer" className="register-login-page" style={{ background: 'transparent' }}>
                    <div className="formAuthContainer">
                        <h1 className="titleAuth">Iniciar <span>Sesion</span></h1>

                        <form onSubmit={submitUser} className="formAuth" >
                            <input className="inputFormAuth" type="email" id="email" placeholder="Correo electronico" required onChange={(e) => setEmail(e.target.value)} />

                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <input className="inputFormAuth" type="password" id="password" placeholder="Contraseña" required onChange={(e) => setPassword(e.target.value)} />

                                <div className="forgot-pass-wrapper">
                                    <span className="forgot-pass-link" onClick={() => setIsRecoverOpen(true)}>
                                        ¿Olvidaste tu contraseña?
                                    </span>
                                </div>
                            </div>

                            <button type="submit" className="buttonFormAuth" disabled={loading} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                                {loading ? <span className="login-spinner"></span> : "Ingresar"}
                            </button>

                            <p className={mensaje ? "errorMsgForm-active" : "errorMsgForm"}>{mensaje}</p>
                        </form>
                    </div>
                </main>
            )}

            {/* --- MODAL DE RECUPERACIÓN --- */}
            {isRecoverOpen && (
                <div className="recover-overlay" onClick={closeRecoverModal}>
                    <div className="recover-card" onClick={(e) => e.stopPropagation()}>
                        <button className="recover-close" onClick={closeRecoverModal}>&times;</button>
                        
                        {recoverStep === 1 && (
                            <>
                                <h2 className="recover-title">Recuperar Acceso</h2>
                                <p className="recover-desc" style={{ marginBottom: '15px' }}>Ingresa tu email y te enviaremos un código de 6 dígitos.</p>
                                <form onSubmit={handleRequestCode} className="recover-form">
                                    <input type="email" className="inputFormAuth" placeholder="Tu email registrado" value={recoverEmail} onChange={(e) => setRecoverEmail(e.target.value)} required />
                                    
                                    <button type="submit" className="buttonFormAuth" disabled={isRecoverLoading} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                                        {isRecoverLoading ? <span className="login-spinner"></span> : "Enviar Código"}
                                    </button>
                                </form>
                            </>
                        )}

                        {recoverStep === 2 && (
                            <>
                                <h2 className="recover-title">Ingresar Código</h2>
                                <p className="recover-desc" style={{ marginBottom: '15px' }}>Revisá tu correo <b>{recoverEmail}</b> e ingresá el código de 6 dígitos.</p>
                                <form onSubmit={handleVerifyCode} className="recover-form">
                                    <input 
                                        type="text" 
                                        className="inputFormAuth" 
                                        placeholder="Código (Ej: 123456)" 
                                        value={recoveryCode} 
                                        onChange={(e) => setRecoveryCode(e.target.value)} 
                                        required 
                                        maxLength={6} 
                                        style={{ letterSpacing: '3px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }} 
                                    />
                                    
                                    <button type="submit" className="buttonFormAuth" disabled={isRecoverLoading} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                                        {isRecoverLoading ? <span className="login-spinner"></span> : "Verificar Código"}
                                    </button>
                                    
                                    <button type="button" className="buttonFormAuth" disabled={isRecoverLoading} style={{background: 'transparent', border: '1px solid #444', marginTop: '10px', opacity: isRecoverLoading ? 0.5 : 1}} onClick={() => setRecoverStep(1)}>
                                        Volver atrás
                                    </button>
                                </form>
                            </>
                        )}

                        {recoverStep === 3 && (
                            <>
                                <h2 className="recover-title">Crear Nueva Clave</h2>
                                <p className="recover-desc" style={{ marginBottom: '15px' }}>Tu código es válido. Ahora elegí tu nueva contraseña.</p>
                                <form onSubmit={handleResetPassword} className="recover-form">
                                    <input 
                                        type="password" 
                                        className="inputFormAuth" 
                                        placeholder="Nueva contraseña" 
                                        value={newPassword} 
                                        onChange={(e) => setNewPassword(e.target.value)} 
                                        required 
                                        minLength={8} 
                                    />
                                    <input 
                                        type="password" 
                                        className="inputFormAuth" 
                                        placeholder="Confirmar contraseña" 
                                        value={confirmPassword} 
                                        onChange={(e) => setConfirmPassword(e.target.value)} 
                                        required 
                                        minLength={8} 
                                    />
                                    
                                    <button type="submit" className="buttonFormAuth" disabled={isRecoverLoading} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                                        {isRecoverLoading ? <span className="login-spinner"></span> : "Guardar y Entrar"}
                                    </button>
                                </form>
                            </>
                        )}

                        {recoverStatus && (
                            <p className="recover-status-msg" style={{ 
                                marginTop: '15px', 
                                color: recoverStatus.includes('✅') ? '#00D2BE' : (recoverStatus.includes('❌') || recoverStatus.includes('⚠️') ? '#ff4d4d' : '#fff') 
                            }}>
                                {recoverStatus}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Login;