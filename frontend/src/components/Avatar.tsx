/** Círculo con iniciales (ficha del detalle; sin foto real). */
export function Avatar({ nombre, apellido }: { nombre?: string; apellido?: string }) {
  const iniciales = `${nombre?.[0] ?? ""}${apellido?.[0] ?? ""}`.toUpperCase() || "?";
  return (
    <div className="avatar" aria-hidden>
      {iniciales}
    </div>
  );
}
