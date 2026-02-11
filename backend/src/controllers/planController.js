
import { planModelo } from "../models/plan.model.js";
import { usuarioModelo } from "../models/user.model.js";
import Shoe from "../models/shoe.model.js";


export const toggleTrainingStatus = async (req, res) => {
  

  // 1. CORRECCIÓN CLAVE: Sacamos 'id' (que es como viene en tu token)
  const { id } = req.user;
  const { index, completado } = req.body;

  if (!id) {
    return res.status(401).json({ message: "Usuario no identificado en el token" });
  }

  if (index === undefined) {
    return res.status(400).json({ message: "Falta el índice del entrenamiento" });
  }

  try {
    // 2. Buscamos al usuario usando 'id'
    const user = await usuarioModelo.findById(id);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado en la DB" });
    }

    if (!user.plan) {
      return res.status(404).json({ message: "El usuario no tiene un plan asignado" });
    }

    // 3. Agarramos la ID del plan
    const planId = user.plan;

    // 4. Actualizamos el Plan
    const updateField = `entrenamientos.${index}.completado`;

    const planUpdated = await planModelo.findByIdAndUpdate(
      planId,
      {
        $set: { [updateField]: completado }
      },
      { new: true }
    );

    if (!planUpdated) {
      return res.status(404).json({ message: "No se encontró el plan para actualizar" });
    }

    console.log("¡Éxito! Plan actualizado.");
    res.status(200).json({ message: "Progreso guardado", plan: planUpdated });

  } catch (error) {
    console.error("🔥 Error guardando:", error);
    res.status(500).json({ message: "Error interno", error: error.message });
  }
};

//Crea un plan de entrenamiento
export const createPlan = async (req, res) => {

  const { idUsuario } = req.params;
  const { entrenamientos } = req.body;

  try {
    const usuario = await usuarioModelo.findById(idUsuario);
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // 1. Borrar plan anterior si existe
    if (usuario.plan) {
      await planModelo.findByIdAndDelete(usuario.plan);
    }

    // 2. Crear nuevo plan
    // CORRECCIÓN 2: Guardar la referencia del usuario DENTRO del plan
    const nuevoPlan = await planModelo.create({
      entrenamientos,
      usuario: idUsuario // <--- ¡Esto es vital para que funcione el .populate()!
    });

    // 3. Asignar al usuario (Relación bidireccional)
    usuario.plan = nuevoPlan._id;
    await usuario.save();

    res.status(201).json({ msg: "Plan creado y asignado", plan: nuevoPlan });

  } catch (error) {
    console.error("❌ ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}


//actualiza el plan del usuario con el entrenamiento ya cargado

export const submitFeedback = async (req, res) => {
    try {
        // Sacamos los datos limpios del body
        const { trainingId, rpe, comentario, shoeId, kmReal,duracionReal } = req.body;

        console.log(trainingId,rpe,comentario,shoeId,kmReal,duracionReal);
        

        // 1. BUSCAR EL PLAN usando JS nativo para evitar errores de casting raros
        // Buscamos el plan que tenga un entrenamiento con ese ID
        const plan = await planModelo.findOne({ "entrenamientos._id": trainingId });

        if (!plan) {
            return res.status(404).json({ message: "Plan no encontrado" });
        }

        // 2. BUSCAR EL ENTRENAMIENTO DENTRO DEL ARRAY
        // Usamos .id() de mongoose que funciona perfecto si el schema tiene _id: true
        const entrenamiento = plan.entrenamientos.id(trainingId);

        if (!entrenamiento) {
            return res.status(404).json({ message: "Entrenamiento no encontrado" });
        }

        // 3. ACTUALIZAR EL FEEDBACK (Aquí está la magia ✨)
        entrenamiento.completado = true;
        
        // Sobreescribimos el objeto feedback con la info nueva
        entrenamiento.feedback = {
            rpe: Number(rpe),
            comentario: comentario,
            kmReal: Number(kmReal),
            duracionReal: Number(duracionReal),
            shoeId: shoeId || ""
        };

        // 4. LÓGICA DE ZAPATILLAS (Sigue igual, es necesaria)
        if (shoeId && shoeId.length > 5 && kmReal > 0) {
            await Shoe.findByIdAndUpdate(shoeId, { 
                $inc: { currentKm: Number(kmReal) } 
            });
            console.log("👟 Zapatilla actualizada");
        }

        // 5. GUARDAR
        await plan.save();
        
        res.status(200).json({ message: "Feedback guardado exitosamente", data: entrenamiento });

    } catch (error) {
        console.error("Error en submitFeedback:", error);
        res.status(500).json({ message: "Error interno", error: error.message });
    }
};

