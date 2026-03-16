import { Spinner } from "./Spinner";

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  ...props
}) {
  return (
    <button
      className={`btn btn--${variant} btn--${size}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
