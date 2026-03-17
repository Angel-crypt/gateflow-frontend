import "./Table.css";
import { Spinner } from "./Spinner";

/**
 * Table — tabla de datos genérica.
 *
 * Props:
 *   columns        { key, header, render? }[]
 *   data           object[]
 *   loading        boolean
 *   emptyMessage   string
 *
 * Ejemplo de columns:
 *   [
 *     { key: "email",  header: "Email" },
 *     { key: "role",   header: "Rol", render: (row) => <Badge role={row.role} /> },
 *     { key: "active", header: "Estado", render: (row) => <Badge active={row.is_active} inactive={!row.is_active} /> },
 *   ]
 */
export function Table({ columns = [], data = [], loading = false, emptyMessage = "Sin resultados" }) {
  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="table-loading">
                  <Spinner size="md" />
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="table-empty">{emptyMessage}</div>
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={row.id ?? i}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
