import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./router/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import GuardLayout from "./layouts/GuardLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import AccessListPage from "./pages/guard/AccessListPage";
import ValidateQRPage from "./pages/guard/ValidateQRPage";
import ManualAccessPage from "./pages/guard/ManualAccessPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Admin — permisos: usuarios, destinos, pases, métricas */}
          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin"           element={<DashboardPage />} />
              <Route path="/admin/usuarios"  element={<div style={placeholderStyle}>Usuarios — próximamente</div>} />
              <Route path="/admin/destinos"  element={<div style={placeholderStyle}>Destinos — próximamente</div>} />
              <Route path="/admin/pases"     element={<div style={placeholderStyle}>Pases — próximamente</div>} />
              <Route path="/admin/accesos"   element={<div style={placeholderStyle}>Accesos — próximamente</div>} />
            </Route>
          </Route>

          {/* Guard — permisos: access-logs, validate */}
          <Route element={<ProtectedRoute roles={["guard"]} />}>
            <Route element={<GuardLayout />}>
              <Route path="/guard"          element={<AccessListPage />} />
              <Route path="/guard/validar"  element={<ValidateQRPage />} />
              <Route path="/guard/manual"   element={<ManualAccessPage />} />
            </Route>
          </Route>

          {/* Tenant — permisos: passes (propios), destinations (propias) */}
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

const placeholderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "200px",
  color: "var(--color-text-muted)",
  fontSize: "0.9375rem",
  border: "2px dashed var(--color-border)",
  borderRadius: "var(--radius-lg)",
};
