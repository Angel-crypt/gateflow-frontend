import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Html5Qrcode } from "html5-qrcode";
import { validatePass } from "../../api/passes.api";
import { createAccessLog } from "../../api/access.api";

// ── Cámara QR ────────────────────────────────────────────────
const SCANNER_ID = "qr-camera-feed";

function QrCamera({ onScan, onPermissionError }) {
  const scannerRef = useRef(null);
  const scannedRef = useRef(false); // evita múltiples callbacks

  useEffect(() => {
    const scanner = new Html5Qrcode(SCANNER_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 12, qrbox: { width: 230, height: 230 } },
        (decoded) => {
          if (scannedRef.current) return;
          const id = decoded.trim();
          if (!id || isNaN(Number(id))) return; // solo acepta IDs numéricos
          scannedRef.current = true;
          scanner.stop().catch(() => {}).finally(() => onScan(id));
        },
        () => {} // ignorar frames sin QR
      )
      .catch(() => onPermissionError());

    return () => {
      scanner.isScanning &&
        scanner.stop().catch(() => {});
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* Contenedor donde html5-qrcode inyecta el video */}
      <div
        id={SCANNER_ID}
        style={{
          width: "100%",
          borderRadius: "10px",
          overflow: "hidden",
          background: "#000",
          minHeight: "260px",
        }}
      />
      {/* Marco de guía */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "230px",
          height: "230px",
          border: "2px solid rgba(255,255,255,0.6)",
          borderRadius: "12px",
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)",
          pointerEvents: "none",
        }}
      >
        {/* Esquinas */}
        {[
          { top: -2, left: -2, borderTop: "3px solid #0369a1", borderLeft: "3px solid #0369a1", borderRadius: "10px 0 0 0" },
          { top: -2, right: -2, borderTop: "3px solid #0369a1", borderRight: "3px solid #0369a1", borderRadius: "0 10px 0 0" },
          { bottom: -2, left: -2, borderBottom: "3px solid #0369a1", borderLeft: "3px solid #0369a1", borderRadius: "0 0 0 10px" },
          { bottom: -2, right: -2, borderBottom: "3px solid #0369a1", borderRight: "3px solid #0369a1", borderRadius: "0 0 10px 0" },
        ].map((s, i) => (
          <div key={i} style={{ position: "absolute", width: "20px", height: "20px", ...s }} />
        ))}
      </div>
      <div style={{
        position: "absolute", bottom: "12px", left: 0, right: 0,
        textAlign: "center", fontSize: "11px", color: "rgba(255,255,255,0.8)",
        pointerEvents: "none",
      }}>
        Apunta al código QR del pase
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function ValidateQRPage() {
  const queryClient = useQueryClient();

  const [mode, setMode] = useState("camera");   // "camera" | "manual"
  const [passId, setPassId] = useState("");
  const [result, setResult] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [camError, setCamError] = useState(false);

  const reset = () => {
    setPassId("");
    setResult(null);
    setConfirmed(false);
  };

  const handleSwitchMode = (m) => {
    reset();
    setMode(m);
    setCamError(false);
  };

  // ── Mutaciones ──
  const validateMutation = useMutation({
    mutationFn: (id) => validatePass(id),
    onSuccess: ({ data }) => setResult({ ok: true, data }),
    onError: (err) =>
      setResult({ ok: false, message: err.response?.data?.detail ?? "Pase no válido." }),
  });

  const confirmMutation = useMutation({
    mutationFn: () => createAccessLog({ access_pass: Number(passId) }),
    onSuccess: () => {
      queryClient.invalidateQueries(["access-logs"]);
      setConfirmed(true);
      setTimeout(() => {
        reset();
        if (mode === "camera") setCamError(false); // re-mount cámara
      }, 2500);
    },
    onError: (err) =>
      setResult((prev) => ({
        ...prev,
        confirmError: err.response?.data?.detail ?? "Error al registrar la entrada.",
      })),
  });

  // Cuando la cámara lee un QR → auto-valida
  const handleScan = (id) => {
    setPassId(id);
    setResult(null);
    setConfirmed(false);
    validateMutation.mutate(id);
  };

  const handleValidate = () => {
    setResult(null);
    setConfirmed(false);
    validateMutation.mutate(passId);
  };

  // ── Tabs de modo ──
  const tabStyle = (active) => ({
    flex: 1, padding: "8px", fontSize: "12px", fontWeight: 500,
    border: "none", cursor: "pointer", transition: "all 150ms",
    background: active ? "#0369a1" : "var(--color-bg)",
    color: active ? "#fff" : "var(--color-text-muted)",
    borderRadius: active ? "7px" : "7px",
  });

  const showCamera = mode === "camera" && !camError && !result && !confirmed;
  const showScanning = showCamera;

  return (
    <>
      {/* ── Selector de modo ── */}
      <div style={{
        display: "flex", gap: "4px", padding: "4px",
        background: "var(--color-bg)",
        border: "0.5px solid var(--color-border)",
        borderRadius: "10px",
      }}>
        <button style={tabStyle(mode === "camera")} onClick={() => handleSwitchMode("camera")}>
          Cámara
        </button>
        <button style={tabStyle(mode === "manual")} onClick={() => handleSwitchMode("manual")}>
          Manual / Escáner
        </button>
      </div>

      {/* ── Cámara ── */}
      {mode === "camera" && !result && !confirmed && (
        <div style={{
          background: "var(--color-surface)",
          border: "0.5px solid var(--color-border)",
          borderRadius: "12px",
          overflow: "hidden",
        }}>
          {camError ? (
            <div style={{
              padding: "32px 16px", textAlign: "center",
              fontSize: "13px", color: "var(--color-text-muted)",
              display: "flex", flexDirection: "column", gap: "8px", alignItems: "center",
            }}>
              <div style={{ fontSize: "12px" }}>Sin acceso a la cámara.</div>
              <button
                onClick={() => handleSwitchMode("manual")}
                style={{
                  padding: "8px 16px", background: "#0369a1", color: "#fff",
                  border: "none", borderRadius: "7px", fontSize: "12px", cursor: "pointer",
                }}
              >
                Ingresar ID manualmente
              </button>
            </div>
          ) : (
            // Key basado en confirmed para re-montar la cámara tras reset
            <QrCamera
              key={String(confirmed)}
              onScan={handleScan}
              onPermissionError={() => setCamError(true)}
            />
          )}
        </div>
      )}

      {/* ── Validando (spinner inline) ── */}
      {validateMutation.isPending && (
        <div style={{
          background: "var(--color-surface)",
          border: "0.5px solid var(--color-border)",
          borderRadius: "10px",
          padding: "16px",
          textAlign: "center",
          fontSize: "13px",
          color: "var(--color-text-muted)",
        }}>
          Validando pase...
        </div>
      )}

      {/* ── Input manual ── */}
      {mode === "manual" && !result && !confirmed && (
        <div style={{
          background: "var(--color-surface)",
          border: "0.5px solid var(--color-border)",
          borderRadius: "12px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}>
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }}>
            Ingresa el ID del pase o usa un escáner físico
          </p>
          <input
            value={passId}
            onChange={(e) => setPassId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && passId && handleValidate()}
            placeholder="ID del pase (ej. 42)"
            type="number"
            autoFocus
            style={{
              width: "100%",
              padding: "11px 12px",
              border: "0.5px solid var(--color-border)",
              borderRadius: "8px",
              fontSize: "18px",
              fontFamily: "monospace",
              textAlign: "center",
              letterSpacing: "2px",
              background: "var(--color-surface)",
              color: "var(--color-text)",
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={handleValidate}
            disabled={!passId || validateMutation.isPending}
            style={{
              width: "100%", padding: "11px",
              background: passId ? "#0369a1" : "var(--color-border)",
              color: "#fff", border: "none", borderRadius: "8px",
              fontSize: "13px", fontWeight: 500,
              cursor: passId ? "pointer" : "not-allowed",
            }}
          >
            {validateMutation.isPending ? "Validando..." : "Validar pase"}
          </button>
        </div>
      )}

      {/* ── Entrada confirmada ── */}
      {confirmed && (
        <div style={{
          background: "#f0fdf4",
          border: "0.5px solid #bbf7d0",
          borderRadius: "10px",
          padding: "20px 16px",
          textAlign: "center",
          display: "flex", flexDirection: "column", gap: "6px", alignItems: "center",
        }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M1.5 5l2.5 2.5 4.5-4.5" />
            </svg>
          </div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#15803d" }}>
            Entrada registrada
          </div>
          <div style={{ fontSize: "12px", color: "#4b7a5a" }}>
            {result?.data?.visitor_name}
          </div>
        </div>
      )}

      {/* ── Pase válido — confirmar entrada ── */}
      {result?.ok && !confirmed && (
        <div style={{
          background: "#f0fdf4",
          border: "0.5px solid #bbf7d0",
          borderRadius: "10px",
          padding: "14px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
            <div style={{
              width: "18px", height: "18px", borderRadius: "50%",
              background: "#16a34a", display: "flex", alignItems: "center",
              justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M1.5 5l2.5 2.5 4.5-4.5" />
              </svg>
            </div>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#15803d" }}>Pase válido</span>
            <span style={{ marginLeft: "auto", fontSize: "10px", fontFamily: "monospace", color: "#4b7a5a" }}>
              ID {passId}
            </span>
          </div>

          {[
            ["Visitante", result.data.visitor_name],
            ["Placa",     result.data.plate || "—"],
            ["Destino",   result.data.destination?.name ?? "—"],
            ["Tipo",      result.data.pass_type === "single" ? "Single Use" : "Day Pass"],
          ].map(([label, val]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "3px 0" }}>
              <span style={{ color: "#4b7a5a" }}>{label}</span>
              <span style={{ color: "#166534", fontWeight: 500 }}>{val}</span>
            </div>
          ))}

          {result.confirmError && (
            <div style={{ marginTop: "10px", fontSize: "12px", color: "#dc2626" }}>
              {result.confirmError}
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button
              onClick={reset}
              style={{
                padding: "11px 16px",
                background: "var(--color-surface)", color: "var(--color-text-muted)",
                border: "0.5px solid var(--color-border)", borderRadius: "8px",
                fontSize: "12px", cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
              style={{
                flex: 1, padding: "11px",
                background: "#16a34a", color: "#fff",
                border: "none", borderRadius: "8px",
                fontSize: "13px", fontWeight: 500,
                cursor: confirmMutation.isPending ? "not-allowed" : "pointer",
                opacity: confirmMutation.isPending ? 0.7 : 1,
              }}
            >
              {confirmMutation.isPending ? "Registrando..." : "Confirmar entrada"}
            </button>
          </div>
        </div>
      )}

      {/* ── Pase inválido ── */}
      {result && !result.ok && (
        <div style={{
          background: "#fef2f2",
          border: "0.5px solid #fecaca",
          borderRadius: "10px",
          padding: "14px",
          display: "flex", flexDirection: "column", gap: "10px",
        }}>
          <div style={{ fontSize: "13px", color: "#dc2626" }}>
            {result.message}
          </div>
          <button
            onClick={reset}
            style={{
              padding: "9px", background: "var(--color-surface)",
              color: "var(--color-text-muted)",
              border: "0.5px solid var(--color-border)",
              borderRadius: "7px", fontSize: "12px", cursor: "pointer",
            }}
          >
            Intentar de nuevo
          </button>
        </div>
      )}
    </>
  );
}
