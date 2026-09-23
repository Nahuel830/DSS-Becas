import { UMBRAL_RECOMENDADO, UMBRAL_REVISION_MIN } from "../utils/dss";

/** Leyenda de comparación con umbral (evaluación-dss.png). */
export function UmbralLegend() {
  return (
    <ul className="legend">
      <li>
        <span className="legend-dot dot-teal" aria-hidden />
        Recomendado (&gt;= {UMBRAL_RECOMENDADO})
      </li>
      <li>
        <span className="legend-dot dot-gold" aria-hidden />
        En revisión ({UMBRAL_REVISION_MIN}-79)
      </li>
      <li>
        <span className="legend-dot dot-red" aria-hidden />
        En riesgo (&lt; 60)
      </li>
    </ul>
  );
}
