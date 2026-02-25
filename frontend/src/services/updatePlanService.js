const url = import.meta.env.VITE_API_URL;

export const updatePlanService = async (idPlan, semana) => {
    const token = localStorage.getItem("token");

    try {
        // OJO: Revisá que esta ruta coincida con la de tu backend
        const res = await fetch(`${url}/api/plans/admin/update/${idPlan}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            // Mandamos la semana entera dentro de la propiedad "entrenamientos"
            body: JSON.stringify({ entrenamientos: semana }) 
        });

        const result = await res.json();
        return result;

    } catch (error) {
        console.log("Error actualizando el plan:", error);
        return { success: false, message: "Error de conexión al servidor" };
    }
}