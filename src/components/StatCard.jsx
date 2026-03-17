import "./Card.css";

/**
 * StatCard — tarjeta de métrica para dashboards.
 *
 * Props:
 *   label    string — descripción de la métrica
 *   value    string | number
 *   icon     ReactNode — ícono o emoji
 *   variant  "primary" | "success" | "danger" | "warning"
 */
export function StatCard({ label, value, icon, variant = "primary" }) {
  return (
    <div className="stat-card">
      {icon && (
        <div className={`stat-card__icon stat-card__icon--${variant}`}>
          {icon}
        </div>
      )}
      <div>
        <p className="stat-card__value">{value}</p>
        <p className="stat-card__label">{label}</p>
      </div>
    </div>
  );
}
