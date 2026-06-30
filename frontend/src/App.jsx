import { useEffect } from "react"; 
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Login from "./components/views/login/Login";
import Register from "./components/views/register/Register";
import Dashboard from "./components/views/dashboard/Dashboard";
import Navbar from "./components/navbar/Navbar";
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


import Footer from "./components/footer/Footer"; 
import TrainingDetail from "./components/views/detalle-plan/TrainingDetail";
import HistorialEntrenamiento from "./components/views/historial-entrenamiento/HistorialEntrenamiento";
import DetalleHistorial from "./components/views/detalle-historial/DetalleHistorial";
import Medallero from "./components/views/medallero/lista-medallero/Medallero";
import MedalForm from "./components/views/medallero/formulario-medallero/MedalForm";

// --- COMPONENTE PARA EL SCROLL ---
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// --- NAVBAR CONDICIONAL ---
const ConditionalNavbar = () => {
  const location = useLocation();
  const hiddenPaths = ["/login"]; 

  if (hiddenPaths.includes(location.pathname)) {
    return null;
  }

  return <Navbar />;
};

// --- 🔥 2. FOOTER CONDICIONAL ---
// Hacemos que se oculte en el login para mantener el diseño limpio ahí
const ConditionalFooter = () => {
    const location = useLocation();
    const hiddenPaths = ["/login"]; 
  
    if (hiddenPaths.includes(location.pathname)) {
      return null;
    }
  
    return <Footer />;
};

// --- RUTA PÚBLICA ---
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token"); 
  
  if (token) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <>
      <LoaderProvider>
        <BrowserRouter>
          
          <ScrollToTop />
          
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


          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>            
            <ConditionalNavbar />
            <main style={{ flex: 1 }}>
              <Routes>
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/register" element={<AdminRoute><Register /></AdminRoute>} />
                <Route path="/" element={<LoginRoute><Dashboard /></LoginRoute>} />
                <Route path="/entrenamiento/:idPlan/:idEntrenamiento" element={<LoginRoute><TrainingDetail /></LoginRoute>} />
                <Route path="/historial/:idUsuario" element={<LoginRoute><HistorialEntrenamiento /></LoginRoute>} />
                <Route path="/detalle-historial/:idPlan" element={<LoginRoute><DetalleHistorial /></LoginRoute>} />
                <Route path="/mis-zapatillas" element={<LoginRoute><ShoesPage /></LoginRoute>} />
                <Route path="/crear-plan" element={<AdminRoute><AddPlan /></AdminRoute>} />
                <Route path="/crear-plan/:id" element={<AdminRoute><AddPlan /></AdminRoute>} />
                <Route path="/editar-plan/:idPlan" element={<AdminRoute><EditPlan /></AdminRoute>} />
                <Route path="/usuarios" element={<AdminRoute><UserList /></AdminRoute>} />
                <Route path="/detalle-plan-admin/:id" element={<AdminRoute><DetallePlan /></AdminRoute>} />
                <Route path="/medallero" element={<LoginRoute><Medallero/></LoginRoute>}/>
                <Route path="/medallero/new" element={<LoginRoute><MedalForm/></LoginRoute>}/>
                <Route path="/medallero/editar/:id" element={<LoginRoute><MedalForm/></LoginRoute>}/>
              </Routes>
            </main>

            <ConditionalFooter />
          </div>
          
        </BrowserRouter>
      </LoaderProvider>
    </>
  )
}

export default App;