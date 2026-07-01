import './MedalleroSkeleton.css';

const MedalleroSkeleton = () => {
    // Generamos 6 tarjetas para que cubran bien la pantalla mientras carga
    const skeletonItems = Array.from({ length: 6 });

    return (
        <div className="ultra-page medallero-seccion">
            <header className="medallero-header">
                <div className="header-content">
                    <div className="skel-title"></div>
                    <div className="skel-text-short"></div>
                </div>
                <div className="skel-btn"></div>
            </header>

            <main>
                <div className="medallero-grid">
                    {skeletonItems.map((_, index) => (
                        <div key={index} className="race-card skeleton-pulse">
                            <div className="skel-image"></div>
                            <div className="race-card-content">
                                <div className="skel-title-card"></div>
                                <div className="skel-meta-row"></div>
                                <div className="skel-stats-row">
                                    <div className="skel-stat"></div>
                                    <div className="skel-stat"></div>
                                    <div className="skel-stat"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default MedalleroSkeleton;