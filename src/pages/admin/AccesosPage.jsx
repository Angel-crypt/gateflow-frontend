import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { getAccessLogs } from "../../api/access.api";
import { Spinner } from "../../components/Spinner";

function hoursInPark(entryTime) {
  return (Date.now() - new Date(entryTime)) / 1000 / 60 / 60;
}

function timeSince(entryTime) {
  const totalMinutes = Math.floor((Date.now() - new Date(entryTime)) / 1000 / 60);
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const m = (totalMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m} hrs`;
}

const ALERT_HOURS = 24;

function getAlertLevel(hours) {
  if (hours >= 48) return "danger";
  if (hours >= ALERT_HOURS) return "warning";
  return null;
}

const ALERT_STYLES = {
  warning: {
    card: { border: "1px solid #f59e0b", background: "#fffbeb" },
    dot: { background: "#d97706" },
    time: { color: "#b45309", fontWeight: 600 },
    badge: { background: "#fef3c7", color: "#b45309" },
  },
  danger: {
    card: { border: "1px solid #ef4444", background: "#fff5f5" },
    dot: { background: "#dc2626" },
    time: { color: "#dc2626", fontWeight: 600 },
    badge: { background: "#fee2e2", color: "#dc2626" },
  },
};

function AccessCard({ log, viewMode }) {
  const isOpen = log.status === "open";
  const hours = isOpen ? hoursInPark(log.entry_time) : 0;
  const alertLevel = isOpen ? getAlertLevel(hours) : null;
  const alertStyle = alertLevel ? ALERT_STYLES[alertLevel] : null;

  if (viewMode === "grid") {
    return (
      <div
        style={{
          background: "var(--color-surface)",
          border: "0.5px solid var(--color-border)",
          borderRadius: "10px",
          padding: "10px",
          ...(alertStyle?.card ?? {}),
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text)" }}>
            {log.visitor_name}
          </div>
          <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "999px", background: isOpen ? "#dcfce7" : "#f1f5f9", color: isOpen ? "#16a34a" : "#64748b" }}>
            {isOpen ? "Activo" : "Cerrado"}
          </span>
        </div>
        <div style={{ fontSize: "11px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
          {log.plate || "—"}
        </div>
        <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
          {log.destination?.name ?? "—"}
        </div>
        <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
          {new Date(log.entry_time).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
        </div>
        {isOpen && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: alertStyle ? alertStyle.time.color : "var(--color-text-muted)" }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", ...(alertStyle?.dot ?? { background: "#16a34a" }) }} />
            {timeSince(log.entry_time)}
          </div>
        )}
        {log.guard && (
          <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>
            Guardia: {log.guard?.email ?? "—"}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "0.5px solid var(--color-border)",
        borderRadius: "10px",
        padding: "12px 14px",
        ...(alertStyle?.card ?? {}),
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text)" }}>
            {log.visitor_name}
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
            {log.plate || "—"}
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {alertLevel && (
            <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", ...alertStyle.badge }}>
              <AlertTriangle size={10} />
              {hours >= 48 ? `+${Math.floor(hours)}h` : "+24h"}
            </span>
          )}
          <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "999px", background: log.access_type === "qr" ? "#e0f2fe" : "#fef3c7", color: log.access_type === "qr" ? "#0369a1" : "#b45309" }}>
            {log.access_type === "qr" ? "QR" : "Manual"}
          </span>
          <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "999px", background: isOpen ? "#dcfce7" : "#f1f5f9", color: isOpen ? "#16a34a" : "#64748b" }}>
            {isOpen ? "Activo" : "Cerrado"}
          </span>
        </div>
      </div>
      <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
        {log.destination?.name ?? "—"}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
        <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
          Entrada: {new Date(log.entry_time).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
        </div>
        {isOpen ? (
          <div style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "4px", color: alertStyle ? alertStyle.time.color : "var(--color-text-muted)", fontWeight: alertStyle ? alertStyle.time.fontWeight : 400 }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", display: "inline-block", ...(alertStyle?.dot ?? { background: "#16a34a" }) }} />
            {timeSince(log.entry_time)} dentro
          </div>
        ) : (
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
            Salida: {new Date(log.exit_time).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
          </div>
        )}
      </div>
      {log.guard && (
        <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
          Guardia: {log.guard?.email ?? "—"}
        </div>
      )}
    </div>
  );
}

export default function AccesosPage() {
  const [viewMode, setViewMode] = useState("list");

  const { data, isLoading } = useQuery({
    queryKey: ["access-logs"],
    queryFn: async () => {
      const res = await getAccessLogs();
      return res.data.results ?? res.data;
    },
  });

  const open = data?.filter((l) => l.status === "open") ?? [];
  const closed = data?.filter((l) => l.status === "closed") ?? [];
  const overdueOpen = open.filter((l) => hoursInPark(l.entry_time) >= ALERT_HOURS);
  const normalOpen = open.filter((l) => hoursInPark(l.entry_time) < ALERT_HOURS);

  if (isLoading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text)" }}>
            Historial de accesos
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
            {open.length} activos
            {overdueOpen.length > 0 && (
              <span style={{ color: "#d97706", fontWeight: 600 }}>
                {" "}· {overdueOpen.length} con alerta +24h
              </span>
            )}
            {" "}· {closed.length} cerrados
          </div>
        </div>
        <button
          onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
          style={{
            padding: "6px 10px",
            background: "var(--color-bg)",
            border: "0.5px solid var(--color-border)",
            borderRadius: "6px",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          {viewMode === "list" ? "▦ Grid" : "☰ Lista"}
        </button>
      </div>

      {!data?.length && (
        <p style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", marginTop: "40px" }}>
          No hay registros de acceso aún.
        </p>
      )}

      {open.length > 0 && (
        <>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Activos ahora
          </div>
          {viewMode === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "8px" }}>
              {overdueOpen.sort((a, b) => new Date(a.entry_time) - new Date(b.entry_time)).map((log) => (
                <AccessCard key={log.id} log={log} viewMode="grid" />
              ))}
              {normalOpen.map((log) => (
                <AccessCard key={log.id} log={log} viewMode="grid" />
              ))}
            </div>
          ) : (
            <>
              {overdueOpen.sort((a, b) => new Date(a.entry_time) - new Date(b.entry_time)).map((log) => (
                <AccessCard key={log.id} log={log} viewMode="list" />
              ))}
              {normalOpen.map((log) => (
                <AccessCard key={log.id} log={log} viewMode="list" />
              ))}
            </>
          )}
        </>
      )}

      {closed.length > 0 && (
        <>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "8px" }}>
            Historial
          </div>
          {viewMode === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "8px" }}>
              {closed.map((log) => (
                <AccessCard key={log.id} log={log} viewMode="grid" />
              ))}
            </div>
          ) : (
            closed.map((log) => (
              <AccessCard key={log.id} log={log} viewMode="list" />
            ))
          )}
        </>
      )}
    </div>
  );
}
