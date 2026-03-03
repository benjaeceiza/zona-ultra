import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    telefono: { type: Number, required: true }, 
    rol: String,

    
    nextRace: {
        name: { type: String, default: '' },
        date: { type: Date, default: null }
    },
    recoveryCodeHash: { type: String, default: null },
    recoveryCodeExpires: { type: Date, default: null },
});

export const usuarioModelo = mongoose.model("User", userSchema);