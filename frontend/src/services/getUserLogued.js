
export const getUserLogued = async (token) => {

    const res = await fetch("http://:8080/api/users/user", {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });



    const result = await res.json();
  
    return result.user

}

