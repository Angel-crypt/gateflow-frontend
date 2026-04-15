import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  DoorOpen, Ticket, Activity, Users,
  QrCode, PenLine,
  MapPin, TrendingUp, RefreshCw, Table2, Download,
} from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import { getDashboard, getAccessLogMetrics, getPassMetrics, getAccessTable, exportAccessTableCSV, exportAccessTablePDF, getHealthCheck } from "../../api/metrics.api";
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

function AccessSummaryCard({ total, qr, manual, peakDay, topDestination }) {
  const manualShare = pct(manual, total);
  const qrShare = pct(qr, total);

  const items = [
    { label: "Total", value: total ?? 0, hint: "accesos en el periodo" },
    { label: "QR", value: qr ?? 0, hint: `${qrShare}% del total` },
    { label: "Manual", value: manual ?? 0, hint: `${manualShare}% del total` },
    { label: "Pico", value: peakDay?.count ?? 0, hint: peakDay ? fmtDate(peakDay.date) : "sin registros" },
  ];

  return (
    <div className="access-summary">
      <div className="analytics__sub-label">Resumen del periodo</div>

      <div className="access-summary__grid">
        {items.map((item) => (
          <div key={item.label} className="access-summary__item">
            <span className="access-summary__metric">{item.value}</span>
            <span className="access-summary__label">{item.label}</span>
            <span className="access-summary__hint">{item.hint}</span>
          </div>
        ))}
      </div>

      <div className="access-summary__footer">
        <span className="access-summary__eyebrow">Destino principal</span>
        <strong className="access-summary__destination">
          {topDestination?.destination ?? "Sin registros"}
        </strong>
        <span className="access-summary__destination-meta">
          {topDestination ? `${topDestination.count} accesos` : "No hay movimiento en este periodo"}
        </span>
      </div>
    </div>
  );
}

function AccessDestinationList({ items = [], total = 0 }) {
  return (
    <div className="destination-ranking">
      {items.slice(0, 4).map((item, index) => {
        const share = pct(item.count, total);
        const isLeader = index === 0;

        return (
          <div
            key={item.destination}
            className={`destination-ranking__item${isLeader ? " destination-ranking__item--leader" : ""}`}
          >
            <div className="destination-ranking__top">
              <div className="destination-ranking__title-group">
                <span className="destination-ranking__place">
                  {isLeader ? "Top" : `#${index + 1}`}
                </span>
                <strong className="destination-ranking__title">{item.destination}</strong>
              </div>

              <div className="destination-ranking__meta">
                <strong className="destination-ranking__count">{item.count}</strong>
                <span className="destination-ranking__share">{share}%</span>
              </div>
            </div>

            <div className="destination-ranking__bar">
              <div
                className="destination-ranking__fill"
                style={{ width: `${share}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * DonutChart — SVG puro sin librerías.
 * Muestra dos segmentos (QR y Manual) con total en el centro y leyenda lateral.
 */
function DonutChart({ qr = 0, manual = 0 }) {
  const total = qr + manual;
  const r = 36;
  const cx = 48;
  const cy = 48;
  const circ = 2 * Math.PI * r;

  const qrPct   = total ? qr   / total : 0.5;
  const manPct  = total ? manual / total : 0.5;
  const qrDash  = qrPct  * circ;
  const manDash = manPct * circ;

  // QR empieza desde las 12 (offset = -circ/4)
  const qrOffset  = -circ / 4;
  const manOffset = qrOffset + qrDash;

  const segments = [
    { key: "qr",     dash: qrDash,  offset: qrOffset,  color: "var(--color-primary)", label: "QR",     count: qr },
    { key: "manual", dash: manDash, offset: manOffset, color: "var(--color-warning)", label: "Manual", count: manual },
  ];

  const [hovered, setHovered] = useState(null);
  const [tooltip, setTooltip] = useState(null); // { x, y, label, count }
  const [animated, setAnimated] = useState(false);
  const svgRef = useRef(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleSegmentEnter = (e, s) => {
    setHovered(s.key);
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 12,
        label: s.label,
        count: s.count,
      });
    }
  };

  const handleSegmentLeave = () => {
    setHovered(null);
    setTooltip(null);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      {/* SVG donut */}
      <div style={{ position: "relative", flexShrink: 0 }}>
      <svg ref={svgRef} width="96" height="96" viewBox="0 0 96 96">
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-border)" strokeWidth="14" />
        {segments.map((s) => (
          <circle
            key={s.key}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="14"
            strokeDasharray={`${animated ? s.dash : 0} ${circ}`}
            strokeDashoffset={-s.offset}
            strokeLinecap="butt"
            style={{
              opacity: hovered && hovered !== s.key ? 0.25 : 1,
              transition: "stroke-dasharray 0.6s ease, opacity 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => handleSegmentEnter(e, s)}
            onMouseLeave={handleSegmentLeave}
          />
        ))}
        {/* Total en el centro */}
        <text
          x={cx} y={cy - 6}
          textAnchor="middle"
          fontSize="15"
          fontWeight="600"
          fill="var(--color-text)"
        >
          {total}
        </text>
        <text
          x={cx} y={cy + 9}
          textAnchor="middle"
          fontSize="9"
          fill="var(--color-text-muted)"
        >
          total
        </text>
      </svg>
      {tooltip && (
        <div style={{
          position: "absolute",
          top: tooltip.y,
          left: tooltip.x,
          transform: "translate(-50%, -100%)",
          background: "var(--color-surface)",
          border: "0.5px solid var(--color-border)",
          borderRadius: "6px",
          padding: "4px 8px",
          fontSize: "11px",
          color: "var(--color-text)",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
        }}>
          {tooltip.label} — {tooltip.count}
        </div>
      )}
      </div>

      {/* Leyenda */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {segments.map((s) => {
          const pctVal = total ? Math.round((s.count / total) * 100) : 0;
          const active = hovered === s.key;
          return (
            <div
              key={s.key}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                opacity: hovered && !active ? 0.35 : 1,
                transition: "opacity 0.2s",
                cursor: "default",
              }}
              onMouseEnter={() => setHovered(s.key)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: s.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "12px", fontWeight: active ? 600 : 400, color: "var(--color-text)", lineHeight: 1.2 }}>
                  {s.label} — {s.count}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                  {pctVal}%
                </div>
              </div>
            </div>
          );
        })}
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
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const avg = Math.round(total / data.length);
  const peakDay = data.reduce(
    (peak, day) => (!peak || day.count > peak.count ? day : peak),
    null
  );

  return (
    <div className="trend-chart">
      <div className="trend-chart__summary">
        <div className="trend-chart__stat">
          <span className="trend-chart__stat-label">Promedio</span>
          <strong className="trend-chart__stat-value">{avg}</strong>
          <span className="trend-chart__stat-note">por bloque</span>
        </div>

        <div className="trend-chart__stat trend-chart__stat--highlight">
          <span className="trend-chart__stat-label">Pico</span>
          <strong className="trend-chart__stat-value">{peakDay?.count ?? 0}</strong>
          <span className="trend-chart__stat-note">
            {peakDay ? fmtDate(peakDay.date) : "sin registros"}
          </span>
        </div>
      </div>

      <div className="bar-chart">
        {data.map((d) => {
          const ratio = d.count / max;
          const isPeak = peakDay?.date === d.date;
          return (
            <div
              key={d.date}
              className={`bar-chart__col${isPeak ? " bar-chart__col--peak" : ""}`}
            >
              <span className="bar-chart__count">{d.count}</span>
              <div className="bar-chart__track">
                <div
                  className="bar-chart__bar"
                  style={{
                    height: `${Math.max(ratio * 124, d.count > 0 ? 10 : 4)}px`,
                  }}
                  title={`${fmtDate(d.date)}: ${d.count}`}
                />
              </div>
              <span className="bar-chart__label">{fmtDate(d.date)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RefinedDonutChart({ qr = 0, manual = 0 }) {
  const total = qr + manual;
  const r = 36;
  const cx = 48;
  const cy = 48;
  const circ = 2 * Math.PI * r;

  const qrPct = total ? qr / total : 0.5;
  const manualPct = total ? manual / total : 0.5;
  const qrDash = qrPct * circ;
  const manualDash = manualPct * circ;

  const segments = [
    { key: "qr", dash: qrDash, offset: -circ / 4, color: "var(--color-primary)", label: "QR", count: qr },
    { key: "manual", dash: manualDash, offset: -circ / 4 + qrDash, color: "var(--color-warning)", label: "Manual", count: manual },
  ];

  const [hovered, setHovered] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [animated, setAnimated] = useState(false);
  const svgRef = useRef(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleSegmentEnter = (e, segment) => {
    setHovered(segment.key);
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top - 14,
      label: segment.label,
      count: segment.count,
    });
  };

  const handleSegmentLeave = () => {
    setHovered(null);
    setTooltip(null);
  };

  return (
    <div className="donut-chart">
      <div className="donut-chart__visual">
        <div className="donut-chart__ring-wrap">
          <svg ref={svgRef} width="112" height="112" viewBox="0 0 96 96" className="donut-chart__svg">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-border)" strokeWidth="14" />
            {segments.map((segment) => (
              <circle
                key={segment.key}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={segment.color}
                strokeWidth="14"
                strokeDasharray={`${animated ? segment.dash : 0} ${circ}`}
                strokeDashoffset={-segment.offset}
                strokeLinecap="butt"
                className="donut-chart__segment"
                style={{ opacity: hovered && hovered !== segment.key ? 0.25 : 1, cursor: "pointer" }}
                onMouseEnter={(e) => handleSegmentEnter(e, segment)}
                onMouseLeave={handleSegmentLeave}
              />
            ))}
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--color-text)">
              {total}
            </text>
            <text x={cx} y={cy + 9} textAnchor="middle" fontSize="9" fill="var(--color-text-muted)">
              total
            </text>
          </svg>

          {tooltip && (
            <div className="donut-chart__tooltip" style={{ top: tooltip.y, left: tooltip.x }}>
              {tooltip.label} · {tooltip.count}
            </div>
          )}
        </div>
      </div>

      <div className="donut-chart__legend">
        {segments.map((segment) => {
          const pctVal = total ? Math.round((segment.count / total) * 100) : 0;
          const active = hovered === segment.key;

          return (
            <div
              key={segment.key}
              className={`donut-chart__legend-item${active ? " donut-chart__legend-item--active" : ""}`}
              style={{ opacity: hovered && !active ? 0.35 : 1 }}
              onMouseEnter={() => setHovered(segment.key)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="donut-chart__legend-main">
                <span className="donut-chart__swatch" style={{ background: segment.color }} />
                <div className="donut-chart__legend-copy">
                  <div className="donut-chart__legend-label">{segment.label}</div>
                  <div className="donut-chart__legend-percent">{pctVal}% del total</div>
                </div>
              </div>

              <div className="donut-chart__legend-value">{segment.count}</div>
            </div>
          );
        })}
      </div>
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

  // Access table state
  const [tableFilters, setTableFilters] = useState({ access_type: "", status: "", destination: "", date_from: "", date_to: "" });
  const [tablePage, setTablePage] = useState(1);
  const [tableOrdering, setTableOrdering] = useState("-entry_time");

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

  const { data: health } = useQuery({
    queryKey: ["health"],
    queryFn: () => getHealthCheck().then((r) => r.data).catch(() => null),
    refetchInterval: 30000,
    retry: false,
  });

  const topAccessDestination = logs?.by_destination?.[0] ?? null;
  const peakAccessDay = logs?.by_day?.reduce(
    (peak, day) => (!peak || day.count > peak.count ? day : peak),
    null
  );

  const activeTableFilters = Object.fromEntries(
    Object.entries({ ...tableFilters, page: tablePage, ordering: tableOrdering }).filter(([, v]) => v !== "")
  );
  const { data: accessTable, isLoading: loadingTable } = useQuery({
    queryKey: ["metrics-access-table", activeTableFilters],
    queryFn: () => getAccessTable(activeTableFilters).then((r) => r.data),
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
          <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: health ? "var(--color-success)" : "#dc2626" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: health ? "var(--color-success)" : "#dc2626", display: "inline-block" }} />
            {health ? "Backend activo" : "Sin conexión"}
          </span>
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
                <div className="access-analytics">

                  <div className="access-analytics__main">
                    <div className="analytics__sub-label">
                      Evolución — {logs?.total ?? 0} total
                    </div>
                    <BarChart data={logs?.by_day} />
                  </div>

                  <div className="access-analytics__aside">
                    <div className="access-analytics__top-row">
                      <div className="access-analytics__panel">
                        <div className="analytics__sub-label">Por tipo</div>
                        <RefinedDonutChart qr={logs?.by_type?.qr ?? 0} manual={logs?.by_type?.manual ?? 0} />
                        {logs?.by_type?.manual > 0 && logs?.total > 0 && (
                          <div className="access-analytics__caption">
                            1 de cada {Math.round(logs.total / logs.by_type.manual)} accesos es manual
                          </div>
                        )}
                      </div>

                      <AccessSummaryCard
                        total={logs?.total ?? 0}
                        qr={logs?.by_type?.qr ?? 0}
                        manual={logs?.by_type?.manual ?? 0}
                        peakDay={peakAccessDay}
                        topDestination={topAccessDestination}
                      />
                    </div>

                    {logs?.by_destination?.length > 0 && (
                      <div className="access-analytics__panel">
                        <div className="analytics__sub-label">Por destino</div>
                        <AccessDestinationList items={logs.by_destination} total={logs.total} />
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

      {/* ── Tabla combinada de accesos ── */}
      <section className="dash__section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <SectionHeader icon={Table2}>Registro de accesos</SectionHeader>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={async () => {
                const res = await exportAccessTableCSV(activeTableFilters);
                const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `accesos_${new Date().toISOString().split("T")[0]}.csv`;
                link.click();
                URL.revokeObjectURL(link.href);
              }}
              style={{ padding: "6px 10px", background: "var(--color-surface)", border: "0.5px solid var(--color-border)", borderRadius: "6px", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
            >
              <Download size={13} />
              CSV
            </button>
            {user?.role === "admin" && (
              <button
                onClick={async () => {
                  const res = await exportAccessTablePDF(activeTableFilters);
                  const blob = new Blob([res.data], { type: "application/pdf" });
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(blob);
                  link.download = `accesos_${new Date().toISOString().split("T")[0]}.pdf`;
                  link.click();
                  URL.revokeObjectURL(link.href);
                }}
                style={{ padding: "6px 10px", background: "var(--color-surface)", border: "0.5px solid var(--color-border)", borderRadius: "6px", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Download size={13} />
                PDF
              </button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
          <select
            value={tableFilters.access_type}
            onChange={(e) => { setTableFilters((f) => ({ ...f, access_type: e.target.value })); setTablePage(1); }}
            style={{ padding: "6px 10px", fontSize: "12px", border: "0.5px solid var(--color-border)", borderRadius: "6px", background: "var(--color-surface)", color: "var(--color-text)" }}
          >
            <option value="">Todos los tipos</option>
            <option value="qr">QR</option>
            <option value="manual">Manual</option>
          </select>

          <select
            value={tableFilters.status}
            onChange={(e) => { setTableFilters((f) => ({ ...f, status: e.target.value })); setTablePage(1); }}
            style={{ padding: "6px 10px", fontSize: "12px", border: "0.5px solid var(--color-border)", borderRadius: "6px", background: "var(--color-surface)", color: "var(--color-text)" }}
          >
            <option value="">Todos los estados</option>
            <option value="open">Activo</option>
            <option value="closed">Cerrado</option>
          </select>

          <input
            type="text"
            placeholder="Destino"
            value={tableFilters.destination}
            onChange={(e) => { setTableFilters((f) => ({ ...f, destination: e.target.value })); setTablePage(1); }}
            style={{ padding: "6px 10px", fontSize: "12px", border: "0.5px solid var(--color-border)", borderRadius: "6px", background: "var(--color-surface)", color: "var(--color-text)", width: "140px" }}
          />

          <input
            type="date"
            value={tableFilters.date_from}
            onChange={(e) => { setTableFilters((f) => ({ ...f, date_from: e.target.value })); setTablePage(1); }}
            style={{ padding: "6px 10px", fontSize: "12px", border: "0.5px solid var(--color-border)", borderRadius: "6px", background: "var(--color-surface)", color: "var(--color-text)" }}
          />

          <input
            type="date"
            value={tableFilters.date_to}
            onChange={(e) => { setTableFilters((f) => ({ ...f, date_to: e.target.value })); setTablePage(1); }}
            style={{ padding: "6px 10px", fontSize: "12px", border: "0.5px solid var(--color-border)", borderRadius: "6px", background: "var(--color-surface)", color: "var(--color-text)" }}
          />

          {Object.values(tableFilters).some((v) => v !== "") && (
            <button
              onClick={() => { setTableFilters({ access_type: "", status: "", destination: "", date_from: "", date_to: "" }); setTablePage(1); }}
              style={{ padding: "6px 10px", fontSize: "12px", border: "0.5px solid var(--color-border)", borderRadius: "6px", background: "var(--color-surface)", color: "var(--color-text-muted)", cursor: "pointer" }}
            >
              Limpiar
            </button>
          )}
        </div>

        <div style={{ overflowX: "auto" }}>
          {loadingTable ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "32px" }}><Spinner /></div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  {[
                    { label: "ID",        key: "id" },
                    { label: "Visitante", key: "visitor_name" },
                    { label: "Placa",     key: "plate" },
                    { label: "Destino",   key: "destination" },
                    { label: "Tipo",      key: "access_type" },
                    { label: "ID Pase",   key: "pass_id" },
                    { label: "Tipo pase", key: "pass_type" },
                    { label: "Guardia",   key: "guard" },
                    { label: "Entrada",   key: "entry_time" },
                    { label: "Salida",    key: "exit_time" },
                    { label: "Estado",    key: "status" },
                  ].map(({ label, key }) => {
                    const isActive = tableOrdering === key || tableOrdering === `-${key}`;
                    const isDesc = tableOrdering === `-${key}`;
                    return (
                      <th
                        key={key}
                        onClick={() => {
                          setTableOrdering(isActive && !isDesc ? `-${key}` : key);
                          setTablePage(1);
                        }}
                        style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: isActive ? "var(--color-text)" : "var(--color-text-muted)", whiteSpace: "nowrap", cursor: "pointer", userSelect: "none" }}
                      >
                        {label}{isActive ? (isDesc ? " ↓" : " ↑") : ""}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {accessTable?.results?.length ? (
                  accessTable.results.map((row) => (
                    <tr key={row.id} style={{ borderBottom: "0.5px solid var(--color-border)" }}>
                      <td style={{ padding: "8px 10px", color: "var(--color-text-muted)" }}>{row.id}</td>
                      <td style={{ padding: "8px 10px", fontWeight: 500 }}>{row.visitor_name}</td>
                      <td style={{ padding: "8px 10px", fontFamily: "monospace" }}>{row.plate}</td>
                      <td style={{ padding: "8px 10px" }}>{row.destination || "—"}</td>
                      <td style={{ padding: "8px 10px" }}>
                        <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "999px", background: row.access_type === "qr" ? "#e0f2fe" : "#fef3c7", color: row.access_type === "qr" ? "#0369a1" : "#b45309" }}>
                          {row.access_type === "qr" ? "QR" : "Manual"}
                        </span>
                      </td>
                      <td style={{ padding: "8px 10px", color: "var(--color-text-muted)" }}>{row.pass_id || "—"}</td>
                      <td style={{ padding: "8px 10px" }}>{row.pass_type}</td>
                      <td style={{ padding: "8px 10px", color: "var(--color-text-muted)" }}>{row.guard}</td>
                      <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{row.entry_time ? new Date(row.entry_time).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" }) : "—"}</td>
                      <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{row.exit_time ? new Date(row.exit_time).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" }) : "—"}</td>
                      <td style={{ padding: "8px 10px" }}>
                        <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "999px", background: row.status === "open" ? "#dcfce7" : "#f1f5f9", color: row.status === "open" ? "#16a34a" : "#64748b" }}>
                          {row.status === "open" ? "Activo" : "Cerrado"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)" }}>
                      No hay registros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {(accessTable?.next || accessTable?.previous) && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", fontSize: "12px", color: "var(--color-text-muted)" }}>
            <button
              onClick={() => setTablePage((p) => p - 1)}
              disabled={!accessTable?.previous}
              style={{ padding: "5px 12px", fontSize: "12px", border: "0.5px solid var(--color-border)", borderRadius: "6px", background: "var(--color-surface)", color: "var(--color-text)", cursor: accessTable?.previous ? "pointer" : "default", opacity: accessTable?.previous ? 1 : 0.4 }}
            >
              ← Anterior
            </button>
            <span>Página {tablePage} · {accessTable?.count ?? 0} registros</span>
            <button
              onClick={() => setTablePage((p) => p + 1)}
              disabled={!accessTable?.next}
              style={{ padding: "5px 12px", fontSize: "12px", border: "0.5px solid var(--color-border)", borderRadius: "6px", background: "var(--color-surface)", color: "var(--color-text)", cursor: accessTable?.next ? "pointer" : "default", opacity: accessTable?.next ? 1 : 0.4 }}
            >
              Siguiente →
            </button>
          </div>
        )}
      </section>

    </div>
  );
}
