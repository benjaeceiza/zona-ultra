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
    const [showPassword, setShowPassword] = useState(false);
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

    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isRecoverLoading, setIsRecoverLoading] = useState(false);

    // --- ESTADOS DE FONDO ---
    const [bgLoaded, setBgLoaded] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const fondoDesktop = "https://res.cloudinary.com/dmnksm3th/image/upload/q_auto/f_auto/v1776466823/fondo-login_vicuzf.png";
    const fondoMobile = "https://res.cloudinary.com/dmnksm3th/image/upload/q_auto/f_auto/v1776466974/fondo-login-mob_dz1ici.jpg";

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

    // ... (Mantengo exacto tu lógica de request, verify y reset password) ...
    const handleRequestCode = async (e) => {
        e.preventDefault();
        setIsRecoverLoading(true);
        setRecoverStatus("");
        try {
            const res = await fetch(`${apiUrl}/api/auth/recover`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: recoverEmail })
            });
            const data = await res.json();
            if (res.ok) setRecoverStep(2);
            else setRecoverStatus("❌ " + data.message);
        } catch (error) {
            setRecoverStatus("❌ Error de conexión.");
        } finally {
            setIsRecoverLoading(false);
        }
    };

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
            if (res.ok) setRecoverStep(3);
            else setRecoverStatus("❌ " + data.message);
        } catch (error) {
            setRecoverStatus("❌ Error de conexión.");
        } finally {
            setIsRecoverLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) return setRecoverStatus("⚠️ Las contraseñas no coinciden.");
        if (newPassword.length < 8) return setRecoverStatus("⚠️ La clave debe tener mínimo 8 caracteres.");

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
                setTimeout(() => closeRecoverModal(), 2000);
            } else setRecoverStatus("❌ " + data.message);
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
        setShowNewPassword(false);
        setShowConfirmPassword(false);
    };

    const currentBgImage = isMobile ? fondoMobile : fondoDesktop;

    // 🔥 SVGs DE LOS OJITOS
    const EyeOpen = () => (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    );
    const EyeClosed = () => (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
    );

    return (
        <div style={{ position: 'relative', minHeight: '100vh', width: '100%', overflow: 'hidden' }}>

            <img
                src={currentBgImage}
                key={isMobile ? 'mobile' : 'desktop'}
                alt="Fondo de Login"
                onLoad={() => setBgLoaded(true)}
                style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    objectFit: 'cover', zIndex: 1, opacity: bgLoaded ? 1 : 0, transition: 'opacity 0.5s ease-in-out'
                }}
            />

            {!bgLoaded && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%', background: '#121212', position: 'absolute', zIndex: 10 }}>
                    <Loader />
                </div>
            )}

            {bgLoaded && (
                <main id="loginContainer" className="register-login-page">
                    <div className="formAuthContainer">
                        <img
                            src="https://res.cloudinary.com/dmnksm3th/image/upload/q_auto/f_auto/v1776467586/logo-zona-ultra_en09ys.png"
                            alt="Zona Ultra Logo"
                            className="login-logo"
                        />
                        <h1 className="titleAuth">Iniciar <span>Sesión</span></h1>

                        <form onSubmit={submitUser} className="formAuth" >
                            <input className="inputFormAuth" type="email" id="email" placeholder="Correo electrónico" required onChange={(e) => setEmail(e.target.value)} />

                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ position: 'relative', width: '100%' }}>
                                    <input
                                        className="inputFormAuth"
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        placeholder="Contraseña"
                                        required
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={{ width: '100%', paddingRight: '45px', boxSizing: 'border-box', margin: 0 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                            background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', padding: 0
                                        }}
                                    >
                                        {showPassword ? <EyeOpen /> : <EyeClosed />}
                                    </button>
                                </div>

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

            {/* --- MODAL DE RECUPERACIÓN (Se mantiene centrado tipo Pop-up) --- */}
            {isRecoverOpen && (
                <div className="recover-overlay" onClick={closeRecoverModal}>
                    <div className="recover-card" onClick={(e) => e.stopPropagation()}>
                        <button className="recover-close" onClick={closeRecoverModal}>&times;</button>

                        {recoverStep === 1 && (
                            <>
                                <h2 className="recover-title">Recuperar Acceso</h2>
                                <p className="recover-desc" style={{ marginBottom: '15px' }}>Ingresá tu email y te enviaremos un código de 6 dígitos.</p>
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
                                    <input type="text" className="inputFormAuth" placeholder="Código (Ej: 123456)" value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value)} required maxLength={6} style={{ letterSpacing: '3px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }} />
                                    <button type="submit" className="buttonFormAuth" disabled={isRecoverLoading} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                                        {isRecoverLoading ? <span className="login-spinner"></span> : "Verificar Código"}
                                    </button>
                                    <button type="button" className="buttonFormAuth" disabled={isRecoverLoading} style={{ background: 'transparent', border: '1px solid #444', marginTop: '10px', opacity: isRecoverLoading ? 0.5 : 1 }} onClick={() => setRecoverStep(1)}>
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
                                    <div style={{ position: 'relative', width: '100%', marginBottom: '10px' }}>
                                        <input type={showNewPassword ? "text" : "password"} className="inputFormAuth" placeholder="Nueva contraseña" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} style={{ width: '100%', paddingRight: '45px', margin: 0, boxSizing: 'border-box' }} />
                                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', padding: 0 }}>
                                            {showNewPassword ? <EyeOpen /> : <EyeClosed />}
                                        </button>
                                    </div>

                                    <div style={{ position: 'relative', width: '100%' }}>
                                        <input type={showConfirmPassword ? "text" : "password"} className="inputFormAuth" placeholder="Confirmar contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} style={{ width: '100%', paddingRight: '45px', margin: 0, boxSizing: 'border-box' }} />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', padding: 0 }}>
                                            {showConfirmPassword ? <EyeOpen /> : <EyeClosed />}
                                        </button>
                                    </div>

                                    <button type="submit" className="buttonFormAuth" disabled={isRecoverLoading} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '15px' }}>
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