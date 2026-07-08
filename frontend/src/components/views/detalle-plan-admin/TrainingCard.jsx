import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { FiChevronDown, FiTarget, FiMessageSquare, FiActivity } from "react-icons/fi";
import { GiRunningShoe } from "react-icons/gi";

const TrainingCard = ({ entrenamiento }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const feedback = entrenamiento.feedback || {};
  const isCompleted = entrenamiento.completado;
  const isFailed = isCompleted && (feedback.noLogrado || (feedback.comentario && feedback.comentario.includes('[NO LOGRADO]')));
  const cleanComment = feedback.comentario ? feedback.comentario.replace('[NO LOGRADO] ', '').replace('[NO LOGRADO]', '') : "";

  let statusClass = "status-pending";
  let badgeText = "PENDIENTE";
  if (isCompleted) {
    if (isFailed) { statusClass = "status-failed"; badgeText = "NO LOGRADO"; } 
    else { statusClass = "status-success"; badgeText = "COMPLETADO"; }
  }

  const calcularPorcentaje = (estimado, real) => {
    if (!estimado || estimado === 0) return { estVisual: 0, realVisual: real > 0 ? 100 : 0 };
    return { estVisual: 100, realVisual: Math.min(Math.round((real / estimado) * 100), 150) };
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
      Estimado: kmEstimado, Real: kmReal,
      EstimadoVis: kmGrafico.estVisual, RealVis: kmGrafico.realVisual,
      unidad: "km"
    },
    {
      metrica: "Tiempo",
      Estimado: tiempoEstimado, Real: tiempoReal,
      EstimadoVis: tiempoGrafico.estVisual, RealVis: tiempoGrafico.realVisual,
      unidad: entrenamiento.unidad === 'horas' ? 'hs' : 'min'
    },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataItem = dataGrafico.find(d => d.metrica === label);
      if (!dataItem) return null;
      return (
        <div style={{ background: '#1e293b', padding: '10px', border: '1px solid #334155', borderRadius: '8px' }}>
          <p style={{ margin: '0 0 5px 0', color: '#fff', fontWeight: 'bold' }}>{label}</p>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>Plan: <strong style={{ color: '#fff' }}>{dataItem.Estimado} {dataItem.unidad}</strong></p>
          <p style={{ margin: 0, color: '#FF4500', fontSize: '0.85rem' }}>Hecho: <strong style={{ color: '#FF4500' }}>{dataItem.Real} {dataItem.unidad}</strong></p>
        </div>
      );
    }
    return null;
  };

  return (
    <article className={`admin-training-card ${isExpanded ? 'expanded' : ''} ${statusClass}`}>
      
      {/* CABECERA (Acordeón) */}
      <div className="atc-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="atc-left">
          <span className="atc-day">{entrenamiento.dia}</span>
          <div className="atc-titles">
            <h4>{entrenamiento.tipo}</h4>
            <p>{entrenamiento.titulo}</p>
          </div>
        </div>

        <div className="atc-quick-metrics">
            <div className="atc-qm-item">
                <small>Volumen</small>
                <span>{isCompleted ? kmReal : kmEstimado} km</span>
            </div>
            <div className="atc-qm-item">
                <small>Tiempo</small>
                <span>{isCompleted ? tiempoReal : tiempoEstimado} {entrenamiento.unidad === 'horas' ? 'hs' : 'min'}</span>
            </div>
        </div>

        <div className="atc-right">
          <span className={`atc-badge badge-${statusClass.split('-')[1]}`}>{badgeText}</span>
          <FiChevronDown className="atc-chevron" />
        </div>
      </div>

      {/* CUERPO EXPANDIBLE */}
      {isExpanded && (
        <div className="atc-body">
          {/* Lado Izquierdo: Misión y Gráfico */}
          <div className="atc-body-left">
            {entrenamiento.descripcion && (
              <div className="atc-mission">
                <h5><FiTarget style={{marginRight: '5px'}}/> La Misión</h5>
                <p>{entrenamiento.descripcion}</p>
              </div>
            )}
            
            <div className="atc-chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataGrafico} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
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
                  <XAxis type="number" hide domain={[0, 'dataMax']} />
                  <YAxis dataKey="metrica" type="category" width={70} tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                  <Legend iconType="circle" wrapperStyle={{color: '#ccc', fontSize: '0.75rem', paddingTop: '10px'}}/>
                  <Bar dataKey="EstimadoVis" fill="url(#colorPlan)" radius={[0, 4, 4, 0]} barSize={14} name="Planificado" />
                  <Bar dataKey="RealVis" fill="url(#colorReal)" radius={[0, 4, 4, 0]} barSize={14} name="Realizado" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lado Derecho: Feedback */}
          <div className="atc-body-right">
            <div className="atc-feedback-box">
               <h5><FiMessageSquare style={{marginRight: '5px'}}/> Comentarios del Atleta</h5>
               <p>{cleanComment.trim() !== "" ? `"${cleanComment}"` : <span style={{opacity: 0.4}}>No dejó comentarios.</span>}</p>
            </div>

            <div className="atc-mini-stats">
              <div className="atc-mini-item">
                <small><FiActivity style={{marginRight: '4px'}}/> ESFUERZO (RPE)</small>
                <span>{feedback.rpe || "-"}<small style={{color:'#666', fontSize:'0.8rem'}}>/10</small></span>
              </div>
              <div style={{ width: '1px', background: '#333' }}></div>
              <div className="atc-mini-item">
                <small><GiRunningShoe style={{marginRight: '4px'}}/> ZAPATILLA</small>
                <span style={{color: '#00D2BE'}}>{feedback.shoeId ? "Usada ✅" : "-"}</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </article>
  );
};

export default TrainingCard;