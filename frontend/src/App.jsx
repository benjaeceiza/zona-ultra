
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/views/login/Login";
import Register from "./components/views/register/Register";
import Dashboard from "./components/views/dashboard/Dashboard";
import Navbar from "./components/Navbar";
import AddPlan from "./components/views/add-plan/AddPlan";
import AdminRoute from "./components/AdminRoute";
import LoginRoute from "./components/LoginRoute";
import UserList from "./components/views/listado-usuarios/UserList";
import { LoaderProvider } from "./context/LoaderContext";
import RouteHandler from "./components/loader/RouteHandler";
import ShoesPage from "./components/views/shoes/ShoesPage";
import DetallePlan from "./components/views/detalle-plan-admin/DetallePlan";


function App() {

  return (
    <>
      <LoaderProvider>
        <BrowserRouter>
          <Navbar />
          <RouteHandler />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<AdminRoute><Register /></AdminRoute>} />
            <Route path="/" element={<LoginRoute><Dashboard /></LoginRoute>} />
            <Route path="/mis-zapatillas" element={<LoginRoute><ShoesPage /></LoginRoute>} />
            <Route path="/crear-plan" element={<AdminRoute><AddPlan /></AdminRoute>} />
            <Route path="/usuarios" element={<AdminRoute><UserList /></AdminRoute>} />
            <Route path="/detalle-plan/:id" element={<AdminRoute><DetallePlan /></AdminRoute>} />
          </Routes>
        </BrowserRouter>
      </LoaderProvider>
    </>
  )
}

export default App
