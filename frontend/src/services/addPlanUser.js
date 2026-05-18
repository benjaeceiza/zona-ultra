
const url  = import.meta.env.VITE_API_URL;

export const addPlanUSer = async (userId, payload, token) => {
    try {
        const response = await fetch(`${url}/api/plans/admin/${userId}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            // 🔥 EL CAMBIO ESTÁ ACÁ: Mandamos el payload crudo, sin envolverlo
            body: JSON.stringify(payload) 
        });

        const data = await response.json(); // Leemos la respuesta del servidor siempre

        if (response.ok) {
            return { success: true, message: "Plan creado con éxito!", data };
        } else {
            // Devolvemos el error real que nos dio el backend
            return { success: false, message: data.error || data.message || "Error desconocido" };
        }
    } catch (error) {
        return { success: false, message: "Error de conexión con el servidor" };
    }
};