import mongoose from "mongoose";

const mesocicloSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true
    },
    macrociclo: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Macrociclo",
      default: null
    },
    titulo: { 
      type: String, 
      required: true 
    },
    objetivo: { type: String }, 
    fechaInicio: { type: Date }, 
    fechaFin: { type: Date },
    estado: { 
      type: String, 
      enum: ['activo', 'pendiente', 'finalizado'], 
      default: 'pendiente' 
    }
  },
  { timestamps: true }
);

export const mesocicloModelo = mongoose.model("Mesociclo", mesocicloSchema);