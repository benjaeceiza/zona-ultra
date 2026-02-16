


const url = import.meta.env.VITE_API_URL;

export const getUserLogued = async (token) => {


    const res = await fetch(`${url}/api/users/user`, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });



    const result = await res.json();

    return result.user

}

