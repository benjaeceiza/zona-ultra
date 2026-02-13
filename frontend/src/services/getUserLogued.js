
export const getUserLogued = async (token) => {

    const res = await fetch("https://zona-ultra.onrender.com/api/users/user", {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });



    const result = await res.json();
  
    return result.user

}

