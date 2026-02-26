import mongoose from "mongoose";

const entrenamientoSchema = new mongoose.Schema(
  {
    dia: {
      type: String,
      enum: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"],
      required: true
    },
    titulo: { type: String, required: true },
    duracion: { type: Number, required: true }, 
    unidad: { type: String, enum: ["minutos", "horas"], default: "minutos" },
    km: { type: Number, default: 0 }, 
    tipo: { type: String, required: true },
    descripcion: { type: String }, 

    completado: { type: Boolean, default: false },

    feedback: {
        comentario: { type: String, default: "" },
        rpe: { type: Number, default: 0 }, 
        kmReal: { type: Number, default: 0 },
        duracionReal:{ type: Number, default: 0 },
        shoeId: { type: String, default: "" } 
    }
  },
  { _id: true } 
);

const planSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true
    },
    
    
    numeroSemana: { type: Number, default: 1 }, // Ej: Semana 1, Semana 2...
    estado: { 
        type: String, 
        enum: ['activo', 'pendiente', 'finalizado'], 
        default: 'pendiente' 
    },
    // ----------------------

    entrenamientos: {
      type: [entrenamientoSchema],
      validate: [
        {
          validator: (v) => v.length === 7,
          message: "El plan debe tener exactamente 7 entrenamientos"
        }
      ]
    }
  },
  { timestamps: true }
);

export const planModelo = mongoose.model("Plan", planSchema);