

// services/shoeService.js

export const getUserShoes = async () => {
    try {
        const token = localStorage.getItem("token");

        const response = await fetch(`http://:8080/api/shoes`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        

        if (response.ok) {
            // Asumimos que el backend devuelve un array o un objeto con la key "shoes"
            // Ajusta "data" o "data.shoes" según lo que devuelva tu API
            return { success: true, data: data }; 
        } else {
            return { success: false, message: data.message || "Error al obtener zapatillas" };
        }

    } catch (error) {
        console.error("Error en getUserShoes service:", error);
        return { success: false, message: "Error de conexión con el servidor" };
    }
};