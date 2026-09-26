/** Indicador de carga (skeleton/spinner) para estados pending. */
export function Spinner({ texto = "Cargando…" }: { texto?: string }) {
  return (
    <p className="muted" role="status" aria-live="polite">
      <span className="spinner" aria-hidden /> {texto}
    </p>
  );
}
