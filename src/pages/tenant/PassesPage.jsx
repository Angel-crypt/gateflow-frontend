import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getPasses, deletePass, updatePass } from "../../api/passes.api";
import { Spinner } from "../../components/Spinner";
import CreatePassModal from "./CreatePassModal";
import QRModal from "./QRModal";

function PassCard({ pass, onViewQR, onDelete, onToggleActive }) {
  const isUsed = pass.is_used;
  const isInactive = !pass.is_active;
  const isExpired = new Date(pass.valid_to) < new Date();
  const canToggle = !isUsed && !isExpired; // puede activar/desactivar si no está usado ni expirado

  const badgeStyle =
    isUsed || isInactive || isExpired
      ? { background: "#f1f5f9", color: "#64748b" }
      : pass.pass_type === "day"
      ? { background: "#e0f2fe", color: "#0369a1" }
      : { background: "#fef3c7", color: "#b45309" };

  const badgeLabel =
    isUsed ? "Usado" : isInactive ? "Inactivo" : isExpired ? "Expirado" : pass.pass_type === "day" ? "Day Pass" : "Single Use";

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "0.5px solid var(--color-border)",
        borderRadius: "10px",
        padding: "12px 14px",
        opacity: isUsed || isExpired ? 0.6 : 1,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
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
      {!isUsed && !isExpired && (
        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
          {!isInactive && (
            <button
              onClick={() => onViewQR(pass)}
              style={{
                flex: 1, padding: "7px", background: "#0369a1",
                color: "#fff", border: "none", borderRadius: "7px",
                fontSize: "12px", fontWeight: 500, cursor: "pointer",
              }}
            >
              Ver QR
            </button>
          )}
          {canToggle && (
            <button
              onClick={() => onToggleActive(pass)}
              style={{
                flex: isInactive ? 1 : 0,
                padding: "7px 12px",
                background: isInactive ? "#0369a1" : "var(--color-surface)",
                color: isInactive ? "#fff" : "#64748b",
                border: isInactive ? "none" : "0.5px solid var(--color-border)",
                borderRadius: "7px", fontSize: "12px", cursor: "pointer",
                fontWeight: isInactive ? 500 : 400,
              }}
            >
              {isInactive ? "Activar" : "Desactivar"}
            </button>
          )}
          <button
            onClick={() => onDelete(pass.id)}
            style={{
              padding: "7px 12px", background: "var(--color-surface)",
              color: "#dc2626", border: "0.5px solid #fecaca",
              borderRadius: "7px", fontSize: "12px", cursor: "pointer",
            }}
          >
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

export default function PassesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPass, setSelectedPass] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["passes"],
    queryFn: async () => {
      const res = await getPasses();
      return res.data.results ?? res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deletePass(id),
    onSuccess: () => queryClient.invalidateQueries(["passes"]),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (pass) => updatePass(pass.id, { is_active: !pass.is_active }),
    onSuccess: () => queryClient.invalidateQueries(["passes"]),
  });

  if (isLoading) return <Spinner />;

  return (
    <>
      <button
        onClick={() => setShowCreate(true)}
        style={{
          width: "100%", padding: "12px", background: "#0369a1",
          color: "#fff", border: "none", borderRadius: "8px",
          fontSize: "13px", fontWeight: 500, cursor: "pointer",
        }}
      >
        + Nuevo pase
      </button>

      {!data?.length && (
        <p style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", marginTop: "40px" }}>
          No tienes pases creados aún.
        </p>
      )}

      {data?.map((pass) => (
        <PassCard
          key={pass.id}
          pass={pass}
          onViewQR={setSelectedPass}
          onDelete={(id) => deleteMutation.mutate(id)}
          onToggleActive={(p) => toggleActiveMutation.mutate(p)}
        />
      ))}

      {showCreate && (
        <CreatePassModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            queryClient.invalidateQueries(["passes"]);
          }}
        />
      )}

      {selectedPass && (
        <QRModal
          pass={selectedPass}
          onClose={() => setSelectedPass(null)}
        />
      )}
    </>
  );
}
