import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { getAccessLogs } from "../../api/access.api";
import { Spinner } from "../../components/Spinner";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Horas transcurridas desde la entrada (número decimal). */
function hoursInPark(entryTime) {
  return (Date.now() - new Date(entryTime)) / 1000 / 60 / 60;
}

/** Formatea la duración como "HH:MM hrs". */
function timeSince(entryTime) {
  const totalMinutes = Math.floor((Date.now() - new Date(entryTime)) / 1000 / 60);
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const m = (totalMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m} hrs`;
}

// ── Umbrales de alerta ────────────────────────────────────────────────────────
//
// Un registro OPEN se considera en alerta si la unidad lleva
// 24h o más dentro del parque sin registrar salida.
const ALERT_HOURS = 24;

// ── Estilos de alerta ─────────────────────────────────────────────────────────
//
// Se aplican progresivamente según las horas dentro del parque:
//   · warning  → 24h – 47h  (naranja/ámbar)
//   · danger   → 48h+       (rojo)
function getAlertLevel(hours) {
  if (hours >= 48) return "danger";
  if (hours >= ALERT_HOURS) return "warning";
  return null;
}

const ALERT_STYLES = {
  warning: {
    card: {
      border: "1px solid #f59e0b",
      background: "#fffbeb",
    },
    dot:   { background: "#d97706" },
    time:  { color: "#b45309", fontWeight: 600 },
    badge: { background: "#fef3c7", color: "#b45309" },
    icon:  "#d97706",
  },
  danger: {
    card: {
      border: "1px solid #ef4444",
      background: "#fff5f5",
    },
    dot:   { background: "#dc2626" },
    time:  { color: "#dc2626", fontWeight: 600 },
    badge: { background: "#fee2e2", color: "#dc2626" },
    icon:  "#dc2626",
  },
};

// ── AccessRow ─────────────────────────────────────────────────────────────────

function AccessRow({ log }) {
  const isOpen = log.status === "open";

  // Determinar nivel de alerta solo para registros abiertos
  const hours       = isOpen ? hoursInPark(log.entry_time) : 0;
  const alertLevel  = isOpen ? getAlertLevel(hours) : null;
  const alertStyle  = alertLevel ? ALERT_STYLES[alertLevel] : null;

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "0.5px solid var(--color-border)",
        borderRadius: "10px",
        padding: "12px 14px",
        // Sobreescribe border/background si hay alerta
        ...(alertStyle?.card ?? {}),
      }}
    >
      {/* ── Fila superior: nombre + badges ── */}
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
          {/* Badge de alerta 24h — solo visible si aplica */}
          {alertLevel && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "3px",
                fontSize: "10px",
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: "999px",
                ...(alertStyle.badge),
              }}
            >
              <AlertTriangle size={10} />
              {hours >= 48 ? `+${Math.floor(hours)}h` : "+24h"}
            </span>
          )}

          {/* Badge tipo de acceso */}
          <span
            style={{
              fontSize: "10px",
              padding: "2px 8px",
              borderRadius: "999px",
              background: log.access_type === "qr" ? "#e0f2fe" : "#fef3c7",
              color:      log.access_type === "qr" ? "#0369a1" : "#b45309",
            }}
          >
            {log.access_type === "qr" ? "QR" : "Manual"}
          </span>

          {/* Badge estado */}
          <span
            style={{
              fontSize: "10px",
              padding: "2px 8px",
              borderRadius: "999px",
              background: isOpen ? "#dcfce7" : "#f1f5f9",
              color:      isOpen ? "#16a34a" : "#64748b",
            }}
          >
            {isOpen ? "Activo" : "Cerrado"}
          </span>
        </div>
      </div>

      {/* Destino */}
      <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
        {log.destination?.name ?? "—"}
      </div>

      {/* ── Fila inferior: entrada + tiempo/salida ── */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
        <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
          Entrada: {new Date(log.entry_time).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
        </div>

        {isOpen ? (
          <div
            style={{
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              // El color del tiempo cambia según el nivel de alerta
              color: alertStyle ? alertStyle.time.color : "var(--color-text-muted)",
              fontWeight: alertStyle ? alertStyle.time.fontWeight : 400,
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                display: "inline-block",
                flexShrink: 0,
                ...(alertStyle?.dot ?? { background: "#16a34a" }),
              }}
            />
            {timeSince(log.entry_time)} dentro
          </div>
        ) : (
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
            Salida: {new Date(log.exit_time).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
          </div>
        )}
      </div>

      {/* Guardia */}
      {log.guard && (
        <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
          Guardia: {log.guard?.email ?? "—"}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AccesosPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["access-logs"],
    queryFn: async () => {
      const res = await getAccessLogs();
      return res.data.results ?? res.data;
    },
  });

  const open   = data?.filter((l) => l.status === "open")   ?? [];
  const closed = data?.filter((l) => l.status === "closed") ?? [];

  // Separar alertas del resto para mostrarlas primero dentro de "Activos"
  const overdueOpen = open.filter((l) => hoursInPark(l.entry_time) >= ALERT_HOURS);
  const normalOpen  = open.filter((l) => hoursInPark(l.entry_time) <  ALERT_HOURS);

  if (isLoading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

      {/* Header */}
      <div style={{ marginBottom: "4px" }}>
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

      {!data?.length && (
        <p style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", marginTop: "40px" }}>
          No hay registros de acceso aún.
        </p>
      )}

      {/* Sección activos */}
      {open.length > 0 && (
        <>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Activos ahora
          </div>

          {/* Alertas primero, ordenadas por mayor tiempo dentro */}
          {overdueOpen
            .sort((a, b) => new Date(a.entry_time) - new Date(b.entry_time))
            .map((log) => <AccessRow key={log.id} log={log} />)
          }

          {/* Registros normales */}
          {normalOpen.map((log) => <AccessRow key={log.id} log={log} />)}
        </>
      )}

      {/* Sección historial cerrado */}
      {closed.length > 0 && (
        <>
          <div style={{
            fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)",
            textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "8px",
          }}>
            Historial
          </div>
          {closed.map((log) => <AccessRow key={log.id} log={log} />)}
        </>
      )}

    </div>
  );
}
