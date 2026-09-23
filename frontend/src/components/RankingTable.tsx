import type { EstadoEstudiante } from "../models/domain";
import { formatPuntaje } from "../utils/format";
import { EstadoBadge } from "./EstadoBadge";

export interface RankingRow {
  posicion: number;
  estudiante: string;
  puntaje: number;
  estado: EstadoEstudiante;
}

/** Tabla # / Estudiante / Puntaje DSS / Estado (dashboard; patrón para gestión). */
export function RankingTable({ rows }: { rows: RankingRow[] }) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Estudiante</th>
            <th>Puntaje DSS</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.posicion}>
              <td>{r.posicion}</td>
              <td>{r.estudiante}</td>
              <td>{formatPuntaje(r.puntaje)}</td>
              <td>
                <EstadoBadge estado={r.estado} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
