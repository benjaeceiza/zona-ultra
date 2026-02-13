import  { useState, useEffect } from "react";

const ModalEditUserAdmin = ({ isOpen, onClose, user, onSave }) => {
  // Estado inicial del formulario
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    rol: "user", // user o admin
  });

  // Cuando el modal se abre o cambia el usuario, actualizamos el formulario
  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || "",
        apellido: user.apellido || "",
        telefono: user.telefono || "",
        email: user.email || "",
        rol: user.rol || "user",
      });
    }
  }, [user, isOpen]);

  // Manejador de cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Enviar formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    // Devolvemos los datos actualizados junto con el ID del usuario
    onSave({ ...formData, _id: user._id });
  };

  // Si no está abierto, no renderizamos nada
  if (!isOpen) return null;

  return (
    <div className="modal-edit-overlay" onClick={onClose}>
      <div 
        className="modal-edit-container" 
        onClick={(e) => e.stopPropagation()} // Evita cerrar si clickeas adentro
      >
        
        {/* HEADER */}
        <div className="modal-edit-header">
          <h2 className="modal-edit-title">Editar Perfil</h2>
          <button className="modal-edit-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* BODY (FORM) */}
        <form onSubmit={handleSubmit}>
          <div className="modal-edit-body">
            
            {/* Fila Nombre y Apellido */}
            <div className="modal-edit-row">
              <div className="modal-edit-field">
                <label className="modal-edit-label">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="modal-edit-input"
                  placeholder="Ej: Benja"
                />
              </div>
              <div className="modal-edit-field">
                <label className="modal-edit-label">Apellido</label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  className="modal-edit-input"
                  placeholder="Ej: Perez"
                />
              </div>
            </div>

            {/* Email */}
            <div className="modal-edit-field">
              <label className="modal-edit-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="modal-edit-input"
                placeholder="usuario@email.com"
              />
            </div>

            {/* Teléfono */}
            <div className="modal-edit-field">
              <label className="modal-edit-label">Teléfono</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="modal-edit-input"
                placeholder="+54 9 ..."
              />
            </div>

            {/* Rol Selector */}
            <div className="modal-edit-field">
              <label className="modal-edit-label">Rol de Usuario</label>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className="modal-edit-select"
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

          </div>

          {/* FOOTER ACTIONS */}
          <div className="modal-edit-footer">
            <button 
              type="button" 
              className="modal-edit-btn-cancel" 
              onClick={onClose}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="modal-edit-btn-save"
            >
              Guardar Cambios
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ModalEditUserAdmin;