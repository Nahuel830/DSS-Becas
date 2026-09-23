export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="page">
      <h1>{title}</h1>
      <p className="muted">* Módulo futuro: sin endpoint en openapi.yaml ni mock en prototypes/.</p>
    </div>
  );
}
