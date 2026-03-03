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

// 🔥 1. IMPORTAMOS EL FOOTER (Ajustá la ruta según tu estructura)
import Footer from "./components/footer/Footer"; 

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

          {/* 🔥 3. ENVOLVEMOS LA ESTRUCTURA EN UN CONTENEDOR FLEX */}
          {/* Esto garantiza que el footer se quede pegado abajo aunque haya poco contenido */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            
            <ConditionalNavbar />

            {/* 🔥 4. El <main> con flex: 1 empuja todo el contenido hacia abajo */}
            <main style={{ flex: 1 }}>
              <Routes>
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
            </main>

            <ConditionalFooter />
          </div>
          
        </BrowserRouter>
      </LoaderProvider>
    </>
  )
}

export default App;