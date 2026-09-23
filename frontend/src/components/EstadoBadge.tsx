import type { EstadoEstudiante } from "../models/domain";

const TONE: Record<EstadoEstudiante, string> = {
  Recomendado: "badge-teal",
  "En revisión": "badge-gold",
  "En riesgo": "badge-red",
  Pendiente: "badge-gray",
};

/** Etiqueta de estado DSS (tablas de dashboard, gestión y detalle). */
export function EstadoBadge({ estado }: { estado: EstadoEstudiante }) {
  return <span className={`badge ${TONE[estado]}`}>{estado}</span>;
}
