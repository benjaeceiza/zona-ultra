
import Swal from 'sweetalert2'; // Importamos el creador de modales

function BotonAccionPeligrosa({ usuarioActual, idElemento }) {

  const handleAccion = async (e) => {
    e.preventDefault();

    // 1. EL BARRERA: Si es demo, le tiramos el modal en la cara y cortamos todo.
    if (usuarioActual.rol === 'demo' || usuarioActual.email === 'admin@demo.com') {
      Swal.fire({
        icon: 'warning', // Icono de advertencia amarillo/naranja
        title: 'Modo de Prueba',
        text: 'Estás desde una cuenta de prueba. Esta acción es inválida y está deshabilitada por seguridad.',
        confirmButtonColor: '#E91E63', // El botón fucsia de tu portfolio
        background: '#112240', // Fondo oscuro para que combine con tu diseño
        color: '#fff' // Letra blanca
      });
      
      return; // 🛑 CORTAMOS ACÁ. Ni siquiera intenta ir al backend.
    }

    // 2. SI ES UN USUARIO REAL: Pasa la barrera y hace el fetch
    try {
      const respuesta = await fetch(`/api/tu-ruta/${idElemento}`, {
        method: 'DELETE', // o PUT, o POST
        headers: { 'Content-Type': 'application/json' },
      });

      if (!respuesta.ok) throw new Error("Error en la acción");
      // Éxito real...

    } catch (error) {
      console.error(error);
    }
  };

  return (
    <button onClick={handleAccion} className="tu-clase-de-boton">
      Eliminar / Crear / Editar
    </button>
  );
}