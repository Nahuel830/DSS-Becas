import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { Spinner } from "../components/Spinner";
import { becasApi } from "../services/api/becas";
import { useAsync } from "../state/useAsync";
import { formatMonedaBs } from "../utils/format";

/** Gestión de becas (sin mock en prototypes/). Lista MOCK_BECAS; asignar usa POST /becas. */
export function BecasPage() {
  const { data, loading, error, recargar } = useAsync(becasApi.list);

  return (
    <div className="page">
      <PageHeader title="Gestión de becas" />
      <Card title={`Becas asignadas (${data?.length ?? 0})`}>
        {loading && <Spinner texto="Cargando becas…" />}
        {error && (
          <EmptyState
            titulo="No se pudieron cargar las becas"
            detalle={error}
            accion={
              <Button type="button" onClick={recargar}>
                Reintentar
              </Button>
            }
          />
        )}
        {!loading && !error && (!data || data.length === 0) && (
          <EmptyState titulo="Sin becas asignadas" detalle="Aún no hay becas registradas." />
        )}
        {!loading && !error && data && data.length > 0 && (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Beca</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.map((b) => (
                  <tr key={b.id_beca}>
                    <td>{b.nombre_beca ?? "-"}</td>
                    <td>{b.tipo ?? "-"}</td>
                    <td>{formatMonedaBs(b.monto)}</td>
                    <td>{b.estado ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
