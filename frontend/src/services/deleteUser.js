

const url  = import.meta.env.VITE_API_URL;
    
// services/deleteUser.js
export const deleteUserService = async (id, token) => {


    try {
        const response = await fetch(`${url}/api/users/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            }
        });

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Error eliminando usuario:", error);
        return { success: false, message: "Error de conexión" };
    }
};