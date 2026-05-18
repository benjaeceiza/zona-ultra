import mongoose from "mongoose";

const macrocicloSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true
    },
    titulo: { 
      type: String, 
      required: true // Ej: "Preparación Patagonia Run 100k", "Pretemporada 2026"
    },
    objetivo: { type: String },
    fechaInicio: { type: Date }, 
    fechaFin: { type: Date },
    estado: { 
      type: String, 
      enum: ['activo', 'finalizado'], 
      default: 'activo' 
    }
  },
  { timestamps: true }
);

export const macrocicloModelo = mongoose.model("Macrociclo", macrocicloSchema);