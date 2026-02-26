import { usuarioModelo } from "../models/user.model.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();




export const loginUser = async (req, res) => {

    const { email, password } = req.body;

    try {
        const user = await usuarioModelo.findOne({ email });
        if (!user) return res.status(404).json({ message: "Email o Contraseña inválido" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(404).json({ message: "Email o Contraseña inválido" });

        const token = jwt.sign(
            { id: user._id, email: user.email, nickname: user.nombre, rol: user.rol },
            process.env.JWT_SECRET,
            { expiresIn: "12h" }
        );

        res.json({ message: "Login exitoso", token });
    } catch (error) {
        res.status(500).json({ message: "Error en el login", error: error.message });
    }
};

// Registro de usuarios (solo admin)

export const registerUser = async (req, res) => {
    try {
        const { nombre, apellido, email, telefono, password } = req.body;

        const existsEmail = await usuarioModelo.findOne({ email });
        const existsPhone = await usuarioModelo.findOne({ telefono });

        if (existsEmail) {
            return res.status(400).json({ message: "El email ya esta en uso!" })
        }

        if (existsPhone) {
            return res.status(400).json({ message: "El numero ya esta en uso!" })
        }

        if (password.length < 8) {

            return res.status(401).json({ message: "Ingrese una contraseña de 8 o mas caracteres" })
        }


        const hashedPassword = await bcrypt.hash(password, 10);



        const user = await usuarioModelo.create({ nombre, apellido, email, telefono, rol: "user", password: hashedPassword });


        res.status(201).json({ message: "Usuario registrado correctamente", })
    } catch (error) {
        res.status(500).json({ message: "Error al registrar", error: error.message });
    }
}


// 1. GENERAR CÓDIGO Y ENVIAR MAIL
export const sendRecoveryCode = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await usuarioModelo.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "No existe un usuario con ese correo." });
        }

        // Generamos código de 6 dígitos
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Encriptamos
        const salt = await bcrypt.genSalt(10);
        user.recoveryCodeHash = await bcrypt.hash(resetCode, salt);
        
        // 🔥 FIX: Lo ajustamos a 1 hora (60 min * 60 seg * 1000 ms) para que coincida con tu texto
        user.recoveryCodeExpires = Date.now() + 60 * 60 * 1000; 
        await user.save();

        // 🔥 FIX: NOMBRES DE VARIABLES EXACTOS DE TU PLANTILLA
     const emailJsData = {
            service_id: "service_9bojsir", 
            template_id: 'template_7b0zv1z', 
            user_id: "ozycZTfYueG9-OUJR", // Tu Public Key
            accessToken: "_zi5zgrXglo88liywF8tO", 
            template_params: {
                email: user.email,               // Coincide con {{email}}
                recovery_code: resetCode,        // Coincide con {{recovery_code}}
            }
        };

        const emailRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailJsData)
        });

        if (!emailRes.ok) {
            const errText = await emailRes.text();
            console.error("Error de EmailJS:", errText);
            throw new Error("Fallo al enviar el email");
        }

        res.status(200).json({ success: true, message: "Código enviado a tu correo" });

    } catch (error) {
        console.error("Error enviando código:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};


export const verifyRecoveryCode = async (req, res) => {
    const { email, code } = req.body;

    try {
        const user = await usuarioModelo.findOne({ email });
        if (!user || !user.recoveryCodeHash) {
            return res.status(400).json({ message: "Solicitud inválida o expirada." });
        }

        if (Date.now() > user.recoveryCodeExpires) {
            return res.status(400).json({ message: "El código expiró. Solicita uno nuevo." });
        }

        const isMatch = await bcrypt.compare(code, user.recoveryCodeHash);
        if (!isMatch) {
            return res.status(400).json({ message: "El código es incorrecto." });
        }

        // Si todo está bien, le damos luz verde al frontend para mostrar los inputs de contraseña
        res.status(200).json({ success: true, message: "Código verificado correctamente." });

    } catch (error) {
        console.error("Error verificando código:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};


// 2. VERIFICAR CÓDIGO Y CAMBIAR CONTRASEÑA
export const resetPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;

    try {
        const user = await usuarioModelo.findOne({ email });
        if (!user || !user.recoveryCodeHash) {
            return res.status(400).json({ message: "Solicitud inválida o expirada." });
        }

        // Verificamos que no haya expirado (15 minutos)
        if (Date.now() > user.recoveryCodeExpires) {
            return res.status(400).json({ message: "El código expiró. Solicita uno nuevo." });
        }

        // Comparamos el código que ingresó el usuario con el hash guardado
        const isMatch = await bcrypt.compare(code, user.recoveryCodeHash);
        if (!isMatch) {
            return res.status(400).json({ message: "El código es incorrecto." });
        }

        // Todo en orden: Encriptamos la nueva clave
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Limpiamos los campos de recuperación
        user.recoveryCodeHash = undefined;
        user.recoveryCodeExpires = undefined;
        await user.save();

        res.status(200).json({ success: true, message: "Contraseña actualizada con éxito." });

    } catch (error) {
        console.error("Error reseteando clave:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};