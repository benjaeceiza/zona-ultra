import mongoose from "mongoose";

const entrenamientoSchema = new mongoose.Schema(
  {
    // --- DATOS DEL PLAN (Lo que el profe manda) ---
    dia: {
      type: String,
      enum: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"],
      required: true
    },
    titulo: { type: String, required: true },
    duracion: { type: Number, required: true }, // Duración planificada
    unidad: { type: String, enum: ["minutos", "horas"], default: "minutos" },
    km: { type: Number, default: 0 }, // Km planificados
    tipo: { type: String, required: true },
    descripcion: { type: String }, // Instrucciones del profe

    // --- ESTADO ---
    completado: {
      type: Boolean,
      default: false
    },

    // --- NUEVO ATRIBUTO: FEEDBACK (Lo que pasó en la realidad) ---
    feedback: {
        comentario: { type: String, default: "" },
        rpe: { type: Number, default: 0 },   // Esfuerzo 1-10
        kmReal: { type: Number, default: 0 },
        duracionReal:{ type: Number, default: 0 },
        shoeId: { type: String, default: "" } // ID de la zapatilla usada
    }
  },
  { _id: true } // Importante: true para poder buscarlo por ID
);

const planSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true
    },
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