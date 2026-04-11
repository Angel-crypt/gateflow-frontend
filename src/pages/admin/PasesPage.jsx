import { useState, useContext, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Search, Filter, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { getPasses, deletePass, updatePass, exportPassesCSV, exportPassesPDF } from "../../api/passes.api";
import { getAccessLogs } from "../../api/access.api";
import apiClient from "../../api/apiClient";
import { Spinner } from "../../components/Spinner";
import CreatePassModal from "../tenant/CreatePassModal";
import PassDetailModal from "./PassDetailModal";
import { AuthContext } from "../../auth/context";

const ITEMS_PER_PAGE = 20;

function PassCard({ pass, onSelectDetail, onDelete, onToggleActive, viewMode, currentUserId, hasActiveAccess, accessLogs }) {
  const isUsed = pass.is_used;
  const isInactive = !pass.is_active;
  const isExpired = new Date(pass.valid_to) < new Date();
  const canToggle = !isUsed && !isExpired;
  const isOwner = pass.created_by?.id === currentUserId;
  
  // Check if day pass has been used (has closed access log)
  const hasClosedLog = accessLogs?.some(log => 
    (log.access_pass?.id === pass.id || (log.visitor_name === pass.visitor_name && log.plate === pass.plate)) && log.status === "closed" && log.exit_time
  );
  const isDayPassUsed = pass.pass_type === "day" && hasClosedLog;
  const isActuallyUsed = isUsed || isDayPassUsed;
  
  const isDayPassActive = pass.pass_type === "day" && hasActiveAccess;

  const cardBorder = isDayPassActive ? "2px solid #16a34a" : isDayPassUsed || (pass.pass_type === "day" && hasClosedLog) ? "2px solid #0369a1" : "0.5px solid var(--color-border)";

  const cardBackground = isOwner 
    ? "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.04) 100%)"
    : "linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.04) 100%)";

  const badgeStyle = isActuallyUsed
    ? { background: "#f1f5f9", color: "#64748b" }
    : isDayPassActive
    ? { background: "#dcfce7", color: "#16a34a" }
    : isInactive
    ? { background: "#f1f5f9", color: "#64748b" }
    : isExpired
    ? { background: "#fef2f2", color: "#dc2626" }
    : pass.pass_type === "day"
    ? { background: "#e0f2fe", color: "#0369a1" }
    : { background: "#fef3c7", color: "#b45309" };

  const badgeLabel = isActuallyUsed 
    ? "Usado" 
    : isDayPassActive 
    ? "En parque" 
    : isInactive 
    ? "Inactivo" 
    : isExpired 
    ? "Expirado" 
    : "Disponible";

  const handleClick = (e) => {
    if (e.target.closest("button")) return;
    onSelectDetail(pass);
  };

  if (viewMode === "grid") {
    return (
      <div onClick={handleClick} style={{ cursor: "pointer" }}>
        <div style={{
          background: cardBackground,
          border: cardBorder,
          borderRadius: "10px",
          padding: "10px",
          opacity: isUsed || isInactive || isExpired ? 0.6 : 1,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text)" }}>
              {pass.visitor_name}
            </div>
            <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "999px", ...badgeStyle }}>
              {badgeLabel}
            </span>
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
            {pass.plate || "—"}
          </div>
          <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
            {pass.destination?.name ?? "—"}
          </div>
          <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
            {new Date(pass.valid_from).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
            {" → "}
            {new Date(pass.valid_to).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div onClick={handleClick} style={{ cursor: "pointer" }}>
      <div style={{
        background: cardBackground,
        border: cardBorder,
        borderRadius: "10px",
        padding: "12px 14px",
        opacity: isUsed || isInactive || isExpired ? 0.6 : 1,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text)" }}>
              {pass.visitor_name}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
              {pass.plate || "—"}
            </div>
          </div>
          <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "999px", ...badgeStyle }}>
            {badgeLabel}
          </span>
        </div>
        <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
          {pass.destination?.name ?? "—"}
        </div>
        <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
          {new Date(pass.valid_from).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
          {" — "}
          {new Date(pass.valid_to).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
        </div>
      </div>
    </div>
  );
}

export default function PasesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [detailPass, setDetailPass] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [destinationFilter, setDestinationFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [createdByFilter, setCreatedByFilter] = useState("all");
  const [page, setPage] = useState(1);
  const { user } = useContext(AuthContext);

  const { data, isLoading } = useQuery({
    queryKey: ["passes"],
    queryFn: async () => {
      const res = await getPasses();
      return res.data.results ?? res.data;
    },
  });

  const { data: accessLogs, isLoading: loadingAccessLogs } = useQuery({
    queryKey: ["access-logs-all"],
    queryFn: async () => {
      const res = await apiClient.get("/api/access-logs/");
      return res.data.results ?? res.data;
    },
    enabled: !!user,
  });

  const hasActiveAccess = (passId) => {
    if (!accessLogs || !data) return false;
    const pass = data.find(p => p.id === passId);
    if (!pass) return false;
    return accessLogs.some(log => 
      (log.access_pass?.id === passId || (log.visitor_name === pass.visitor_name && log.plate === pass.plate)) && log.status === "open"
    );
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => deletePass(id),
    onSuccess: () => queryClient.invalidateQueries(["passes"]),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (pass) => updatePass(pass.id, { is_active: !pass.is_active }),
    onSuccess: () => queryClient.invalidateQueries(["passes"]),
  });

  const filteredPasses = useMemo(() => {
    if (!data) return [];
    
    return data.filter(pass => {
      // Search
      if (search) {
        const searchLower = search.toLowerCase();
        const matchName = pass.visitor_name?.toLowerCase().includes(searchLower);
        const matchPlate = pass.plate?.toLowerCase().includes(searchLower);
        if (!matchName && !matchPlate) return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        const isUsed = pass.is_used;
        const isInactive = !pass.is_active;
        const isExpired = new Date(pass.valid_to) < new Date();
        
        // Check if day pass has been used (has closed access log)
        const hasClosedLog = accessLogs?.some(log => 
          (log.access_pass?.id === pass.id || (log.visitor_name === pass.visitor_name && log.plate === pass.plate)) && log.status === "closed" && log.exit_time
        );
        const isDayPassUsed = pass.pass_type === "day" && hasClosedLog;
        
        const isActuallyUsed = isUsed || isDayPassUsed;
        
        // Check if has active access (open)
        const hasOpenLog = accessLogs?.some(log => 
          (log.access_pass?.id === pass.id || (log.visitor_name === pass.visitor_name && log.plate === pass.plate)) && log.status === "open"
        );
        const isActiveInPark = hasOpenLog;
        
        if (statusFilter === "active" && (isInactive || isExpired || isActuallyUsed)) return false;
        if (statusFilter === "inactive" && !isInactive) return false;
        if (statusFilter === "used" && !isActuallyUsed) return false;
        if (statusFilter === "expired" && !isExpired) return false;
        if (statusFilter === "available" && (isActuallyUsed || isInactive || isExpired)) return false;
      }

      // Created by filter
      if (createdByFilter !== "all") {
        const passCreatedById = pass.created_by?.id;
        if (createdByFilter === "mine" && passCreatedById !== user?.id) return false;
        if (createdByFilter === "tenant" && passCreatedById === user?.id) return false;
      }

      // Destination filter
      if (destinationFilter !== "all" && pass.destination?.id !== parseInt(destinationFilter)) {
        return false;
      }

      // Date filter
      if (dateFilter !== "all") {
        const now = new Date();
        const validFrom = new Date(pass.valid_from);
        const validTo = new Date(pass.valid_to);
        
        if (dateFilter === "today") {
          const today = now.toDateString();
          if (validFrom.toDateString() !== today && validTo.toDateString() !== today) return false;
        } else if (dateFilter === "week") {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (validFrom < weekAgo && validTo < weekAgo) return false;
        } else if (dateFilter === "month") {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (validFrom < monthAgo && validTo < monthAgo) return false;
        } else if (dateFilter === "expired") {
          if (validTo >= now) return false;
        } else if (dateFilter === "future") {
          if (validFrom > now) {
            // future passes are valid
          } else if (validTo < now) {
            return false; // already expired
          }
        }
      }

      return true;
    });
  }, [data, search, statusFilter, destinationFilter, dateFilter, createdByFilter, accessLogs, user]);

  const dayPasses = filteredPasses.filter(p => p.pass_type === "day");
  const singlePasses = filteredPasses.filter(p => p.pass_type === "single");

  const totalDayPages = Math.ceil(dayPasses.length / ITEMS_PER_PAGE);
  const totalSinglePages = Math.ceil(singlePasses.length / ITEMS_PER_PAGE);

  const paginatedDayPasses = dayPasses.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const paginatedSinglePasses = singlePasses.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const destinations = useMemo(() => {
    if (!data) return [];
    const dests = new Map();
    data.forEach(p => {
      if (p.destination) dests.set(p.destination.id, p.destination);
    });
    return Array.from(dests.values());
  }, [data]);

  const buildExportParams = () => {
    const params = {};
    if (statusFilter === "inactive") params.is_active = false;
    if (statusFilter === "available" || statusFilter === "active") params.is_active = true;
    if (destinationFilter !== "all") params.destination = destinationFilter;
    if (dateFilter !== "all") {
      const now = new Date();
      if (dateFilter === "today") {
        const start = new Date(now); start.setHours(0, 0, 0, 0);
        params.date_from = start.toISOString();
      } else if (dateFilter === "week") {
        params.date_from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (dateFilter === "month") {
        params.date_from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (dateFilter === "expired") {
        params.date_to = now.toISOString();
      } else if (dateFilter === "future") {
        params.date_from = now.toISOString();
      }
    }
    return params;
  };

  const exportToCSV = async () => {
    const res = await exportPassesCSV(buildExportParams());
    const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `pases_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportToPDF = async () => {
    const res = await exportPassesPDF(buildExportParams());
    const blob = new Blob([res.data], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `pases_${new Date().toISOString().split("T")[0]}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (isLoading || loadingAccessLogs) return <Spinner />;

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
          <option value="available">Disponibles</option>
          <option value="active">En parque</option>
          <option value="inactive">Inactivos</option>
          <option value="used">Usados</option>
          <option value="expired">Expirados</option>
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
          <option value="week">Esta semana</option>
          <option value="month">Este mes</option>
          <option value="expired">Expirados</option>
          <option value="future">Futuros</option>
        </select>

        <select
          value={createdByFilter}
          onChange={(e) => { setCreatedByFilter(e.target.value); setPage(1); }}
          style={{
            padding: "8px 10px",
            background: "var(--color-bg)",
            border: "0.5px solid var(--color-border)",
            borderRadius: "6px",
            fontSize: "12px",
            color: "var(--color-text)",
          }}
        >
          <option value="all">Todos los creadores</option>
          <option value="mine">Creados por mí</option>
          <option value="tenant">De inquilinos</option>
        </select>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text)" }}>
            Pases de acceso
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
            <span style={{ color: "#3b82f6" }}>●</span> creados por mí &nbsp;&nbsp;
            <span style={{ color: "#f59e0b" }}>●</span> de inquilinos
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
            {filteredPasses.length} passes encontrados
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={exportToCSV}
            style={{ padding: "6px 10px", background: "var(--color-bg)", border: "0.5px solid var(--color-border)", borderRadius: "6px", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
          >
            <Download size={14} />
            CSV
          </button>
          {user?.role === "admin" && (
            <button
              onClick={exportToPDF}
              style={{ padding: "6px 10px", background: "var(--color-bg)", border: "0.5px solid var(--color-border)", borderRadius: "6px", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
            >
              <Download size={14} />
              PDF
            </button>
          )}
          <button onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")} style={{ padding: "6px 10px", background: "var(--color-bg)", border: "0.5px solid var(--color-border)", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>
            {viewMode === "list" ? "▦ Grid" : "☰ Lista"}
          </button>
          <button onClick={() => setShowCreate(true)} style={{ padding: "6px 12px", background: "#0369a1", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>
            + Nuevo
          </button>
        </div>
      </div>

      {!filteredPasses.length && <p style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", marginTop: "40px" }}>No hay passes que coincidan con los filtros.</p>}

      {dayPasses.length > 0 && (
        <>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "8px" }}>
            Day Pass ({dayPasses.length})
          </div>
          {viewMode === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
              {paginatedDayPasses.map((pass) => (
                <PassCard key={pass.id} pass={pass} viewMode="grid" currentUserId={user?.id} hasActiveAccess={hasActiveAccess(pass.id)} accessLogs={accessLogs} onSelectDetail={setDetailPass} onDelete={() => {}} onToggleActive={() => {}} />
              ))}
            </div>
          ) : (
            paginatedDayPasses.map((pass) => (
              <PassCard key={pass.id} pass={pass} viewMode="list" currentUserId={user?.id} hasActiveAccess={hasActiveAccess(pass.id)} accessLogs={accessLogs} onSelectDetail={setDetailPass} onDelete={() => {}} onToggleActive={() => {}} />
            ))
          )}
          {totalDayPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", alignItems: "center", marginTop: "8px" }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "4px 8px", background: "var(--color-bg)", border: "0.5px solid var(--color-border)", borderRadius: "4px", cursor: "pointer", opacity: page === 1 ? 0.5 : 1 }}><ChevronLeft size={14} /></button>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Página {page} de {Math.max(totalDayPages, totalSinglePages)}</span>
              <button onClick={() => setPage(p => Math.min(Math.max(totalDayPages, totalSinglePages), p + 1))} disabled={page >= Math.max(totalDayPages, totalSinglePages)} style={{ padding: "4px 8px", background: "var(--color-bg)", border: "0.5px solid var(--color-border)", borderRadius: "4px", cursor: "pointer", opacity: page >= Math.max(totalDayPages, totalSinglePages) ? 0.5 : 1 }}><ChevronRight size={14} /></button>
            </div>
          )}
        </>
      )}

      {singlePasses.length > 0 && (
        <>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "8px" }}>
            Single Use ({singlePasses.length})
          </div>
          {viewMode === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
              {paginatedSinglePasses.map((pass) => (
                <PassCard key={pass.id} pass={pass} viewMode="grid" currentUserId={user?.id} hasActiveAccess={hasActiveAccess(pass.id)} accessLogs={accessLogs} onSelectDetail={setDetailPass} onDelete={() => {}} onToggleActive={() => {}} />
              ))}
            </div>
          ) : (
            paginatedSinglePasses.map((pass) => (
              <PassCard key={pass.id} pass={pass} viewMode="list" currentUserId={user?.id} hasActiveAccess={hasActiveAccess(pass.id)} accessLogs={accessLogs} onSelectDetail={setDetailPass} onDelete={() => {}} onToggleActive={() => {}} />
            ))
          )}
        </>
      )}

      {showCreate && <CreatePassModal onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); queryClient.invalidateQueries(["passes"]); }} />}
      {detailPass && (
        <PassDetailModal
          pass={detailPass}
          onClose={() => setDetailPass(null)}
          onToggleActive={(p) => toggleActiveMutation.mutate(p)}
          onDelete={(id) => deleteMutation.mutate(id)}
          canActivate={detailPass.created_by?.id === user?.id && !detailPass.is_active && !detailPass.is_used && new Date(detailPass.valid_to) >= new Date()}
          canDelete={true}
          isOwner={detailPass.created_by?.id === user?.id}
        />
      )}
    </div>
  );
}
