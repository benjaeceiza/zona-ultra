
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
    // 1. Buscamos al usuario NORMAL (Sin populate)
    const usuario = await usuarioModelo.findById(idUsuario);

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // 2. Buscamos todos los planes de este usuario en la BD de planes
    const planesDelUsuario = await planModelo.find({ usuario: idUsuario });

    // Filtramos los que están en curso
    const planesEnCurso = planesDelUsuario.filter(p => p.estado !== 'finalizado');

    // Límite de 4
    if (planesEnCurso.length >= 4) {
      return res.status(400).json({ 
        success: false, 
        message: "⚠️ El usuario ya tiene el mes completo (4 semanas cargadas). Esperá a que termine alguna." 
      });
    }

    const estadoInicial = planesEnCurso.length === 0 ? 'activo' : 'pendiente';
    // Calculamos el número de semana basado en el total de planes que tiene el usuario
    const numeroSemana = (planesDelUsuario.length % 4) + 1;

    // 3. Creamos el plan
    const nuevoPlan = await planModelo.create({
      usuario: idUsuario,
      entrenamientos,
      estado: estadoInicial,
      numeroSemana: numeroSemana
    });

    // 🔥 MAGIA: Ya no hacemos push() al usuario ni lo guardamos. El plan ya se asoció gracias al "usuario: idUsuario" arriba.

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
            shoeId: shoeId || "",
            noLogrado: Boolean(req.body.noLogrado)
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

export const completeCurrentWeek = async (req, res) => {
  const { idUsuario } = req.params;
  
  try {
    // 1. Buscamos DIRECTAMENTE en la colección de planes el que esté activo para este usuario
    const planActivo = await planModelo.findOne({ usuario: idUsuario, estado: 'activo' });
    
    if (!planActivo) {
        return res.status(400).json({ message: "No hay semana activa." });
    }

    // 2. Finalizamos la semana actual
    await planModelo.findByIdAndUpdate(planActivo._id, { estado: 'finalizado' });

    // 3. Buscamos todos los planes que estén pendientes para este usuario
    const planesPendientes = await planModelo.find({ usuario: idUsuario, estado: 'pendiente' });

    if (planesPendientes.length > 0) {
      // 🔥 ORDEN CRONOLÓGICO: Siempre activar la que se creó primero
      planesPendientes.sort((a, b) => a._id.toString().localeCompare(b._id.toString()));
      
      const planQueSigue = planesPendientes[0]; 
      await planModelo.findByIdAndUpdate(planQueSigue._id, { estado: 'activo' });
    }
    
    res.json({ success: true, message: "Semana rotada con éxito." });
    
  } catch (error) {
    console.error("Error al rotar la semana:", error);
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


export const deletePlan = async (req, res) => {
    const { idPlan } = req.params;

    try {
        const planBorrado = await planModelo.findByIdAndDelete(idPlan);
        
        if (!planBorrado) {
            return res.status(404).json({ message: "Plan no encontrado" });
        }

        const userId = planBorrado.usuario.toString();

        // 1. Traemos TODAS las semanas del usuario para no perder el hilo de la numeración
        const todasLasSemanas = await planModelo.find({ usuario: userId }).sort({ _id: 1 });

        let encontradaPrimeraActiva = false;

        // 2. Iteramos sobre todas las que quedaron
        for (let i = 0; i < todasLasSemanas.length; i++) {
            const semana = todasLasSemanas[i];
            
            // La numeración es estricta según su posición (1, 2, 3...)
            const nuevoNumero = i + 1; 
            let nuevoEstado = semana.estado;

            // 3. Lógica de estados: 
            // Si ya estaba finalizada, ni la tocamos.
            if (semana.estado !== 'finalizado') {
                // Si es la primera que vemos que NO está finalizada, la activamos
                if (!encontradaPrimeraActiva) {
                    nuevoEstado = 'activo';
                    encontradaPrimeraActiva = true;
                } else {
                    // Si ya encontramos la activa, las demás que sigan son pendientes
                    nuevoEstado = 'pendiente';
                }
            }

            // Guardamos los cambios
            await planModelo.findByIdAndUpdate(
                semana._id,
                { numeroSemana: nuevoNumero, estado: nuevoEstado },
                { new: true }
            );
        }

        res.status(200).json({ success: true, message: "Plan eliminado, reordenado y numerado perfecto." });
        
    } catch (error) {
        console.error("❌ ERROR EN DELETE:", error);
        res.status(500).json({ error: error.message });
    }
};