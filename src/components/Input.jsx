import "./Form.css";

export function Input({ label, error, hint, id, ...props }) {
  return (
    <div className="field">
      {label && (
        <label className="field__label" htmlFor={id}>
          {label}
        </label>
      )}
      <input
        className={`field__input${error ? " field__input--error" : ""}`}
        id={id}
        {...props}
      />
      {error && <span className="field__error">{error}</span>}
      {hint && !error && <span className="field__hint">{hint}</span>}
    </div>
  );
}
