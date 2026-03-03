import "./Footer.css";

const Footer = () => {
    // Tomamos el año actual de forma dinámica
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer-container">
            <div className="footer-content">
                <p className="footer-text">
                    &copy; {currentYear} <span className="footer-brand">Zona Ultra</span>. Todos los derechos reservados.
                </p>
                
                <div className="footer-version-badge">
                    <span className="version-dot"></span>
                    VERSIÓN BETA 1.0
                </div>
            </div>
        </footer>
    );
};

export default Footer;