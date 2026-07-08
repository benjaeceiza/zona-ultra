import './ProfileSkeleton.css';

const ProfileSkeleton = () => {
    return (
        <main className="profile-container">
            {/* --- HEADER SKELETON --- */}
            <header className="profile-header">
                <div className="sk-block" style={{ width: '90px', height: '36px', borderRadius: '8px' }}></div>
                <div className="profile-title-group">
                    <div className="sk-block" style={{ width: '150px', height: '14px', marginBottom: '6px' }}></div>
                    <div className="sk-block" style={{ width: '220px', height: '32px' }}></div>
                </div>
            </header>

            <div className="profile-grid">
                
                {/* --- COLUMNA IZQUIERDA: ID CARD --- */}
                <aside className="sk-id-card">
                    <div className="sk-block sk-avatar-circle"></div>
                    <div className="sk-block sk-badge"></div>
                    <div className="sk-block sk-name"></div>
                    <div className="sk-block sk-email"></div>

                    <div className="sk-divider"></div>

                    <div className="sk-stats-grid">
                        <div className="sk-block sk-stat-box"></div>
                        <div className="sk-block sk-stat-box"></div>
                        <div className="sk-block sk-stat-box"></div>
                    </div>

                    <div className="sk-block sk-logout-btn"></div>
                </aside>

                {/* --- COLUMNA DERECHA: EDITOR --- */}
                <section className="sk-editor-section">
                    
                    {/* Tabs falsas */}
                    <div className="sk-tabs-row">
                        <div className="sk-block sk-tab"></div>
                        <div className="sk-block sk-tab"></div>
                        <div className="sk-block sk-tab"></div>
                    </div>

                    {/* Formulario falso */}
                    <div className="sk-form-body">
                        <div className="sk-block sk-section-title"></div>
                        
                        <div className="sk-form-row">
                            <div className="sk-input-group">
                                <div className="sk-block sk-label"></div>
                                <div className="sk-block sk-input"></div>
                            </div>
                            <div className="sk-input-group">
                                <div className="sk-block sk-label"></div>
                                <div className="sk-block sk-input"></div>
                            </div>
                        </div>

                        <div className="sk-form-row">
                            <div className="sk-input-group">
                                <div className="sk-block sk-label"></div>
                                <div className="sk-block sk-input"></div>
                            </div>
                            <div className="sk-input-group">
                                <div className="sk-block sk-label"></div>
                                <div className="sk-block sk-input"></div>
                            </div>
                        </div>

                        <div className="sk-form-row">
                            <div className="sk-input-group">
                                <div className="sk-block sk-label"></div>
                                <div className="sk-block sk-input"></div>
                            </div>
                        </div>

                        <div className="sk-footer">
                            <div className="sk-block sk-save-btn"></div>
                        </div>
                    </div>

                </section>
            </div>
        </main>
    );
};

export default ProfileSkeleton;