
import mongoose from "mongoose";

const raceSchema = new mongoose.Schema({

    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    nombreCarrera: { type: String, required: true }, // Ej: "Amanecer Comechingón"
    distancia: { type: Number, required: true }, // En Km, ej: 42
    fecha: { type: String, required: true }, // Ej: "2026-05-15"
    lugar: { type: String }, // Ej: "Villa Yacanto, Córdoba"
    
    // Tiempos y Posiciones
    tiempoOficial: { type: String, required: true }, // Formato "HH:MM:SS"
    posicionGeneral: { type: Number },
    posicionCategoria: { type: Number },
    categoria: { type: String }, // Ej: "Masculino 18-29"
    
    // Fotos y Extras
    fotos: [{ type: String }], // URLs de las fotos (subidas a Firebase Storage, Cloudinary, etc.)
    comentario: { type: String } // Breve reseña de la experiencia
}, { timestamps: true });

export const raceModelo = mongoose.model("Race", raceSchema);