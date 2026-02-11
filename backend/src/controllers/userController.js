
import { usuarioModelo } from "../models/user.model.js"





//Le agrega al usuario una nueva carrera.
export const updateNextRace = async (req, res) => {
    const { id } = req.params; // El ID del usuario
    const { name, date } = req.body; // Los datos que vienen del front

    try {
        // Buscamos y actualizamos. 
        // { new: true } nos devuelve el usuario ya actualizado.
        const user = await usuarioModelo.findByIdAndUpdate(
            id,
            {
                $set: {
                    "nextRace.name": name,
                    "nextRace.date": date
                }
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        return res.status(200).json({
            message: "Objetivo actualizado con éxito",
            nextRace: user.nextRace
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al actualizar la carrera", error });
    }
};