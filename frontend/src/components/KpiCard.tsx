export type KpiTone = "teal" | "navy" | "gold" | "red";

/** Tarjeta de resumen con borde lateral de color (fila superior del dashboard). */
export function KpiCard({ label, value, tone }: { label: string; value: number; tone: KpiTone }) {
  return (
    <div className={`kpi kpi-${tone}`}>
      <span className="kpi-label">{label}</span>
      <strong className="kpi-value">{value}</strong>
    </div>
  );
}
