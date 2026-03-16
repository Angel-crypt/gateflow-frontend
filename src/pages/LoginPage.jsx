import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { Button } from "../components/Button";
import { Input } from "../components/Input";

const ROLE_HOME = {
  admin:  "/admin",
  guard:  "/guard",
  tenant: "/tenant",
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
  };

  const validate = () => {
    const next = {};
    if (!form.email)    next.email    = "El email es requerido";
    if (!form.password) next.password = "La contraseña es requerida";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const user = await login(form);
      navigate(ROLE_HOME[user.role] ?? "/", { replace: true });
    } catch {
      setServerError("Email o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>GateFlow</h1>
          <p style={styles.subtitle}>Ingresa tus credenciales para continuar</p>
        </div>

        {serverError && <p style={styles.serverError}>{serverError}</p>}

        <form onSubmit={handleSubmit} noValidate style={styles.form}>
          <Input
            label="Email"
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="usuario@parque.com"
            autoComplete="email"
          />
          <Input
            label="Contraseña"
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <Button type="submit" size="lg" loading={loading} style={{ width: "100%", marginTop: "8px" }}>
            Iniciar sesión
          </Button>
        </form>
      </div>
    </div>
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
    maxWidth: "400px",
    backgroundColor: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-md)",
    padding: "var(--space-8)",
  },
  header: {
    marginBottom: "var(--space-6)",
    textAlign: "center",
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: "700",
    color: "var(--color-primary)",
    marginBottom: "var(--space-1)",
  },
  subtitle: {
    fontSize: "0.9375rem",
    color: "var(--color-text-muted)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-4)",
  },
  serverError: {
    fontSize: "0.875rem",
    color: "var(--color-danger)",
    backgroundColor: "var(--color-danger-light)",
    border: "1px solid var(--color-danger)",
    borderRadius: "var(--radius)",
    padding: "var(--space-2) var(--space-3)",
    marginBottom: "var(--space-4)",
  },
};
