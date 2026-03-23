import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Html5Qrcode } from "html5-qrcode";
import { validatePass } from "../../api/passes.api";
import { createAccessLog } from "../../api/access.api";
import apiClient from "../../api/apiClient";

// ── Destinos ────────────────────────────────────────────────
function useDestinations() {
  return useQuery({
    queryKey: ["destinations"],
    queryFn: async () => {
      const res = await apiClient.get("/api/destinations/");
      return res.data.results ?? res.data;
    },
  });
}

// ── Cámara QR ────────────────────────────────────────────────
const SCANNER_ID = "qr-camera-feed";

function QrCamera({ onScan, onPermissionError }) {
  const scannerRef = useRef(null);
  const scannedRef = useRef(false);
  const startingRef = useRef(false); // evita doble init en StrictMode

  useEffect(() => {
    if (startingRef.current) return;
    startingRef.current = true;

    // Limpiar contenido previo (fix para StrictMode / remounts)
    const container = document.getElementById(SCANNER_ID);
    if (container) container.innerHTML = "";

    const scanner = new Html5Qrcode(SCANNER_ID, { verbose: false });
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded) => {
          if (scannedRef.current) return;
          const id = decoded.trim();
          if (!id || isNaN(Number(id))) return;
          scannedRef.current = true;
          scanner.stop().catch(() => {}).finally(() => onScan(id));
        },
        () => {} // frames sin QR — ignorar
      )
      .catch(() => {
        startingRef.current = false;
        onPermissionError();
      });

    return () => {
      startingRef.current = false;
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div
        id={SCANNER_ID}
        style={{
          width: "100%",
          borderRadius: "10px",
          overflow: "hidden",
          background: "#000",
          minHeight: "250px",
          // Ocultar controles extra que inyecta html5-qrcode
          lineHeight: 0,
        }}
      />
      {/* Marco de guía */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "220px",
          height: "220px",
          border: "1.5px solid rgba(255,255,255,0.5)",
          borderRadius: "12px",
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.3)",
          pointerEvents: "none",
        }}
      >
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
        position: "absolute", bottom: "10px", left: 0, right: 0,
        textAlign: "center", fontSize: "11px", color: "rgba(255,255,255,0.8)",
        pointerEvents: "none",
      }}>
        Apunta al código QR del pase
      </div>
    </div>
  );
}

// ── Tarjeta de error con íconos diferenciados ─────────────────
const ERROR_CONFIG = {
  already_used: {
    bg: "#fffbeb", border: "#fcd34d", color: "#92400e",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
        <path d="M12 8v4M12 16h.01"/>
      </svg>
    ),
  },
  inactive: {
    bg: "#f8fafc", border: "#cbd5e1", color: "#475569",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
      </svg>
    ),
  },
  not_yet_valid: {
    bg: "#eff6ff", border: "#93c5fd", color: "#1e40af",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  expired: {
    bg: "#fff7ed", border: "#fdba74", color: "#9a3412",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  not_found: {
    bg: "#fef2f2", border: "#fca5a5", color: "#991b1b",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        <line x1="11" y1="8" x2="11" y2="14"/><line x1="11" y1="16" x2="11.01" y2="16"/>
      </svg>
    ),
  },
  default: {
    bg: "#fef2f2", border: "#fca5a5", color: "#991b1b",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
  },
};

function ErrorCard({ result, onReset }) {
  const cfg = ERROR_CONFIG[result.error_code] ?? ERROR_CONFIG.default;
  return (
    <div style={{
      background: cfg.bg, border: `0.5px solid ${cfg.border}`,
      borderRadius: "10px", padding: "14px",
      display: "flex", flexDirection: "column", gap: "10px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: cfg.color }}>
        {cfg.icon}
        <span style={{ fontSize: "13px", fontWeight: 500 }}>{result.message}</span>
      </div>
      <button
        onClick={onReset}
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
  );
}

// ── Pestaña QR ────────────────────────────────────────────────
function QRTab() {
  const queryClient = useQueryClient();
  const [qrMode, setQrMode] = useState("camera"); // "camera" | "teclado"
  const [passId, setPassId] = useState("");
  const [result, setResult] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [camError, setCamError] = useState(false);

  const reset = () => {
    setPassId("");
    setResult(null);
    setConfirmed(false);
  };

  const handleSwitchQrMode = (m) => {
    reset();
    setQrMode(m);
    setCamError(false);
  };

  const validateMutation = useMutation({
    mutationFn: (id) => validatePass(id),
    onSuccess: ({ data }) => setResult({ ok: true, data }),
    onError: (err) => {
      const errData = err.response?.data ?? {};
      setResult({
        ok: false,
        message: errData.detail ?? "Pase no válido.",
        error_code: errData.error_code ?? "default",
      });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () => createAccessLog({ access_pass: Number(passId) }),
    onSuccess: () => {
      queryClient.invalidateQueries(["access-logs"]);
      setConfirmed(true);
      setTimeout(() => {
        reset();
        setCamError(false);
      }, 2500);
    },
    onError: (err) =>
      setResult((prev) => ({
        ...prev,
        confirmError: err.response?.data?.detail ?? "Error al registrar la entrada.",
      })),
  });

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

  const tabStyle = (active) => ({
    flex: 1, padding: "7px", fontSize: "12px", fontWeight: 500,
    border: "none", cursor: "pointer", transition: "all 150ms",
    background: active ? "#0369a1" : "var(--color-bg)",
    color: active ? "#fff" : "var(--color-text-muted)",
    borderRadius: "7px",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Sub-tabs cámara / teclado */}
      <div style={{
        display: "flex", gap: "4px", padding: "4px",
        background: "var(--color-bg)",
        border: "0.5px solid var(--color-border)",
        borderRadius: "10px",
      }}>
        <button style={tabStyle(qrMode === "camera")} onClick={() => handleSwitchQrMode("camera")}>
          Cámara
        </button>
        <button style={tabStyle(qrMode === "teclado")} onClick={() => handleSwitchQrMode("teclado")}>
          ID / Escáner
        </button>
      </div>

      {/* Cámara */}
      {qrMode === "camera" && !result && !confirmed && (
        <div style={{
          background: "var(--color-surface)",
          border: "0.5px solid var(--color-border)",
          borderRadius: "12px", overflow: "hidden",
        }}>
          {camError ? (
            <div style={{
              padding: "32px 16px", textAlign: "center",
              fontSize: "13px", color: "var(--color-text-muted)",
              display: "flex", flexDirection: "column", gap: "8px", alignItems: "center",
            }}>
              <div style={{ fontSize: "12px" }}>Sin acceso a la cámara.</div>
              <button
                onClick={() => handleSwitchQrMode("teclado")}
                style={{
                  padding: "8px 16px", background: "#0369a1", color: "#fff",
                  border: "none", borderRadius: "7px", fontSize: "12px", cursor: "pointer",
                }}
              >
                Ingresar ID manualmente
              </button>
            </div>
          ) : (
            <QrCamera
              key={`cam-${confirmed}`}
              onScan={handleScan}
              onPermissionError={() => setCamError(true)}
            />
          )}
        </div>
      )}

      {/* Validando */}
      {validateMutation.isPending && (
        <div style={{
          background: "var(--color-surface)",
          border: "0.5px solid var(--color-border)",
          borderRadius: "10px", padding: "16px",
          textAlign: "center", fontSize: "13px",
          color: "var(--color-text-muted)",
        }}>
          Validando pase...
        </div>
      )}

      {/* Input teclado */}
      {qrMode === "teclado" && !result && !confirmed && (
        <div style={{
          background: "var(--color-surface)",
          border: "0.5px solid var(--color-border)",
          borderRadius: "12px", padding: "16px",
          display: "flex", flexDirection: "column", gap: "10px",
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
              width: "100%", padding: "11px 12px",
              border: "0.5px solid var(--color-border)",
              borderRadius: "8px", fontSize: "20px",
              fontFamily: "monospace", textAlign: "center",
              letterSpacing: "3px",
              background: "var(--color-surface)", color: "var(--color-text)",
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

      {/* Entrada confirmada */}
      {confirmed && (
        <div style={{
          background: "#f0fdf4", border: "0.5px solid #bbf7d0",
          borderRadius: "10px", padding: "20px 16px",
          textAlign: "center", display: "flex",
          flexDirection: "column", gap: "6px", alignItems: "center",
        }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M1.5 5l2.5 2.5 4.5-4.5" />
            </svg>
          </div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#15803d" }}>Entrada registrada</div>
          <div style={{ fontSize: "12px", color: "#4b7a5a" }}>{result?.data?.visitor_name}</div>
        </div>
      )}

      {/* Pase válido — confirmar */}
      {result?.ok && !confirmed && (
        <div style={{
          background: "#f0fdf4", border: "0.5px solid #bbf7d0",
          borderRadius: "10px", padding: "14px",
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

      {/* Error diferenciado por código */}
      {result && !result.ok && (
        <ErrorCard result={result} onReset={reset} />
      )}
    </div>
  );
}

// ── Pestaña Manual ────────────────────────────────────────────
function ManualTab() {
  const queryClient = useQueryClient();
  const { data: destinations = [] } = useDestinations();
  const [form, setForm] = useState({ visitor_name: "", plate: "", destination: "", notes: "" });
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const mutation = useMutation({
    mutationFn: () => createAccessLog(form),
    onSuccess: () => {
      setSuccess(true);
      setErrorMsg("");
      setForm({ visitor_name: "", plate: "", destination: "", notes: "" });
      queryClient.invalidateQueries(["access-logs"]);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.detail ?? "Error al registrar la entrada.");
    },
  });

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const isValid = form.visitor_name && form.plate && form.destination;

  const INPUT = {
    padding: "9px 10px",
    border: "0.5px solid var(--color-border)",
    borderRadius: "7px",
    fontSize: "13px",
    background: "var(--color-surface)",
    color: "var(--color-text)",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {success && (
        <div style={{
          background: "#f0fdf4", border: "0.5px solid #bbf7d0",
          borderRadius: "10px", padding: "12px 14px",
          fontSize: "13px", color: "#15803d", fontWeight: 500,
        }}>
          Acceso registrado correctamente.
        </div>
      )}

      <div style={{
        background: "var(--color-surface)",
        border: "0.5px solid var(--color-border)",
        borderRadius: "12px", padding: "16px",
        display: "flex", flexDirection: "column", gap: "12px",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500 }}>
            Nombre del visitante
          </label>
          <input name="visitor_name" value={form.visitor_name} onChange={handleChange}
            placeholder="Ej. Juan García" style={INPUT} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500 }}>
            Placa del vehículo
          </label>
          <input name="plate" value={form.plate} onChange={handleChange}
            placeholder="ABC-123"
            style={{ ...INPUT, fontFamily: "monospace", letterSpacing: "1px" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500 }}>
            Destino
          </label>
          <select name="destination" value={form.destination} onChange={handleChange} style={INPUT}>
            <option value="">Seleccionar destino...</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500 }}>
            Notas (opcional)
          </label>
          <input name="notes" value={form.notes} onChange={handleChange}
            placeholder="Motivo de visita..." style={INPUT} />
        </div>

        {errorMsg && (
          <div style={{ fontSize: "12px", color: "#dc2626" }}>{errorMsg}</div>
        )}

        <button
          onClick={() => mutation.mutate()}
          disabled={!isValid || mutation.isPending}
          style={{
            width: "100%", padding: "12px",
            background: isValid ? "#0369a1" : "var(--color-border)",
            color: "#fff", border: "none", borderRadius: "8px",
            fontSize: "13px", fontWeight: 500,
            cursor: isValid ? "pointer" : "not-allowed",
          }}
        >
          {mutation.isPending ? "Registrando..." : "Registrar entrada"}
        </button>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function RegisterAccessPage() {
  const [tab, setTab] = useState("qr"); // "qr" | "manual"

  const tabStyle = (active) => ({
    flex: 1, padding: "9px", fontSize: "13px", fontWeight: 500,
    border: "none", cursor: "pointer", transition: "all 150ms",
    background: active ? "#0369a1" : "var(--color-bg)",
    color: active ? "#fff" : "var(--color-text-muted)",
    borderRadius: "7px",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Tabs principales */}
      <div style={{
        display: "flex", gap: "4px", padding: "4px",
        background: "var(--color-bg)",
        border: "0.5px solid var(--color-border)",
        borderRadius: "10px",
      }}>
        <button style={tabStyle(tab === "qr")} onClick={() => setTab("qr")}>
          Pase QR
        </button>
        <button style={tabStyle(tab === "manual")} onClick={() => setTab("manual")}>
          Manual
        </button>
      </div>

      {tab === "qr" ? <QRTab /> : <ManualTab />}
    </div>
  );
}
