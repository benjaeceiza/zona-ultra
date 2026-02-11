

const API_URL = "http://localhost:8080/api/users"; 

export const updateUserRace = async (userId, raceData) => {
    
    const token = localStorage.getItem('token'); 

    try {
        const response = await fetch(`${API_URL}/race/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(raceData) 
        });

        
        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody.message || "Error al actualizar la carrera");
        }

        // 3. Devolvemos la data limpia
        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Error en updateUserRace:", error);
        throw error; // Re-lanzamos para manejarlo en el componente
    }
};