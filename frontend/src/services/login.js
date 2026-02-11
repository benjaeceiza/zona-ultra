export const userLogin = async (email, password) => {
  const data = { email, password };

  try {
    const res = await fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    // 🔍 Aseguramos que la respuesta sea JSON (aunque haya error)
    const result = await res.json().catch(() => null);

    if (!res.ok) {
      // Si el servidor devolvió un error HTTP
      const msg = result?.message || "Error desconocido en el servidor";
      return `${msg}`;
    }

    // ✅ Si llega acá, fue correcto el login
    if (result?.token) {
      localStorage.setItem("token", result.token);
  
    }

    return {token:result.token};

  } catch (err) {
    console.error("Error en el login:", err);
    return "❌ Error de conexión con el servidor";
  }
};
