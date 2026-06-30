

/**
 * Servicio para gestionar la subida de imágenes a Cloudinary de forma directa desde el Frontend.
 * * Requisitos previos en Cloudinary:
 * 1. Cloud Name (disponible en el Dashboard principal).
 * 2. Un Upload Preset configurado como 'Unsigned' (Sin firma) en Settings > Upload.
 */

const CLOUD_NAME = "dmnksm3th"; // Reemplazá con tu Cloud Name real
const UPLOAD_PRESET = "imagenes-carreras"; // Reemplazá con tu Upload Preset 'Unsigned'

/**
 * Sube un archivo físico (imagen) a Cloudinary de manera asíncrona.
 * @param {File} file - El objeto archivo obtenido del input de tipo file.
 * @returns {Promise<string|null>} La URL segura (https) de la imagen subida, o null si falla.
 */
export const uploadImageToCloudinary = async (file) => {
    if (!file) return null;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error detallado de Cloudinary:", errorData);
            return null;
        }

        const data = await response.json();
        return data.secure_url; // Retorna la URL pública y segura (https)
    } catch (error) {
        console.error("Error de red o conexión al subir a Cloudinary:", error);
        return null;
    }
};