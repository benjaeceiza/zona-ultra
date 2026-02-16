

const url  = import.meta.env.VITE_API_URL;

export const getUsers = async () => {
    const token = localStorage.getItem("token");

    try {
        const res = await fetch(`${url}/api/users`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }});

        const result = await res.json();

        return result

    } catch (error) {
        console.log(error);

    }
}