import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface BarraEstado {
  label: string;
  value: number;
  tone: "teal" | "gold" | "red";
}

const COLOR: Record<BarraEstado["tone"], string> = {
  teal: "#0e7c7b",
  gold: "#b08d1e",
  red: "#b03a2e",
};

/** Gráfico de barras de distribución por estado (recharts, misma API que el CSS anterior). */
export function EstadoChart({ items }: { items: BarraEstado[] }) {
  const datos = items.map((i) => ({ estado: i.label, cantidad: i.value, color: COLOR[i.tone] }));
  return (
    <div className="chart" role="img" aria-label="Distribución de estudiantes por estado">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={datos} margin={{ top: 16, right: 16, bottom: 0, left: -12 }}>
          <XAxis dataKey="estado" tick={{ fontSize: 12 }} interval={0} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => [value, "Estudiantes"]} />
          <Bar dataKey="cantidad" radius={[2, 2, 0, 0]}>
            {datos.map((d) => (
              <Cell key={d.estado} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
