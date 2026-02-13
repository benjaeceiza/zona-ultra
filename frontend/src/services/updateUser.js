// services/updateUser.js
export const updateUserAdmin = async (id, userData, token) => {
    try {
        const response = await fetch(`https://zona-ultra.onrender.com/api/users/admin-edit/${id}`, { 
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Error actualizando usuario:", error);
        return { success: false, message: "Error de conexión" };
    }
};



export const updateUser = async (id, userData, token) => {
    try {
        const response = await fetch(`https://zona-ultra.onrender.com/api/users/edit/${id}`, { 
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Error actualizando usuario:", error);
        return { success: false, message: "Error de conexión con el servidor" };
    }
};


