import { useState } from "react";
import { userLogin } from "../../../services/login.js";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [loading, setLoading] = useState(false); // 🔥 NUEVO ESTADO
    const navigate = useNavigate();

    const [isRecoverOpen, setIsRecoverOpen] = useState(false);
    const [recoverEmail, setRecoverEmail] = useState("");
    const [recoverStatus, setRecoverStatus] = useState("");

    const submitUser = async (e) => {
        e.preventDefault();
        setLoading(true); // 🚀 Iniciamos loader
        setMensaje(""); 

        try {
            const res = await userLogin(email, password);
            if (res?.token) {
                navigate("/");
            } else {
                setMensaje(res || "Credenciales incorrectas");
            }
        } catch (err) {
            console.error(err);
            setMensaje("Error al iniciar sesión");
        } finally {
            setLoading(false); // 🏁 Detenemos loader
        }
    };

    const handleRecoverSubmit = async (e) => {
        e.preventDefault();
        setRecoverStatus("Enviando...");
        setTimeout(() => {
            setRecoverStatus("¡Listo! Revisa tu correo para restablecer la clave.");
            setTimeout(() => {
                setIsRecoverOpen(false);
                setRecoverStatus("");
                setRecoverEmail("");
            }, 3000);
        }, 1500);
    };

    return (
        <>
            <main id="loginContainer" className="register-login-page">
                <div className="formAuthContainer">
                    <h1 className="titleAuth">Iniciar <span>Sesion</span></h1>
                    
                    <form onSubmit={submitUser} className="formAuth" >
                        <input className="inputFormAuth" type="email" id="email" placeholder="Correo electronico" required onChange={(e) => setEmail(e.target.value)} />
                        
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                            <input className="inputFormAuth" type="password" id="password" placeholder="Contraseña" required onChange={(e) => setPassword(e.target.value)} />
                            
                            <div className="forgot-pass-wrapper">
                                <span className="forgot-pass-link" onClick={() => setIsRecoverOpen(true)}>
                                    ¿Olvidaste tu contraseña?
                                </span>
                            </div>
                        </div>

                        {/* 🔥 BOTÓN CON LOADER */}
                        <button 
                            type="submit" 
                            className="buttonFormAuth" 
                            disabled={loading}
                            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                        >
                            {loading ? (
                                <>
                                    <span className="login-spinner"></span>
                                </>
                            ) : (
                                "Ingresar"
                            )}
                        </button>

                        <p className={mensaje ? "errorMsgForm-active" : "errorMsgForm"}>{mensaje}</p>
                    </form>
                </div>
            </main>

            {/* --- MODAL DE RECUPERACIÓN (Queda igual) --- */}
            {isRecoverOpen && (
                <div className="recover-overlay" onClick={() => setIsRecoverOpen(false)}>
                    <div className="recover-card" onClick={(e) => e.stopPropagation()}>
                        <button className="recover-close" onClick={() => setIsRecoverOpen(false)}>&times;</button>
                        <h2 className="recover-title">Recuperar Acceso</h2>
                        <form onSubmit={handleRecoverSubmit} className="recover-form">
                            <input type="email" className="inputFormAuth" placeholder="Tu email" value={recoverEmail} onChange={(e) => setRecoverEmail(e.target.value)} required />
                            <button type="submit" className="buttonFormAuth">Enviar Enlace</button>
                            {recoverStatus && <p className="recover-status-msg">{recoverStatus}</p>}
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}

export default Login;