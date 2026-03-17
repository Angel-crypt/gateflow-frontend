import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  DoorOpen, Ticket, Activity, Users,
  Shield, Building2, QrCode, PenLine,
  MapPin, TrendingUp, RefreshCw,
} from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import { getDashboard, getAccessLogMetrics, getPassMetrics } from "../../api/metrics.api";
import { Spinner } from "../../components/Spinner";
import "./DashboardPage.css";

// ── Helpers ──────────────────────────────────────────────────
function pct(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("es-MX", { weekday: "short", day: "numeric" });
}

// ── Sub-components ────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, accent, accentLight, badge, live, loading, onClick }) {
  return (
    <div
      className={`kpi${live ? " kpi--live" : ""}${loading ? " kpi--loading" : ""}${onClick ? " kpi--clickable" : ""}`}
      style={{ "--kpi-accent": accent, "--kpi-accent-light": accentLight, cursor: onClick ? "pointer" : "default" }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      <div className="kpi__top">
        <div className="kpi__icon">
          <Icon size={18} strokeWidth={2} />
        </div>
        {badge && <span className="kpi__badge">{badge}</span>}
      </div>
      <div className="kpi__value">{loading ? "—" : (value ?? "—")}</div>
      <div className="kpi__label">{label}</div>
    </div>
  );
}

function StatRow({ label, value, total, color }) {
  const width = pct(value, total);
  return (
    <div className="stat-row">
      <div className="stat-row__top">
        <span className="stat-row__label">{label}</span>
        <span className="stat-row__value">{value ?? "—"}</span>
      </div>
      <div className="stat-row__bar">
        <div className="stat-row__fill" style={{ width: `${width}%`, "--bar-color": color }} />
      </div>
    </div>
  );
}

function BarChart({ data }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="bar-chart">
      {data.map((d) => (
        <div key={d.date} className="bar-chart__col">
          <div
            className="bar-chart__bar"
            style={{ height: `${(d.count / max) * 70}px` }}
            title={`${fmtDate(d.date)}: ${d.count}`}
          />
          <span className="bar-chart__label">{fmtDate(d.date)}</span>
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
      <Icon size={15} color="var(--color-text-muted)" />
      <span style={{ fontSize: "0.8125rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-muted)" }}>
        {children}
      </span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
const PERIODS = [
  { key: "today", label: "Hoy" },
  { key: "week",  label: "Semana" },
  { key: "month", label: "Mes" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState("week");

  const { data: dash, isLoading: loadingDash, refetch: refetchDash } = useQuery({
    queryKey: ["metrics-dashboard"],
    queryFn: () => getDashboard().then((r) => r.data),
  });

  const { data: logs, isLoading: loadingLogs } = useQuery({
    queryKey: ["metrics-access-logs", period],
    queryFn: () => getAccessLogMetrics(period).then((r) => r.data),
  });

  const { data: passes, isLoading: loadingPasses } = useQuery({
    queryKey: ["metrics-passes"],
    queryFn: () => getPassMetrics().then((r) => r.data),
  });

  const loading = loadingDash;

  return (
    <div className="dash">
      {/* ── Header ── */}
      <div className="dash__header">
        <div>
          <div className="dash__title">Dashboard</div>
          <div className="dash__subtitle">{user.park?.name ?? "GateFlow"} — resumen general</div>
        </div>
        <button
          onClick={() => refetchDash()}
          style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: "0.8125rem", padding: "var(--space-2)" }}
        >
          <RefreshCw size={14} />
          Actualizar
        </button>
      </div>

      {/* ── Live KPIs ── */}
      <div>
        <SectionTitle icon={Activity}>Estado en vivo</SectionTitle>
        <div className="dash__grid-4">
          <KpiCard
            label="Dentro del parque ahora"
            value={dash?.access_logs?.open_now}
            icon={DoorOpen}
            accent="var(--color-success)"
            accentLight="var(--color-success-light)"
            badge="En vivo"
            live
            loading={loading}
            onClick={() => navigate("/admin/accesos")}
          />
          <KpiCard
            label="Pases activos"
            value={dash?.passes?.active}
            icon={Ticket}
            accent="var(--color-primary)"
            accentLight="var(--color-primary-light)"
            loading={loading}
            onClick={() => navigate("/admin/pases")}
          />
          <KpiCard
            label="Accesos hoy"
            value={dash?.access_logs?.today}
            icon={Activity}
            accent="#0ea5e9"
            accentLight="#e0f2fe"
            loading={loading}
            onClick={() => navigate("/admin/accesos")}
          />
          <KpiCard
            label="Usuarios del parque"
            value={dash?.users?.total}
            icon={Users}
            accent="var(--color-warning)"
            accentLight="var(--color-warning-light)"
            loading={loading}
            onClick={() => navigate("/admin/usuarios")}
          />
        </div>
      </div>

      {/* ── Detail breakdown ── */}
      <div>
        <SectionTitle icon={TrendingUp}>Desglose general</SectionTitle>
        <div className="dash__grid-3">

          {/* Usuarios */}
          <div className="detail-card">
            <div className="detail-card__title">
              <Users size={13} />
              Usuarios
            </div>
            <div className="detail-card__rows">
              <StatRow
                label="Guardias"
                value={dash?.users?.guards}
                total={dash?.users?.total}
                color="var(--color-primary)"
              />
              <StatRow
                label="Inquilinos"
                value={dash?.users?.tenants}
                total={dash?.users?.total}
                color="#0ea5e9"
              />
            </div>
          </div>

          {/* Destinos */}
          <div className="detail-card">
            <div className="detail-card__title">
              <MapPin size={13} />
              Destinos
            </div>
            <div className="detail-card__rows">
              <StatRow
                label="Activos"
                value={dash?.destinations?.active}
                total={dash?.destinations?.total}
                color="var(--color-success)"
              />
              <StatRow
                label="Inactivos"
                value={dash?.destinations?.inactive}
                total={dash?.destinations?.total}
                color="var(--color-danger)"
              />
            </div>
          </div>

          {/* Pases */}
          <div className="detail-card">
            <div className="detail-card__title">
              <Ticket size={13} />
              Pases
            </div>
            <div className="detail-card__rows">
              <StatRow
                label="Activos"
                value={dash?.passes?.active}
                total={dash?.passes?.total}
                color="var(--color-success)"
              />
              <StatRow
                label="Próximos"
                value={dash?.passes?.upcoming}
                total={dash?.passes?.total}
                color="#0ea5e9"
              />
              <StatRow
                label="Expirados"
                value={dash?.passes?.expired}
                total={dash?.passes?.total}
                color="var(--color-text-muted)"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Access log analytics ── */}
      <div className="analytics">
        <div className="analytics__header">
          <span className="analytics__title">
            <Activity size={14} />
            Registros de acceso
          </span>
          <div className="period-pills">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                className={`period-pill${period === p.key ? " period-pill--active" : ""}`}
                onClick={() => setPeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="analytics__body">
          {loadingLogs ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
              <Spinner size="md" />
            </div>
          ) : (
            <div className="dash__grid-2">
              {/* Evolución diaria */}
              <div>
                <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "var(--space-3)", fontWeight: 500 }}>
                  Evolución — {logs?.total ?? 0} total
                </div>
                <BarChart data={logs?.by_day} />
              </div>

              {/* Por destino + por tipo */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {/* Por tipo */}
                <div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "var(--space-2)", fontWeight: 500 }}>
                    Por tipo
                  </div>
                  <div className="type-split">
                    <div
                      className="type-split__qr"
                      style={{ width: `${pct(logs?.by_type?.qr, logs?.total)}%` }}
                    />
                  </div>
                  <div className="type-legend">
                    <div className="type-legend__item">
                      <div className="type-legend__dot" style={{ background: "var(--color-primary)" }} />
                      <QrCode size={12} />
                      QR — {logs?.by_type?.qr ?? 0}
                    </div>
                    <div className="type-legend__item">
                      <div className="type-legend__dot" style={{ background: "var(--color-warning)" }} />
                      <PenLine size={12} />
                      Manual — {logs?.by_type?.manual ?? 0}
                    </div>
                  </div>
                </div>

                {/* Por destino */}
                {logs?.by_destination?.length > 0 && (
                  <div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "var(--space-2)", fontWeight: 500 }}>
                      Por destino
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                      {logs.by_destination.slice(0, 4).map((d) => (
                        <StatRow
                          key={d.destination}
                          label={d.destination}
                          value={d.count}
                          total={logs.total}
                          color="var(--color-primary)"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Passes analytics ── */}
      <div className="analytics">
        <div className="analytics__header">
          <span className="analytics__title">
            <Ticket size={14} />
            Analítica de pases
          </span>
        </div>
        <div className="analytics__body">
          {loadingPasses ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
              <Spinner size="md" />
            </div>
          ) : (
            <div className="dash__grid-2">
              {/* Por tipo de pase */}
              <div>
                <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "var(--space-3)", fontWeight: 500 }}>
                  Por tipo de pase
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                  <StatRow
                    label="Pase de día"
                    value={passes?.by_type?.day}
                    total={passes?.total}
                    color="var(--color-primary)"
                  />
                  <StatRow
                    label="Uso único"
                    value={passes?.by_type?.single}
                    total={passes?.total}
                    color="#0ea5e9"
                  />
                </div>
              </div>

              {/* Por destino */}
              {passes?.by_destination?.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "var(--space-3)", fontWeight: 500 }}>
                    Por destino
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                    {passes.by_destination.slice(0, 4).map((d) => (
                      <StatRow
                        key={d.destination}
                        label={d.destination}
                        value={d.count}
                        total={passes.total}
                        color="var(--color-success)"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
