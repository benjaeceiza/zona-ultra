import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { addPlanUSer } from "../../../services/addPlanUser";
import { getUsers } from "../../../services/getUsers";
import "./AddPlan.css"

const DESCRIPCIONES_AUTO = {
  "pasadas aerobicas": "Cambios de ritmo graduales",
  "rodaje suave": "Ritmo cómodo continuo",
  "rodaje largo": "Ritmo suave – medio constante",
  "pasadas anaerobicas": "Cambios de ritmo bruscos",
  "entrenamiento por desnivel": "Subida a ritmo controlado",
  "Entrenamiento poR desnivel (escaleras)": "Subida de escaleras a ritmo controlado",
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

  // Estados de Asignación y Usuarios
  const [users, setUsers] = useState([]);
  const [assignMode, setAssignMode] = useState("single");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [canAdd, setCanAdd] = useState(true);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusColor, setStatusColor] = useState("");

  // Estados del Wizard (Asistente)
  const [creationMode, setCreationMode] = useState("idle"); // 'idle' | 'single' | 'setup_macro' | 'fill_macro'

  // Estado para el "Microciclo Suelto"
  const [semanaIndividual, setSemanaIndividual] = useState(getSemanaLimpia());
  const [tipoSemanaSingle, setTipoSemanaSingle] = useState("");

  // Estados para el "Plan Completo"
  const [macroSetup, setMacroSetup] = useState({
    titulo: "", objetivo: "", fechaInicio: "", fechaFin: "",
    mesociclos: [{ titulo: "Mesociclo 1", cantidadSemanas: 4 }]
  });

  // Acá se va a guardar la estructura generada (El súper acordeón)
  const [macroData, setMacroData] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const result = await getUsers();
        if (result?.users) {
          setUsers(result.users);
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

  // --- Lógica de Validación de Usuarios ---
  const checkUsersStatus = (selectedIds, userList = users) => {
    if (!selectedIds || selectedIds.length === 0) {
      setCanAdd(false);
      setStatusMsg(assignMode === "single" ? "" : "Selecciona al menos un usuario.");
      setStatusColor("#666");
      return;
    }

    let tienePlanCompletoActivo = false;
    let alumnosConMacro = [];

    selectedIds.forEach(userId => {
      const usuario = userList.find(u => u._id === userId);
      if (usuario?.planes) {
        // 🔥 CORRECCIÓN: Buscamos p.macrociclo (no p.esPlanCompleto, porque eso no se guarda en la DB)
        const macroActivo = usuario.planes.find(p => p.macrociclo && p.estado !== 'finalizado');

        if (macroActivo) {
          tienePlanCompletoActivo = true;
          alumnosConMacro.push(`${usuario.nombre} ${usuario.apellido}`);
        }
      }
    });

    // 🔥 Creamos la variable que nos faltaba leyendo tu estado creationMode
    const estaCreandoPlanCompleto = creationMode === 'setup_macro' || creationMode === 'fill_macro';

    // Si intenta crear un plan completo y el usuario ya tiene uno, lo bloqueamos
    if (estaCreandoPlanCompleto && tienePlanCompletoActivo) {
      setCanAdd(false);
      setStatusMsg(`⛔ ${alumnosConMacro.join(', ')} ya tiene(n) un Plan activo. Finalizalo o eliminalo primero.`);
      setStatusColor("#ff4d4d");
    } else {
      setCanAdd(true);
      setStatusMsg(`✅ Listo para asignar el entrenamiento.`);
      setStatusColor("#00D2BE");
    }
  };

  useEffect(() => {
    if (selectedUsers.length > 0) {
      checkUsersStatus(selectedUsers);
    }
  }, [creationMode, selectedUsers]);

  const handleSingleUserChange = (e) => {
    const newId = e.target.value;
    if (newId) { setSelectedUsers([newId]); checkUsersStatus([newId]); }
    else { setSelectedUsers([]); checkUsersStatus([]); }
  };

  const handleToggleUser = (userId) => {
    setSelectedUsers(prev => {
      let newSelected = prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId];
      checkUsersStatus(newSelected); return newSelected;
    });
  };

  // ==========================================
  // LOGICA: MICROCICLO SUELTO
  // ==========================================
  const handleChangeDiaSingle = (index, campo, valor) => {
    const nuevaSemana = [...semanaIndividual];
    nuevaSemana[index][campo] = valor;
    if (campo === "titulo") {
      nuevaSemana[index].tipo = ""; nuevaSemana[index].km = ""; nuevaSemana[index].descripcion = "";
      if (valor === "descanso") { nuevaSemana[index].tipo = "descanso"; nuevaSemana[index].descripcion = "Recuperación"; nuevaSemana[index].duracion = "0"; nuevaSemana[index].km = "0"; }
    }
    setSemanaIndividual(nuevaSemana);
  };

  const handleTipoChangeSingle = (index, valor) => {
    const nuevaSemana = [...semanaIndividual];
    nuevaSemana[index].tipo = valor;
    if (DESCRIPCIONES_AUTO[valor]) nuevaSemana[index].descripcion = DESCRIPCIONES_AUTO[valor];
    setSemanaIndividual(nuevaSemana);
  };

  // ==========================================
  // LOGICA: ARMADO DEL MACROCICLO (PASO 2 y 3)
  // ==========================================
  const handleMacroSetupChange = (campo, valor) => {
    setMacroSetup(prev => ({ ...prev, [campo]: valor }));
  };

  const handleMesoSetupChange = (index, campo, valor) => {
    const nuevosMesos = [...macroSetup.mesociclos];
    nuevosMesos[index][campo] = campo === 'cantidadSemanas' ? Number(valor) : valor;
    setMacroSetup(prev => ({ ...prev, mesociclos: nuevosMesos }));
  };

  const handleChangeTipoMicrociclo = (mesoIndex, weekIndex, valor) => {
    const newData = [...macroData];
    newData[mesoIndex].semanas[weekIndex].tipoMicrociclo = valor;
    setMacroData(newData);
  };

  const agregarMesoSetup = () => {
    setMacroSetup(prev => ({
      ...prev, mesociclos: [...prev.mesociclos, { titulo: `Mesociclo ${prev.mesociclos.length + 1}`, cantidadSemanas: 4 }]
    }));
  };

  const quitarMesoSetup = () => {
    if (macroSetup.mesociclos.length > 1) {
      setMacroSetup(prev => ({ ...prev, mesociclos: prev.mesociclos.slice(0, -1) }));
    }
  };

  // 🔥 MAGIA: Genera el Árbol completo con reseteo de contador
  const generarGrilla = () => {
    if (!macroSetup.titulo) return toast.warn("Ponle un título al Plan Completo");

    const nuevaData = macroSetup.mesociclos.map((meso) => {
      const semanasArray = Array.from({ length: meso.cantidadSemanas }).map((_, index) => {
        return {
          numeroSemana: index + 1,
          isExpanded: false,
          tipoMicrociclo: "",
          entrenamientos: getSemanaLimpia()
        };
      });
      return { titulo: meso.titulo, isExpanded: true, semanas: semanasArray };
    });
    setMacroData(nuevaData);
    setCreationMode('fill_macro');
  };

  const toggleMesoAccordion = (mesoIndex) => {
    const newData = [...macroData];
    newData[mesoIndex].isExpanded = !newData[mesoIndex].isExpanded;
    setMacroData(newData);
  };

  const toggleWeekAccordion = (mesoIndex, weekIndex) => {
    const newData = [...macroData];
    newData[mesoIndex].semanas[weekIndex].isExpanded = !newData[mesoIndex].semanas[weekIndex].isExpanded;
    setMacroData(newData);
  };

  const handleChangeDiaMacro = (mesoIndex, weekIndex, dayIndex, campo, valor) => {
    const newData = [...macroData];
    const dia = newData[mesoIndex].semanas[weekIndex].entrenamientos[dayIndex];
    dia[campo] = valor;
    if (campo === "titulo") {
      dia.tipo = ""; dia.km = ""; dia.descripcion = "";
      if (valor === "descanso") { dia.tipo = "descanso"; dia.descripcion = "Recuperación"; dia.duracion = "0"; dia.km = "0"; }
    }
    setMacroData(newData);
  };

  const handleTipoChangeMacro = (mesoIndex, weekIndex, dayIndex, valor) => {
    const newData = [...macroData];
    const dia = newData[mesoIndex].semanas[weekIndex].entrenamientos[dayIndex];
    dia.tipo = valor;
    if (DESCRIPCIONES_AUTO[valor]) dia.descripcion = DESCRIPCIONES_AUTO[valor];
    setMacroData(newData);
  };

  // ==========================================
  // SUBMIT 
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedUsers.length === 0) return toast.warn("⚠️ Selecciona al menos un usuario.");
    if (!canAdd) return toast.error("⛔ Hay usuarios con el mes completo en tu selección.");

    setLoading(true);

    let payload = {};

    if (creationMode === 'single') {
      if (semanaIndividual.some(dia => dia.titulo === "" || dia.tipo === "")) {
        setLoading(false); return toast.error("❌ Hay días sin completar.");
      }
      payload = {
        semanaIndividual: {
          numeroSemana: 1,
          tipoMicrociclo: tipoSemanaSingle,
          entrenamientos: semanaIndividual
        }
      };
    }
    else if (creationMode === 'fill_macro') {
      const mesociclosLimpios = macroData.map(meso => ({
        titulo: meso.titulo,
        semanas: meso.semanas.map(sem => ({
          numeroSemana: sem.numeroSemana,
          tipoMicrociclo: sem.tipoMicrociclo, // SE ENVÍA AL BACKEND
          entrenamientos: sem.entrenamientos
        }))
      }));

      payload = {
        esPlanCompleto: true,
        datosMacrociclo: {
          titulo: macroSetup.titulo, objetivo: macroSetup.objetivo,
          fechaInicio: macroSetup.fechaInicio, fechaFin: macroSetup.fechaFin
        },
        mesociclos: mesociclosLimpios
      };
    }

    try {
      const token = localStorage.getItem("token");
      const promesasEnvio = selectedUsers.map(userId => addPlanUSer(userId, payload, token));
      const resultados = await Promise.all(promesasEnvio);
      const hayErrores = resultados.some(res => !res.success);

      if (!hayErrores) {
        toast.success(`✅ ¡Plan asignado con éxito a ${selectedUsers.length} alumno(s)!`);

        setCreationMode('idle');
        setSemanaIndividual(getSemanaLimpia());
        setMacroSetup({ titulo: "", objetivo: "", fechaInicio: "", fechaFin: "", mesociclos: [{ titulo: "Mesociclo 1", cantidadSemanas: 4 }] });
        setMacroData([]);
        if (!id) { setSelectedUsers([]); setStatusMsg(""); }
      } else {
        toast.error("⚠️ Hubo errores al asignar el plan a algunos usuarios.");
      }
    } catch (error) {
      console.error(error); toast.error("❌ Error de conexión al procesar el envío.");
    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // COMPONENTES DE RENDERIZADO
  // ==========================================
  const renderDayCard = (diaInfo, weekIndex, dayIndex, mesoIndex = null) => {
    const isSingle = mesoIndex === null;
    return (
      <div key={diaInfo.dia} className={`plan-creator-day-card ${diaInfo.tipo === 'descanso' ? 'plan-creator-is-rest' : ''}`}>
        <h3 className="plan-creator-day-title">{diaInfo.dia}</h3>
        <div className="plan-creator-inputs-wrapper">
          <select className="plan-creator-select" value={diaInfo.titulo} onChange={(e) => isSingle ? handleChangeDiaSingle(dayIndex, "titulo", e.target.value) : handleChangeDiaMacro(mesoIndex, weekIndex, dayIndex, "titulo", e.target.value)}>
            <option value="">-- Objetivo del Día --</option>
            <option value="entrenamiento aerobico">Aeróbico (Running)</option>
            <option value="entrenamiento de fuerza">Fuerza / Gym</option>
            <option value="descanso">Descanso</option>
          </select>

          {diaInfo.titulo === "entrenamiento aerobico" && (
            <>
              <select className="plan-creator-select" value={diaInfo.tipo} onChange={(e) => isSingle ? handleTipoChangeSingle(dayIndex, e.target.value) : handleTipoChangeMacro(mesoIndex, weekIndex, dayIndex, e.target.value)}>
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
              <input className="plan-creator-input" type="number" placeholder="Distancia (km)" onWheel={(e) => e.target.blur()} value={diaInfo.km} onChange={(e) => isSingle ? handleChangeDiaSingle(dayIndex, "km", e.target.value) : handleChangeDiaMacro(mesoIndex, weekIndex, dayIndex, "km", e.target.value)} />
            </>
          )}

          {diaInfo.titulo === "entrenamiento de fuerza" && (
            <select className="plan-creator-select" value={diaInfo.tipo} onChange={(e) => isSingle ? handleTipoChangeSingle(dayIndex, e.target.value) : handleTipoChangeMacro(mesoIndex, weekIndex, dayIndex, e.target.value)}>
              <option value="">-- Rutina de Fuerza --</option>
              <option value="full body">Full body</option>
              <option value="tren superior">Tren superior</option>
              <option value="tren inferior">Tren inferior</option>
              <option value="streching">Stretching</option>
            </select>
          )}

          {diaInfo.titulo !== "descanso" && diaInfo.titulo !== "" && (
            <div className="plan-creator-duration-group">
              <input className="plan-creator-input" type="number" placeholder="Duración" onWheel={(e) => e.target.blur()} value={diaInfo.duracion} onChange={(e) => isSingle ? handleChangeDiaSingle(dayIndex, "duracion", e.target.value) : handleChangeDiaMacro(mesoIndex, weekIndex, dayIndex, "duracion", e.target.value)} />
              <div className="plan-creator-toggle-group">
                <button type="button" className={`plan-creator-toggle-btn ${diaInfo.unidad === "minutos" ? "plan-creator-active" : ""}`} onClick={() => isSingle ? handleChangeDiaSingle(dayIndex, "unidad", "minutos") : handleChangeDiaMacro(mesoIndex, weekIndex, dayIndex, "unidad", "minutos")}>Min</button>
                <button type="button" className={`plan-creator-toggle-btn ${diaInfo.unidad === "horas" ? "plan-creator-active" : ""}`} onClick={() => isSingle ? handleChangeDiaSingle(dayIndex, "unidad", "horas") : handleChangeDiaMacro(mesoIndex, weekIndex, dayIndex, "unidad", "horas")}>Hs</button>
              </div>
            </div>
          )}

          <textarea className="plan-creator-textarea" placeholder="Instrucciones..." value={diaInfo.descripcion} onChange={(e) => isSingle ? handleChangeDiaSingle(dayIndex, "descripcion", e.target.value) : handleChangeDiaMacro(mesoIndex, weekIndex, dayIndex, "descripcion", e.target.value)} />
        </div>
      </div>
    );
  };


  return (
    <main className="plan-creator-container">
      <div className="plan-creator-header">
        <h1 className="plan-creator-title">
          {creationMode === 'idle' ? 'Nuevo Plan' : creationMode === 'single' ? 'Microciclo Individual' : 'Periodización Completa'}
        </h1>
        {creationMode !== 'idle' && (
          <button type="button" className="plan-creator-btn-auto-fill" onClick={() => setCreationMode('idle')}>← Volver al Menú</button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="plan-creator-form">

        {/* ================= PANTALLA 1: SELECCIÓN DE MODO ================= */}
        {creationMode === 'idle' && (
          <div className="wizard-selection-grid">
            <div className="wizard-card" onClick={() => setCreationMode('single')}>
              <h3>📅 Microciclo Individual</h3>
              <p>Crea una grilla simple de 7 días. Ideal para usuarios que no siguen un plan a largo plazo o microciclos de ajuste.</p>
            </div>
            <div className="wizard-card macro-card" onClick={() => setCreationMode('setup_macro')}>
              <h3>🏆 Plan de Entrenamiento Completo</h3>
              <p>Diseña un Macrociclo estructurado. Define múltiples Mesociclos y la cantidad de Microciclos (Semanas) para cada uno.</p>
            </div>
          </div>
        )}

       {creationMode === 'single' && (
          <div className="single-week-wrapper">
            
            {/* 🔥 NUEVO SELECTOR: TIPO DE MICROCICLO SUELTO */}
            <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0, 210, 190, 0.05)', borderRadius: '8px', borderLeft: '4px solid #00D2BE', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <label style={{ color: '#fff', fontWeight: 'bold' }}>Enfoque de la Semana:</label>
                <select 
                    className="plan-creator-select" 
                    style={{ margin: 0, width: 'auto', minWidth: '200px' }}
                    value={tipoSemanaSingle}
                    onChange={(e) => setTipoSemanaSingle(e.target.value)}
                >
                    <option value="">⚪ Sin especificar</option>
                    <option value="aerobico">🔵 Aeróbico / Acumulación</option>
                    <option value="fuerza">🟠 Fuerza / Musculación</option>
                    <option value="choque">🔴 Choque / Alta Intensidad</option>
                    <option value="descarga">🟢 Descarga / Recuperación</option>
                    <option value="competencia">🏆 Competencia (Tapering)</option>
                    <option value="hibrido">🟣 Mixto / Híbrido</option>
                </select>
            </div>

            {/* Acá sigue tu grilla de días normal */}
            <div className="plan-creator-days-grid">
              {semanaIndividual.map((diaInfo, index) => renderDayCard(diaInfo, 0, index, null))}
            </div>
            
          </div>
        )}
        {/* ================= PANTALLA 2 (MACRO): CONFIGURAR ESTRUCTURA ================= */}
        {creationMode === 'setup_macro' && (
          <div className="plan-creator-meso-config wizard-setup">
            <h2 style={{ color: '#00D2BE', borderBottom: '1px solid #333', paddingBottom: '10px' }}>1. Datos del Plan General (Macrociclo)</h2>
            <div className="plan-creator-meso-inputs">
              <input type="text" className="plan-creator-input" placeholder="Título (Ej: Preparación Patagonia Run 100k)" value={macroSetup.titulo} onChange={(e) => handleMacroSetupChange('titulo', e.target.value)} />
              <input type="text" className="plan-creator-input" placeholder="Objetivo Principal" value={macroSetup.objetivo} onChange={(e) => handleMacroSetupChange('objetivo', e.target.value)} />
              <div className="date-group">
                <input type="date" className="plan-creator-input" title="Fecha de Inicio" value={macroSetup.fechaInicio} onChange={(e) => handleMacroSetupChange('fechaInicio', e.target.value)} />
                <input type="date" className="plan-creator-input" title="Fecha de Fin" value={macroSetup.fechaFin} onChange={(e) => handleMacroSetupChange('fechaFin', e.target.value)} />
              </div>
            </div>

            <h2 style={{ color: '#00D2BE', borderBottom: '1px solid #333', paddingBottom: '10px', marginTop: '20px' }}>2. Estructura de Mesociclos</h2>
            {macroSetup.mesociclos.map((meso, index) => (
              <div key={index} style={{ display: 'flex', gap: '15px', background: '#111', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #FF4500' }}>
                <input type="text" className="plan-creator-input" style={{ flex: 2 }} placeholder={`Título (Ej: Base ${index + 1})`} value={meso.titulo} onChange={(e) => handleMesoSetupChange(index, 'titulo', e.target.value)} />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#888', whiteSpace: 'nowrap' }}>Duración:</span>
                  <input type="number" className="plan-creator-input" min="1" max="20" placeholder="Microciclos" value={meso.cantidadSemanas} onChange={(e) => handleMesoSetupChange(index, 'cantidadSemanas', e.target.value)} />
                  <span style={{ color: '#888' }}>Microciclos</span>
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              <button type="button" className="plan-creator-btn-auto-fill" onClick={agregarMesoSetup}>+ AGREGAR MESOCICLO</button>
              {macroSetup.mesociclos.length > 1 && <button type="button" className="plan-creator-btn-danger" onClick={quitarMesoSetup}>- QUITAR ÚLTIMO</button>}
            </div>

            <button type="button" className="plan-creator-btn-submit" style={{ marginTop: '30px', maxWidth: '100%' }} onClick={generarGrilla}>
              CREAR ESTRUCTURA DEL PLAN
            </button>
          </div>
        )}

        {/* ================= PANTALLA 3 (MACRO): RELLENAR GRILLA ANIDADA ================= */}
        {creationMode === 'fill_macro' && (
          <div className="macro-fill-container">
            <div className="macro-header-summary" style={{ background: '#1a1a1a', padding: '15px 20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #333' }}>
              <h2 style={{ color: '#fff', margin: 0 }}>{macroSetup.titulo}</h2>
              <p style={{ color: '#888', margin: '5px 0 0 0' }}>Plan de {macroData.length} Mesociclos en total. <em>(Podés dejar microciclos vacíos y editarlos en el futuro)</em>.</p>
            </div>

            {/* Iteramos los Mesociclos */}
            {macroData.map((meso, mesoIndex) => (
              <div key={mesoIndex} className={`meso-accordion-container ${!meso.isExpanded ? 'collapsed' : ''}`}>

                {/* Cabecera del Mesociclo */}
                <div className="meso-accordion-header" onClick={() => toggleMesoAccordion(mesoIndex)}>
                  <h2 className="meso-title">📁 {meso.titulo} <span className="week-count-badge">{meso.semanas.length} Microciclos</span></h2>
                  <span className="accordion-icon">{meso.isExpanded ? '▲' : '▼'}</span>
                </div>

                {/* Contenido del Mesociclo (Los Microciclos) */}
                {meso.isExpanded && (
                  <div className="meso-accordion-content">
                    {meso.semanas.map((semana, weekIndex) => (
                      <div key={weekIndex} className={`week-accordion-container ${!semana.isExpanded ? 'collapsed' : ''}`}>

                        {/* Cabecera del Microciclo */}
                        <div className="week-accordion-header" onClick={() => toggleWeekAccordion(mesoIndex, weekIndex)}>
                          <h3 className="week-title">▶ Microciclo {semana.numeroSemana} </h3>
                          <span className="accordion-icon" style={{ fontSize: '0.9rem' }}>{semana.isExpanded ? '▲ Ocultar días' : '▼ Ver días'}</span>
                        </div>

                        {/* Contenido del Microciclo (Los 7 días) */}
                        {semana.isExpanded && (
                          <div className="week-accordion-content">

                            {/* 🔥 NUEVO SELECTOR: TIPO DE MICROCICLO */}
                            <div style={{ marginBottom: '15px', padding: '15px', background: 'rgba(0, 210, 190, 0.05)', borderRadius: '8px', borderLeft: '4px solid #00D2BE', display: 'flex', alignItems: 'center', gap: '15px' }}>
                              <label style={{ color: '#fff', fontWeight: 'bold' }}>Enfoque de la Semana:</label>
                              <select
                                className="plan-creator-select"
                                style={{ margin: 0, width: 'auto', minWidth: '200px' }}
                                value={semana.tipoMicrociclo || ""}
                                onChange={(e) => handleChangeTipoMicrociclo(mesoIndex, weekIndex, e.target.value)}
                              >
                                <option value="">-- Seleccionar Enfoque --</option>
                                <option value="aerobico">🔵 Aeróbico / Acumulación</option>
                                <option value="fuerza">🟠 Fuerza / Musculación</option>
                                <option value="choque">🔴 Choque / Alta Intensidad</option>
                                <option value="descarga">🟢 Descarga / Recuperación</option>
                                <option value="competencia">🏆 Competencia (Tapering)</option>
                                <option value="hibrido">🟣 Mixto / Híbrido</option>
                              </select>
                            </div>

                            {/* Acá siguen los 7 días (renderDayCard) */}
                            <div className="plan-creator-days-grid">
                              {semana.entrenamientos.map((diaInfo, dayIndex) => renderDayCard(diaInfo, weekIndex, dayIndex, mesoIndex))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ================= SECCIÓN DE ASIGNACIÓN (COMÚN) ================= */}
        {creationMode !== 'idle' && creationMode !== 'setup_macro' && (
          <div className="plan-creator-submit-section" style={{ marginTop: '30px' }}>
            <h3 className="plan-creator-label" style={{ marginBottom: '15px' }}>Destinatarios del Plan:</h3>

            {!id && (
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', padding: '10px', background: '#1e1e1e', borderRadius: '8px', border: '1px solid #333' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '0.95rem' }}>
                  <input type="radio" name="assignMode" checked={assignMode === 'single'} onChange={() => { setAssignMode('single'); setSelectedUsers([]); }} style={{ accentColor: '#00D2BE', width: '18px', height: '18px' }} />
                  A un alumno
                </label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '0.95rem' }}>
                  <input type="radio" name="assignMode" checked={assignMode === 'multiple'} onChange={() => { setAssignMode('multiple'); setSelectedUsers([]); }} style={{ accentColor: '#00D2BE', width: '18px', height: '18px' }} />
                  A varios alumnos
                </label>
              </div>
            )}

            {assignMode === 'single' ? (
              <div className="user-selection-block" style={{ marginBottom: '20px' }}>
                <select className="plan-creator-select plan-creator-user-select" value={selectedUsers.length === 1 ? selectedUsers[0] : ""} onChange={handleSingleUserChange} disabled={!!id}>
                  <option value="">-- Seleccionar Alumno --</option>
                  {users?.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.nombre} {item.apellido}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="multi-user-selection-block">
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <button type="button" onClick={() => { const allIds = users.map(u => u._id); setSelectedUsers(allIds); checkUsersStatus(allIds); }} style={{ background: '#333', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Marcar Todos</button>
                  <button type="button" onClick={() => { setSelectedUsers([]); checkUsersStatus([]); }} style={{ background: 'transparent', color: '#888', border: '1px solid #555', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Desmarcar Todos</button>
                </div>
                <div className="multi-user-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px', padding: '10px', marginBottom: '20px' }}>
                  {users?.map((item) => (
                    <label key={item._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '5px', background: selectedUsers.includes(item._id) ? 'rgba(0, 210, 190, 0.1)' : 'transparent', borderRadius: '5px', transition: 'background 0.2s' }}>
                      <input type="checkbox" checked={selectedUsers.includes(item._id)} onChange={() => handleToggleUser(item._id)} style={{ width: '18px', height: '18px', accentColor: '#00D2BE', cursor: 'pointer' }} />
                      <span style={{ color: '#fff', fontSize: '0.95rem' }}>{item.nombre} {item.apellido}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {selectedUsers.length > 0 && statusMsg && (
              <div style={{ marginBottom: '15px', padding: '10px 15px', borderRadius: '8px', border: `2px solid ${statusColor}`, backgroundColor: 'rgba(30, 30, 30, 0.8)', color: statusColor, fontWeight: 'bold', textAlign: 'center', fontSize: '0.9rem' }}>
                {statusMsg}
              </div>
            )}

            <button type="submit" className="plan-creator-btn-submit" disabled={loading || !canAdd || selectedUsers.length === 0} style={{ opacity: (!canAdd || loading || selectedUsers.length === 0) ? 0.5 : 1, cursor: (!canAdd || loading || selectedUsers.length === 0) ? 'not-allowed' : 'pointer', width: '100%' }}>
              {loading ? "GUARDANDO..." : `CONFIRMAR PLAN PARA ${selectedUsers.length} ALUMNO(S)`}
            </button>
          </div>
        )}
      </form>
    </main>
  );
};

export default AddPlan;