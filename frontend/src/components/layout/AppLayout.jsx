import { useLocation } from "react-router-dom";
import Navbar from "../navbar/Navbar"; // Ajustá la ruta según dónde lo guardes
import Footer from "../footer/Footer"; // Ajustá la ruta según dónde esté tu footer
import "./AppLayout.css"; 

const AppLayout = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  // Si es la página de login, renderizamos el contenido limpio sin barras laterales ni footer
  if (isLoginPage) {
    return (
      <div className="auth-layout-wrapper">
        <main className="auth-main-content">
          {children}
        </main>
      </div>
    );
  }

  // Para todo el resto de la app, aplicamos el layout de dos columnas
  return (
    <div className="app-main-layout">
      {/* Navbar inteligente: en PC renderiza el Sidebar izquierdo y en Celular el TabBar */}
      <Navbar />

      {/* Columna derecha: Contenido de las páginas + Footer */}
      <div className="app-content-wrapper">
        <main className="app-main-content">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default AppLayout;