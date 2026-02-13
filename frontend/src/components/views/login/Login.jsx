import { useState } from "react";
import { userLogin } from "../../../services/login.js";
import { useNavigate } from "react-router-dom";
// Si tenés un servicio real de recuperación, importalo acá.
// import { recoverPassword } from "../../../services/auth.js"; 

const Login = () => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mensaje, setMensaje] = useState("");
    const navigate = useNavigate();

    // --- NUEVO ESTADO PARA MODAL RECUPERACIÓN ---
    const [isRecoverOpen, setIsRecoverOpen] = useState(false);
    const [recoverEmail, setRecoverEmail] = useState("");
    const [recoverStatus, setRecoverStatus] = useState(""); // para mensajes del modal

    const submitUser = async (e) => {
        e.preventDefault();
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
        }
    };

    // --- LÓGICA DE RECUPERACIÓN ---
    const handleRecoverSubmit = async (e) => {
        e.preventDefault();
        setRecoverStatus("Enviando...");
        
        // Simulación de llamada a la API
        setTimeout(() => {
            // Aquí iría: await recoverPassword(recoverEmail);
            setRecoverStatus("¡Listo! Revisa tu correo (y spam) para restablecer la clave.");
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
                            
                            {/* --- LINK RECUPERAR --- */}
                            <div className="forgot-pass-wrapper">
                                <span 
                                    className="forgot-pass-link" 
                                    onClick={() => setIsRecoverOpen(true)}
                                >
                                    ¿Olvidaste tu contraseña?
                                </span>
                            </div>
                        </div>

                        <input className="buttonFormAuth" type="submit" value={"Ingresar"} />
                        <p className={mensaje ? "errorMsgForm-active" : "errorMsgForm"}>{mensaje}</p>
                    </form>
                </div>
            </main>

            {/* --- MODAL DE RECUPERACIÓN --- */}
            {isRecoverOpen && (
                <div className="recover-overlay" onClick={() => setIsRecoverOpen(false)}>
                    <div className="recover-card" onClick={(e) => e.stopPropagation()}>
                        <button className="recover-close" onClick={() => setIsRecoverOpen(false)}>&times;</button>
                        
                        <h2 className="recover-title">Recuperar Acceso</h2>
                        <p className="recover-desc">
                            Ingresa tu email y te enviaremos el codigo para restablecer tu contraseña.
                        </p>

                        <form onSubmit={handleRecoverSubmit} className="recover-form">
                            <input 
                                type="email" 
                                className="inputFormAuth" 
                                placeholder="Tu email registrado"
                                value={recoverEmail}
                                onChange={(e) => setRecoverEmail(e.target.value)}
                                required
                            />
                            <button type="submit" className="buttonFormAuth">
                                Enviar Enlace
                            </button>
                            
                            {recoverStatus && (
                                <p className="recover-status-msg">{recoverStatus}</p>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}

export default Login;