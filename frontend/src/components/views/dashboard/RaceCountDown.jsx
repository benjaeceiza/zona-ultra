import { useState, useEffect } from "react";
import { updateUserRace } from "../../../services/updateRace";
import confetti from "canvas-confetti"; // 🔥 Efecto facherito

const RaceCountdown = ({ initialFecha, initialNombre, userId }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [raceName, setRaceName] = useState(initialNombre || "");
    const [raceDateStr, setRaceDateStr] = useState(initialFecha ? initialFecha.split('T')[0] : "");

    // --- LÓGICA DE TIEMPO REPARADA ---
    const getDaysLeft = () => {
        if (!raceDateStr) return null;

        // FIX ZONA HORARIA: Forzamos el mediodía para evitar saltos de día por UTC
        const target = new Date(raceDateStr + "T12:00:00");
        const today = new Date();
        today.setHours(12, 0, 0, 0); // Normalizamos hoy también al mediodía

        const diffTime = target - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const daysLeft = getDaysLeft();

    // --- LÓGICA DE ESTILOS Y FRASES ---
    const getStatusConfig = (days) => {
        if (days === null) return { color: "#888", phrase: "¡Ponete un objetivo!" };
        if (days === 0) return { color: "#00D2BE", phrase: "¡HOY SE DEJA TODO! 🏃‍♂️💨" };
        if (days < 0) return { color: "#444", phrase: "¡Carrera finalizada! ¿Cuál sigue?" };
        if (days <= 7) return { color: "#ff4d4d", phrase: "¡Semana de descarga! A cuidar las patas 🍗" };
        if (days <= 21) return { color: "#f1c40f", phrase: "¡Semanas clave! No aflojes ⚡" };
        return { color: "#00D2BE", phrase: "Buen tiempo para preparar la base 🏔️" };
    };

    const config = getStatusConfig(daysLeft);

    // --- EFECTO DE CUMPLE/CARRERA ---
    useEffect(() => {
        // Solo si es el día de la carrera
        if (daysLeft === 0) {
            const hoyStr = new Date().toLocaleDateString(); // "25/2/2026"
            const ultimoFestejo = localStorage.getItem(`festejo_${userId}_${raceDateStr}`);

            // Si hoy no festejamos todavía este objetivo específico
            if (ultimoFestejo !== hoyStr) {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#00D2BE', '#f1c40f', '#ffffff']
                });

                // Guardamos la marca para que no se repita hoy
                localStorage.setItem(`festejo_${userId}_${raceDateStr}`, hoyStr);
            }
        }
    }, [daysLeft, userId, raceDateStr]);

    const handleSave = async () => {
        try {
            const data = { name: raceName, date: raceDateStr };
            await updateUserRace(userId, data);
            setIsEditing(false);
        } catch (error) {
            alert("Hubo un problema: " + error.message);
        }
    };

    return (
        <div
            className="widget-card countdown-card"
            style={{
                borderLeft: `5px solid ${config.color}`,
                transition: 'all 0.3s ease'
            }}
        >
            {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="edit-race-btn">✏️</button>
            )}

            <div className="widget-content">
                <span className="widget-label" style={{ color: config.color }}>
                    {daysLeft === 0 ? "¡LLEGÓ EL DÍA! 🏆" : "PRÓXIMO OBJETIVO 🏁"}
                </span>

                {isEditing ? (
                    <div className="race-edit-form">
                        <input
                            type="text"
                            value={raceName}
                            onChange={(e) => setRaceName(e.target.value)}
                            className="race-input"
                            placeholder="Nombre de la carrera"
                        />
                        <input
                            type="date"
                            value={raceDateStr}
                            onChange={(e) => setRaceDateStr(e.target.value)}
                            className="race-input"
                        />
                        <div className="race-actions">
                            <button onClick={handleSave} className="save-btn">Guardar</button>
                            <button onClick={() => setIsEditing(false)} className="cancel-btn">X</button>
                        </div>
                    </div>
                ) : (
                    <div className="race-info-display">
                        <h3 className="race-name">{raceName || "Definir objetivo"}</h3>
                        <p className="race-phrase" style={{ fontSize: '0.8rem', fontStyle: 'italic', opacity: 0.8 }}>
                            {config.phrase}
                        </p>
                    </div>
                )}
            </div>

            {!isEditing && raceDateStr && daysLeft >= 0 && (
                <div className="countdown-box" style={{ background: config.color }}>
                    <span className="count-number">{daysLeft}</span>
                    <span className="count-label">{daysLeft === 1 ? "DÍA" : "DÍAS"}</span>
                </div>
            )}
        </div>
    );
};

export default RaceCountdown;