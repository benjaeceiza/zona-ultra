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

// --- FUNCIÓN GENERADORA (CLAVE PARA EL RESET) ---
// Esta función crea objetos nuevos cada vez que se llama.
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
  
  // Usamos la función para el estado inicial
  const [semana, setSemana] = useState(getSemanaLimpia());
  
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const result = await getUsers();
      if (result?.users) setUsers(result.users);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (id) {
      setUserId(id);
    }
  }, [id]);

  const handleChange = (index, campo, valor) => {
    // Copia profunda para no mutar referencias
    const nuevaSemana = semana.map((dia, i) => {
        if (i === index) {
            return { ...dia, [campo]: valor };
        }
        return dia;
    });
    
    // Lógica extra para cambios de título
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

    const hayVacios = semana.some(dia => dia.titulo === "" || dia.tipo === "");
    
    if (hayVacios) {
        return toast.error("❌ Hay días sin completar. Por favor revisa el plan.");
    }

    setLoading(true);

    try {
        const token = localStorage.getItem("token");
        const res = await addPlanUSer(userId, semana, token);

        if (res.success) {
            toast.success("✅ ¡Plan asignado con éxito!");
            
            // --- RESETEO AHORA SÍ FUNCIONA ---
            setSemana(getSemanaLimpia()); // Generamos una semana nueva y vacía
            
            if(!id) setUserId(""); // Solo limpiamos el usuario si no venimos de la URL
            
        } else {
            toast.error("Error: " + res.message);
        }
    } catch (error) {
        console.error(error);
        toast.error("❌ Error de conexión al guardar el plan.");
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
                
                {/* 1. SELECCIONAR TIPO PRINCIPAL */}
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

                {/* 2. SELECCIONAR SUB-TIPO */}
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
                
                {/* 3. INPUTS COMUNES (Duración) */}
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

                {/* TEXTAREA DESCRIPCIÓN */}
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

        {/* FOOTER */}
        <div className="plan-creator-submit-section">
          <label className="plan-creator-label">Asignar Plan al Alumno:</label>
          <select
            className="plan-creator-select plan-creator-user-select"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="">-- Seleccionar Usuario --</option>
            {users?.map((item) => (
              <option key={item._id} value={item._id}>
                {item.nombre} {item.apellido}
              </option>
            ))}
          </select>

          <button type="submit" className="plan-creator-btn-submit" disabled={loading}>
            {loading ? "GUARDANDO..." : "CONFIRMAR PLAN"}
          </button>
        </div>
      </form>
    </main>
  );
};

export default AddPlan;