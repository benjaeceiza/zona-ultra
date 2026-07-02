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
  const { esPlanCompleto, datosMacrociclo, mesociclos, semanaIndividual } = req.body;

  try {
    const usuario = await usuarioModelo.findById(idUsuario);
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });

    // 🔥 1. CANDADO ESTRICTO: Solo un Macrociclo a la vez por usuario.
    if (esPlanCompleto) {
        // CORRECCIÓN: Ahora buscamos si el usuario tiene alguna SEMANA perteneciente 
        // a un Macrociclo que todavía no esté finalizada (ya sea pendiente o activa).
        const semanaDeMacroViva = await planModelo.findOne({
            usuario: idUsuario,
            macrociclo: { $ne: null }, // Que pertenezca a un plan completo
            estado: { $ne: 'finalizado' } // Que NO esté terminada
        });

        if (semanaDeMacroViva) {
            return res.status(400).json({
                success: false,
                message: `El atleta ya tiene un Plan Completo en curso (aún le quedan semanas). Debe finalizarlo antes de asignar uno nuevo.`
            });
        }
    }

    // 🔥 2. SISTEMA DE COLA UNIVERSAL:
    // Buscamos si hay ALGUNA semana activa o pendiente (sea suelta o de un plan)
    const planOcupado = await planModelo.findOne({ 
        usuario: idUsuario, 
        estado: { $in: ['activo', 'pendiente'] } 
    });
    
    // Si hay algo en curso, lo nuevo nace "pendiente" y se va al fondo de la fila
    const estadoInicialParaPrimera = planOcupado ? 'pendiente' : 'activo';

    // ========================================================
    // CASO A: ES UN PLAN COMPLETO (Macrociclo -> Mesos -> Semanas)
    // ========================================================
    if (esPlanCompleto && datosMacrociclo && mesociclos) {

      const nuevoMacrociclo = new macrocicloModelo({
        usuario: idUsuario,
        titulo: datosMacrociclo.titulo,
        objetivo: datosMacrociclo.objetivo || "",
        fechaInicio: datosMacrociclo.fechaInicio,
        fechaFin: datosMacrociclo.fechaFin,
        estado: 'activo' 
      });
      const macrocicloGuardado = await nuevoMacrociclo.save();

      let planesAInsertar = [];
      let isFirstWeek = true;

      for (let i = 0; i < mesociclos.length; i++) {
        const mesoData = mesociclos[i];

        const nuevoMesociclo = new mesocicloModelo({
          usuario: idUsuario,
          macrociclo: macrocicloGuardado._id, 
          titulo: mesoData.titulo || `Mesociclo ${i + 1}`,
          objetivo: mesoData.objetivo || "",
        });
        const mesocicloGuardado = await nuevoMesociclo.save();

        if (mesoData.semanas && mesoData.semanas.length > 0) {
          mesoData.semanas.forEach((semana, wIndex) => {
            planesAInsertar.push({
              usuario: idUsuario,
              macrociclo: macrocicloGuardado._id, 
              mesociclo: mesocicloGuardado._id, 
              numeroSemana: wIndex + 1, 
              tipoMicrociclo: semana.tipoMicrociclo || "",
              estado: isFirstWeek ? estadoInicialParaPrimera : 'pendiente',
              entrenamientos: semana.entrenamientos
            });
            isFirstWeek = false; 
          });
        }
      }

      if (planesAInsertar.length > 0) {
        await planModelo.insertMany(planesAInsertar);
      }

      return res.status(201).json({
        success: true,
        msg: `Plan estructurado creado y encolado correctamente.`,
        macrociclo: macrocicloGuardado
      });

    }
    // ========================================================
    // CASO B: ES UNA SEMANA INDIVIDUAL/SUELTA
    // ========================================================
    else if (semanaIndividual) {
      
      const cantidadSueltas = await planModelo.countDocuments({ usuario: idUsuario, mesociclo: null });

      const nuevoPlan = await planModelo.create({
        usuario: idUsuario,
        mesociclo: null,
        numeroSemana: cantidadSueltas + 1,
        tipoMicrociclo: semanaIndividual.tipoMicrociclo || "", 
        estado: estadoInicialParaPrimera,
        entrenamientos: semanaIndividual.entrenamientos
      });

      return res.status(201).json({
        success: true,
        msg: `Semana encolada exitosamente al calendario del atleta.`,
        plan: nuevoPlan
      });
    }

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
export const addMicrociclo = async (req, res) => {
  try {
    const { usuarioId, macrocicloId, mesocicloId } = req.body;
    const idDelUsuario = typeof usuarioId === 'object' ? usuarioId._id : usuarioId;

    const diasVacios = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"].map(dia => ({
      dia, titulo: "", tipo: "", duracion: 0, unidad: "minutos", km: 0, descripcion: "", completado: false
    }));

    const nuevoPlan = new planModelo({
      usuario: idDelUsuario, 
      macrociclo: macrocicloId, 
      mesociclo: mesocicloId,
      estado: 'pendiente', 
      entrenamientos: diasVacios, 
      numeroSemana: 999 
    });
    await nuevoPlan.save();

    // 🔥 CORRECCIÓN: Buscamos y ordenamos únicamente los planes de ESTE mesociclo
    const planesDelMeso = await planModelo.find({ mesociclo: mesocicloId });
    
    planesDelMeso.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeA - timeB; 
    });

    // Renumeramos de 1 a N dentro de este bloque
    const updates = planesDelMeso.map((plan, index) => 
        planModelo.findByIdAndUpdate(plan._id, { numeroSemana: index + 1 })
    );
    await Promise.all(updates);

    res.json({ success: true, message: "Microciclo agregado y mesociclo renumerado" });
  } catch (error) { 
      console.error("🔥 ERROR EN ADD-MICROCYCLE:", error);
      res.status(500).json({ error: error.message }); 
  }
};


export const deleteMicrociclo = async (req, res) => {
  try {
    const planABorrar = await planModelo.findById(req.params.idPlan);
    if (!planABorrar) {
        return res.status(404).json({ error: "No se encontró el plan a borrar" });
    }

    const mesocicloId = planABorrar.mesociclo;

    // 1. Borramos la semana seleccionada
    await planModelo.findByIdAndDelete(req.params.idPlan);

    // 🔥 CORRECCIÓN: Si es parte de un plan completo, reordenamos solo ese mesociclo
    if (mesocicloId) {
        const planesDelMeso = await planModelo.find({ mesociclo: mesocicloId });
        
        planesDelMeso.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeA - timeB;
        });

        // Tapamos el bache renumerando desde 1 de nuevo
        const updates = planesDelMeso.map((plan, index) => 
            planModelo.findByIdAndUpdate(plan._id, { numeroSemana: index + 1 })
        );
        await Promise.all(updates);
    }

    res.json({ success: true, message: "Microciclo eliminado y mesociclo renumerado" });
  } catch (error) { 
      console.error("🔥 ERROR EN DELETE-MICROCYCLE:", error);
      res.status(500).json({ error: error.message }); 
  }
};


//  Obtener historial paginado
export const getHistorialUsuario = async (req, res) => {
  try {
    const { idUsuario } = req.params;
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5; 
    const skip = (page - 1) * limit;

    const query = { usuario: idUsuario, estado: 'finalizado' };

    const totalPlanes = await planModelo.countDocuments(query);
    
    const planes = await planModelo.find(query)
      .populate('macrociclo', 'titulo')
      .populate('mesociclo', 'titulo')
      // ❌ ANTES: .sort({ updatedAt: -1 })
      // ✅ AHORA: Ordenamos por _id. 
      // Si usás -1 te trae lo último creado arriba de todo (ideal para historial).
      // Si preferís orden cronológico natural (Micro 1, 2, 3, 4), poné 1.
      .sort({ _id: -1 }) 
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      planes,
      totalPages: Math.ceil(totalPlanes / limit),
      currentPage: page,
      totalHistorico: totalPlanes
    });
  } catch (error) {
    console.error("❌ ERROR EN HISTORIAL:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};