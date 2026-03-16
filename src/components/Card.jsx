/**
 * Card — contenedor base de superficie.
 *
 * Props:
 *   padding  "padded" | "compact" | "none"  (default: "padded")
 *   flat     boolean — sin sombra
 *   hoverable boolean — eleva al pasar el cursor
 */
export function Card({ children, padding = "padded", flat = false, hoverable = false, className = "", ...props }) {
  const classes = [
    "card",
    padding !== "none" ? `card--${padding}` : "",
    flat ? "card--flat" : "",
    hoverable ? "card--hover" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
