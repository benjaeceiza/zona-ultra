import { Router } from "express";
import { usuarioModelo } from "../models/user.model.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware/auth.js";
import { isAdminMiddleware } from "../middleware/isAdminMiddleware.js";

dotenv.config();

export const router = Router();

//Solo el admin puede crear usuarios
// Register
router.post("/admin/register",authMiddleware,isAdminMiddleware, async (req, res) => {

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

      
        res.status(201).json({message: "Usuario registrado correctamente",})
    } catch (error) {
        res.status(500).json({ message: "Error al registrar", error: error.message });
    }
});




//Login para los usuarios

//Login
router.post("/login", async (req, res) => {
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


});

