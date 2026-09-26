import type { ReactNode } from "react";

/** Estado vacío o "módulo en construcción" con acción opcional. */
export function EmptyState({ titulo, detalle, accion }: { titulo: string; detalle?: string; accion?: ReactNode }) {
  return (
    <div className="empty">
      <strong>{titulo}</strong>
      {detalle && <p className="muted">{detalle}</p>}
      {accion}
    </div>
  );
}
