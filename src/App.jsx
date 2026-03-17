import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./router/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import LoginPage from "./pages/LoginPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Admin */}
          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin"          element={<div>Dashboard</div>} />
              <Route path="/admin/usuarios" element={<div>Usuarios</div>} />
            </Route>
          </Route>

          {/* Guard — layout pendiente */}
          <Route element={<ProtectedRoute roles={["guard"]} />}>
            <Route path="/guard" element={<div>Guard home</div>} />
          </Route>

          {/* Tenant — layout pendiente */}
          <Route element={<ProtectedRoute roles={["tenant"]} />}>
            <Route path="/tenant" element={<div>Tenant home</div>} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
