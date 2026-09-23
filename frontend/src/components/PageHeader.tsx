/** Encabezado de página (título a la izquierda, como en los mocks). */
export function PageHeader({ title }: { title: string }) {
  return (
    <div className="page-head">
      <h1>{title}</h1>
    </div>
  );
}
