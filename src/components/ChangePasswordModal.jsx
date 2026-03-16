import { useState } from "react";
import { changePassword } from "../api/auth.api";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { Button } from "./Button";

const INITIAL = { current_password: "", new_password: "", confirm_password: "" };

export function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
  };

  const validate = () => {
    const next = {};
    if (!form.current_password) next.current_password = "Requerido";
    if (!form.new_password)     next.new_password     = "Requerido";
    else if (form.new_password.length < 8)
      next.new_password = "Mínimo 8 caracteres";
    if (!form.confirm_password) next.confirm_password = "Requerido";
    else if (form.new_password !== form.confirm_password)
      next.confirm_password = "Las contraseñas no coinciden";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await changePassword(form);
      setSuccess(true);
    } catch (err) {
      const data = err.response?.data;
      if (data?.current_password) {
        setErrors((prev) => ({ ...prev, current_password: "Contraseña incorrecta" }));
      } else {
        setServerError("Ocurrió un error. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Modal
        title="Cambiar contraseña"
        onClose={onClose}
        footer={<Button onClick={onClose}>Cerrar</Button>}
      >
        <p style={{ color: "var(--color-success)", fontWeight: 500 }}>
          ✓ Contraseña actualizada correctamente.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      title="Cambiar contraseña"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button form="change-password-form" type="submit" loading={loading}>
            Guardar
          </Button>
        </>
      }
    >
      {serverError && (
        <p style={errorStyle}>{serverError}</p>
      )}

      <form id="change-password-form" onSubmit={handleSubmit} noValidate
        style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}
      >
        <Input
          label="Contraseña actual"
          id="current_password"
          name="current_password"
          type="password"
          value={form.current_password}
          onChange={handleChange}
          error={errors.current_password}
          autoComplete="current-password"
        />
        <Input
          label="Nueva contraseña"
          id="new_password"
          name="new_password"
          type="password"
          value={form.new_password}
          onChange={handleChange}
          error={errors.new_password}
          hint="Mínimo 8 caracteres"
          autoComplete="new-password"
        />
        <Input
          label="Confirmar nueva contraseña"
          id="confirm_password"
          name="confirm_password"
          type="password"
          value={form.confirm_password}
          onChange={handleChange}
          error={errors.confirm_password}
          autoComplete="new-password"
        />
      </form>
    </Modal>
  );
}

const errorStyle = {
  fontSize: "0.875rem",
  color: "var(--color-danger)",
  backgroundColor: "var(--color-danger-light)",
  border: "1px solid var(--color-danger)",
  borderRadius: "var(--radius)",
  padding: "var(--space-2) var(--space-3)",
};
