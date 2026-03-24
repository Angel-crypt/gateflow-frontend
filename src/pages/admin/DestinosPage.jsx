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
        <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "999px", ...typeStyle }}>
          {typeLabel}
        </span>
      </div>
    </div>
  );
}

export default function DestinosPage() {
  return null;
}
