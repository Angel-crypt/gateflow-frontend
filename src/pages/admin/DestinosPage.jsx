import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDestinations, toggleActiveDestination, deleteDestination } from "../../api/destinations.api";
import { Spinner } from "../../components/Spinner";

function DestinationCard({ destination, onEdit, onToggle, onDelete }) {
  const isActive = destination.is_active;

  const typeStyle =
    destination.type === "company"
      ? { background: "#e0f2fe", color: "#0369a1" }
      : { background: "#fef3c7", color: "#b45309" };

  const typeLabel = destination.type === "company" ? "Empresa" : "Área";

  const statusStyle = isActive
    ? { background: "#dcfce7", color: "#16a34a" }
    : { background: "#f1f5f9", color: "#64748b" };

  const statusLabel = isActive ? "Activo" : "Inactivo";

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "0.5px solid var(--color-border)",
        borderRadius: "10px",
        padding: "12px 14px",
        opacity: isActive ? 1 : 0.6,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text)" }}>
            {destination.name}
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
            {destination.responsible
              ? `${destination.responsible.first_name} ${destination.responsible.last_name}`
              : "Sin responsable"}
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "999px", ...typeStyle }}>
            {typeLabel}
          </span>
          <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "999px", ...statusStyle }}>
            {statusLabel}
          </span>
        </div>
      </div>
      <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
        {destination.park?.name ?? "—"}
      </div>
    </div>
  );
}

export default function DestinosPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["destinations"],
    queryFn: async () => {
      const res = await getDestinations();
      return res.data;
    },
  });

  if (isLoading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text)" }}>
            Destinos
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
            {data?.length ?? 0} destinos en total
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: "8px 14px",
            background: "#0369a1",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          + Nuevo destino
        </button>
      </div>

      {!data?.length && (
        <p style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", marginTop: "40px" }}>
          No hay destinos registrados aún.
        </p>
      )}

      {data?.map((destination) => (
        <DestinationCard
          key={destination.id}
          destination={destination}
          onEdit={() => setSelectedDestination(destination)}
        />
      ))}
    </div>
  );
}
