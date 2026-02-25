const url = import.meta.env.VITE_API_URL;

export const getPlanById = async (idPlan) => {
    const token = localStorage.getItem("token");

    try {
        // OJO: Revisá que esta ruta coincida con la de tu backend
        const res = await fetch(`${url}/api/plans/${idPlan}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const result = await res.json();
        return result;

    } catch (error) {
        console.log("Error obteniendo el plan:", error);
        return { success: false, message: "Error de conexión al servidor" };
    }
}