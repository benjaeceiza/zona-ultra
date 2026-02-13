import { useState, useEffect } from "react";
 

const ModalEditNormal = ({ isOpen, onClose, user, onSave }) => {
  
  // Estado para Datos Personales
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    email: "", 
  });

  // Estado para Cambio de Contraseña
  const [showPassFields, setShowPassFields] = useState(false);
  const [passData, setPassData] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [errorPass, setErrorPass] = useState("");

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || "",
        apellido: user.apellido || "",
        telefono: user.telefono || "",
        email: user.email || "",
      });
      // Reseteamos la sección de contraseñas
      setShowPassFields(false);
      setPassData({ newPassword: "", confirmPassword: "" });
      setErrorPass("");
    }
  }, [user, isOpen]);

  // Manejar cambios en inputs de texto
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejar cambios en inputs de contraseña
  const handlePassChange = (e) => {
    const { name, value } = e.target;
    setPassData((prev) => ({ ...prev, [name]: value }));
    setErrorPass(""); // Limpiamos el error al escribir
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Preparamos el objeto con datos personales
    const dataToSend = { ...formData, _id: user._id };

    // 2. Si desplegó la sección de contraseñas, validamos
    if (showPassFields) {
        
        // Validación: Campos vacíos
        if (!passData.newPassword || !passData.confirmPassword) {
            setErrorPass("Debes completar ambos campos de contraseña.");
            return;
        }

        // Validación: Coincidencia
        if (passData.newPassword !== passData.confirmPassword) {
            setErrorPass("Las contraseñas no coinciden.");
            return;
        }

        // Validación: Longitud mínima (8 caracteres)
        if (passData.newPassword.length < 8) {
            setErrorPass("La contraseña debe tener al menos 8 caracteres.");
            return;
        }

        // Si pasa todo, agregamos la nueva contraseña al objeto
        dataToSend.newPassword = passData.newPassword;
        dataToSend.changePassword = true; // Flag para el backend
    }

    onSave(dataToSend);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-editar-normal-overlay" onClick={onClose}>
      <div 
        className="modal-editar-normal-container" 
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER */}
        <div className="modal-editar-normal-header">
          <h2 className="modal-editar-normal-title">Editar Mi Perfil</h2>
          <button className="modal-editar-normal-close" onClick={onClose}>&times;</button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit}>
          <div className="modal-editar-normal-body">
            
            {/* Fila: Nombre y Apellido */}
            <div className="modal-editar-normal-row">
              <div className="modal-editar-normal-field">
                <label className="modal-editar-normal-label">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="modal-editar-normal-input"
                  placeholder="Tu nombre"
                />
              </div>
              <div className="modal-editar-normal-field">
                <label className="modal-editar-normal-label">Apellido</label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  className="modal-editar-normal-input"
                  placeholder="Tu apellido"
                />
              </div>
            </div>

            {/* Email */}
            <div className="modal-editar-normal-field">
              <label className="modal-editar-normal-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="modal-editar-normal-input"
                placeholder="tu@email.com"
              />
            </div>

            {/* Teléfono */}
            <div className="modal-editar-normal-field">
              <label className="modal-editar-normal-label">Teléfono</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="modal-editar-normal-input"
                placeholder="+54 9 ..."
              />
            </div>

            {/* --- SECCIÓN SEGURIDAD --- */}
            <div className="modal-editar-separator"></div>

            <div className="modal-editar-security-section">
                <div className="security-header">
                    <label className="modal-editar-normal-label" style={{ color: '#FF4500' }}>
                        Seguridad
                    </label>
                    <button 
                        type="button" 
                        className="btn-toggle-pass"
                        onClick={() => setShowPassFields(!showPassFields)}
                    >
                        {showPassFields ? "Cancelar cambio" : "Cambiar Contraseña"}
                    </button>
                </div>

                {showPassFields && (
                    <div className="password-fields-container">
                        <div className="modal-editar-normal-row">
                            <div className="modal-editar-normal-field">
                                <input 
                                    type="password"
                                    name="newPassword"
                                    placeholder="Nueva Contraseña"
                                    className="modal-editar-normal-input pass-input"
                                    value={passData.newPassword}
                                    onChange={handlePassChange}
                                />
                            </div>
                            <div className="modal-editar-normal-field">
                                <input 
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="Repetir Contraseña"
                                    className="modal-editar-normal-input pass-input"
                                    value={passData.confirmPassword}
                                    onChange={handlePassChange}
                                />
                            </div>
                        </div>
                        
                        {errorPass && <p className="error-msg">{errorPass}</p>}
                        
                        <p style={{fontSize: '0.75rem', color: '#666', marginTop: '5px'}}>
                            * Mínimo 8 caracteres.
                        </p>
                    </div>
                )}
            </div>

          </div>

          {/* FOOTER */}
          <div className="modal-editar-normal-footer">
            <button 
              type="button" 
              className="modal-editar-normal-cancel" 
              onClick={onClose}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="modal-editar-normal-save"
            >
              Guardar Cambios
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ModalEditNormal;