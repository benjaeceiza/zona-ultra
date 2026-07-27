import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { addPlanUSer } from "../../../services/addPlanUser";
import { getUsers } from "../../../services/getUsers";
import { getUserWithPlan } from "../../../services/getUserPlan";
// Asegurate de importar tu servicio de Cloudinary
import { uploadAudioToCloudinary } from "../../../services/cloudinaryService";
import "./AddPlan.css"
import { Mic, FolderUp, Square, Trash2 } from 'lucide-react';

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
    descripcion: "",
    audioUrl: "" // 🔥 Inicializamos el campo para el audio[cite: 4]
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
  const [creationMode, setCreationMode] = useState("idle");

  // Estado para el "Microciclo Suelto"
  const [semanaIndividual, setSemanaIndividual] = useState(getSemanaLimpia());
  const [tipoSemanaSingle, setTipoSemanaSingle] = useState("");

  // Estados para el "Plan Completo"
  const [macroSetup, setMacroSetup] = useState({
    titulo: "", objetivo: "", fechaInicio: "", fechaFin: "",
    mesociclos: [{ titulo: "Mesociclo 1", cantidadSemanas: 4 }]
  });

  const [macroData, setMacroData] = useState([]);

  // 🔥 NUEVOS ESTADOS Y REFS PARA AUDIO[cite: 4]
  const [recordingDayKey, setRecordingDayKey] = useState(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const result = await getUsers();
        if (result?.users) {
          setUsers(result.users);
          if (id) {
            setAssignMode("single");
            setSelectedUsers([id]);
            checkUsersStatus([id]);
          }
        }
      } catch (error) {
        console.error("Error cargando usuarios", error);
      }
    };
    fetchUsers();
  }, [id]);

  const checkUsersStatus = async (selectedIds) => {
    if (!selectedIds || selectedIds.length === 0) {
      setCanAdd(false);
      setStatusMsg(assignMode === "single" ? "" : "Selecciona al menos un usuario.");
      setStatusColor("#666");
      return;
    }

    setStatusMsg("⏳ Verificando estado del atleta...");
    setStatusColor("#888");
    setCanAdd(false);

    let tieneMacroNoFinalizado = false;
    let tieneAlgoActivo = false;
    let alumnosConMacro = [];
    let alumnosOcupados = [];

    for (const userId of selectedIds) {
      try {
        const data = await getUserWithPlan(userId);
        if (data && data.user && data.user.planes) {
          const planes = data.user.planes;
          const macroVivo = planes.find(p => p.macrociclo && p.estado !== 'finalizado');
          if (macroVivo) {
            tieneMacroNoFinalizado = true;
            alumnosConMacro.push(`${data.user.nombre} ${data.user.apellido}`);
          }
          const ocupado = planes.some(p => p.estado === 'activo' || p.estado === 'pendiente');
          if (ocupado) {
            tieneAlgoActivo = true;
            alumnosOcupados.push(`${data.user.nombre} ${data.user.apellido}`);
          }
        }
      } catch (error) {
        console.error("Error al validar el estado del usuario:", error);
      }
    }

    const estaCreandoPlanCompleto = creationMode === 'setup_macro' || creationMode === 'fill_macro';

    if (estaCreandoPlanCompleto && tieneMacroNoFinalizado) {
      setCanAdd(false);
      setStatusMsg(`⛔ ACCIÓN DENEGADA: ${alumnosConMacro.join(', ')} ya tiene un Plan Completo en curso. No se pueden superponer dos planificaciones generales.`);
      setStatusColor("#ff4d4d");
    } else if (tieneAlgoActivo) {
      setCanAdd(true);
      if (estaCreandoPlanCompleto) {
        setStatusMsg(`ℹ️ ${alumnosOcupados.join(', ')} tiene entrenamiento en curso. Este nuevo Plan Completo se guardará en COLA.`);
      } else {
        setStatusMsg(`ℹ️ ${alumnosOcupados.join(', ')} tiene entrenamiento activo. Esta nueva semana suelta pasará como PENDIENTE en la fila.`);
      }
      setStatusColor("#f1c40f");
    } else {
      setCanAdd(true);
      setStatusMsg(`✅ Atleta libre. El entrenamiento iniciará inmediatamente de forma ACTIVA.`);
      setStatusColor("#00D2BE");
    }
  };

  useEffect(() => {
    if (selectedUsers.length > 0) {
      checkUsersStatus(selectedUsers);
    } else {
      setCanAdd(false);
      setStatusMsg(assignMode === "single" ? "" : "Selecciona al menos un usuario.");
      setStatusColor("#666");
    }
  }, [creationMode, selectedUsers, assignMode]);

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

  const handleChangeDiaSingle = (index, campo, valor) => {
    const nuevaSemana = [...semanaIndividual];
    nuevaSemana[index][campo] = valor;
    if (campo === "titulo") {
      nuevaSemana[index].tipo = ""; nuevaSemana[index].km = ""; nuevaSemana[index].descripcion = ""; nuevaSemana[index].audioUrl = "";
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

  const handleMacroSetupChange = (campo, valor) => {
    setMacroSetup(prev => ({ ...prev, [campo]: valor }));
  };

  const handleMesoSetupChange = (index, campo, valor) => {
    const nuevosMesos = [...macroSetup.mesociclos];
    if (campo === 'cantidadSemanas') {
      nuevosMesos[index][campo] = valor === "" ? "" : Number(valor);
    } else {
      nuevosMesos[index][campo] = valor;
    }
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
      dia.tipo = ""; dia.km = ""; dia.descripcion = ""; dia.audioUrl = "";
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
  // 🔥 LÓGICA DE AUDIOS[cite: 4]
  // ==========================================
  const startRecording = async (dayKey) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.start();
      setRecordingDayKey(dayKey);
    } catch (err) {
      toast.error("❌ No se pudo acceder al micrófono. Verificá los permisos del navegador.");
    }
  };

  const stopRecording = (isSingle, dayIndex, mesoIndex, weekIndex) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {

      mediaRecorderRef.current.onstop = async () => {
        setIsUploadingAudio(true);
        setRecordingDayKey(null);

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        const audioFile = new File([audioBlob], `audio-${Date.now()}.mp3`, { type: 'audio/mp3' });

        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

        toast.info("⏳ Procesando y subiendo audio...");
        const url = await uploadAudioToCloudinary(audioFile);

        if (url) {
          if (isSingle) handleChangeDiaSingle(dayIndex, "audioUrl", url);
          else handleChangeDiaMacro(mesoIndex, weekIndex, dayIndex, "audioUrl", url);
          toast.success("✅ Audio guardado con éxito.");
        } else {
          toast.error("❌ Error al subir el audio a Cloudinary.");
        }
        setIsUploadingAudio(false);
      };

      mediaRecorderRef.current.stop();
    }
  };

  const handleFileUpload = async (e, isSingle, dayIndex, mesoIndex, weekIndex) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingAudio(true);
    toast.info("⏳ Subiendo archivo MP3/WAV...");
    const url = await uploadAudioToCloudinary(file);

    if (url) {
      if (isSingle) handleChangeDiaSingle(dayIndex, "audioUrl", url);
      else handleChangeDiaMacro(mesoIndex, weekIndex, dayIndex, "audioUrl", url);
      toast.success("✅ Audio subido con éxito.");
    } else {
      toast.error("❌ Error al subir el archivo.");
    }
    setIsUploadingAudio(false);
  };

  const handleDeleteAudio = (isSingle, dayIndex, mesoIndex, weekIndex) => {
    if (isSingle) {
      handleChangeDiaSingle(dayIndex, "audioUrl", "");
    } else {
      handleChangeDiaMacro(mesoIndex, weekIndex, dayIndex, "audioUrl", "");
    }
    toast.success("🗑️ Audio eliminado de la sesión.");
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedUsers.length === 0) return toast.warn("⚠️ Selecciona al menos un usuario.");
    if (!canAdd) return toast.error("⛔ Hay usuarios con el mes completo en tu selección.");
    if (isUploadingAudio) return toast.warn("⚠️ Esperá a que termine de subir el audio antes de guardar.");

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
          tipoMicrociclo: sem.tipoMicrociclo,
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

      const errores = resultados.filter(res => !res.success);

      if (errores.length === 0) {
        toast.success(`✅ ¡Entrenamiento asignado con éxito a ${selectedUsers.length} alumno(s)!`);

        setCreationMode('idle');
        setSemanaIndividual(getSemanaLimpia());
        setMacroSetup({ titulo: "", objetivo: "", fechaInicio: "", fechaFin: "", mesociclos: [{ titulo: "Mesociclo 1", cantidadSemanas: 4 }] });
        setMacroData([]);
        if (!id) { setSelectedUsers([]); setStatusMsg(""); }
      } else {
        errores.forEach(err => {
          toast.error(`❌ ${err.message || err.error || "Error al asignar el plan."}`);
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("❌ Error de conexión al procesar el envío.");
    } finally {
      setLoading(false);
    }
  };

  const renderDayCard = (diaInfo, weekIndex, dayIndex, mesoIndex = null) => {
    const isSingle = mesoIndex === null;
    const currentDayKey = `${mesoIndex}-${weekIndex}-${dayIndex}`;

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

          {/* 🔥 SECCIÓN DE AUDIO CON ÍCONOS MINIMALISTAS */}
          {diaInfo.titulo !== "descanso" && diaInfo.titulo !== "" && (
            <div className="audio-section-wrapper">
              <span className="audio-section-label">AUDIOS</span>

              {diaInfo.audioUrl ? (
                // ✅ VISTA: AUDIO SUBIDO (Reproductor + Basurero)
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0, 210, 190, 0.05)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(0, 210, 190, 0.2)' }}>

                  <audio controls src={diaInfo.audioUrl} style={{ flex: 1, height: '36px', outline: 'none', colorScheme: 'dark' }} />

                  <button
                    type="button"
                    className="btn-icon-only danger"
                    title="Eliminar Audio"
                    onClick={() => handleDeleteAudio(isSingle, dayIndex, mesoIndex, weekIndex)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ) : (
                // 🎤 VISTA: CONTROLES DE GRABACIÓN
                <div className="audio-controls-row">

                  {recordingDayKey === currentDayKey ? (
                    // 🌊 ESTADO: GRABANDO (Ondas + Botón Detener)
                    <div className="recording-wrapper">
                      <div className="sound-wave-container">
                        <div className="sound-wave"></div>
                        <div className="sound-wave"></div>
                        <div className="sound-wave"></div>
                        <div className="sound-wave"></div>
                        <div className="sound-wave"></div>
                      </div>
                      <span className="recording-text">Grabando</span>

                      <button
                        type="button"
                        className="btn-stop-record"
                        onClick={() => stopRecording(isSingle, dayIndex, mesoIndex, weekIndex)}
                        disabled={isUploadingAudio}
                      >
                        <Square size={12} fill="currentColor" /> 
                      </button>
                    </div>
                  ) : (
                    // 🔘 ESTADO: REPOSO (Solo íconos)
                    <>
                      <button
                        type="button"
                        className="btn-icon-only primary"
                        title="Grabar Audio"
                        onClick={() => startRecording(currentDayKey)}
                        disabled={isUploadingAudio || (recordingDayKey !== null && recordingDayKey !== currentDayKey)}
                      >
                        <Mic size={20} />
                      </button>

                      {recordingDayKey !== currentDayKey && (
                        <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
                          <button type="button" className="btn-icon-only secondary" title="Subir archivo MP3" disabled={isUploadingAudio || recordingDayKey !== null}>
                            <FolderUp size={20} />
                          </button>
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => handleFileUpload(e, isSingle, dayIndex, mesoIndex, weekIndex)}
                            style={{ position: 'absolute', top: 0, left: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                            disabled={isUploadingAudio || recordingDayKey !== null}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
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
            <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0, 210, 190, 0.05)', borderRadius: '8px', borderLeft: '4px solid #00D2BE', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <label style={{ color: '#fff', fontWeight: 'bold' }}>Enfoque de la Semana:</label>
              <select
                className="plan-creator-select"
                style={{ margin: 0, width: 'auto', minWidth: '200px' }}
                value={tipoSemanaSingle}
                onChange={(e) => setTipoSemanaSingle(e.target.value)}
              >
                <option value="">⚪ Sin especificar</option>
                <option value="carga">🟠 Carga</option>
                <option value="descarga">🟢 Descarga</option>
                <option value="ajuste">🔵 Ajuste</option>
                <option value="tapering">🟣 Tapering</option>
                <option value="competicion">🏆 Competición</option>
                <option value="mantenimiento">🟡 Mantenimiento</option>
              </select>
            </div>
            <div className="plan-creator-days-grid">
              {semanaIndividual.map((diaInfo, index) => renderDayCard(diaInfo, 0, index, null))}
            </div>
          </div>
        )}

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
                  <input
                    type="number"
                    className="plan-creator-input"
                    min="1"
                    max="20"
                    placeholder="Microciclos"
                    value={meso.cantidadSemanas}
                    onChange={(e) => handleMesoSetupChange(index, 'cantidadSemanas', e.target.value)}
                  />
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

        {creationMode === 'fill_macro' && (
          <div className="macro-fill-container">
            <div className="macro-header-summary" style={{ background: '#1a1a1a', padding: '15px 20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #333' }}>
              <h2 style={{ color: '#fff', margin: 0 }}>{macroSetup.titulo}</h2>
              <p style={{ color: '#888', margin: '5px 0 0 0' }}>Plan de {macroData.length} Mesociclos en total. <em>(Podés dejar microciclos vacíos y editarlos en el futuro)</em>.</p>
            </div>

            {macroData.map((meso, mesoIndex) => (
              <div key={mesoIndex} className={`meso-accordion-container ${!meso.isExpanded ? 'collapsed' : ''}`}>

                <div className="meso-accordion-header" onClick={() => toggleMesoAccordion(mesoIndex)}>
                  <h2 className="meso-title">📁 {meso.titulo} <span className="week-count-badge">{meso.semanas.length} Microciclos</span></h2>
                  <span className="accordion-icon">{meso.isExpanded ? '▲' : '▼'}</span>
                </div>

                {meso.isExpanded && (
                  <div className="meso-accordion-content">
                    {meso.semanas.map((semana, weekIndex) => (
                      <div key={weekIndex} className={`week-accordion-container ${!semana.isExpanded ? 'collapsed' : ''}`}>

                        <div className="week-accordion-header" onClick={() => toggleWeekAccordion(mesoIndex, weekIndex)}>
                          <h3 className="week-title">▶ Microciclo {semana.numeroSemana} </h3>
                          <span className="accordion-icon" style={{ fontSize: '0.9rem' }}>{semana.isExpanded ? '▲ Ocultar días' : '▼ Ver días'}</span>
                        </div>

                        {semana.isExpanded && (
                          <div className="week-accordion-content">

                            <div style={{ marginBottom: '15px', padding: '15px', background: 'rgba(0, 210, 190, 0.05)', borderRadius: '8px', borderLeft: '4px solid #00D2BE', display: 'flex', alignItems: 'center', gap: '15px' }}>
                              <label style={{ color: '#fff', fontWeight: 'bold' }}>Enfoque de la Semana:</label>
                              <select
                                className="plan-creator-select"
                                style={{ margin: 0, width: 'auto', minWidth: '200px' }}
                                value={semana.tipoMicrociclo || ""}
                                onChange={(e) => handleChangeTipoMicrociclo(mesoIndex, weekIndex, e.target.value)}
                              >
                                <option value="">⚪ Sin especificar</option>
                                <option value="carga">🟠 Carga</option>
                                <option value="descarga">🟢 Descarga</option>
                                <option value="ajuste">🔵 Ajuste</option>
                                <option value="tapering">🟣 Tapering</option>
                                <option value="competicion">🏆 Competición</option>
                                <option value="mantenimiento">🟡 Mantenimiento</option>
                              </select>
                            </div>

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

            <button type="submit" className="plan-creator-btn-submit" disabled={loading || !canAdd || selectedUsers.length === 0 || isUploadingAudio} style={{ opacity: (!canAdd || loading || selectedUsers.length === 0 || isUploadingAudio) ? 0.5 : 1, cursor: (!canAdd || loading || selectedUsers.length === 0 || isUploadingAudio) ? 'not-allowed' : 'pointer', width: '100%' }}>
              {loading ? "GUARDANDO..." : `CONFIRMAR PLAN PARA ${selectedUsers.length} ALUMNO(S)`}
            </button>
          </div>
        )}
      </form>
    </main>
  );
};

export default AddPlan;