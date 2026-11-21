// src/services/historialService.js
const HISTORIAL_CACHE_PREFIX = "zu_cached_historial_";
const PLAN_CACHE_PREFIX = "zu_cached_plan_";

export const getHistorialPaginado = async (userId, page = 1, limit = 5) => {
    const cacheKey = `${HISTORIAL_CACHE_PREFIX}${userId}_p${page}_l${limit}`;
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
        
        const data = await res.json();
        if (data?.success) {
            try {
                localStorage.setItem(cacheKey, JSON.stringify(data));
                if (Array.isArray(data.planes)) {
                    data.planes.forEach((p) => {
                        if (p && p._id) {
                            localStorage.setItem(`${PLAN_CACHE_PREFIX}${p._id}`, JSON.stringify(p));
                        }
                    });
                }
            } catch (e) {
                console.warn("No se pudo guardar historial en caché:", e);
            }
            return data;
        }
    } catch (error) {
        console.warn("Sin conexión fetching historial, usando caché local:", error);
    }

    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (e) {
        console.error("Error leyendo caché de historial:", e);
    }

    return { success: false };
};