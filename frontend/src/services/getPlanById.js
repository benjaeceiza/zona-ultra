const url = import.meta.env.VITE_API_URL;
const PLAN_CACHE_PREFIX = "zu_cached_plan_";
const USER_CACHE_KEY = "zu_cached_user";

export const getPlanById = async (idPlan) => {
    const token = localStorage.getItem("token");

    try {
        const res = await fetch(`${url}/api/plans/${idPlan}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const result = await res.json();
        const planObj = result?.plan || result?.data || (result?._id ? result : null);

        if (planObj && planObj._id) {
            try {
                localStorage.setItem(`${PLAN_CACHE_PREFIX}${planObj._id}`, JSON.stringify(planObj));
            } catch (e) {
                console.warn("No se pudo guardar el plan en caché local:", e);
            }
            return result;
        }
    } catch (error) {
        console.warn("Sin conexión obteniendo el plan, buscando en caché local:", error);
    }

    // Fallback offline: buscar por ID de plan o dentro de los planes del usuario cacheado
    try {
        const cachedPlan = localStorage.getItem(`${PLAN_CACHE_PREFIX}${idPlan}`);
        if (cachedPlan) {
            return { success: true, plan: JSON.parse(cachedPlan), offline: true };
        }

        const cachedUserRaw = localStorage.getItem(USER_CACHE_KEY);
        if (cachedUserRaw) {
            const cachedUser = JSON.parse(cachedUserRaw);
            const foundPlan = cachedUser?.planes?.find(
                (p) => p?._id === idPlan || p?.entrenamientos?.some((t) => t?._id === idPlan)
            );
            if (foundPlan) {
                return { success: true, plan: foundPlan, offline: true };
            }
        }
    } catch (e) {
        console.error("Error leyendo plan desde caché local:", e);
    }

    return { success: false, message: "Error de conexión al servidor" };
};