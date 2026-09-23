import { Link } from "react-router-dom";
import { ROUTES } from "../routing/routes";
import { formatPuntaje } from "../utils/format";

export interface EstudianteRow {
  id: number;
  codigo: string;
  nombre: string;
  carrera: string;
  estadoBeca: string;
  puntaje: number | null;
}

/** Tabla Código / Nombre / Carrera / Estado beca / Puntaje DSS / Acción (gestión). */
export function EstudiantesTable({ rows }: { rows: EstudianteRow[] }) {
  if (rows.length === 0) return <p className="muted">Sin estudiantes para mostrar.</p>;
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Carrera</th>
            <th>Estado beca</th>
            <th>Puntaje DSS</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.codigo}</td>
              <td>{r.nombre}</td>
              <td>{r.carrera}</td>
              <td>{r.estadoBeca}</td>
              <td>{r.puntaje === null ? "-" : formatPuntaje(r.puntaje)}</td>
              <td>
                <Link to={ROUTES.detalleEstudiante(r.id)}>Ver</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
