import { useQuery } from "@tanstack/react-query";
import { getAccessLogs } from "../../api/access.api";
import { Spinner } from "../../components/Spinner";

function timeSince(entryTime) {
  const diff = Math.floor((Date.now() - new Date(entryTime)) / 1000 / 60);
  const h = Math.floor(diff / 60).toString().padStart(2, "0");
  const m = (diff % 60).toString().padStart(2, "0");
  return `${h}:${m} hrs`;
}

function AccessRow({ log }) {
  const isOpen = log.status === "open";

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "0.5px solid var(--color-border)",
        borderRadius: "10px",
        padding: "12px 14px",
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
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <span
            style={{
              fontSize: "10px",
              padding: "2px 8px",
              borderRadius: "999px",
              background: log.access_type === "qr" ? "#e0f2fe" : "#fef3c7",
              color: log.access_type === "qr" ? "#0369a1" : "#b45309",
            }}
          >
            {log.access_type === "qr" ? "QR" : "Manual"}
          </span>
          <span
            style={{
              fontSize: "10px",
              padding: "2px 8px",
              borderRadius: "999px",
              background: isOpen ? "#dcfce7" : "#f1f5f9",
              color: isOpen ? "#16a34a" : "#64748b",
            }}
          >
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
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
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
  const { data, isLoading } = useQuery({
    queryKey: ["access-logs"],
    queryFn: async () => {
      const res = await getAccessLogs();
      return res.data;
    },
  });

  const open = data?.filter((l) => l.status === "open") ?? [];
  const closed = data?.filter((l) => l.status === "closed") ?? [];

  if (isLoading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ marginBottom: "4px" }}>
        <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text)" }}>
          Historial de accesos
        </div>
        <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
          {open.length} activos · {closed.length} cerrados
        </div>
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
          {open.map((log) => <AccessRow key={log.id} log={log} />)}
        </>
      )}

      {closed.length > 0 && (
        <>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "8px" }}>
            Historial
          </div>
          {closed.map((log) => <AccessRow key={log.id} log={log} />)}
        </>
      )}
    </div>
  );
}

