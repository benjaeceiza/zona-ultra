// services/planService.js

// Cambiamos 'trainingId' por 'index'
export const updateTrainingStatus = async (token, index, completado) => {
    
    
    const response = await fetch('http://:8080/api/plans/admin/actualizar-progreso', { 
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        // Enviamos el index en el body
        body: JSON.stringify({ index, completado })
    });

    if (!response.ok) {
        throw new Error('No se pudo actualizar el progreso');
    }

    return await response.json();
};