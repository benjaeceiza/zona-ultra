import { useState } from "react";
import { updateUserRace } from "../../../services/updateRace";


const RaceCountdown = ({ initialFecha, initialNombre, userId }) => {

    // Estados locales para manejar la edición
    const [isEditing, setIsEditing] = useState(false);
    const [raceName, setRaceName] = useState(initialNombre || "");
    const [raceDateStr, setRaceDateStr] = useState(initialFecha ? initialFecha.split('T')[0] : "");

    // --- LÓGICA DE TIEMPO (Tu código original) ---
    const today = new Date();
    const targetDate = new Date(raceDateStr);
    // Ajuste: sumamos el time offset para evitar problemas de zona horaria al calcular días
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const daysLeft = diffDays > 0 ? diffDays : 0;

    // --- MANEJO DEL GUARDADO ---
    const handleSave = async () => {
        try {
            // userId: viene de props
            // raceName, raceDateStr: vienen del estado
            const data = {
                name: raceName,
                date: raceDateStr
            };

            await updateUserRace(userId, data);

            // Éxito: Salimos del modo edición
            setIsEditing(false);
            alert("¡Objetivo guardado! A entrenar duro 🚀");

        } catch (error) {
            alert("Hubo un problema: " + error.message);
        }
    };

    return (
        <div className="widget-card countdown-card" style={{ position: 'relative' }}>

            {/* Botón de Editar (visible solo al hacer hover o siempre, según tu gusto) */}
            {!isEditing && (
                <button
                    onClick={() => setIsEditing(true)}
                    className="edit-race-btn"
                    title="Editar objetivo"
                >
                    ✏️
                </button>
            )}

            <div className="widget-content">
                <span className="widget-label">PRÓXIMO OBJETIVO 🏁</span>

                {isEditing ? (
                    // --- MODO EDICIÓN ---
                    <div className="race-edit-form">
                        <input
                            type="text"
                            placeholder="Nombre de la carrera"
                            value={raceName}
                            onChange={(e) => setRaceName(e.target.value)}
                            className="race-input"
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
                    // --- MODO VISUALIZACIÓN ---
                    <>
                        <h3 className="race-name">
                            {raceName || "Definir objetivo"}
                        </h3>
                        <p className="race-date">
                            {raceDateStr ? new Date(raceDateStr).toLocaleDateString() : "--/--/--"}
                        </p>
                    </>
                )}
            </div>

            {/* Solo mostramos el contador si no estamos editando y hay fecha */}
            {!isEditing && raceDateStr && (
                <div className="countdown-box">
                    <span className="count-number">{daysLeft}</span>
                    <span className="count-label">DÍAS</span>
                </div>
            )}
        </div>
    );
};

export default RaceCountdown;