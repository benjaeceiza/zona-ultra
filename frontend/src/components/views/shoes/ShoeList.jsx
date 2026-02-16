import { useState, useEffect } from 'react';

const ShoeList = ({ refreshTrigger }) => { // refreshTrigger es opcional, por si querés recargar cuando agregás una nueva
    const [shoes, setShoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const url = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchShoes = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${url}/api/shoes`, { // Ojo con el puerto, vi 8080 acá y 5000 antes
                    headers: {
                        "Authorization": `Bearer ${token}`, // Asegurate que tu backend espere "Bearer" y no "x-auth-token"
                        // Si usabas mi código anterior de backend, en headers era: 'x-auth-token': token
                    }
                });

                const data = await res.json();


                // LÓGICA CORREGIDA:
                if (Array.isArray(data)) {
                    // CASO A: El backend devuelve directo el array [ {..}, {..} ]
                    setShoes(data);
                } else if (data.data && Array.isArray(data.data)) {
                    // CASO B: El backend devuelve { success: true, data: [ ... ] }
                    setShoes(data.data);
                } else if (data.success && data.data) {
                    // CASO C: Devuelve un solo objeto en data, lo metemos en un array para que el map no rompa
                    setShoes([data.data]);
                } else {
                    console.warn("Formato de respuesta no reconocido", data);
                }

            } catch (error) {
                console.error("Error cargando zapatillas:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchShoes();

    }, [refreshTrigger]); // Se vuelve a ejecutar si cambia refreshTrigger

   

    if (loading) return <p>Cargando equipamiento...</p>;
    if (shoes.length === 0) return <p>No tenés zapatillas registradas.</p>;


    return (
        <div className="row mt-4">
            {shoes.map((shoe) => {
                // Calculamos porcentaje de vida útil
                const percentage = Math.min((shoe.currentKm / shoe.maxKm) * 100, 100);
                // Color de la barra: Verde (ok), Amarillo (atención), Rojo (cambiar)
                let barColor = 'bg-success';
                if (percentage > 75) barColor = 'bg-warning';
                if (percentage >= 100) barColor = 'bg-danger';

                return (
                    <div key={shoe._id} className="col-md-4 mb-3">
                        <div className="card shadow-sm h-100">
                            <div className="card-body">
                                <h5 className="card-title fw-bold">{shoe.brand} {shoe.model}</h5>

                                <div className="mt-3">
                                    <div className="d-flex justify-content-between small mb-1">
                                        <span>Uso actual:</span>
                                        <span className="fw-bold">{shoe.currentKm} / {shoe.maxKm} km</span>
                                    </div>

                                    {/* Barra de progreso */}
                                    <div className="progress" style={{ height: '10px' }}>
                                        <div
                                            className={`progress-bar ${barColor}`}
                                            role="progressbar"
                                            style={{ width: `${percentage}%` }}
                                            aria-valuenow={percentage}
                                            aria-valuemin="0"
                                            aria-valuemax="100"
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ShoeList;