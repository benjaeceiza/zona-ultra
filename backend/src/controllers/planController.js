
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


// Crea un plan de entrenamiento (Soporta mes completo: 4 semanas)
export const createPlan = async (req, res) => {
  const { idUsuario } = req.params;
  const { entrenamientos } = req.body;

  try {
    const usuario = await usuarioModelo.findById(idUsuario).populate('planes');

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const planesEnCurso = usuario.planes.filter(p => p.estado !== 'finalizado');

    // 🔥 CAMBIO: Ahora el límite es 4
    if (planesEnCurso.length >= 4) {
      return res.status(400).json({ 
        success: false, 
        message: "⚠️ El usuario ya tiene el mes completo (4 semanas cargadas). Esperá a que termine alguna." 
      });
    }

    const estadoInicial = planesEnCurso.length === 0 ? 'activo' : 'pendiente';
    const numeroSemana = (usuario.planes.length % 4) + 1;

    const nuevoPlan = await planModelo.create({
      usuario: idUsuario,
      entrenamientos,
      estado: estadoInicial,
      numeroSemana: numeroSemana
    });

    usuario.planes.push(nuevoPlan._id);
    await usuario.save();

    res.status(201).json({ 
      success: true,
      msg: `Plan creado exitosamente como: ${estadoInicial.toUpperCase()}`, 
      plan: nuevoPlan 
    });

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


// Cierra la semana actual y activa la siguiente en la cola
export const completeCurrentWeek = async (req, res) => {
  const { idUsuario } = req.params;
  try {
    const usuario = await usuarioModelo.findById(idUsuario).populate('planes');
    const planActivo = usuario.planes.find(p => p.estado === 'activo');
    
    if (!planActivo) return res.status(400).json({ message: "No hay semana activa." });

    // Finalizamos la actual
    await planModelo.findByIdAndUpdate(planActivo._id, { estado: 'finalizado' });

    const planesPendientes = usuario.planes.filter(p => p && p.estado === 'pendiente');

    if (planesPendientes.length > 0) {
      // 🔥 ORDEN CRONOLÓGICO: Siempre activar la que se creó primero
      planesPendientes.sort((a, b) => a._id.toString().localeCompare(b._id.toString()));
      
      const planQueSigue = planesPendientes[0]; 
      await planModelo.findByIdAndUpdate(planQueSigue._id, { estado: 'activo' });
    }
    res.json({ success: true, message: "Semana rotada con éxito." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const updatePlan = async (req, res) => {
  const { idPlan } = req.params;
  const { entrenamientos } = req.body;

  try {
    const planActualizado = await planModelo.findByIdAndUpdate(
      idPlan,
      { entrenamientos },
      { new: true } // Para que devuelva el documento ya modificado
    );

    if (!planActualizado) {
      return res.status(404).json({ message: "Plan no encontrado" });
    }

    res.json({ success: true, message: "Plan actualizado correctamente", plan: planActualizado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};


// Traer un solo plan por su ID
export const getPlan = async (req, res) => {
  try {
    const plan = await planModelo.findById(req.params.idPlan);
    if (!plan) return res.status(404).json({ message: "Plan no encontrado" });
    
    // Lo devolvemos adentro de "plan" para que el frontend lo lea bien
    res.json({ success: true, plan }); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};