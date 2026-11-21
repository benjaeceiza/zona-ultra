

const url = import.meta.env.VITE_API_URL;
const SHOES_CACHE_KEY = "zu_cached_shoes";

export const getUserShoes = async () => {
    try {
        const token = localStorage.getItem("token");

        const response = await fetch(`${url}/api/shoes`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            try {
                localStorage.setItem(SHOES_CACHE_KEY, JSON.stringify(data));
            } catch (e) {
                console.warn("No se pudo guardar zapatillas en caché:", e);
            }
            return { success: true, data: data };
        }
    } catch (error) {
        console.warn("Sin conexión en getUserShoes, usando caché local:", error);
    }

    try {
        const cached = localStorage.getItem(SHOES_CACHE_KEY);
        if (cached) {
            return { success: true, data: JSON.parse(cached), offline: true };
        }
    } catch (e) {
        console.error("Error leyendo zapatillas de caché:", e);
    }

    return { success: false, message: "Error de conexión con el servidor" };
};