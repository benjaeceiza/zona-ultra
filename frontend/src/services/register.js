export const userRegister = async (nombre, apellido, email, telefono, password, token) => {
  const data = { nombre, apellido, email, telefono, password };

  try {
    const res = await fetch("http://:8080/api/auth/admin/register", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (res.ok) {
      // NOTA: No guardamos el token en localStorage aquí porque
      // si no, sobrescribimos la sesión del Admin.
      return { success: true, token: result.token };
    } else {
      // Devolvemos el mensaje de error uniformemente
      return { success: false, message: result.message || "No se pudo registrar" };
    }
  } catch (err) {
    // Devolvemos un objeto con message para mantener la coherencia
    return { success: false, message: "❌ Error de conexión con el servidor" };
  }
};