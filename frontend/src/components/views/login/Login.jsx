import { useState } from "react";
import { userLogin } from "../../../services/login.js";
import { useNavigate } from "react-router-dom";


const Login = () => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mensaje, setMensaje] = useState("")
    const navigate = useNavigate();

    const submitUser = async (e) => {
        e.preventDefault();

        try {
            const res = await userLogin(email, password);

            /**
             * ⬇️ userLogin DEBE devolver algo así:
             * { token: "eyJhbGciOi..." }
             */
            if (res?.token) {
                // 🔥 ESTO actualiza el navbar
                navigate("/");


            } else {
                setMensaje(res || "Credenciales incorrectas");
            }
        } catch (err) {
            console.error(err);
            setMensaje("Error al iniciar sesión");
        }
    };

    return (
        <>
            <main id="loginContainer" className="register-login-page">
                <div className="formAuthContainer">
                    <h1 className="titleAuth">Iniciar <span>Sesion</span></h1>
                    <form onSubmit={submitUser} className="formAuth" >
                        <input className="inputFormAuth" type="email" id="email" placeholder="Correo electronico" required onChange={(e) => setEmail(e.target.value)} />
                        <input className="inputFormAuth" type="password" id="password" placeholder="Contraseña" required onChange={(e) => setPassword(e.target.value)} />
                        <input className="buttonFormAuth" type="submit" value={"Ingresar"} />
                        <p className={mensaje ? "errorMsgForm-active" : "errorMsgForm"}>{mensaje}</p>
                    </form>
                </div>
            </main>
        </>
    )
}

export default Login;