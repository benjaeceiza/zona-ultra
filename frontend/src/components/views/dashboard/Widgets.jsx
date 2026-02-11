import { useState, useEffect } from "react";

// --- COMPONENTE 2: CLIMA (Mockup Visual) ---

export const WeatherWidget = () => {
    return (
        <div className=" weather-card">
            <div className="weather-icon">🌤️</div>
            <div className="weather-info">
                <span className="temp">18°C</span>
                <span className="location">Montaña</span>
            </div>
            <div className="weather-detail">
                <span>💧 10%</span>
                <span>💨 15km/h</span>
            </div>
        </div>
    );
};


export const ShoeTracker = ({ userShoes = [] }) => {
    
    // 1. INICIALIZACIÓN: Leemos del localStorage al crear el estado
    const [selectedIndex, setSelectedIndex] = useState(() => {
        const savedIndex = localStorage.getItem("selectedShoeIndex");
        // Si existe, lo convertimos a número, si no, devolvemos 0
        return savedIndex !== null ? Number(savedIndex) : 0;
    });

    // 2. GUARDADO: Cada vez que cambia el index, lo guardamos
    useEffect(() => {
        localStorage.setItem("selectedShoeIndex", selectedIndex);
    }, [selectedIndex]);

    // 3. SEGURIDAD: Si userShoes cambia y el índice guardado es mayor 
    // que la cantidad de zapatillas (ej: borraste una), reseteamos a 0.
    useEffect(() => {
        if (userShoes.length > 0 && selectedIndex >= userShoes.length) {
            setSelectedIndex(0);
        }
    }, [userShoes, selectedIndex]);


    // Si no hay zapatillas, mostramos un estado vacío
    if (!userShoes || userShoes.length === 0) {
        return (
            <div className="widget-card shoe-card-widget">
                <div className="shoe-icon-container-widget">👟</div>
                <div className="shoe-info-widget">
                    <span className="widget-label">MI EQUIPO</span>
                    <h4 className="shoe-model-widget">Sin zapatillas</h4>
                    <small style={{ color: '#666' }}>Agregá una en el garage</small>
                </div>
            </div>
        );
    }

    // Datos de la zapatilla seleccionada actualmente
    // (Validamos que exista para evitar errores si el array carga después)
    const currentShoe = userShoes[selectedIndex] || userShoes[0];

    // Cálculos
    const actual = currentShoe.currentKm || 0;
    const maximo = currentShoe.maxKm || 800;
    
    const porcentaje = Math.min((actual / maximo) * 100, 100);
    const colorBarra = porcentaje > 80 ? '#FF4500' : '#00D2BE';

    return (
        <div className="widget-card shoe-card-widget">
            <div className="shoe-icon-container-widget">
                👟
            </div>
            <div className="shoe-info-widget">
                <span className="widget-label">MI EQUIPO</span>

                <div className="shoe-select-wrapper">
                    <select
                        className="shoe-model-select"
                        value={selectedIndex}
                        onChange={(e) => setSelectedIndex(Number(e.target.value))}
                    >
                        {userShoes.map((shoe, index) => (
                            <option key={shoe._id || index} value={index}>
                                {shoe.brand} {shoe.model}
                            </option>
                        ))}
                    </select>
                    <span className="select-arrow">▼</span>
                </div>

                <div className="shoe-progress-bg-widget">
                    <div
                        className="shoe-progress-fill-widget"
                        style={{
                            width: `${porcentaje}%`,
                            backgroundColor: colorBarra
                        }}
                    ></div>
                </div>

                <div className="shoe-stats-widget">
                    <span>{actual} km</span>
                    <span className="shoe-limit"> / {maximo} km</span>
                </div>
            </div>
        </div>
    );
};