// src/services/historialService.js
export const getHistorialPaginado = async (userId, page = 1, limit = 5) => {
    try {
        const token = localStorage.getItem("token");
        const apiUrl = import.meta.env.VITE_API_URL;
        
        const res = await fetch(`${apiUrl}/api/plans/historial/${userId}?page=${page}&limit=${limit}`, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        
        return await res.json();
    } catch (error) {
        console.error("Error fetching historial:", error);
        return { success: false };
    }
};