import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccessLogs, registerExit, exportAccessLogsCSV } from "../../api/access.api";
import { Download } from "lucide-react";
import { Spinner } from "../../components/Spinner";

function timeSince(entryTime) {
  const diff = Math.floor((Date.now() - new Date(entryTime)) / 1000 / 60);
  const h = Math.floor(diff / 60).toString().padStart(2, "0");
  const m = (diff % 60).toString().padStart(2, "0");
  return `${h}:${m} hrs dentro`;
}

export default function AccessListPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["access-logs"],
    queryFn: async () => {
      const res = await getAccessLogs();
      return res.data.results ?? res.data;
    },
  });

  const exitMutation = useMutation({
    mutationFn: (id) => registerExit(id),
    onSuccess: () => queryClient.invalidateQueries(["access-logs"]),
  });

  const open = data?.filter((l) => l.status === "open") ?? [];

  const exportToCSV = async () => {
    const res = await exportAccessLogsCSV({ status: "open" });
    const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `accesos_activos_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (isLoading) return <Spinner />;

  if (!open.length)
    return (
      <p style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", marginTop: "40px" }}>
        No hay accesos abiertos en este momento.
      </p>
    );

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text)" }}>
          Accesos activos ({open.length})
        </div>
        <button
          onClick={exportToCSV}
          style={{ padding: "6px 10px", background: "var(--color-surface)", border: "0.5px solid var(--color-border)", borderRadius: "6px", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
        >
          <Download size={14} />
          CSV
        </button>
      </div>
      {open.map((log) => (
        <div
          key={log.id}
          style={{
            background: "var(--color-surface)",
            border: "0.5px solid var(--color-border)",
            borderRadius: "10px",
            padding: "12px 14px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text)" }}>
              {log.visitor_name}
            </span>
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
          </div>

          <div style={{ fontSize: "12px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
            {log.plate || "—"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
            {log.destination?.name ?? "—"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px", display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
            {timeSince(log.entry_time)}
          </div>

          <button
            onClick={() => exitMutation.mutate(log.id)}
            disabled={exitMutation.isPending && exitMutation.variables === log.id}
            style={{
              width: "100%",
              marginTop: "10px",
              padding: "8px",
              background: "var(--color-surface)",
              color: "#dc2626",
              border: "0.5px solid #fecaca",
              borderRadius: "7px",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {exitMutation.isPending && exitMutation.variables === log.id
              ? "Registrando salida..."
              : "Registrar salida"}
          </button>
        </div>
      ))}
    </>
  );
}
