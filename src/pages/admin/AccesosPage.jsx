import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Search, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { getAccessLogs } from "../../api/access.api";
import { Spinner } from "../../components/Spinner";

const ITEMS_PER_PAGE = 20;

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [destinationFilter, setDestinationFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["access-logs"],
    queryFn: async () => {
      const res = await getAccessLogs();
      return res.data.results ?? res.data;
    },
  });

  const filteredLogs = useMemo(() => {
    if (!data) return [];

    return data.filter(log => {
      // Search
      if (search) {
        const searchLower = search.toLowerCase();
        const matchName = log.visitor_name?.toLowerCase().includes(searchLower);
        const matchPlate = log.plate?.toLowerCase().includes(searchLower);
        if (!matchName && !matchPlate) return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "open" && log.status !== "open") return false;
        if (statusFilter === "closed" && log.status !== "closed") return false;
      }

      // Type filter
      if (typeFilter !== "all") {
        if (typeFilter === "qr" && log.access_type !== "qr") return false;
        if (typeFilter === "manual" && log.access_type !== "manual") return false;
      }

      // Destination filter
      if (destinationFilter !== "all" && log.destination?.id !== parseInt(destinationFilter)) {
        return false;
      }

      // Date filter
      if (dateFilter !== "all") {
        const now = new Date();
        const entryTime = new Date(log.entry_time);
        
        if (dateFilter === "today") {
          const today = now.toDateString();
          if (entryTime.toDateString() !== today) return false;
        } else if (dateFilter === "yesterday") {
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          if (entryTime.toDateString() !== yesterday.toDateString()) return false;
        } else if (dateFilter === "week") {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (entryTime < weekAgo) return false;
        } else if (dateFilter === "month") {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (entryTime < monthAgo) return false;
        }
      }

      return true;
    });
  }, [data, search, statusFilter, typeFilter, destinationFilter, dateFilter]);

  const destinations = useMemo(() => {
    if (!data) return [];
    const dests = new Map();
    data.forEach(l => {
      if (l.destination) dests.set(l.destination.id, l.destination);
    });
    return Array.from(dests.values());
  }, [data]);

  const exportToCSV = () => {
    const headers = ["Fecha entrada", "Fecha salida", "Visitante", "Placa", "Destino", "Tipo", "Estado", "Guardia"];
    const rows = filteredLogs.map(log => [
      new Date(log.entry_time).toLocaleString("es-MX"),
      log.exit_time ? new Date(log.exit_time).toLocaleString("es-MX") : "—",
      log.visitor_name,
      log.plate || "—",
      log.destination?.name || "—",
      log.access_type === "qr" ? "QR" : "Manual",
      log.status === "open" ? "Activo" : "Cerrado",
      log.guard?.email || "—",
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `accesos_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const open = filteredLogs.filter((l) => l.status === "open");
  const closed = filteredLogs.filter((l) => l.status === "closed");
  const overdueOpen = open.filter((l) => hoursInPark(l.entry_time) >= ALERT_HOURS);
  const normalOpen = open.filter((l) => hoursInPark(l.entry_time) < ALERT_HOURS);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedOpen = open.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const paginatedClosed = closed.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (isLoading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Filters */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: "150px" }}>
          <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input
            type="text"
            placeholder="Buscar por nombre o placa..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{
              width: "100%",
              padding: "8px 8px 8px 32px",
              background: "var(--color-bg)",
              border: "0.5px solid var(--color-border)",
              borderRadius: "6px",
              fontSize: "12px",
              color: "var(--color-text)",
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{
            padding: "8px 10px",
            background: "var(--color-bg)",
            border: "0.5px solid var(--color-border)",
            borderRadius: "6px",
            fontSize: "12px",
            color: "var(--color-text)",
          }}
        >
          <option value="all">Todos los estados</option>
          <option value="open">Activos</option>
          <option value="closed">Cerrados</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          style={{
            padding: "8px 10px",
            background: "var(--color-bg)",
            border: "0.5px solid var(--color-border)",
            borderRadius: "6px",
            fontSize: "12px",
            color: "var(--color-text)",
          }}
        >
          <option value="all">Todos los tipos</option>
          <option value="qr">QR</option>
          <option value="manual">Manual</option>
        </select>

        <select
          value={destinationFilter}
          onChange={(e) => { setDestinationFilter(e.target.value); setPage(1); }}
          style={{
            padding: "8px 10px",
            background: "var(--color-bg)",
            border: "0.5px solid var(--color-border)",
            borderRadius: "6px",
            fontSize: "12px",
            color: "var(--color-text)",
          }}
        >
          <option value="all">Todos los destinos</option>
          {destinations.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <select
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
          style={{
            padding: "8px 10px",
            background: "var(--color-bg)",
            border: "0.5px solid var(--color-border)",
            borderRadius: "6px",
            fontSize: "12px",
            color: "var(--color-text)",
          }}
        >
          <option value="all">Todas las fechas</option>
          <option value="today">Hoy</option>
          <option value="yesterday">Ayer</option>
          <option value="week">Esta semana</option>
          <option value="month">Este mes</option>
        </select>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text)" }}>
            Historial de accesos
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
            {filteredLogs.length} registros · {open.length} activos
            {overdueOpen.length > 0 && (
              <span style={{ color: "#d97706", fontWeight: 600 }}>
                {" "}· {overdueOpen.length} con alerta +24h
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={exportToCSV}
            style={{
              padding: "6px 10px",
              background: "var(--color-bg)",
              border: "0.5px solid var(--color-border)",
              borderRadius: "6px",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Download size={14} />
            CSV
          </button>
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
      </div>

      {!filteredLogs.length && (
        <p style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", marginTop: "40px" }}>
          No hay registros que coincidan con los filtros.
        </p>
      )}

      {open.length > 0 && (
        <>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Activos ahora ({open.length})
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
            Historial ({closed.length})
          </div>
          {viewMode === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "8px" }}>
              {paginatedClosed.map((log) => (
                <AccessCard key={log.id} log={log} viewMode="grid" />
              ))}
            </div>
          ) : (
            paginatedClosed.map((log) => (
              <AccessCard key={log.id} log={log} viewMode="list" />
            ))
          )}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", alignItems: "center", marginTop: "8px" }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "4px 8px", background: "var(--color-bg)", border: "0.5px solid var(--color-border)", borderRadius: "4px", cursor: "pointer", opacity: page === 1 ? 0.5 : 1 }}><ChevronLeft size={14} /></button>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Página {page} de {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ padding: "4px 8px", background: "var(--color-bg)", border: "0.5px solid var(--color-border)", borderRadius: "4px", cursor: "pointer", opacity: page >= totalPages ? 0.5 : 1 }}><ChevronRight size={14} /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
