/** Lista de alertas con marcador rojo (panel lateral del dashboard). */
export function AlertsPanel({ alertas }: { alertas: string[] }) {
  if (alertas.length === 0) return <p className="muted">Sin alertas.</p>;
  return (
    <ul className="alerts">
      {alertas.map((a) => (
        <li key={a}>
          <span className="alert-dot" aria-hidden />
          {a}
        </li>
      ))}
    </ul>
  );
}
