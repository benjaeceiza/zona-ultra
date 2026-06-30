


// Ajustá esta URL según el puerto donde corra tu backend en desarrollo o producción
const API_URL = `${import.meta.env.VITE_API_URL}/api/races`;

/**
 * Guarda una nueva carrera en el medallero del corredor.
 * @param {Object} raceData - Objeto con toda la información de la carrera y el array de URLs de fotos.
 * @returns {Promise<Object>} Respuesta del servidor (success, message, data).
 */
export const addRaceToMedallero = async (raceData) => {
    try {
        const token = localStorage.getItem('token'); // Levantamos el JWT

        const response = await fetch(`${API_URL}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Inyectamos el JWT de manera limpia
            },
            body: JSON.stringify(raceData)
        });
        return await response.json();
    } catch (error) {
        console.error("Error en servicio addRaceToMedallero:", error);
        return { success: false, message: "No se pudo conectar con el servidor." };
    }
};

/**
 * Obtiene todas las carreras del medallero para un usuario específico.
 * @param {string} idUsuario - ID de MongoDB del corredor.
 * @returns {Promise<Object>} Respuesta del servidor con el array de carreras ordenadas por fecha.
 */


export const getMedalleroByUser = async (idUsuario) => {
    try {
        const token = localStorage.getItem('token'); // Levantamos el JWT

        const response = await fetch(`${API_URL}/user/${idUsuario}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Inyectamos el JWT acá también
            }
        });
        return await response.json();
    } catch (error) {
        console.error("Error en servicio getMedalleroByUser:", error);
        return { success: false, message: "Error al conectar con el servidor." };
    }
};


export const updateRaceInMedallero = async (id, raceData) => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(raceData)
        });
        return await response.json();
    } catch (error) {
        console.error(error);
        return { success: false, message: "Error de conexión al actualizar." };
    }
};

export const deleteRaceFromMedallero = async (id) => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return await response.json();
    } catch (error) {
        console.error(error);
        return { success: false, message: "Error de conexión al eliminar." };
    }
};