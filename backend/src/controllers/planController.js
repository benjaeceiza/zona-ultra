import { planModelo } from "../models/plan.model.js";
import { usuarioModelo } from "../models/user.model.js";
import { mesocicloModelo } from "../models/mesociclo.model.js";
import { macrocicloModelo } from "../models/macrociclo.model.js"; // 🔥 El nuevo padre de todos
import Shoe from "../models/shoe.model.js";

// ==========================================
// 1. MARCAR DÍA COMO COMPLETADO (CHECKBOX)
// ==========================================
export const toggleTrainingStatus = async (req, res) => {
  const { id } = req.user;
  const { index, completado } = req.body;

  if (!id) return res.status(401).json({ message: "Usuario no identificado en el token" });
  if (index === undefined) return res.status(400).json({ message: "Falta el índice del entrenamiento" });

  try {
    const user = await usuarioModelo.findById(id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado en la DB" });

    // Buscamos el plan activo del usuario directamente en la colección de planes
    const planActivo = await planModelo.findOne({ usuario: id, estado: 'activo' });

    if (!planActivo) {
      return res.status(404).json({ message: "El usuario no tiene una semana activa" });
    }

    const updateField = `entrenamientos.${index}.completado`;

    const planUpdated = await planModelo.findByIdAndUpdate(
      planActivo._id,
      { $set: { [updateField]: completado } },
      { new: true }
    );

    res.status(200).json({ message: "Progreso guardado", plan: planUpdated });

  } catch (error) {
    console.error("🔥 Error guardando:", error);
    res.status(500).json({ message: "Error interno", error: error.message });
  }
};

// ==========================================
// 2. CREAR PLAN COMPLETO O SEMANA INDIVIDUAL
// ==========================================
export const createPlan = async (req, res) => {
  const { idUsuario } = req.params;

  // NUEVA ESTRUCTURA QUE ESPERAMOS DEL FRONTEND
  const { esPlanCompleto, datosMacrociclo, mesociclos, semanaIndividual } = req.body;

  try {
    const usuario = await usuarioModelo.findById(idUsuario);
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });

    // Vemos si ya tiene una semana activa para saber si las nuevas arrancan en 'pendiente' o 'activo'
    const planActivoExistente = await planModelo.findOne({ usuario: idUsuario, estado: 'activo' });
    const estadoInicialParaPrimera = planActivoExistente ? 'pendiente' : 'activo';

    // ========================================================
    // CASO A: ES UN PLAN COMPLETO (Macrociclo -> Mesos -> Semanas)
    // ========================================================
    if (esPlanCompleto && datosMacrociclo && mesociclos) {

      const planCompletoEnCurso = await planModelo.findOne({
        usuario: idUsuario,
        macrociclo: { $ne: null }, // Si tiene el campo macrociclo, es un plan completo
        estado: { $ne: 'finalizado' } // Y si no está finalizado...
      });

      if (planCompletoEnCurso) {
        return res.status(400).json({
          success: false,
          message: "El alumno ya tiene un plan de entrenamiento en curso. Debe finalizarlo o eliminarlo para asignar uno nuevo."
        });
      }

      // 🔥 ESTRATEGIA 1 (LIMPIEZA AUTOMÁTICA):
      // Antes de crear el plan nuevo, borramos toda la basura suelta 
      // que haya quedado pendiente del pasado para que no trabe la fila.
      await planModelo.deleteMany({
        usuario: idUsuario,
        $or: [
          { mesociclo: null },
          { mesociclo: { $exists: false } } // Por si quedaron sin el campo
        ],
        estado: { $ne: 'finalizado' } // No tocamos el historial de lo que ya corrió
      });

      // 1. Creamos el PADRE (Macrociclo)
      const nuevoMacrociclo = new macrocicloModelo({
        usuario: idUsuario,
        titulo: datosMacrociclo.titulo,
        objetivo: datosMacrociclo.objetivo || "",
        fechaInicio: datosMacrociclo.fechaInicio,
        fechaFin: datosMacrociclo.fechaFin
      });
      const macrocicloGuardado = await nuevoMacrociclo.save();

      let planesAInsertar = [];
      let isFirstWeek = true;

      // 2. Iteramos los HIJOS (Mesociclos)
      for (let i = 0; i < mesociclos.length; i++) {
        const mesoData = mesociclos[i];

        const nuevoMesociclo = new mesocicloModelo({
          usuario: idUsuario,
          macrociclo: macrocicloGuardado._id, // Lo atamos al padre
          titulo: mesoData.titulo || `Mesociclo ${i + 1}`,
          objetivo: mesoData.objetivo || "",
        });
        const mesocicloGuardado = await nuevoMesociclo.save();

        // 3. Preparamos los NIETOS (Las Semanas/Planes de este mesociclo)
        if (mesoData.semanas && mesoData.semanas.length > 0) {
          mesoData.semanas.forEach((semana) => {
            planesAInsertar.push({
              usuario: idUsuario,
              macrociclo: macrocicloGuardado._id, 
              mesociclo: mesocicloGuardado._id, 
              numeroSemana: semana.numeroSemana,
              tipoMicrociclo: semana.tipoMicrociclo || "",
              estado: isFirstWeek ? estadoInicialParaPrimera : 'pendiente',
              entrenamientos: semana.entrenamientos
            });
            isFirstWeek = false; 
          });
        }
      }

      // 4. Guardamos todas las semanas de un solo golpe en la BD
      if (planesAInsertar.length > 0) {
        await planModelo.insertMany(planesAInsertar);
      }

      return res.status(201).json({
        success: true,
        msg: `Plan '${datosMacrociclo.titulo}' con ${mesociclos.length} bloques creado exitosamente`,
        macrociclo: macrocicloGuardado
      });

    }
    // ========================================================
    // CASO B: ES UNA SEMANA INDIVIDUAL/SUELTA
    // ========================================================
    else if (semanaIndividual) {
      const nuevoPlan = await planModelo.create({
        usuario: idUsuario,
        mesociclo: null,
        numeroSemana: semanaIndividual.numeroSemana || 1,
        tipoMicrociclo: semanaIndividual.tipoMicrociclo || "", 
        estado: estadoInicialParaPrimera,
        entrenamientos: semanaIndividual.entrenamientos
      });

      return res.status(201).json({
        success: true,
        msg: `Semana individual asignada exitosamente`,
        plan: nuevoPlan
      });
    }

    // ERROR: Si mandan un body raro o incompleto
    else {
      return res.status(400).json({ success: false, message: "Datos incompletos para armar el entrenamiento." });
    }

  } catch (error) {
    console.error("❌ ERROR EN CREATE PLAN:", error);
    res.status(500).json({ error: error.message });
  }
}

// ==========================================
// 3. ENVIAR FEEDBACK DEL DÍA (RPE, KM, ETC)
// ==========================================
export const submitFeedback = async (req, res) => {
  try {
    const { trainingId, rpe, comentario, shoeId, kmReal, duracionReal } = req.body;

    const plan = await planModelo.findOne({ "entrenamientos._id": trainingId });
    if (!plan) return res.status(404).json({ message: "Plan no encontrado" });

    const entrenamiento = plan.entrenamientos.id(trainingId);
    if (!entrenamiento) return res.status(404).json({ message: "Entrenamiento no encontrado" });

    entrenamiento.completado = true;

    entrenamiento.feedback = {
      rpe: Number(rpe),
      comentario: comentario,
      kmReal: Number(kmReal),
      duracionReal: Number(duracionReal),
      shoeId: shoeId || "",
      noLogrado: Boolean(req.body.noLogrado)
    };

    if (shoeId && shoeId.length > 5 && kmReal > 0) {
      await Shoe.findByIdAndUpdate(shoeId, { $inc: { currentKm: Number(kmReal) } });
    }

    await plan.save();
    res.status(200).json({ message: "Feedback guardado exitosamente", data: entrenamiento });

  } catch (error) {
    console.error("Error en submitFeedback:", error);
    res.status(500).json({ message: "Error interno", error: error.message });
  }
};

// ==========================================
// 4. ROTAR SEMANA (CERRAR ACTUAL, ABRIR SIGUIENTE)
// ==========================================
export const completeCurrentWeek = async (req, res) => {
  const { idUsuario } = req.params;
  
  try {
    // Buscamos cuál es la semana que el usuario está corriendo hoy
    const planActivo = await planModelo.findOne({ usuario: idUsuario, estado: 'activo' });
    
    if (!planActivo) return res.status(400).json({ message: "No hay ninguna semana activa para cerrar." });

    // 1. Cerramos la semana actual pasándola a finalizado
    await planModelo.findByIdAndUpdate(planActivo._id, { estado: 'finalizado' });

    // 2. Revisamos inmediatamente si quedan microciclos pendientes en la cola
    const planesPendientes = await planModelo.find({ usuario: idUsuario, estado: 'pendiente' });

    if (planesPendientes.length > 0) {
      // CASO A: Todavía quedan semanas en el plan. Activamos la que sigue normalmente.
      planesPendientes.sort((a, b) => a._id.toString().localeCompare(b._id.toString()));
      const planQueSigue = planesPendientes[0]; 
      
      await planModelo.findByIdAndUpdate(planQueSigue._id, { estado: 'activo' });
      
      return res.json({ 
        success: true, 
        message: `Semana finalizada. Se activó el Microciclo/Semana ${planQueSigue.numeroSemana}.` 
      });
      
    } else {
      // CASO B: ¡ELEGANCIA! No quedaron semanas pendientes en la base de datos.
      // Si la semana que acabamos de cerrar pertenecía a un Macrociclo...
      if (planActivo.macrociclo) {
        // 🔥 CERRAMOS EL CANDADO PADRE: Pasamos el macrociclo entero a finalizado
        await macrocicloModelo.findByIdAndUpdate(planActivo.macrociclo, { estado: 'finalizado' });
        
        return res.json({ 
          success: true, 
          macroPlanCompletado: true,
          message: "¡Felicitaciones! Se completó el microciclo final. Toda la periodización general ha sido archivada con éxito." 
        });
      }
      
      return res.json({ success: true, message: "Se completó la última semana suelta disponible." });
    }
    
  } catch (error) {
    console.error("Error al rotar la semana:", error);
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// 5. ACTUALIZAR EJERCICIOS DE UN PLAN
// ==========================================
export const updatePlan = async (req, res) => {
  const { idPlan } = req.params;
  // 🔥 AHORA RECIBIMOS TAMBIÉN EL TIPO DE MICROCICLO
  const { entrenamientos, tipoMicrociclo } = req.body; 

  try {
    const planActualizado = await planModelo.findByIdAndUpdate(
      idPlan,
      { entrenamientos, tipoMicrociclo }, // 🔥 LO ACTUALIZAMOS ACÁ
      { new: true } 
    );

    if (!planActualizado) return res.status(404).json({ message: "Plan no encontrado" });

    res.json({ success: true, message: "Plan actualizado correctamente", plan: planActualizado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// 6. OBTENER UN PLAN ESPECÍFICO
// ==========================================
export const getPlan = async (req, res) => {
  try {
    // Le agregamos populate para que traiga la info del mesociclo al que pertenece
    const plan = await planModelo.findById(req.params.idPlan).populate('mesociclo');
    if (!plan) return res.status(404).json({ message: "Plan no encontrado" });

    res.json({ success: true, plan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const deletePlan = async (req, res) => {
  try {
    // 🔥 MAGIA: Buscamos el ID con ambos nombres por las dudas
    const idA_Borrar = req.params.idPlan || req.params.id;

    if (!idA_Borrar) {
      return res.status(400).json({ message: "No se proporcionó el ID del plan a eliminar." });
    }

    // 1. Eliminamos el plan de la base de datos
    const planBorrado = await planModelo.findByIdAndDelete(idA_Borrar);

    if (!planBorrado) {
      return res.status(404).json({ message: "Plan no encontrado en la base de datos." });
    }

    const userId = planBorrado.usuario.toString();

    // 2. Buscamos todas las semanas que le quedaron al alumno, en orden de creación
    const semanasRestantes = await planModelo.find({
      usuario: userId,
      estado: { $ne: 'finalizado' }
    }).sort({ _id: 1 });

    let encontradaPrimeraActiva = false;
    let contadoresPorMesociclo = {};
    let contadorSueltas = 1;

    // 3. Recorremos lo que quedó y re-asignamos números y estados
    for (let i = 0; i < semanasRestantes.length; i++) {
      const semana = semanasRestantes[i];
      let nuevoNumero;

      // Numeración separada para Mesociclos y Sueltas
      if (semana.mesociclo) {
        const idMesoStr = semana.mesociclo.toString();
        if (!contadoresPorMesociclo[idMesoStr]) {
          contadoresPorMesociclo[idMesoStr] = 1;
        }
        nuevoNumero = contadoresPorMesociclo[idMesoStr];
        contadoresPorMesociclo[idMesoStr]++;
      } else {
        nuevoNumero = contadorSueltas;
        contadorSueltas++;
      }

      let nuevoEstado = semana.estado;

      // 🔥 LA CLAVE: El primero de la lista que no esté finalizado, se vuelve ACTIVO
      if (!encontradaPrimeraActiva) {
        nuevoEstado = 'activo';
        encontradaPrimeraActiva = true;
      } else {
        nuevoEstado = 'pendiente';
      }

      // Actualizamos en la DB
      await planModelo.findByIdAndUpdate(
        semana._id,
        { numeroSemana: nuevoNumero, estado: nuevoEstado },
        { new: true }
      );
    }

    res.status(200).json({ success: true, message: "Microciclo eliminado. La cola avanzó correctamente." });

  } catch (error) {
    console.error("❌ ERROR EN DELETE:", error);
    res.status(500).json({ message: "Error interno del servidor", details: error.message });
  }
};


export const deleteFullMacro = async (req, res) => {
    try {
        const { idMacro } = req.params;

        // 1. Borramos el Macrociclo
        await macrocicloModelo.findByIdAndDelete(idMacro);
        // 2. Borramos todos sus Mesociclos hijos
        await mesocicloModelo.deleteMany({ macrociclo: idMacro });
        // 3. Borramos todas las semanas que estuvieran atadas al macro
        await planModelo.deleteMany({ macrociclo: idMacro }); 
        // Nota: Asegurate de que planModelo tenga el campo 'macrociclo' como hablamos en el paso anterior. Si no, borralos buscando por los mesociclos eliminados.

        res.status(200).json({ success: true, message: "Plan completo erradicado." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};