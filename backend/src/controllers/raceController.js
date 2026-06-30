
import { raceModelo } from "../models/race.model.js"


// @desc    Agregar una nueva carrera al medallero
// @route   POST /api/races
export const addRace = async (req, res) => {
    try {
        const {
            usuario, nombreCarrera, distancia, fecha, lugar,
            tiempoOficial, posicionGeneral, posicionCategoria,
            categoria, fotos, comentario
        } = req.body;

        // Validación básica de campos obligatorios
        if (!usuario || !nombreCarrera || !distancia || !tiempoOficial) {
            return res.status(400).json({
                success: false,
                message: "Faltan campos obligatorios (usuario, nombre, distancia o tiempo)."
            });
        }

        const nuevaCarrera = new raceModelo({
            usuario,
            nombreCarrera,
            distancia: Number(distancia),
            fecha,
            lugar,
            tiempoOficial,
            posicionGeneral: posicionGeneral ? Number(posicionGeneral) : null,
            posicionCategoria: posicionCategoria ? Number(posicionCategoria) : null,
            categoria,
            fotos, // Viene el array de URLs desde el frontend
            comentario
        });

        await nuevaCarrera.save();

        res.status(201).json({
            success: true,
            message: "¡Carrera agregada con éxito al medallero!",
            data: nuevaCarrera
        });
    } catch (error) {
        console.error("Error en addRace controller:", error);
        res.status(500).json({ success: false, message: "Error interno al guardar la carrera." });
    }
};


// @desc    Obtener todas las carreras de un usuario
// @route   GET /api/races/user/:idUsuario
// @access  Private
export const getMedalleroByUser = async (req, res) => {
    try {
        const { idUsuario } = req.params;

        if (!idUsuario) {
            return res.status(400).json({ success: false, message: "El ID de usuario es requerido." });
        }

        // Trae las carreras y las ordena por fecha de la más reciente a la más vieja
        const carreras = await raceModelo.find({ usuario: idUsuario }).sort({ fecha: -1 });

        res.status(200).json({
            success: true,
            count: carreras.length,
            data: carreras
        });
    } catch (error) {
        console.error("Error en getMedalleroByUser controller:", error);
        res.status(500).json({ success: false, message: "Error interno al obtener el medallero." });
    }
};



export const updateRace = async (req, res) => {
    try {
        const { id } = req.params;
        
        const carreraActualizada = await raceModelo.findByIdAndUpdate(id, req.body, { new: true });
        
        if (!carreraActualizada) {
            return res.status(404).json({ success: false, message: "Carrera no encontrada." });
        }
        
        res.status(200).json({ success: true, message: "¡Carrera actualizada!", data: carreraActualizada });
    } catch (error) {
        console.error("Error en updateRace:", error);
        res.status(500).json({ success: false, message: "Error al actualizar la carrera." });
    }
};


export const deleteRace = async (req, res) => {
    try {
        const { id } = req.params;
        
        const carreraEliminada = await raceModelo.findByIdAndDelete(id);
        
        if (!carreraEliminada) {
            return res.status(404).json({ success: false, message: "Carrera no encontrada." });
        }
        
        res.status(200).json({ success: true, message: "Carrera eliminada correctamente del medallero." });
    } catch (error) {
        console.error("Error en deleteRace:", error);
        res.status(500).json({ success: false, message: "Error al eliminar la carrera." });
    }
};