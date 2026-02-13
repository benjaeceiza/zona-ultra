// services/deleteUser.js
export const deleteUserService = async (id, token) => {
    try {
        const response = await fetch(`http://:8080/api/users/${id}`, {
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