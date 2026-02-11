import { useState } from "react";
import { userRegister } from "../../../services/register.js"; 


const Register = () => {

    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [telefono, setTelefono] = useState("");
    
    const [mensaje, setMensaje] = useState(""); 

    const submitUser = async (e) => { 
        e.preventDefault();
        const token = localStorage.getItem("token"); 

        if (!token) {
            setMensaje("No tienes permisos (Falta token)");
            return;
        }

        try {
            const res = await userRegister(nombre, apellido, email, telefono, password, token);

            if (res.success) {
                alert("¡Usuario creado con éxito!");
                setMensaje(""); 
                // Opcional: Podrías limpiar los inputs aquí reseteando los estados
            } else {
                setMensaje(res.message); 
            }
        } catch (error) {
            console.error(error);
            setMensaje("Error inesperado en el frontend");
        }
    }

    return (
        // 2. Agregué la clase 'register-page' para centrar todo en la pantalla
        <main className="register-login-page">
            
            <div className="formAuthContainer">
                <h1 className="titleAuth">Registrar <span>Usuario</span></h1>
                
                <form onSubmit={submitUser} className="formAuth">
                    <input className="inputFormAuth" type="text" placeholder="Nombre" required onChange={(e) => setNombre(e.target.value)} />
                    <input className="inputFormAuth" type="text" placeholder="Apellido" required onChange={(e) => setApellido(e.target.value)} />
                    <input className="inputFormAuth" type="email" placeholder="Correo electrónico" required onChange={(e) => setEmail(e.target.value)} />
                    {/* El CSS se encarga de quitar las flechas feas del number */}
                    <input className="inputFormAuth" type="number" placeholder="Teléfono" required onChange={(e) => setTelefono(e.target.value)} />
                    <input className="inputFormAuth" type="password" placeholder="Contraseña" required onChange={(e) => setPassword(e.target.value)} />
                    
                    <input className="buttonFormAuth" type="submit" value="Crear Cuenta" />
                    
                    {mensaje && <p className="errorMsgForm">{mensaje}</p>}
                </form>
            </div>
        </main>
    )
}

export default Register;