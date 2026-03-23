import { useQuery } from "@tanstack/react-query";
import { getPasses } from "../../api/passes.api";
import { Spinner } from "../../components/Spinner";

function PassRow({ pass }) {
  const isInactive = !pass.is_active;
  const isExpired = new Date(pass.valid_to) < new Date();

  const badgeStyle =
    isInactive || isExpired
      ? { background: "#f1f5f9", color: "#64748b" }
      : pass.pass_type === "day"
      ? { background: "#e0f2fe", color: "#0369a1" }
      : { background: "#fef3c7", color: "#b45309" };

  const badgeLabel =
    isInactive ? "Inactivo" : isExpired ? "Expirado" : pass.pass_type === "day" ? "Day Pass" : "Single Use";

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "0.5px solid var(--color-border)",
        borderRadius: "10px",
        padding: "12px 14px",
        opacity: isInactive || isExpired ? 0.6 : 1,
      }}
    >
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
  );
}

export default function PasesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["passes"],
    queryFn: async () => {
      const res = await getPasses();
      return res.data;
    },
  });

  if (isLoading) return <Spinner />;

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
      </div>

      {!data?.length && (
        <p style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", marginTop: "40px" }}>
          No hay pases registrados aún.
        </p>
      )}

      {data?.map((pass) => (
        <PassRow key={pass.id} pass={pass} />
      ))}
    </div>
  );
}
