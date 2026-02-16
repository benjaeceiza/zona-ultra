// services/updateUser.js

const url  = import.meta.env.VITE_API_URL;

export const updateUserAdmin = async (id, userData, token) => {
    try {
        const response = await fetch(`${url}/api/users/admin-edit/${id}`, { 
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
        const response = await fetch(`${url}/api/users/edit/${id}`, { 
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


