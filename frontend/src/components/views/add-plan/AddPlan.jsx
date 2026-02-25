import { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; 
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
  
  const [semana, setSemana] = useState(getSemanaLimpia());
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);

  const [canAdd, setCanAdd] = useState(true); 
  const [statusMsg, setStatusMsg] = useState(""); 
  const [statusColor, setStatusColor] = useState(""); 

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const result = await getUsers();
        if (result?.users) {
            setUsers(result.users);
            if (id) {
                setUserId(id);
                checkUserStatus(id, result.users);
            }
        }
      } catch (error) {
          console.error("Error cargando usuarios", error);
      }
    };
    fetchUsers();
  }, [id]);

  // 🔥 CAMBIO: Lógica ajustada para 4 semanas (el mes completo)
  const checkUserStatus = (selectedId, userList = users) => {
      if (!selectedId) {
          setCanAdd(false);
          setStatusMsg("");
          return;
      }

      const usuario = userList.find(u => u._id === selectedId);

      if (usuario && usuario.planes) {
          const planesEnCola = usuario.planes.filter(p => p.estado !== 'finalizado');
          const count = planesEnCola.length;

          if (count >= 4) {
              setCanAdd(false);
              setStatusMsg(`⛔ MES COMPLETO: El usuario ya tiene 4 semanas cargadas. No puedes cargar más.`);
              setStatusColor("#ff4d4d"); 
          } else if (count > 0 && count < 4) {
              setCanAdd(true);
              setStatusMsg(`⚠️ ATENCIÓN: El usuario tiene ${count}/4 semanas cargadas. Este plan entrará como 'Pendiente'.`);
              setStatusColor("#f1c40f"); 
          } else {
              setCanAdd(true);
              setStatusMsg("✅ Todo despejado: Este será el primer plan del mes ('Activo').");
              setStatusColor("#00D2BE"); 
          }
      } else {
          setCanAdd(true);
          setStatusMsg("✅ Usuario libre.");
          setStatusColor("#00D2BE");
      }
  };

  const handleUserChange = (e) => {
      const newId = e.target.value;
      setUserId(newId);
      checkUserStatus(newId);
  };

  const handleChange = (index, campo, valor) => {
    const nuevaSemana = semana.map((dia, i) => {
        if (i === index) return { ...dia, [campo]: valor };
        return dia;
    });
    
    if (campo === "titulo") {
        nuevaSemana[index].tipo = "";
        nuevaSemana[index].km = "";
        nuevaSemana[index].descripcion = "";
        
        if(valor === "descanso"){
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId) return toast.warn("⚠️ Por favor selecciona un usuario.");
    if (!canAdd) return toast.error("⛔ No puedes agregar más planes a este usuario.");

    const hayVacios = semana.some(dia => dia.titulo === "" || dia.tipo === "");
    if (hayVacios) return toast.error("❌ Hay días sin completar.");

    setLoading(true);

    try {
        const token = localStorage.getItem("token");
        const res = await addPlanUSer(userId, semana, token);

        if (res.success) {
            toast.success("✅ ¡Plan asignado con éxito!");
            
            const updatedUsers = await getUsers();
            if(updatedUsers?.users) {
                setUsers(updatedUsers.users);
                checkUserStatus(userId, updatedUsers.users); 
            }

            setSemana(getSemanaLimpia());
            if(!id) setUserId(""); 
            setStatusMsg(""); 
            
        } else {
            toast.error("Error: " + res.message);
        }
    } catch (error) {
        console.error(error);
        toast.error("❌ Error de conexión.");
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

        <div className="plan-creator-submit-section">
            
            <div className="user-selection-block">
                <label className="plan-creator-label">Asignar Plan al Alumno:</label>
                <select
                    className="plan-creator-select plan-creator-user-select"
                    value={userId}
                    onChange={handleUserChange}
                >
                    <option value="">-- Seleccionar Usuario --</option>
                    {users?.map((item) => (
                    <option key={item._id} value={item._id}>
                        {item.nombre} {item.apellido}
                    </option>
                    ))}
                </select>
            </div>

            {userId && statusMsg && (
                <div style={{
                    marginBottom: '15px',
                    padding: '10px 15px',
                    borderRadius: '8px',
                    border: `2px solid ${statusColor}`,
                    backgroundColor: 'rgba(30, 30, 30, 0.8)',
                    color: statusColor,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    fontSize: '0.9rem'
                }}>
                    {statusMsg}
                </div>
            )}

            <button 
                type="submit" 
                className="plan-creator-btn-submit" 
                disabled={loading || !canAdd}
                style={{ 
                    opacity: (!canAdd || loading) ? 0.5 : 1, 
                    cursor: (!canAdd || loading) ? 'not-allowed' : 'pointer' 
                }}
            >
                {loading ? "GUARDANDO..." : "CONFIRMAR PLAN"}
            </button>
        </div>
      </form>
    </main>
  );
};

export default AddPlan;