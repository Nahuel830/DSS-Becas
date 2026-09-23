import type { ReactNode } from "react";

/** Campo de formulario con etiqueta y mensaje de error (nuevo-estudiante, evaluación). */
export function FormField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      {children}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
