import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  DoorOpen, Ticket, Activity, Users,
  QrCode, PenLine,
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

function fmtTime(date) {
  return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

// ── Sub-components ────────────────────────────────────────────

/**
 * KpiCard — tarjeta de métrica principal.
 * La prop `hero` activa un tratamiento visual de mayor peso
 * para la métrica más crítica (personas dentro del parque).
 * El live-dot se mueve al badge — no al valor numérico —
 * para no confundir el número con texto truncado.
 */
function KpiCard({ label, value, icon: Icon, accent, accentLight, badge, live, loading, onClick, hero }) {
  return (
    <div
      className={[
        "kpi",
        hero    ? "kpi--hero"      : "",
        live    ? "kpi--live"      : "",
        loading ? "kpi--loading"   : "",
        onClick ? "kpi--clickable" : "",
      ].filter(Boolean).join(" ")}
      style={{ "--kpi-accent": accent, "--kpi-accent-light": accentLight }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      <div className="kpi__top">
        <div className="kpi__icon">
          <Icon size={18} strokeWidth={2} />
        </div>
        {badge && (
          <span className="kpi__badge">
            {/* Punto de "en vivo" dentro del badge, no flotando junto al número */}
            {live && <span className="live-dot" aria-hidden="true" />}
            {badge}
          </span>
        )}
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

/**
 * BarChart — altura aumentada a 140px con etiquetas de valor
 * sobre cada barra para compensar el tamaño reducido.
 * Font-size de etiquetas subido de 10px → 11px (mínimo legible).
 */
function BarChart({ data }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="bar-chart">
      {data.map((d) => (
        <div key={d.date} className="bar-chart__col">
          {/* Valor sobre la barra — accesible también en mobile */}
          <span className="bar-chart__count">{d.count > 0 ? d.count : ""}</span>
          <div
            className="bar-chart__bar"
            style={{ height: `${Math.max((d.count / max) * 110, d.count > 0 ? 8 : 3)}px` }}
            title={`${fmtDate(d.date)}: ${d.count}`}
          />
          <span className="bar-chart__label">{fmtDate(d.date)}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * SectionHeader — encabezado de sección con línea visual clara.
 * Reemplaza los SectionTitle con estilos inline dispersos.
 */
function SectionHeader({ icon: Icon, children }) {
  return (
    <div className="section-header">
      <Icon size={14} />
      <span>{children}</span>
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────
const PERIODS = [
  { key: "today", label: "Hoy" },
  { key: "week",  label: "Semana" },
  { key: "month", label: "Mes" },
];

const ANALYTICS_TABS = [
  { key: "accesos", label: "Accesos", icon: Activity },
  { key: "pases",   label: "Pases",   icon: Ticket },
];

// ── Page ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState("week");

  // Tab unificado para la sección de analytics — reduce la doble caja
  const [analyticsTab, setAnalyticsTab] = useState("accesos");

  // Timestamp visible del último refresh — da confianza en el dato "en vivo"
  const [lastRefresh, setLastRefresh] = useState(() => new Date());

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

  const handleRefresh = () => {
    refetchDash();
    setLastRefresh(new Date());
  };

  return (
    <div className="dash">

      {/* ── Header ── */}
      <div className="dash__header">
        <div>
          <div className="dash__title">Dashboard</div>
          <div className="dash__subtitle">{user.park?.name ?? "GateFlow"} — resumen general</div>
        </div>
        {/* Acciones del header con clase CSS en lugar de estilos inline */}
        <div className="dash__header-actions">
          <span className="dash__refresh-time">
            Actualizado {fmtTime(lastRefresh)}
          </span>
          <button className="dash__refresh-btn" onClick={handleRefresh}>
            <RefreshCw size={14} />
            Actualizar
          </button>
        </div>
      </div>

      {/* ── Live KPIs ── */}
      <section className="dash__section">
        <SectionHeader icon={Activity}>Estado en vivo</SectionHeader>
        <div className="dash__grid-4">
          {/*
           * Primera card con prop `hero` — métrica más crítica del panel.
           * Mayor tamaño de valor (2.375rem vs 2rem), fondo con tinte sutil.
           * Las otras 3 cards conservan el estilo estándar.
           */}
          <KpiCard
            label="Dentro del parque ahora"
            value={dash?.access_logs?.open_now}
            icon={DoorOpen}
            accent="var(--color-success)"
            accentLight="var(--color-success-light)"
            badge="En vivo"
            live
            hero
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
            accent="var(--color-info)"
            accentLight="var(--color-info-light)"
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
      </section>

      {/* ── Detail breakdown ── */}
      <section className="dash__section">
        <SectionHeader icon={TrendingUp}>Desglose general</SectionHeader>
        <div className="dash__grid-3">

          <div className="detail-card">
            <div className="detail-card__title"><Users size={13} />Usuarios</div>
            <div className="detail-card__rows">
              <StatRow label="Guardias"   value={dash?.users?.guards}  total={dash?.users?.total} color="var(--color-primary)" />
              <StatRow label="Inquilinos" value={dash?.users?.tenants} total={dash?.users?.total} color="var(--color-info)" />
            </div>
          </div>

          <div className="detail-card">
            <div className="detail-card__title"><MapPin size={13} />Destinos</div>
            <div className="detail-card__rows">
              <StatRow label="Activos"   value={dash?.destinations?.active}   total={dash?.destinations?.total} color="var(--color-success)" />
              <StatRow label="Inactivos" value={dash?.destinations?.inactive} total={dash?.destinations?.total} color="var(--color-danger)" />
            </div>
          </div>

          <div className="detail-card">
            <div className="detail-card__title"><Ticket size={13} />Pases</div>
            <div className="detail-card__rows">
              <StatRow label="Activos"   value={dash?.passes?.active}   total={dash?.passes?.total} color="var(--color-success)" />
              <StatRow label="Próximos"  value={dash?.passes?.upcoming} total={dash?.passes?.total} color="var(--color-info)" />
              <StatRow label="Expirados" value={dash?.passes?.expired}  total={dash?.passes?.total} color="var(--color-text-muted)" />
            </div>
          </div>
        </div>
      </section>

      {/*
       * ── Analytics unificado ──
       * Los dos bloques originales (accesos + pases) colapsados en un
       * solo card con tabs. Reduce la densidad vertical ~40% y hace
       * evidente que son categorías distintas de análisis.
       */}
      <section className="dash__section">
        <div className="analytics">

          <div className="analytics__header">
            {/* Tabs de navegación — reemplazan los dos headers separados */}
            <div className="analytics__tabs">
              {ANALYTICS_TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  className={`analytics__tab${analyticsTab === key ? " analytics__tab--active" : ""}`}
                  onClick={() => setAnalyticsTab(key)}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* Selector de período — solo visible en tab Accesos */}
            {analyticsTab === "accesos" && (
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
            )}
          </div>

          <div className="analytics__body">

            {/* ── Tab: Accesos ── */}
            {analyticsTab === "accesos" && (
              loadingLogs ? (
                <div className="analytics__loading"><Spinner size="md" /></div>
              ) : (
                <div className="dash__grid-2">

                  {/* Evolución diaria */}
                  <div>
                    <div className="analytics__sub-label">
                      Evolución — {logs?.total ?? 0} total
                    </div>
                    <BarChart data={logs?.by_day} />
                  </div>

                  {/* Por tipo + por destino */}
                  <div className="analytics__right-col">

                    {/* Por tipo — leyenda simplificada: solo dot + texto */}
                    <div>
                      <div className="analytics__sub-label">Por tipo</div>
                      <div className="type-split">
                        <div
                          className="type-split__qr"
                          style={{ width: `${pct(logs?.by_type?.qr, logs?.total)}%` }}
                        />
                      </div>
                      <div className="type-legend">
                        <div className="type-legend__item">
                          <div className="type-legend__dot" style={{ background: "var(--color-primary)" }} />
                          QR — {logs?.by_type?.qr ?? 0}
                        </div>
                        <div className="type-legend__item">
                          <div className="type-legend__dot" style={{ background: "var(--color-warning)" }} />
                          Manual — {logs?.by_type?.manual ?? 0}
                        </div>
                      </div>
                    </div>

                    {/* Por destino */}
                    {logs?.by_destination?.length > 0 && (
                      <div>
                        <div className="analytics__sub-label">Por destino</div>
                        <div className="analytics__rows">
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
              )
            )}

            {/* ── Tab: Pases ── */}
            {analyticsTab === "pases" && (
              loadingPasses ? (
                <div className="analytics__loading"><Spinner size="md" /></div>
              ) : (
                <div className="dash__grid-2">

                  {/* Por tipo de pase */}
                  <div>
                    <div className="analytics__sub-label">Por tipo de pase</div>
                    <div className="analytics__rows">
                      <StatRow label="Pase de día" value={passes?.by_type?.day}    total={passes?.total} color="var(--color-primary)" />
                      <StatRow label="Uso único"   value={passes?.by_type?.single} total={passes?.total} color="var(--color-info)" />
                    </div>
                  </div>

                  {/* Por destino */}
                  {passes?.by_destination?.length > 0 && (
                    <div>
                      <div className="analytics__sub-label">Por destino</div>
                      <div className="analytics__rows">
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
              )
            )}

          </div>
        </div>
      </section>

    </div>
  );
}
