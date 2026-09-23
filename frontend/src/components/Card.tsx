import type { ReactNode } from "react";

/** Panel genérico con título (base de Ranking, Alertas, Distribución y futuras pantallas). */
export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card">
      <h2 className="card-title">{title}</h2>
      {children}
    </section>
  );
}
