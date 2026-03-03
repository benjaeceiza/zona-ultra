import { usuarioModelo } from "../models/user.model.js";
import { planModelo } from "../models/plan.model.js"; // 🔥 IMPORTANTE: Asegurate de importar el modelo de planes acá
import bcrypt from "bcrypt";

// Le agrega al usuario una nueva carrera.
export const updateNextRace = async (req, res) => {
    const { id } = req.params; 
    const { name, date } = req.body; 

    try {
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

export const updateUserAdmin = async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, email, telefono, rol } = req.body;

    try {
        const userToUpdate = await usuarioModelo.findById(id);

        if (!userToUpdate) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        if (email && email !== userToUpdate.email) {
            const emailExists = await usuarioModelo.findOne({ email });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: "El email ya está en uso por otro usuario."
                });
            }
        }

        const updateData = {
            nombre: nombre || userToUpdate.nombre,
            apellido: apellido || userToUpdate.apellido,
            email: email || userToUpdate.email,
            telefono: telefono || userToUpdate.telefono,
            rol: rol || userToUpdate.rol
        };

        const updatedUser = await usuarioModelo.findByIdAndUpdate(id, updateData, { new: true }).select("-password");

        return res.status(200).json({
            success: true,
            message: "Usuario actualizado correctamente",
            user: updatedUser
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Error en el servidor al actualizar usuario"
        });
    }
};

// 🔥 ACÁ ESTÁ EL CAMBIO CLAVE DE LIMPIEZA
export const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await usuarioModelo.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        // --- ZONA DE LIMPIEZA (CASCADA) ACTIVADA ---
        // Borramos todos los planes que tengan el ID de este usuario
        await planModelo.deleteMany({ usuario: id });
        
        // Si tenés modelo de Zapatillas, descomentá esto y asegurate de importarlo arriba:
        // await shoeModelo.deleteMany({ userId: id });
        // ------------------------------------------

        // Finalmente, eliminamos al usuario
        await usuarioModelo.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Usuario y todo su historial eliminados correctamente"
        });

    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        return res.status(500).json({
            success: false,
            message: "Error del servidor al eliminar"
        });
    }
};

export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, email, telefono, rol, newPassword } = req.body;

    try {
        const userToUpdate = await usuarioModelo.findById(id);

        if (!userToUpdate) {
            return res.status(404).json({ 
                success: false, 
                message: "Usuario no encontrado" 
            });
        }

        if (email && email !== userToUpdate.email) {
            const emailExists = await usuarioModelo.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ 
                    success: false, 
                    message: "El email ya está en uso." 
                });
            }
        }

        const updateData = {
            nombre: nombre || userToUpdate.nombre,
            apellido: apellido || userToUpdate.apellido,
            email: email || userToUpdate.email,
            telefono: telefono || userToUpdate.telefono,
            rol: rol || userToUpdate.rol 
        };

        if (newPassword) {
            if (newPassword.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: "La contraseña debe tener mínimo 8 caracteres."
                });
            }

            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(newPassword, salt);
        }

        const updatedUser = await usuarioModelo.findByIdAndUpdate(id, updateData, { new: true }).select("-password");

        return res.status(200).json({
            success: true,
            message: "Perfil actualizado correctamente",
            user: updatedUser
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ 
            success: false, 
            message: "Error en el servidor al actualizar" 
        });
    }
};