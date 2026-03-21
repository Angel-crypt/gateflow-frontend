import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { validatePass } from "../../api/passes.api";

export default function ValidateQRPage() {
  const queryClient = useQueryClient();
  const [qrCode, setQrCode] = useState("");
  const [result, setResult] = useState(null);

  const mutation = useMutation({
    mutationFn: () => validatePass(qrCode),
    onSuccess: ({ data }) => setResult({ ok: true, data }),
    onError: (err) =>
      setResult({ ok: false, message: err.response?.data?.detail ?? "Error al validar." }),
  });

  const handleValidate = () => {
    setResult(null);
    mutation.mutate();
  };

  const handleConfirm = () => {
    queryClient.invalidateQueries(["access-logs"]);
    setQrCode("");
    setResult(null);
  };

  return (
    <>
      {/* QR input */}
      <div
        style={{
          background: "var(--color-surface)",
          border: "0.5px solid var(--color-border)",
          borderRadius: "12px",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "120px",
            height: "120px",
            border: "2px solid #0369a1",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-muted)",
            fontSize: "11px",
          }}
        >
          Cámara QR
        </div>
        <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
          o ingresa el código manualmente
        </p>
        <input
          value={qrCode}
          onChange={(e) => setQrCode(e.target.value)}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx"
          style={{
            width: "100%",
            padding: "9px 12px",
            border: "0.5px solid var(--color-border)",
            borderRadius: "7px",
            fontSize: "13px",
            fontFamily: "monospace",
            letterSpacing: "1px",
            background: "var(--color-surface)",
            color: "var(--color-text)",
          }}
        />
        <button
          onClick={handleValidate}
          disabled={!qrCode || mutation.isPending}
          style={{
            width: "100%",
            padding: "11px",
            background: "#0369a1",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {mutation.isPending ? "Validando..." : "Validar pase"}
        </button>
      </div>

      {/* Resultado válido */}
      {result?.ok && (
        <div
          style={{
            background: "#f0fdf4",
            border: "0.5px solid #bbf7d0",
            borderRadius: "10px",
            padding: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
            <div
              style={{
                width: "18px", height: "18px", borderRadius: "50%",
                background: "#16a34a", display: "flex",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M1.5 5l2.5 2.5 4.5-4.5" />
              </svg>
            </div>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#15803d" }}>Pase válido</span>
          </div>
          {[
            ["Visitante", result.data.visitor_name],
            ["Placa", result.data.plate || "—"],
            ["Destino", result.data.destination?.name ?? "—"],
            ["Tipo", result.data.pass_type === "single" ? "Single Use" : "Day Pass"],
          ].map(([label, val]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "3px 0" }}>
              <span style={{ color: "#4b7a5a" }}>{label}</span>
              <span style={{ color: "#166534", fontWeight: 500 }}>{val}</span>
            </div>
          ))}
          <button
            onClick={handleConfirm}
            style={{
              width: "100%", marginTop: "12px", padding: "11px",
              background: "#16a34a", color: "#fff", border: "none",
              borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
            }}
          >
            Confirmar entrada
          </button>
        </div>
      )}

      {/* Resultado inválido */}
      {result && !result.ok && (
        <div
          style={{
            background: "#fef2f2",
            border: "0.5px solid #fecaca",
            borderRadius: "10px",
            padding: "14px",
            fontSize: "13px",
            color: "#dc2626",
          }}
        >
          {result.message}
        </div>
      )}
    </>
  );
}
