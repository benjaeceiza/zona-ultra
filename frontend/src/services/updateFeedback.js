

export const updateFeedback = async (feedbackData) => {
    
    try {
        const token = localStorage.getItem("token");
        
        // Ajusta la URL a tu ruta real
        const response = await fetch(`http://:8080/api/plans/feedback`, {
            method: "PUT", // Usamos PUT o PATCH porque es una actualización
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(feedbackData)
        });

        const data = await response.json();
        return { success: response.ok, message: data.message || "Error al guardar" };

    } catch (error) {
        console.error(error);
        return { success: false, message: "Error de conexión" };
    }
};