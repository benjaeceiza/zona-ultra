// Ajusta la URL base según tu entorno ( o producción)
const url  = import.meta.env.VITE_API_URL;

export const getUserWithPlan = async (userId) => {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${url}/api/users/admin/${userId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error al obtener el usuario y su plan");
        }

        const data = await response.json();

        return {
            user: data.user,
            plan: data.plan
        };

    } catch (error) {
        console.error("Error en el servicio getUserWithPlan:", error);
        throw error;
    }
};