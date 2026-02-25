import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getPlanById } from "../../../services/getPlanById";
import { updatePlanService } from "../../../services/updatePlanService";

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


const EditPlan = () => {
    const { idPlan } = useParams(); // Agarramos el ID del plan de la URL
    const navigate = useNavigate();

    const [semana, setSemana] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // 1. Cargar el plan a editar
    useEffect(() => {
        const fetchPlanData = async () => {
            try {
                // Asumiendo que tenés un servicio que trae el plan por ID
                const data = await getPlanById(idPlan);
               
                if (data.plan && data.plan.entrenamientos) {
                    setSemana(data.plan.entrenamientos);
                }
            } catch (error) {
                toast.error("Error al cargar el plan");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        if (idPlan) fetchPlanData();
    }, [idPlan]);




    // Lógica de cambios (Exactamente igual que en AddPlan)
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

    // Guardar los cambios (PUT en vez de POST)
    const handleSubmit = async (e) => {
        e.preventDefault();

        const hayVacios = semana.some(dia => dia.titulo === "" || dia.tipo === "");
        if (hayVacios) return toast.error("❌ Hay días sin completar.");

        setSaving(true);

        try {
            const token = localStorage.getItem("token");
            // Tu servicio que haga un fetch con método PUT
            const res = await updatePlanService(idPlan, semana, token);

            if (res.success) {
                toast.success("✅ ¡Plan modificado con éxito!");
                navigate(-1); // Volvemos a la vista del detalle
            } else {
                toast.error("Error: " + res.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("❌ Error de conexión.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <h2 style={{ color: 'white', textAlign: 'center' }}>Cargando plan...</h2>;

    return (
        <main className="plan-creator-container">
            <div className="plan-creator-header">
                <h1 className="plan-creator-title">Editando Semana</h1>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="plan-creator-days-grid">
                    {semana.map((diaInfo, index) => (
                        <div key={diaInfo.dia || index} className={`plan-creator-day-card ${diaInfo.tipo === 'descanso' ? 'plan-creator-is-rest' : ''}`}>
                            <h3 className="plan-creator-day-title">{diaInfo.dia}</h3>

                            <div className="plan-creator-inputs-wrapper">
                                {/* --- 1. OBJETIVO --- */}
                                <select className="plan-creator-select" value={diaInfo.titulo || ""} onChange={(e) => handleChange(index, "titulo", e.target.value)}>
                                    <option value="">-- Objetivo del Día --</option>
                                    <option value="entrenamiento aerobico">Aeróbico (Running)</option>
                                    <option value="entrenamiento de fuerza">Fuerza / Gym</option>
                                    <option value="descanso">Descanso</option>
                                </select>

                                {/* --- 2. TIPO AERÓBICO --- */}
                                {diaInfo.titulo === "entrenamiento aerobico" && (
                                    <>
                                        <select className="plan-creator-select" value={diaInfo.tipo || ""} onChange={(e) => handleTipoChange(index, e.target.value)}>
                                            <option value="">-- Tipo de Ejercicio --</option>
                                            <option value="pasadas aerobicas">Pasadas aeróbicas</option>
                                            <option value="rodaje suave">Rodaje Suave</option>
                                            <option value="rodaje largo">Rodaje Largo</option>
                                            {/* ... el resto de tus opciones ... */}
                                        </select>

                                        <input className="plan-creator-input" type="number" placeholder="Distancia (km)" value={diaInfo.km || ""} onChange={(e) => handleChange(index, "km", e.target.value)} />
                                    </>
                                )}

                                {/* --- 3. TIPO FUERZA --- */}
                                {diaInfo.titulo === "entrenamiento de fuerza" && (
                                    <select className="plan-creator-select" value={diaInfo.tipo || ""} onChange={(e) => handleTipoChange(index, e.target.value)}>
                                        <option value="">-- Rutina de Fuerza --</option>
                                        <option value="full body">Full body</option>
                                        <option value="tren superior">Tren superior</option>
                                        <option value="tren inferior">Tren inferior</option>
                                        <option value="streching">Stretching</option>
                                    </select>
                                )}

                                {/* --- 4. DURACIÓN --- */}
                                {diaInfo.titulo !== "descanso" && diaInfo.titulo !== "" && (
                                    <div className="plan-creator-duration-group">
                                        <input className="plan-creator-input" type="number" placeholder="Duración" value={diaInfo.duracion || ""} onChange={(e) => handleChange(index, "duracion", e.target.value)} />
                                        <div className="plan-creator-toggle-group">
                                            <button type="button" className={`plan-creator-toggle-btn ${diaInfo.unidad === "minutos" ? "plan-creator-active" : ""}`} onClick={() => handleChange(index, "unidad", "minutos")}>Min</button>
                                            <button type="button" className={`plan-creator-toggle-btn ${diaInfo.unidad === "horas" ? "plan-creator-active" : ""}`} onClick={() => handleChange(index, "unidad", "horas")}>Hs</button>
                                        </div>
                                    </div>
                                )}

                                {/* --- 5. DESCRIPCIÓN --- */}
                                <textarea className="plan-creator-textarea" placeholder="Instrucciones..." value={diaInfo.descripcion || ""} onChange={(e) => handleChange(index, "descripcion", e.target.value)} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="plan-creator-submit-section">
                    <button type="submit" className="plan-creator-btn-submit" disabled={saving}>
                        {saving ? "ACTUALIZANDO..." : "GUARDAR CAMBIOS"}
                    </button>
                </div>
            </form>
        </main>
    );
};

export default EditPlan;