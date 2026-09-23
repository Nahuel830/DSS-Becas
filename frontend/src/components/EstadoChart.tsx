export interface BarraEstado {
  label: string;
  value: number;
  tone: "teal" | "gold" | "red";
}

/**
 * Gráfico de barras CSS (distribución por estado).
 * Sin dependencia de gráficos: suficiente para 3 barras; evaluar Recharts si crecen.
 */
export function EstadoChart({ items }: { items: BarraEstado[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="bars" role="img" aria-label="Distribución de estudiantes por estado">
      {items.map((i) => (
        <div className="bar" key={i.label}>
          <span className="bar-value">{i.value}</span>
          <div className="bar-track">
            <div className={`bar-fill bar-${i.tone}`} style={{ height: `${(i.value / max) * 100}%` }} />
          </div>
          <span className="bar-label">{i.label}</span>
        </div>
      ))}
    </div>
  );
}
