import type { ReactNode } from "react";

/** Modal genérico centrado (formularios de catálogos). */
export function Modal({ titulo, onCerrar, children }: { titulo: string; onCerrar: () => void; children: ReactNode }) {
  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div
        className="modal modal-wide"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{titulo}</h3>
        {children}
      </div>
    </div>
  );
}
