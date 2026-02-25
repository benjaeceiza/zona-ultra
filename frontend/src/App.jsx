import { useEffect } from "react"; 
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom"; // 1. IMPORTANTE: Agregué Navigate
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

// --- 2. NUEVO COMPONENTE: RUTA PÚBLICA ---
// Si ya estás logueado (hay token), te patea al Home ("/").
// Si no estás logueado, te deja ver el Login.
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
          
          <ConditionalNavbar />
          <ToastContainer 
            position="top-right"
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
          <Routes>
            {/* 3. ENVIO EL LOGIN CON PUBLIC ROUTE */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            
            <Route path="/register" element={<AdminRoute><Register /></AdminRoute>} />
            <Route path="/" element={<LoginRoute><Dashboard /></LoginRoute>} />
            <Route path="/mis-zapatillas" element={<LoginRoute><ShoesPage /></LoginRoute>} />
            <Route path="/crear-plan" element={<AdminRoute><AddPlan /></AdminRoute>} />
            <Route path="/crear-plan/:id" element={<AdminRoute><AddPlan /></AdminRoute>} />
            <Route path="/editar-plan/:idPlan" element={<AdminRoute><EditPlan /></AdminRoute>} />
            <Route path="/usuarios" element={<AdminRoute><UserList /></AdminRoute>} />
            <Route path="/detalle-plan/:id" element={<AdminRoute><DetallePlan /></AdminRoute>} />
          </Routes>
        </BrowserRouter>
      </LoaderProvider>
    </>
  )
}

export default App