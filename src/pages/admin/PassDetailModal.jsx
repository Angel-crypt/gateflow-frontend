import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import apiClient from "../../api/apiClient";

function usePassAccessLogs(passId, passType) {
  return useQuery({
    queryKey: ["access-logs", passId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/access-logs/?search=${passId}`);
      const logs = res.data.results ?? res.data;
      return logs;
    },
    enabled: !!passId && passType === "day",
  });
}

export default function PassDetailModal({ pass, onClose, onToggleActive, onDelete, canActivate, canDelete, isOwner }) {
  const canvasRef = useRef(null);
  const isUsed = pass.is_used;
  const isInactive = !pass.is_active;
  const isExpired = new Date(pass.valid_to) < new Date();
  const isDayPass = pass.pass_type === "day";

  const { data: accessLogs = [], isLoading: loadingLogs } = usePassAccessLogs(pass.id, pass.pass_type);

  useEffect(() => {
    if (!pass?.id || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, String(pass.id), {
      width: 160,
      margin: 2,
      color: { dark: "#0c4a6e", light: "#ffffff" },
    });
  }, [pass?.id]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `pase-${pass.visitor_name.replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      const file = new File([blob], `pase-${pass.id}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Pase QR — ${pass.visitor_name}` });
      } else {
        handleDownload();
      }
    });
  };

  const badgeStyle = isUsed || isInactive || isExpired
    ? { background: "#f1f5f9", color: "#64748b" }
    : pass.pass_type === "day"
    ? { background: "#e0f2fe", color: "#0369a1" }
    : { background: "#fef3c7", color: "#b45309" };

  const badgeLabel = isUsed ? "Usado" : isInactive ? "Inactivo" : isExpired ? "Expirado" : pass.pass_type === "day" ? "Day Pass" : "Single Use";

  const entryCount = accessLogs.length;

  const infoRows = [
    ["ID", pass.id],
    ["Visitante", pass.visitor_name],
    ["Placa", pass.plate || "—"],
    ["Tipo", pass.pass_type === "day" ? "Day Pass" : "Single Use"],
    ["Destino", pass.destination?.name ?? "—"],
    ["Válido desde", new Date(pass.valid_from).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })],
    ["Válido hasta", new Date(pass.valid_to).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })],
    ["Estado", badgeLabel],
    ["Creado por", pass.created_by?.email ?? "—"],
    ["Fecha de creación", new Date(pass.created_at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })],
  ];

  const actionButtons = [];
  if (!isUsed && !isExpired && !isInactive) {
    actionButtons.push({ label: "Compartir QR", onClick: handleShare, bg: "#0369a1", color: "#fff", border: "none" });
  }
  if (canActivate && isInactive) {
    actionButtons.push({ label: "Activar", onClick: () => onToggleActive(pass), bg: "#16a34a", color: "#fff", border: "none" });
  }
  if (!isInactive && !isUsed && !isExpired) {
    actionButtons.push({ label: "Desactivar", onClick: () => onToggleActive(pass), bg: "var(--color-bg)", color: "#64748b", border: "0.5px solid var(--color-border)" });
  }
  if (canDelete) {
    actionButtons.push({ label: "Eliminar", onClick: () => { onDelete(pass.id); onClose(); }, bg: "var(--color-bg)", color: "#dc2626", border: "0.5px solid #fecaca" });
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "flex-end",
        justifyContent: "center", zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "16px 16px 0 0",
          padding: "16px",
          width: "100%",
          maxWidth: "480px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: "32px", height: "3px", background: "var(--color-border)", borderRadius: "2px", margin: "0 auto" }} />

        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text)" }}>
          Detalles del pase
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <div style={{
            background: "var(--color-bg)",
            border: "0.5px solid var(--color-border)",
            borderRadius: "10px",
            padding: "12px",
            display: "flex", flexDirection: "column", alignItems: "center",
          }}>
            <canvas ref={canvasRef} style={{ borderRadius: "6px" }} />
            <div style={{ fontSize: "9px", fontFamily: "monospace", color: "var(--color-text-muted)", marginTop: "4px" }}>
              {pass.id}
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            {infoRows.slice(1, 7).map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{label}</div>
                <div style={{ fontSize: "12px", color: "var(--color-text)", fontWeight: label === "Visitante" ? 600 : 400 }}>
                  {val}
                </div>
              </div>
            ))}
            <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "999px", alignSelf: "flex-start", ...badgeStyle }}>
              {badgeLabel}
            </span>
          </div>
        </div>

        <div style={{ height: "0.5px", background: "var(--color-border)" }} />

        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px" }}>
            Información adicional
          </div>
          {infoRows.slice(7).map(([label, val]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
              <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
              <span style={{ color: "var(--color-text)" }}>{val}</span>
            </div>
          ))}
        </div>

        {isDayPass && (
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px" }}>
              Historial de accesos ({entryCount} entradas registradas)
            </div>
            {loadingLogs ? (
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", textAlign: "center", padding: "8px" }}>Cargando...</div>
            ) : accessLogs.length === 0 ? (
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", textAlign: "center", padding: "8px", background: "var(--color-bg)", borderRadius: "6px" }}>
                Sin accesos registrados
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "150px", overflowY: "auto" }}>
                {accessLogs.map((log) => (
                  <div key={log.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", padding: "6px", background: "var(--color-bg)", borderRadius: "6px" }}>
                    <div>
                      <div style={{ color: "var(--color-text)", fontWeight: 500 }}>{new Date(log.entry_time).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}</div>
                      <div style={{ color: "var(--color-text-muted)" }}>{log.guard?.email ?? "—"}</div>
                    </div>
                    <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "999px", background: log.status === "open" ? "#dcfce7" : "#f1f5f9", color: log.status === "open" ? "#16a34a" : "#64748b" }}>
                      {log.status === "open" ? "Activo" : "Cerrado"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "8px", flex: actionButtons.length + 1, flexBasis: "100%" }}>
            {actionButtons.map((btn, i) => (
              <button
                key={i}
                onClick={btn.onClick}
                style={{
                  flex: 1, padding: "10px",
                  background: btn.bg, color: btn.color,
                  border: btn.border, borderRadius: "8px",
                  fontSize: "12px", cursor: "pointer",
                }}
              >
                {btn.label}
              </button>
            ))}
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: "10px", background: "var(--color-surface)",
                color: "var(--color-text-muted)", border: "0.5px solid var(--color-border)",
                borderRadius: "8px", fontSize: "12px", cursor: "pointer",
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
