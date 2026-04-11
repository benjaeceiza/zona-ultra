import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const TrainingCard = ({ entrenamiento }) => {
  
  // 1. PREPARAR DATOS
  const feedback = entrenamiento.feedback || {};
  const isCompleted = entrenamiento.completado;

  // 🔥 DETECCIÓN DE "NO LOGRADO"
  const isFailed = isCompleted && (feedback.noLogrado || (feedback.comentario && feedback.comentario.includes('[NO LOGRADO]')));

  // Limpiamos el texto
  const cleanComment = feedback.comentario ? feedback.comentario.replace('[NO LOGRADO] ', '').replace('[NO LOGRADO]', '') : "";

  // 🔥 NUEVO: Función para normalizar a porcentajes (para que las barras se vean proporcionadas)
  const calcularPorcentaje = (estimado, real) => {
    if (!estimado || estimado === 0) return { estVisual: 0, realVisual: real > 0 ? 100 : 0 };
    return {
      estVisual: 100, // El plan siempre es la barra llena (100%)
      realVisual: Math.min(Math.round((real / estimado) * 100), 150) // Topeamos en 150% por si hizo de más, para que no rompa el gráfico
    };
  };

  const kmEstimado = entrenamiento.km || 0;
  const kmReal = feedback.kmReal || 0;
  const kmGrafico = calcularPorcentaje(kmEstimado, kmReal);

  const tiempoEstimado = entrenamiento.duracion || 0;
  const tiempoReal = isCompleted ? (feedback.duracionReal || 0) : 0;
  const tiempoGrafico = calcularPorcentaje(tiempoEstimado, tiempoReal);

  const dataGrafico = [
    {
      metrica: "Km",
      Estimado: kmEstimado, // Valor real (para el tooltip)
      Real: kmReal,         // Valor real (para el tooltip)
      EstimadoVis: kmGrafico.estVisual, // Valor normalizado (para dibujar la barra)
      RealVis: kmGrafico.realVisual,    // Valor normalizado (para dibujar la barra)
      unidad: "km"
    },
    {
      metrica: "Tiempo",
      Estimado: tiempoEstimado,
      Real: tiempoReal,
      EstimadoVis: tiempoGrafico.estVisual,
      RealVis: tiempoGrafico.realVisual,
      unidad: entrenamiento.unidad === 'horas' ? 'hs' : 'min'
    },
  ];

  // 2. TOOLTIP PERSONALIZADO 🔥 MODIFICADO
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Buscamos los datos reales usando el label ("Km" o "Tiempo")
      const dataItem = dataGrafico.find(d => d.metrica === label);
      if (!dataItem) return null;

      return (
        <div className="custom-tooltip" style={{ background: '#1e293b', padding: '10px', border: '1px solid #334155', borderRadius: '8px' }}>
          <p className="custom-tooltip-p" style={{ margin: '0 0 5px 0', color: '#fff', fontWeight: 'bold' }}>{label}</p>
          <p className="custom-tooltip-p-2" style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
            Plan: <strong style={{ color: '#fff' }}>{dataItem.Estimado} {dataItem.unidad}</strong>
          </p>
          <p className="custom-tooltip-p-2" style={{ margin: 0, color: '#FF4500', fontSize: '0.85rem' }}>
            Hecho: <strong style={{ color: '#fff' }}>{dataItem.Real} {dataItem.unidad}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`training-card ${isCompleted && !isFailed ? "card-glow-border" : ""}`} style={isFailed ? { border: '1px solid rgba(255, 77, 77, 0.3)' } : {}}>
      
      {/* --- CABECERA --- */}
      <div className="card-header-row">
        <div className="title-group">
          <span className="day-badge">{entrenamiento.dia}</span>
          <h3 className="card-title">{entrenamiento.tipo}</h3>
          <p className="card-subtitle">{entrenamiento.titulo}</p>
        </div>
        
        <div 
            className={`status-pill ${isCompleted ? (isFailed ? "status-failed" : "status-success") : "status-pending"}`}
            style={isFailed ? { backgroundColor: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', border: '1px solid #ff4d4d' } : {}}
        >
          {isCompleted ? (isFailed ? "NO LOGRADO" : "COMPLETADO") : "PENDIENTE"}
        </div>
      </div>

      {/* --- DESCRIPCIÓN DEL ENTRENAMIENTO --- */}
      {entrenamiento.descripcion && (
        <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            padding: '12px 16px',
            margin: '0 20px 15px 20px',
            borderRadius: '8px',
            borderLeft: '3px solid #00D2BE',
        }}>
            <span style={{ 
                display: 'block', 
                color: '#fff', 
                fontSize: '0.7rem', 
                textTransform: 'uppercase', 
                letterSpacing: '1px', 
                marginBottom: '6px',
                opacity: 0.8
            }}>
                🎯 La Misión
            </span>
            <p style={{ 
                color: '#cbd5e1',
                fontSize: '0.85rem', 
                lineHeight: '1.5', 
                margin: 0,
                whiteSpace: 'pre-line' 
            }}>
                {entrenamiento.descripcion}
            </p>
        </div>
      )}

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
                  <stop offset="0%" stopColor="#07ffe6" stopOpacity={0.5}/>
                  <stop offset="100%" stopColor="#00ffe5" stopOpacity={0.9}/>
                </linearGradient>

                <linearGradient id="colorReal" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#FF4500" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#ff7849" stopOpacity={1}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" />
              {/* 🔥 NUEVO: Forzamos el dominio del eje X de 0 a 100+ para manejar los porcentajes */}
              <XAxis type="number" hide domain={[0, 'dataMax']} />
              
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
              
              {/* 🔥 MODIFICADO: Ahora apuntan a EstimadoVis y RealVis */}
              <Bar dataKey="EstimadoVis" fill="url(#colorPlan)" radius={[0, 4, 4, 0]} barSize={14} name="Plan" />
              <Bar dataKey="RealVis" fill="url(#colorReal)" radius={[0, 4, 4, 0]} barSize={14} name="Hecho" />
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