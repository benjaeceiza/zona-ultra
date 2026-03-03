import { useState, useEffect } from "react";
import { updateUserRace } from "../../../services/updateRace";
import confetti from "canvas-confetti";

const RaceCountdown = ({ initialFecha, initialNombre, userId }) => {
    const [isEditing, setIsEditing] = useState(false);

    // --- ESTADOS REALES ---
    const [savedName, setSavedName] = useState(initialNombre || "");
    const [savedDateStr, setSavedDateStr] = useState(initialFecha ? initialFecha.split('T')[0] : "");

    // --- ESTADOS BORRADOR ---
    const [draftName, setDraftName] = useState("");
    const [draftDateStr, setDraftDateStr] = useState("");

    // --- LÓGICA DE TIEMPO ---
    const getDaysLeft = () => {
        if (!savedDateStr) return null;

        const target = new Date(savedDateStr + "T12:00:00");
        const today = new Date();
        today.setHours(12, 0, 0, 0);

        const diffTime = target - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const daysLeft = getDaysLeft();

    // --- LÓGICA DE ESTILOS Y FRASES ---
    const getStatusConfig = (days) => {
        if (days === null) return { color: "#888", phrase: "Aún no hay evento." };
        if (days === 0) return { color: "#00D2BE", phrase: "¡HOY SE DEJA TODO! 🏃‍♂️💨" };
        if (days < 0) return { color: "#444", phrase: "¡Carrera finalizada! ¿Cuál sigue?" };
        if (days <= 7) return { color: "#ff4d4d", phrase: "¡Semana de descarga! A cuidar las patas 🍗" };
        if (days <= 21) return { color: "#f1c40f", phrase: "¡Semanas clave! No aflojes ⚡" };
        return { color: "#00D2BE", phrase: "Buen tiempo para preparar la base 🏔️" };
    };

    const config = getStatusConfig(daysLeft);

    // --- FORMATEAR LA FECHA (Para mostrarla chiquita abajo) ---
    const displayDate = savedDateStr ? new Date(savedDateStr + "T12:00:00").toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: '2-digit'
    }) : "";

    // --- EFECTO CONFETTI ---
    useEffect(() => {
        if (daysLeft === 0) {
            const hoyStr = new Date().toLocaleDateString();
            const ultimoFestejo = localStorage.getItem(`festejo_${userId}_${savedDateStr}`);

            if (ultimoFestejo !== hoyStr) {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#00D2BE', '#f1c40f', '#ffffff']
                });
                localStorage.setItem(`festejo_${userId}_${savedDateStr}`, hoyStr);
            }
        }
    }, [daysLeft, userId, savedDateStr]);

    // --- FUNCIONES DE BOTONES ---
    const handleEditClick = () => {
        setDraftName(savedName);
        setDraftDateStr(savedDateStr);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const handleSave = async () => {
        try {
            const data = { name: draftName, date: draftDateStr };
            await updateUserRace(userId, data);
            
            setSavedName(draftName);
            setSavedDateStr(draftDateStr);
            setIsEditing(false);
        } catch (error) {
            alert("Hubo un problema: " + error.message);
        }
    };

    const handleDelete = async () => {
        const confirmar = window.confirm("¿Seguro que querés eliminar el objetivo?");
        if (!confirmar) return;

        try {
            await updateUserRace(userId, { name: "", date: "" });
            
            setSavedName("");
            setSavedDateStr("");
            setIsEditing(false);
        } catch (error) {
            alert("Hubo un problema al eliminar: " + error.message);
        }
    };

    return (
        <div
            className="widget-card countdown-card"
            style={{
                borderLeft: `5px solid ${config.color}`,
                transition: 'all 0.3s ease',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}
        >
            <div className="widget-content" style={{ flex: 1 }}>
                <span className="widget-label" style={{ color: config.color, display: 'block', marginBottom: '8px' }}>
                    {daysLeft === 0 ? "¡LLEGÓ EL DÍA! 🏆" : (savedDateStr ? "PRÓXIMO OBJETIVO 🏁" : "SIN OBJETIVO")}
                </span>

                {isEditing ? (
                    <div className="race-edit-form">
                        <input
                            type="text"
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            className="race-input"
                            placeholder="Nombre de la carrera"
                            style={{ marginBottom: '8px', width: '100%' }}
                        />
                        <input
                            type="date"
                            value={draftDateStr}
                            onChange={(e) => setDraftDateStr(e.target.value)}
                            className="race-input"
                            style={{ width: '100%' }}
                        />
                        <div className="race-actions" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button onClick={handleSave} className="save-btn" style={{ flex: 1 }}>Guardar</button>
                            <button onClick={handleCancel} className="cancel-btn" style={{ flex: 1, background: '#444' }}>Cancelar</button>
                        </div>
                    </div>
                ) : (
                    <div className="race-info-display">
                        {!savedDateStr ? (
                            <button 
                                onClick={handleEditClick}
                                style={{ 
                                    background: '#00D2BE', color: '#121212', border: 'none', 
                                    padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', 
                                    cursor: 'pointer', marginTop: '5px' 
                                }}
                            >
                                + Agregar evento
                            </button>
                        ) : (
                            <>
                                <h3 className="race-name" style={{ margin: '0 0 5px 0' }}>{savedName}</h3>
                                <p className="race-phrase" style={{ fontSize: '0.8rem', fontStyle: 'italic', opacity: 0.8, marginBottom: '12px' }}>
                                    {config.phrase}
                                </p>
                                
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button 
                                        onClick={handleEditClick} 
                                        style={{ background: 'transparent', color: '#00D2BE', border: '1px solid #00D2BE', borderRadius: '4px', padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer' }}
                                    >
                                        Editar
                                    </button>
                                    <button 
                                        onClick={handleDelete} 
                                        style={{ background: 'transparent', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: '4px', padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer' }}
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* CONTADOR DE DÍAS Y FECHA EXACTA */}
            {!isEditing && savedDateStr && daysLeft >= 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: '15px' }}>
                    <div className="countdown-box" style={{ background: config.color, minWidth: '60px', textAlign: 'center', margin: 0 }}>
                        <span className="count-number">{daysLeft}</span>
                        <span className="count-label">{daysLeft === 1 ? "DÍA" : "DÍAS"}</span>
                    </div>
                    {/* 🔥 ACÁ ESTÁ LA FECHA CHIQUITA */}
                    <span style={{ fontSize: '0.75rem', color: '#888', marginTop: '6px', fontWeight: 'bold', letterSpacing: '1px' }}>
                        {displayDate}
                    </span>
                </div>
            )}
        </div>
    );
};

export default RaceCountdown;