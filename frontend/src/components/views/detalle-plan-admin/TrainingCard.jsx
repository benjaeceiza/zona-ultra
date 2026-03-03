import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const TrainingCard = ({ entrenamiento }) => {
  
  // 1. PREPARAR DATOS
  const feedback = entrenamiento.feedback || {};
  const isCompleted = entrenamiento.completado;

  // 🔥 DETECCIÓN DE "NO LOGRADO"
  const isFailed = isCompleted && (feedback.noLogrado || (feedback.comentario && feedback.comentario.includes('[NO LOGRADO]')));

  // Limpiamos el texto para que no muestre la etiqueta fea "[NO LOGRADO]" al usuario
  const cleanComment = feedback.comentario ? feedback.comentario.replace('[NO LOGRADO] ', '').replace('[NO LOGRADO]', '') : "";

  const dataGrafico = [
    {
      metrica: "Km",
      Estimado: entrenamiento.km || 0,
      Real: feedback.kmReal || 0, 
      unidad: "km"
    },
    {
      metrica: "Tiempo",
      Estimado: entrenamiento.duracion || 0,
      // Si está completado (aunque sea no logrado), mostramos lo que haya puesto en duracionReal
      Real: isCompleted ? (feedback.duracionReal || 0) : 0, 
      unidad: entrenamiento.unidad === 'horas' ? 'hs' : 'min'
    },
  ];

  // 2. TOOLTIP PERSONALIZADO
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataItem = dataGrafico.find(d => d.metrica === label);
      const unit = dataItem ? dataItem.unidad : "";

      return (
        <div className="custom-tooltip">
          <p className="custom-tooltip-p">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="custom-tooltip-p-2" >
              {entry.name}: <strong>{entry.value} {unit}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    // Si fue completado con éxito, le damos el glow normal. Si falló, le sacamos el glow o le podés poner una clase "card-failed-border" en tu CSS
    <div className={`training-card ${isCompleted && !isFailed ? "card-glow-border" : ""}`} style={isFailed ? { border: '1px solid rgba(255, 77, 77, 0.3)' } : {}}>
      
      {/* --- CABECERA --- */}
      <div className="card-header-row">
        <div className="title-group">
          <span className="day-badge">{entrenamiento.dia}</span>
          <h3 className="card-title">{entrenamiento.tipo}</h3>
          <p className="card-subtitle">{entrenamiento.titulo}</p>
        </div>
        
        {/* 🔥 LÓGICA DE ESTADO DINÁMICO */}
        <div 
            className={`status-pill ${isCompleted ? (isFailed ? "status-failed" : "status-success") : "status-pending"}`}
            style={isFailed ? { backgroundColor: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', border: '1px solid #ff4d4d' } : {}}
        >
          {isCompleted ? (isFailed ? "NO LOGRADO" : "COMPLETADO") : "PENDIENTE"}
        </div>
      </div>

      <div className="card-body-grid">
        
        {/* --- GRÁFICO --- */}
        <div className="chart-wrapper" style={{ position: 'relative', width: '100%', height: '180px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
                data={dataGrafico} 
                layout="vertical" 
                margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPlan" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#475569" stopOpacity={0.3}/>
                  <stop offset="100%" stopColor="#64748b" stopOpacity={0.5}/>
                </linearGradient>

                <linearGradient id="colorReal" x1="0" y1="0" x2="1" y2="0">
                  {/* Si es no logrado, pintamos la barra "Real" de gris/rojo oscuro o dejamos tu naranja original. Acá dejé el naranja. */}
                  <stop offset="0%" stopColor="#FF4500" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#ff7849" stopOpacity={1}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" />
              <XAxis type="number" hide />
              
              <YAxis 
                dataKey="metrica" 
                type="category" 
                width={70} 
                tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 'bold'}} 
                axisLine={false} 
                tickLine={false} 
              />
              
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '0.75rem', opacity: 0.7 }}/>
              
              <Bar dataKey="Estimado" fill="url(#colorPlan)" radius={[0, 4, 4, 0]} barSize={14} name="Plan" />
              <Bar dataKey="Real" fill="url(#colorReal)" radius={[0, 4, 4, 0]} barSize={14} name="Hecho" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* --- INFO LATERAL --- */}
        <div className="feedback-wrapper">
          
          <div className="feedback-box">
             <div className="feedback-header">
                <span className="icon">💬</span>
                <span>comentarios</span>
             </div>
             <p className="feedback-text">
               {/* 🔥 Usamos el comentario limpio */}
               {cleanComment.trim() !== "" 
                 ? `"${cleanComment}"` 
                 : <span style={{opacity: 0.5}}>Sin comentarios.</span>}
             </p>
          </div>

          <div className="mini-stats-row">
            <div className="mini-stat">
              <span className="stat-label">RPE</span>
              <div className="stat-number-wrapper">
                <span className="stat-number" style={{ color: '#FF4500' }}>
                    {feedback.rpe || "-"}
                </span>
                <span className="stat-max">/10</span>
              </div>
            </div>

            <div className="vertical-divider"></div>

            <div className="mini-stat">
              <span className="stat-label">ZAPATILLA</span>
              <span className="stat-text-value" style={{fontSize: '0.8rem'}}>
                {feedback.shoeId ? "✅" : "-"}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TrainingCard;