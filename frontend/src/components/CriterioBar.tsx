/** Barra horizontal de criterio 0–100 (Evaluación DSS en el detalle). */
export function CriterioBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="hbar-row">
      <span className="hbar-label">{label}</span>
      <div className="hbar-track">
        <div className="hbar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
