


const url = import.meta.env.VITE_API_URL;
const USER_CACHE_KEY = "zu_cached_user";
const PLAN_CACHE_PREFIX = "zu_cached_plan_";

export const getUserLogued = async (token) => {
    try {
        const res = await fetch(`${url}/api/users/user`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const result = await res.json();

        if (result?.user) {
            try {
                localStorage.setItem(USER_CACHE_KEY, JSON.stringify(result.user));
                // Guardamos cada plan y sus entrenamientos en caché local para acceso 100% offline
                if (Array.isArray(result.user.planes)) {
                    result.user.planes.forEach((plan) => {
                        if (plan && plan._id) {
                            localStorage.setItem(`${PLAN_CACHE_PREFIX}${plan._id}`, JSON.stringify(plan));
                        }
                    });
                }
            } catch (cacheError) {
                console.warn("No se pudo actualizar la caché local de usuario:", cacheError);
            }
            return result.user;
        }
    } catch (error) {
        console.warn("Sin conexión, recuperando usuario y entrenamientos de caché local:", error);
    }

    try {
        const cachedUser = localStorage.getItem(USER_CACHE_KEY);
        if (cachedUser) {
            return JSON.parse(cachedUser);
        }
    } catch (e) {
        console.error("Error leyendo caché local de usuario:", e);
    }

    return null;
};

