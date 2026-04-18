import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { addPlanUSer } from "../../../services/addPlanUser";
import { getUsers } from "../../../services/getUsers";

const DESCRIPCIONES_AUTO = {
  "pasadas aerobicas": "Cambios de ritmo graduales",
  "rodaje suave": "Ritmo cómodo continuo",
  "rodaje largo": "Ritmo suave – medio constante",
  "pasadas anaerobicas": "Cambios de ritmo bruscos",
  "entrenamiento por desnivel": "Subida a ritmo controlado",
  "Entrenamiento pro desnivel-escaleras": "Subida de escaleras a ritmo controlado",
  "ritmo umbral aerobico": "Ritmo exigente pero sostenido",
  "fartlek aerobico en montana": "Cambio de ritmo según el terreno",
  "power hiking": "Caminar Fuerte con bastones o sin ellos",
  "descanso": "Recuperación"
};

const getSemanaLimpia = () => {
  const dias = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
  return dias.map(dia => ({
    dia: dia,
    titulo: "",
    tipo: "",
    duracion: "",
    unidad: "minutos",
    km: "",
    descripcion: ""
  }));
};

const AddPlan = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [semana, setSemana] = useState(getSemanaLimpia());
  const [users, setUsers] = useState([]);
  
  // 🔥 NUEVO ESTADO: Controla si estamos asignando a uno o a varios
  const [assignMode, setAssignMode] = useState("single"); 

  // Guardamos siempre los IDs en un array (sea 1 o varios)
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  const [loading, setLoading] = useState(false);

  // Estados para validación
  const [canAdd, setCanAdd] = useState(true);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusColor, setStatusColor] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const result = await getUsers();
        if (result?.users) {
          setUsers(result.users);
          
          // Si venimos de la URL con un ID específico, forzamos el modo "single"
          if (id) {
            setAssignMode("single");
            setSelectedUsers([id]);
            checkUsersStatus([id], result.users);
          }
        }
      } catch (error) {
        console.error("Error cargando usuarios", error);
      }
    };
    fetchUsers();
  }, [id]);

  // Función de validación (sirve tanto para 1 como para varios)
  const checkUsersStatus = (selectedIds, userList = users) => {
    if (!selectedIds || selectedIds.length === 0) {
      setCanAdd(false);
      setStatusMsg(assignMode === "single" ? "" : "Selecciona al menos un usuario.");
      setStatusColor("#666");
      return;
    }

    let usuariosBloqueados = [];
    let usuariosPendientes = [];

    selectedIds.forEach(userId => {
      const usuario = userList.find(u => u._id === userId);
      if (usuario && usuario.planes) {
        const planesEnCola = usuario.planes.filter(p => p && p.estado !== 'finalizado');
        const count = planesEnCola.length;

        if (count >= 4) {
          usuariosBloqueados.push(`${usuario.nombre} ${usuario.apellido}`);
        } else if (count > 0) {
          usuariosPendientes.push(`${usuario.nombre} ${usuario.apellido} (${count}/4)`);
        }
      }
    });

    if (usuariosBloqueados.length > 0) {
      setCanAdd(false);
      setStatusMsg(`⛔ MES COMPLETO para: ${usuariosBloqueados.join(', ')}. No puedes asignarles plan.`);
      setStatusColor("#ff4d4d");
    } else if (usuariosPendientes.length > 0) {
      setCanAdd(true);
      setStatusMsg(`⚠️ ATENCIÓN: Alumnos con semanas en cola: ${usuariosPendientes.join(', ')}.`);
      setStatusColor("#f1c40f");
    } else {
      setCanAdd(true);
      setStatusMsg(`✅ Todo despejado para ${selectedIds.length === 1 ? 'el alumno' : 'los alumnos'}.`);
      setStatusColor("#00D2BE");
    }
  };

  // 🔥 NUEVO: Maneja el cambio entre "A uno" y "A varios"
  const handleModeChange = (mode) => {
    setAssignMode(mode);
    setSelectedUsers([]); // Limpiamos la selección al cambiar de modo para evitar errores
    setStatusMsg("");
  };

  // Maneja la selección del <select> (Modo Uno)
  const handleSingleUserChange = (e) => {
    const newId = e.target.value;
    if (newId) {
      setSelectedUsers([newId]);
      checkUsersStatus([newId]);
    } else {
      setSelectedUsers([]);
      checkUsersStatus([]);
    }
  };

  // Maneja los checkboxes (Modo Varios)
  const handleToggleUser = (userId) => {
    setSelectedUsers(prevSelected => {
      let newSelected;
      if (prevSelected.includes(userId)) {
        newSelected = prevSelected.filter(id => id !== userId);
      } else {
        newSelected = [...prevSelected, userId];
      }
      checkUsersStatus(newSelected);
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    const allIds = users.map(u => u._id);
    setSelectedUsers(allIds);
    checkUsersStatus(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedUsers([]);
    checkUsersStatus([]);
  };

  // Manejadores del plan
  const handleChange = (index, campo, valor) => {
    const nuevaSemana = semana.map((dia, i) => {
      if (i === index) return { ...dia, [campo]: valor };
      return dia;
    });

    if (campo === "titulo") {
      nuevaSemana[index].tipo = "";
      nuevaSemana[index].km = "";
      nuevaSemana[index].descripcion = "";

      if (valor === "descanso") {
        nuevaSemana[index].tipo = "descanso";
        nuevaSemana[index].descripcion = "Recuperación";
        nuevaSemana[index].duracion = "0";
        nuevaSemana[index].km = "0";
      }
    }
    setSemana(nuevaSemana);
  };

  const handleTipoChange = (index, valor) => {
    const nuevaSemana = semana.map((dia, i) => {
      if (i === index) {
        let nuevoDia = { ...dia, tipo: valor };
        if (DESCRIPCIONES_AUTO[valor]) {
          nuevoDia.descripcion = DESCRIPCIONES_AUTO[valor];
        }
        return nuevoDia;
      }
      return dia;
    });
    setSemana(nuevaSemana);
  };

  // Submit (envía a 1 o a varios iterando el array)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedUsers.length === 0) return toast.warn("⚠️ Por favor selecciona al menos un usuario.");
    if (!canAdd) return toast.error("⛔ Hay usuarios con el mes completo en tu selección.");

    const hayVacios = semana.some(dia => dia.titulo === "" || dia.tipo === "");
    if (hayVacios) return toast.error("❌ Hay días sin completar en la planificación.");

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      
      const promesasEnvio = selectedUsers.map(userId => addPlanUSer(userId, semana, token));
      const resultados = await Promise.all(promesasEnvio);
      const hayErrores = resultados.some(res => !res.success);

      if (!hayErrores) {
        toast.success(`✅ ¡Plan asignado con éxito a ${selectedUsers.length} alumno(s)!`);

        const updatedUsers = await getUsers();
        if (updatedUsers?.users) {
          setUsers(updatedUsers.users);
          checkUsersStatus(selectedUsers, updatedUsers.users);
        }

        setSemana(getSemanaLimpia());
        
        if (!id) {
          setSelectedUsers([]);
          setStatusMsg("");
        }

      } else {
        toast.error("⚠️ Hubo errores al asignar el plan a algunos usuarios.");
      }
    } catch (error) {
      console.error(error);
      toast.error("❌ Error de conexión al procesar el envío.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="plan-creator-container">

      <div className="plan-creator-header">
        <h1 className="plan-creator-title">Nuevo Plan Semanal</h1>
      </div>

      <form onSubmit={handleSubmit}>

        <div className="plan-creator-days-grid">
          {semana.map((diaInfo, index) => (
            <div
              key={diaInfo.dia}
              className={`plan-creator-day-card ${diaInfo.tipo === 'descanso' ? 'plan-creator-is-rest' : ''}`}
            >
              <h3 className="plan-creator-day-title">{diaInfo.dia}</h3>

              <div className="plan-creator-inputs-wrapper">
                <select
                  className="plan-creator-select"
                  value={diaInfo.titulo}
                  onChange={(e) => handleChange(index, "titulo", e.target.value)}
                >
                  <option value="">-- Objetivo del Día --</option>
                  <option value="entrenamiento aerobico">Aeróbico (Running)</option>
                  <option value="entrenamiento de fuerza">Fuerza / Gym</option>
                  <option value="descanso">Descanso</option>
                </select>

                {diaInfo.titulo === "entrenamiento aerobico" && (
                  <>
                    <select
                      className="plan-creator-select"
                      value={diaInfo.tipo}
                      onChange={(e) => handleTipoChange(index, e.target.value)}
                    >
                      <option value="">-- Tipo de Ejercicio --</option>
                      <option value="pasadas aerobicas">Pasadas aeróbicas</option>
                      <option value="rodaje suave">Rodaje Suave</option>
                      <option value="rodaje largo">Rodaje Largo</option>
                      <option value="pasadas anaerobicas">Pasadas anaeróbicas</option>
                      <option value="entrenamiento por desnivel">Entrenamiento por desnivel</option>
                      <option value="ritmo umbral aerobico">Ritmo umbral aeróbico</option>
                      <option value="fartlek aerobico en montana">Fartlek aeróbico en montaña</option>
                      <option value="power hiking">Power hiking</option>
                    </select>

                    <input
                      className="plan-creator-input"
                      type="number"
                      placeholder="Distancia (km)"
                      onWheel={(e) => e.target.blur()}
                      value={diaInfo.km}
                      onChange={(e) => handleChange(index, "km", e.target.value)}
                    />
                  </>
                )}

                {diaInfo.titulo === "entrenamiento de fuerza" && (
                  <select
                    className="plan-creator-select"
                    value={diaInfo.tipo}
                    onChange={(e) => handleTipoChange(index, e.target.value)}
                  >
                    <option value="">-- Rutina de Fuerza --</option>
                    <option value="full body">Full body</option>
                    <option value="tren superior">Tren superior</option>
                    <option value="tren inferior">Tren inferior</option>
                    <option value="streching">Stretching</option>
                  </select>
                )}

                {diaInfo.titulo !== "descanso" && diaInfo.titulo !== "" && (
                  <div className="plan-creator-duration-group">
                    <input
                      className="plan-creator-input"
                      type="number"
                      placeholder="Duración"
                      onWheel={(e) => e.target.blur()}
                      value={diaInfo.duracion}
                      onChange={(e) => handleChange(index, "duracion", e.target.value)}
                    />

                    <div className="plan-creator-toggle-group">
                      <button
                        type="button"
                        className={`plan-creator-toggle-btn ${diaInfo.unidad === "minutos" ? "plan-creator-active" : ""}`}
                        onClick={() => handleChange(index, "unidad", "minutos")}
                      >
                        Min
                      </button>
                      <button
                        type="button"
                        className={`plan-creator-toggle-btn ${diaInfo.unidad === "horas" ? "plan-creator-active" : ""}`}
                        onClick={() => handleChange(index, "unidad", "horas")}
                      >
                        Hs
                      </button>
                    </div>
                  </div>
                )}

                <textarea
                  className="plan-creator-textarea"
                  placeholder="Instrucciones o detalles técnicos..."
                  value={diaInfo.descripcion}
                  onChange={(e) => handleChange(index, "descripcion", e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 🔥 SECCIÓN DE ASIGNACIÓN (MODO TOGGLE) */}
        <div className="plan-creator-submit-section" style={{ marginTop: '30px' }}>
          
          <h3 className="plan-creator-label" style={{ marginBottom: '15px' }}>Destinatarios del Plan:</h3>

          {/* RADIO BUTTONS PARA ELEGIR MODO */}
          {!id && (
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', padding: '10px', background: '#1e1e1e', borderRadius: '8px', border: '1px solid #333' }}>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '0.95rem' }}>
                <input 
                  type="radio" 
                  name="assignMode" 
                  checked={assignMode === 'single'} 
                  onChange={() => handleModeChange('single')} 
                  style={{ accentColor: '#00D2BE', width: '18px', height: '18px' }}
                />
                A un alumno
              </label>
              
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '0.95rem' }}>
                <input 
                  type="radio" 
                  name="assignMode" 
                  checked={assignMode === 'multiple'} 
                  onChange={() => handleModeChange('multiple')} 
                  style={{ accentColor: '#00D2BE', width: '18px', height: '18px' }}
                />
                A varios alumnos
              </label>
            </div>
          )}

          {/* RENDER CONDICIONAL SEGÚN EL MODO ELEGIDO */}
          {assignMode === 'single' ? (
            
            /* --- MODO: UNO SOLO --- */
            <div className="user-selection-block" style={{ marginBottom: '20px' }}>
              <select
                className="plan-creator-select plan-creator-user-select"
                value={selectedUsers.length === 1 ? selectedUsers[0] : ""}
                onChange={handleSingleUserChange}
                disabled={!!id} // Si hay ID en la URL, bloqueamos el select
              >
                <option value="">-- Seleccionar Alumno --</option>
                {users?.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.nombre} {item.apellido} ({item.planes?.filter(p => p && p.estado !== 'finalizado').length || 0}/4)
                  </option>
                ))}
              </select>
            </div>

          ) : (

            /* --- MODO: MASIVO --- */
            <div className="multi-user-selection-block">
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <button type="button" onClick={handleSelectAll} style={{ background: '#333', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem' }}>Marcar Todos</button>
                <button type="button" onClick={handleDeselectAll} style={{ background: 'transparent', color: '#888', border: '1px solid #555', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem' }}>Desmarcar Todos</button>
              </div>

              <div className="multi-user-list" style={{
                display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px', padding: '10px', marginBottom: '20px'
              }}>
                {users?.map((item) => (
                  <label key={item._id} style={{ 
                    display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '5px',
                    background: selectedUsers.includes(item._id) ? 'rgba(0, 210, 190, 0.1)' : 'transparent',
                    borderRadius: '5px', transition: 'background 0.2s'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(item._id)}
                      onChange={() => handleToggleUser(item._id)}
                      style={{ width: '18px', height: '18px', accentColor: '#00D2BE', cursor: 'pointer' }}
                    />
                    <span style={{ color: '#fff', fontSize: '0.95rem' }}>
                      {item.nombre} {item.apellido} 
                      <span style={{ color: '#888', fontSize: '0.8rem', marginLeft: '8px' }}>
                        ({item.planes?.filter(p => p && p.estado !== 'finalizado').length || 0}/4 semanas)
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* MENSAJE DE ESTADO */}
          {selectedUsers.length > 0 && statusMsg && (
            <div style={{
              marginBottom: '15px', padding: '10px 15px', borderRadius: '8px',
              border: `2px solid ${statusColor}`, backgroundColor: 'rgba(30, 30, 30, 0.8)',
              color: statusColor, fontWeight: 'bold', textAlign: 'center', fontSize: '0.9rem'
            }}>
              {statusMsg}
            </div>
          )}

          {/* BOTÓN DE SUBMIT */}
          <button
            type="submit"
            className="plan-creator-btn-submit"
            disabled={loading || !canAdd || selectedUsers.length === 0}
            style={{
              opacity: (!canAdd || loading || selectedUsers.length === 0) ? 0.5 : 1,
              cursor: (!canAdd || loading || selectedUsers.length === 0) ? 'not-allowed' : 'pointer',
              width: '100%'
            }}
          >
            {loading ? "GUARDANDO..." : `CONFIRMAR PLAN PARA ${selectedUsers.length} ALUMNO(S)`}
          </button>
        </div>
      </form>
    </main>
  );
};

export default AddPlan;