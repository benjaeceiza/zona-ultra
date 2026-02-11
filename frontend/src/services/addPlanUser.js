export const addPlanUSer = async (userId, semana,token) => {
    try {
        const response = await fetch(`http://localhost:8080/api/plans/admin/${userId}`, {
            method: "POST",
                headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
            body: JSON.stringify({ entrenamientos: semana })
        });

        const data = await response.json(); // Leemos la respuesta del servidor siempre

        if (response.ok) {
            return { success: true, message: "Plan creado con éxito!", data };
        } else {
            // Devolvemos el error real que nos dio el backend (ej: "Path 'titulo' is required")
            return { success: false, message: data.error || "Error desconocido" };
        }
    } catch (error) {
        return { success: false, message: "Error de conexión con el servidor" };
    }
};