import { useState, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { getPasses, deletePass, updatePass } from "../../api/passes.api";
import { getAccessLogs } from "../../api/access.api";
import apiClient from "../../api/apiClient";
import { Spinner } from "../../components/Spinner";
import CreatePassModal from "../tenant/CreatePassModal";
import PassDetailModal from "./PassDetailModal";
import { AuthContext } from "../../auth/context";

function PassCard({ pass, onSelectDetail, onDelete, onToggleActive, viewMode, currentUserId, hasActiveAccess }) {
  const isUsed = pass.is_used;
  const isInactive = !pass.is_active;
  const isExpired = new Date(pass.valid_to) < new Date();
  const canToggle = !isUsed && !isExpired;
  const isOwner = pass.created_by?.id === currentUserId;
  const isDayPassUsed = pass.pass_type === "day" && isUsed;
  const isDayPassActive = pass.pass_type === "day" && hasActiveAccess;

  const cardBorder = isDayPassActive ? "2px solid #16a34a" : isDayPassUsed ? "2px solid #0369a1" : "0.5px solid var(--color-border)";

  const badgeStyle = isUsed || isInactive || isExpired
    ? { background: "#f1f5f9", color: "#64748b" }
    : pass.pass_type === "day"
    ? { background: "#e0f2fe", color: "#0369a1" }
    : { background: "#fef3c7", color: "#b45309" };

  const badgeLabel = isUsed ? "Usado" : isInactive ? "Inactivo" : isExpired ? "Expirado" : pass.pass_type === "day" ? "Day Pass" : "Single Use";

  const handleClick = (e) => {
    if (e.target.closest("button")) return;
    onSelectDetail(pass);
  };

  if (viewMode === "grid") {
    return (
      <div onClick={handleClick} style={{ cursor: "pointer" }}>
        <div style={{
          background: "var(--color-surface)",
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
        background: "var(--color-surface)",
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
        <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
          Creado por: {pass.created_by?.email ?? "—"}
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

  if (isLoading || loadingAccessLogs) return <Spinner />;

  const dayPasses = data?.filter(p => p.pass_type === "day") ?? [];
  const singlePasses = data?.filter(p => p.pass_type === "single") ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text)" }}>
            Pases de acceso
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
            {data?.length ?? 0} pases en total
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")} style={{ padding: "6px 10px", background: "var(--color-bg)", border: "0.5px solid var(--color-border)", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>
            {viewMode === "list" ? "▦ Grid" : "☰ Lista"}
          </button>
          <button onClick={() => setShowCreate(true)} style={{ padding: "6px 12px", background: "#0369a1", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>
            + Nuevo
          </button>
        </div>
      </div>

      {!data?.length && <p style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", marginTop: "40px" }}>No hay pases registrados aún.</p>}

      {dayPasses.length > 0 && (
        <>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "8px" }}>
            Day Pass ({dayPasses.length})
          </div>
          {viewMode === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
              {dayPasses.map((pass) => (
                <PassCard key={pass.id} pass={pass} viewMode="grid" currentUserId={user?.id} hasActiveAccess={hasActiveAccess(pass.id)} onSelectDetail={setDetailPass} onDelete={() => {}} onToggleActive={() => {}} />
              ))}
            </div>
          ) : (
            dayPasses.map((pass) => (
              <PassCard key={pass.id} pass={pass} viewMode="list" currentUserId={user?.id} hasActiveAccess={hasActiveAccess(pass.id)} onSelectDetail={setDetailPass} onDelete={() => {}} onToggleActive={() => {}} />
            ))
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
              {singlePasses.map((pass) => (
                <PassCard key={pass.id} pass={pass} viewMode="grid" currentUserId={user?.id} hasActiveAccess={hasActiveAccess(pass.id)} onSelectDetail={setDetailPass} onDelete={() => {}} onToggleActive={() => {}} />
              ))}
            </div>
          ) : (
            singlePasses.map((pass) => (
              <PassCard key={pass.id} pass={pass} viewMode="list" currentUserId={user?.id} hasActiveAccess={hasActiveAccess(pass.id)} onSelectDetail={setDetailPass} onDelete={() => {}} onToggleActive={() => {}} />
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
