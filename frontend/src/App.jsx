import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Login from "./components/views/login/Login";
import Register from "./components/views/register/Register";
import Dashboard from "./components/views/dashboard/Dashboard";
import AddPlan from "./components/views/add-plan/AddPlan";
import AdminRoute from "./components/AdminRoute";
import LoginRoute from "./components/LoginRoute";
import UserList from "./components/views/listado-usuarios/UserList";
import { LoaderProvider } from "./context/LoaderContext";
import RouteHandler from "./components/loader/RouteHandler";
import ShoesPage from "./components/views/shoes/ShoesPage";
import DetallePlan from "./components/views/detalle-plan-admin/DetallePlan";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import EditPlan from "./components/views/edit-plan/EditPlan";
import TrainingDetail from "./components/views/detalle-plan/TrainingDetail";
import HistorialEntrenamiento from "./components/views/historial-entrenamiento/HistorialEntrenamiento";
import DetalleHistorial from "./components/views/detalle-historial/DetalleHistorial";
import Medallero from "./components/views/medallero/lista-medallero/Medallero";
import MedalForm from "./components/views/medallero/formulario-medallero/MedalForm";

// Importamos el nuevo Layout que creamos
import AppLayout from "./components/layout/AppLayout";
import ProfilePage from "./components/views/perfil/ProfilePage";
import HistorialAdmin from "./components/views/historial-entrenamiento/HistorialAdmin";
import DetalleHistorialAdmin from "./components/views/detalle-historial/DetalleHistorialAdmin";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const TokenChecker = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          if (decoded.exp < currentTime) {
            console.log("Token expirado, cerrando sesión automáticamente.");
            localStorage.removeItem("token");
            window.location.href = "/login";
          }
        } catch (err) {
          console.log("Token inválido, cerrando sesión.");
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      }
    };

    // Revisar al cambiar de ruta
    checkToken();

    // Revisar constantemente cada 1 minuto
    const interval = setInterval(checkToken, 60000);

    return () => clearInterval(interval);
  }, [pathname]);

  return null;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <LoaderProvider>
      <BrowserRouter>
        <ScrollToTop />
        <TokenChecker />

        <ToastContainer
          position="top-left"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />

        <RouteHandler />
        <AppLayout>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<AdminRoute><Register /></AdminRoute>} />
            <Route path="/" element={<LoginRoute><Dashboard /></LoginRoute>} />
            <Route path="/perfil" element={<LoginRoute><ProfilePage /></LoginRoute>} />
            <Route path="/entrenamiento/:idPlan/:idEntrenamiento" element={<LoginRoute><TrainingDetail /></LoginRoute>} />
            <Route path="/historial/:idUsuario" element={<LoginRoute><HistorialEntrenamiento /></LoginRoute>} />
            <Route path="/detalle-historial/:idPlan" element={<LoginRoute><DetalleHistorial /></LoginRoute>} />
            <Route path="/mis-zapatillas" element={<LoginRoute><ShoesPage /></LoginRoute>} />
            <Route path="/crear-plan" element={<AdminRoute><AddPlan /></AdminRoute>} />
            <Route path="/crear-plan/:id" element={<AdminRoute><AddPlan /></AdminRoute>} />
            <Route path="/editar-plan/:idPlan" element={<AdminRoute><EditPlan /></AdminRoute>} />
            <Route path="/usuarios" element={<AdminRoute><UserList /></AdminRoute>} />
            <Route path="/detalle-plan-admin/:id" element={<AdminRoute><DetallePlan /></AdminRoute>} />
            <Route path="/medallero" element={<LoginRoute><Medallero /></LoginRoute>} />
            <Route path="/medallero/new" element={<LoginRoute><MedalForm /></LoginRoute>} />
            <Route path="/medallero/editar/:id" element={<LoginRoute><MedalForm /></LoginRoute>} />
            <Route path="/historial-admin/:idUsuario" element={<AdminRoute><HistorialAdmin /></AdminRoute>} />
            <Route path="/detalle-historial-admin/:idPlan" element={<AdminRoute><DetalleHistorialAdmin /></AdminRoute>} />
          </Routes>
        </AppLayout>

      </BrowserRouter>
    </LoaderProvider>
  );
}

export default App;