
import './DashboardSkeleton.css';

const DashboardSkeleton = () => {
    return (
        <main className="dashboard-container">
            {/* HEADER */}
            <header className="dash-header">
                <div className="header-left">
                    <div className="sk-dash-anim" style={{ width: '120px', height: '40px' }}></div>
                </div>
                <div className="header-center">
                    {/* Simulamos el logo redondo o cuadrado */}
                    <div className="sk-dash-anim" style={{ width: '60px', height: '60px', borderRadius: '50%' }}></div>
                </div>
                <div className="header-right">
                    {/* Simulamos el widget del clima */}
                    <div className="sk-dash-anim" style={{ width: '100px', height: '40px' }}></div>
                </div>
            </header>

            <section className="content-section">
                {/* BARRA DE PROGRESO */}
                <div className="progress-section" style={{ background: '#1a1a1a', padding: '20px', borderRadius: '15px', border: '1px solid #333' }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <div className="sk-dash-anim" style={{ width: '100px', height: '28px', borderRadius: '20px' }}></div>
                        <div className="sk-dash-anim" style={{ width: '140px', height: '28px', borderRadius: '20px' }}></div>
                    </div>
                    <div className="progress-info" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div className="sk-dash-anim" style={{ width: '150px', height: '20px' }}></div>
                        <div className="sk-dash-anim" style={{ width: '50px', height: '24px' }}></div>
                    </div>
                    <div className="sk-dash-anim sk-box" style={{ height: '10px', borderRadius: '5px' }}></div>
                </div>

                {/* STATS GRID (4 tarjetitas) */}
                <div className="stats-grid" style={{ marginTop: '20px' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="stat-card" style={{ background: '#1a1a1a', border: '1px solid #333' }}>
                            <div className="sk-dash-anim sk-box" style={{ height: '80px', borderRadius: '8px' }}></div>
                        </div>
                    ))}
                </div>

                {/* TÍTULO DE LA SECCIÓN */}
                <div style={{ margin: '30px 0 20px 0' }}>
                    <div className="sk-dash-anim" style={{ width: '200px', height: '30px' }}></div>
                </div>

                {/* CARDS GRID (Simulamos los 7 días de la semana) */}
                <div className="cards-grid">
                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                        <div key={i} className="sk-dash-anim sk-box" style={{ height: '160px', borderRadius: '15px' }}></div>
                    ))}
                </div>

                {/* WIDGETS INFERIORES (Cuenta regresiva y Zapatillas) */}
                <div className="widgets-row" style={{ marginTop: '30px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div className="sk-dash-anim" style={{ flex: '1 1 300px', height: '120px', borderRadius: '15px' }}></div>
                    <div className="sk-dash-anim" style={{ flex: '1 1 300px', height: '120px', borderRadius: '15px' }}></div>
                </div>
            </section>
        </main>
    );
};

export default DashboardSkeleton;