import type { ReactNode } from "react";

/** Bloque de formulario con título teal (Datos personales, académicos… del mock). */
export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="form-section">
      <h3 className="form-section-title">{title}</h3>
      <div className="form-grid">{children}</div>
    </div>
  );
}
