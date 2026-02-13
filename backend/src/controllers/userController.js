
import { usuarioModelo } from "../models/user.model.js";
import bcrypt from "bcrypt";


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



export const updateUserAdmin = async (req, res) => {
    const { id } = req.params;
    // Desestructuramos solo lo que permitimos actualizar para evitar inyecciones de datos raros
    const { nombre, apellido, email, telefono, rol } = req.body;

    try {
        // 1. Buscamos al usuario actual
        const userToUpdate = await usuarioModelo.findById(id);

        if (!userToUpdate) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        // 2. VALIDACIÓN DE EMAIL:
        // Si viene un email y es distinto al que ya tenía, verificamos que no esté ocupado.
        if (email && email !== userToUpdate.email) {
            const emailExists = await usuarioModelo.findOne({ email });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: "El email ya está en uso por otro usuario."
                });
            }
        }

        // 3. Preparamos el objeto con los datos nuevos
        // Usamos el operador || para mantener el dato viejo si no envían nada nuevo
        const updateData = {
            nombre: nombre || userToUpdate.nombre,
            apellido: apellido || userToUpdate.apellido,
            email: email || userToUpdate.email,
            telefono: telefono || userToUpdate.telefono,
            rol: rol || userToUpdate.rol
        };

        // 4. Ejecutamos la actualización
        // { new: true } es clave: devuelve el objeto YA actualizado, no el viejo.
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


export const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Verificamos que exista primero (opcional, findByIdAndDelete ya lo maneja, pero sirve para validar)
        const user = await usuarioModelo.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        // --- ZONA DE LIMPIEZA (CASCADA) ---
        // Aquí podrías borrar sus planes para no dejar datos huérfanos
        // await Plan.deleteMany({ usuario: id });
        // await Shoe.deleteMany({ userId: id });
        // ----------------------------------

        // 2. Eliminamos al usuario
        await usuarioModelo.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Usuario eliminado correctamente"
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
    
    // Desestructuramos los datos que vienen del front
    const { nombre, apellido, email, telefono, rol, newPassword } = req.body;

    try {
        // 1. Buscamos el usuario actual
        const userToUpdate = await usuarioModelo.findById(id);

        if (!userToUpdate) {
            return res.status(404).json({ 
                success: false, 
                message: "Usuario no encontrado" 
            });
        }

        // 2. VALIDACIÓN DE EMAIL (Si lo cambia, que sea único)
        if (email && email !== userToUpdate.email) {
            const emailExists = await usuarioModelo.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ 
                    success: false, 
                    message: "El email ya está en uso." 
                });
            }
        }

        // 3. PREPARAMOS EL OBJETO DE ACTUALIZACIÓN
        const updateData = {
            nombre: nombre || userToUpdate.nombre,
            apellido: apellido || userToUpdate.apellido,
            email: email || userToUpdate.email,
            telefono: telefono || userToUpdate.telefono,
            rol: rol || userToUpdate.rol // Ojo: Si es usuario normal, podrías quitar esto para que no se auto-ascienda
        };

        // 4. LÓGICA DE CONTRASEÑA (Nueva)
        if (newPassword) {
            // Validación extra de backend
            if (newPassword.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: "La contraseña debe tener mínimo 8 caracteres."
                });
            }

            // Encriptamos la contraseña
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(newPassword, salt);
        }

        // 5. GUARDAMOS CAMBIOS
        // { new: true } devuelve el usuario ya modificado
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