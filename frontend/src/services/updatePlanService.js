const url = import.meta.env.VITE_API_URL;

export const updatePlanService = async (idPlan, payload, token) => {
    const apiUrl = import.meta.env.VITE_API_URL;
    try {
        const response = await fetch(`${apiUrl}/api/plans/admin/update/${idPlan}`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            
            body: JSON.stringify(payload) 
        });
        const data = await response.json();
        return { success: response.ok, message: data.message };
    } catch (error) {
        return { success: false, message: error.message };
    }
};