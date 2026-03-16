import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./router/ProtectedRoute";
import { useAuth } from "./auth/useAuth";
import { Button } from "./components/Button";
import { Badge } from "./components/Badge";
import { Card } from "./components/Card";
import { ChangePasswordModal } from "./components/ChangePasswordModal";
import LoginPage from "./pages/LoginPage";

function UserHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div style={styles.page}>
      <Card style={styles.card}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.name}>{user.first_name} {user.last_name}</h2>
            <p style={styles.email}>{user.email}</p>
          </div>
          <Badge role={user.role} />
        </div>

        <hr style={styles.divider} />

        <div style={styles.info}>
          <Row label="Parque"  value={user.park?.name ?? "—"} />
          <Row label="Estado"  value={user.is_active
            ? <Badge active />
            : <Badge inactive />}
          />
          {user.destinations?.length > 0 && (
            <Row
              label="Destinos"
              value={user.destinations.map((d) => d.name).join(", ")}
            />
          )}
        </div>

        <div style={styles.footer}>
          <Button variant="secondary" onClick={() => setShowChangePassword(true)}>
            Cambiar contraseña
          </Button>
          <Button variant="danger" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </div>
      </Card>

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={styles.row}>
      <span style={styles.rowLabel}>{label}</span>
      <span style={styles.rowValue}>{value}</span>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="/admin" element={<UserHome />} />
          </Route>

          <Route element={<ProtectedRoute roles={["guard"]} />}>
            <Route path="/guard" element={<UserHome />} />
          </Route>

          <Route element={<ProtectedRoute roles={["tenant"]} />}>
            <Route path="/tenant" element={<UserHome />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "var(--color-bg)",
    padding: "var(--space-4)",
  },
  card: {
    width: "100%",
    maxWidth: "460px",
    padding: "var(--space-6)",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "var(--space-4)",
  },
  name: {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "var(--color-text)",
    marginBottom: "var(--space-1)",
  },
  email: {
    fontSize: "0.9375rem",
    color: "var(--color-text-muted)",
  },
  divider: {
    border: "none",
    borderTop: "1px solid var(--color-border)",
    margin: "var(--space-4) 0",
  },
  info: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-3)",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.9375rem",
  },
  rowLabel: {
    color: "var(--color-text-muted)",
    fontWeight: "500",
  },
  rowValue: {
    color: "var(--color-text)",
  },
  footer: {
    marginTop: "var(--space-6)",
    display: "flex",
    justifyContent: "flex-end",
  },
};
