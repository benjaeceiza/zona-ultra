import { useState, useEffect } from "react";

// --- COMPONENTE 2: CLIMA (Mockup Visual) ---

const getWeatherIcon = (weatherId, isNight) => {
    if (weatherId >= 200 && weatherId < 300) return "⛈️"; // Tormenta
    if (weatherId >= 300 && weatherId < 500) return "🌦️"; // Llovizna
    if (weatherId >= 500 && weatherId < 600) return "🌧️"; // Lluvia
    if (weatherId >= 600 && weatherId < 700) return "❄️"; // Nieve
    if (weatherId >= 700 && weatherId < 800) return "🌫️"; // Niebla
    if (weatherId === 800) return isNight ? "🌙" : "☀️"; // Despejado
    if (weatherId > 800) return "☁️"; // Nublado
    return "🌤️"; // Default
};

export const WeatherWidget = () => {
    // Estado para guardar los datos
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // TU API KEY (Si esta falla, registrate gratis en OpenWeatherMap y poné la tuya)
    const API_KEY = "831cbbc051686ead8ff1bf31a04e1dbd"; 

    useEffect(() => {
        // Función para pedir el clima
        const fetchWeather = async (lat, lon) => {
            try {
                const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}`;
                const res = await fetch(url);
                const data = await res.json();

                if (data.cod !== 200) throw new Error("Error en API");

                setWeather({
                    temp: Math.round(data.main.temp),
                    city: data.name,
                    humidity: data.main.humidity,
                    wind: Math.round(data.wind.speed * 3.6), // Convertimos m/s a km/h
                    id: data.weather[0].id,
                    isNight: data.weather[0].icon.includes('n') // Detectamos si es de noche
                });

            } catch (err) {
                console.error(err);
                setError("Sin datos");
            } finally {
                setLoading(false);
            }
        };

        // Pedimos la ubicación al navegador
        navigator.geolocation.getCurrentPosition(
            (position) => {
                fetchWeather(position.coords.latitude, position.coords.longitude);
            },
            (err) => {
                // Si el usuario niega la ubicación, usamos una por defecto (ej: Villa Mercedes)
                // Coordenadas de Villa Mercedes: -33.6757, -65.4585
                fetchWeather(-33.6757, -65.4585); 
                console.log("Ubicación denegada, usando default.");
            }
        );
    }, []);

    // --- RENDERIZADO ---

    // 1. Estado de carga (mantenemos la estructura visual)
    if (loading) return (
        <div className="weather-card">
            <div className="weather-icon">⏳</div>
            <div className="weather-info">
                <span className="location">Cargando...</span>
            </div>
        </div>
    );

    // 2. Estado de error (o fallback visual)
    if (error || !weather) return (
        <div className="weather-card">
            <div className="weather-icon">❌</div>
            <div className="weather-info">
                <span className="location">Offline</span>
            </div>
        </div>
    );

    // 3. Widget Funcional
    return (
        <div className="weather-card">
            <div className="weather-icon">
                {getWeatherIcon(weather.id, weather.isNight)}
            </div>
            
            <div className="weather-info">
                <span className="temp">{weather.temp}°C</span>
                {/* Recortamos el nombre si es muy largo */}
                <span className="location">
                    {weather.city.length > 12 ? weather.city.substring(0, 10) + '...' : weather.city}
                </span>
            </div>
            
            <div className="weather-detail">
                <span title="Humedad">💧 {weather.humidity}%</span>
                <span title="Viento">💨 {weather.wind}km/h</span>
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