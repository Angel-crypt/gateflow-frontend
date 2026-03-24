import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDestinations, toggleActiveDestination, deleteDestination } from "../../api/destinations.api";
import { Spinner } from "../../components/Spinner";
import CreateDestinationModal from "./CreateDestinationModal";
import EditDestinationModal from "./EditDestinationModal";

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
      <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
        <button
          onClick={() => onEdit(destination)}
          style={{
            flex: 1, padding: "7px",
            background: "var(--color-surface)",
            color: "var(--color-text)",
            border: "0.5px solid var(--color-border)",
            borderRadius: "7px", fontSize: "12px",
            fontWeight: 500, cursor: "pointer",
          }}
        >
          Editar
        </button>
        <button
          onClick={() => onToggle(destination)}
          style={{
            flex: 1, padding: "7px",
            background: isActive ? "#fef3c7" : "#dcfce7",
            color: isActive ? "#b45309" : "#16a34a",
            border: "none", borderRadius: "7px",
            fontSize: "12px", fontWeight: 500, cursor: "pointer",
          }}
        >
          {isActive ? "Desactivar" : "Activar"}
        </button>
        <button
          onClick={() => onDelete(destination.id)}
          style={{
            padding: "7px 12px",
            background: "var(--color-surface)",
            color: "#dc2626",
            border: "0.5px solid #fecaca",
            borderRadius: "7px", fontSize: "12px",
            cursor: "pointer",
          }}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

export default function DestinosPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["destinations"],
    queryFn: async () => {
      const res = await getDestinations();
      return res.data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (destination) => toggleActiveDestination(destination.id, !destination.is_active),
    onSuccess: () => queryClient.invalidateQueries(["destinations"]),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteDestination(id),
    onSuccess: () => queryClient.invalidateQueries(["destinations"]),
  });

  const filtered = data?.filter((d) =>
    typeFilter === "all" ? true : d.type === typeFilter
  ) ?? [];

  if (isLoading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text)" }}>
            Destinos
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
            {filtered.length} destinos en total
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

      {/* Filtro de tipo */}
      <div style={{ display: "flex", gap: "6px" }}>
        {["all", "company", "area"].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            style={{
              padding: "5px 12px",
              borderRadius: "999px",
              border: "0.5px solid var(--color-border)",
              fontSize: "11px",
              fontWeight: 500,
              cursor: "pointer",
              background: typeFilter === t ? "#0369a1" : "var(--color-surface)",
              color: typeFilter === t ? "#fff" : "var(--color-text-muted)",
            }}
          >
            {t === "all" ? "Todos" : t === "company" ? "Empresas" : "Áreas"}
          </button>
        ))}
      </div>

      {!filtered.length && (
        <p style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", marginTop: "40px" }}>
          No hay destinos registrados aún.
        </p>
      )}

      {filtered.map((destination) => (
        <DestinationCard
          key={destination.id}
          destination={destination}
          onEdit={() => setSelectedDestination(destination)}
          onToggle={(d) => toggleMutation.mutate(d)}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      ))}

      {showCreate && (
        <CreateDestinationModal onClose={() => setShowCreate(false)} />
      )}

      {selectedDestination && (
        <EditDestinationModal
          destination={selectedDestination}
          onClose={() => setSelectedDestination(null)}
        />
      )}
    </div>
  );
}

