import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { CriterioBar } from "../components/CriterioBar";
import { EmptyState } from "../components/EmptyState";
import { EstadoBadge } from "../components/EstadoBadge";
import { PageHeader } from "../components/PageHeader";
import { Spinner } from "../components/Spinner";
import type { EstadoEstudiante } from "../models/domain";
import { ROUTES } from "../routing/routes";
import { fetchDashboard } from "../services/api/dashboard";
import { estudiantesApi } from "../services/api/estudiantes";
import { resultadosApi } from "../services/api/resultados";
import { db } from "../services/api/db";
import { MOCK_CRITERIOS } from "../services/api/mocks";
import { useToast } from "../state/ToastContext";
import { clasificarPuntaje, codigoEstudiante, getEvaluacion, nombreCompleto } from "../utils/dss";
import { formatFecha, formatMonedaBs, formatPuntaje } from "../utils/format";

const ESTADOS_VALIDOS: EstadoEstudiante[] = ["Recomendado", "En revisión", "En riesgo", "Pendiente"];

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt>{etiqueta}</dt>
      <dd>{valor}</dd>
    </div>
  );
}

const texto = (v: string | number | undefined): string =>
  v === undefined || v === null || v === "" ? "-" : String(v);

/** detalle-estudiante.png → /estudiantes/:idEstudiante. Ficha, acciones, evaluación e historial. */
export function DetalleEstudiantePage() {
  const { idEstudiante } = useParams();
  const id = Number(idEstudiante);
  const valido = Number.isInteger(id) && id > 0;
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [confirmandoBaja, setConfirmandoBaja] = useState(false);

  const dash = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard });
  const res = useQuery({
    queryKey: ["resultado", id],
    queryFn: () => resultadosApi.getByEstudianteConFallback(id),
    enabled: valido,
  });

  const eliminar = useMutation({
    mutationFn: () => estudiantesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.exito("Estudiante eliminado.");
      navigate(ROUTES.estudiantes);
    },
    onError: () => {
      toast.error("No se pudo eliminar al estudiante.");
      setConfirmandoBaja(false);
    },
  });

  const volver = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(ROUTES.estudiantes);
  };

  if (!valido) return <div className="page error">ID de estudiante inválido.</div>;
  if (dash.isPending || res.isPending || !dash.data || !res.data) {
    return (
      <div className="page">
        <PageHeader title="Detalle del estudiante" />
        <Spinner texto="Cargando ficha…" />
      </div>
    );
  }

  const estudiante = dash.data.estudiantes.find((e) => e.id_estudiante === id);
  if (!estudiante) {
    return (
      <div className="page">
        <PageHeader title="Detalle del estudiante" />
        <EmptyState
          titulo="Estudiante no encontrado"
          detalle="El estudiante no existe o fue eliminado."
          accion={<Link to={ROUTES.estudiantes}>Volver al listado</Link>}
        />
      </div>
    );
  }

  const evaluacion = getEvaluacion(dash.data.evaluaciones, id);
  const puntaje = evaluacion?.puntaje_final ?? null;
  const beca = db.getAll("becas").find((b) => b.id_estudiante === id);
  // Criterios mock solo en modo demostración (sin endpoint en openapi.yaml).
  const criterios = dash.data.live ? undefined : MOCK_CRITERIOS[id];
  const historial = db.eventosDe(id);

  const etiquetado = res.data.data?.resultado;
  const estado: EstadoEstudiante =
    etiquetado && (ESTADOS_VALIDOS as string[]).includes(etiquetado)
      ? (etiquetado as EstadoEstudiante)
      : puntaje !== null
        ? clasificarPuntaje(puntaje)
        : "Pendiente";

  return (
    <div className="page">
      <PageHeader title="Detalle del estudiante" />
      <div className="toolbar">
        <Button variant="secondary" type="button" onClick={volver}>
          ← Volver
        </Button>
        <Link className="btn btn-secondary" to={ROUTES.editarEstudiante(id)}>
          Editar
        </Link>
        <Link className="btn btn-primary" to={ROUTES.evaluacionPorId(id)}>
          Evaluar con DSS
        </Link>
        <button className="btn btn-secondary" type="button" onClick={() => setConfirmandoBaja(true)}>
          Eliminar
        </button>
      </div>

      <div className="cols-2">
        <Card title="Ficha del estudiante">
          <div className="profile">
            <Avatar nombre={estudiante.nombre} apellido={estudiante.apellido} />
            <strong className="profile-name">{nombreCompleto(estudiante)}</strong>
            <span className="muted">{codigoEstudiante(id)} / {estudiante.carrera ?? "-"}</span>
            <EstadoBadge estado={estado} />
          </div>
          <dl className="stats">
            <Dato etiqueta="Puntaje DSS" valor={formatPuntaje(puntaje)} />
            <Dato etiqueta="Asistencia" valor={criterios ? `${criterios.asistencia} %` : "-"} />
            <Dato etiqueta="Promedio" valor={estudiante.promedio !== undefined ? formatPuntaje(estudiante.promedio) : "-"} />
            <Dato
              etiqueta="Beca actual"
              valor={beca ? `${beca.tipo ?? beca.nombre_beca ?? "-"} (${formatMonedaBs(beca.monto)})` : "-"}
            />
          </dl>
        </Card>

        <div>
          <Card title="Evaluación DSS">
            {!evaluacion ? (
              <EmptyState
                titulo="Sin evaluación"
                detalle="Este estudiante aún no fue evaluado."
                accion={<Link to={ROUTES.evaluacionPorId(id)}>Evaluar ahora</Link>}
              />
            ) : (
              <>
                <CriterioBar label="Puntaje académico" value={evaluacion.puntaje_academico ?? 0} />
                <CriterioBar label="Puntaje social" value={evaluacion.puntaje_social ?? 0} />
                <CriterioBar label="Puntaje final" value={evaluacion.puntaje_final ?? 0} />
                <p>
                  <span className="muted">Fecha: {formatFecha(evaluacion.fecha)} · Recomendación: </span>
                  <EstadoBadge estado={estado} />
                </p>
              </>
            )}
          </Card>

          <Card title="Historial de seguimiento">
            {historial.length === 0 ? (
              <p className="muted">Sin historial registrado.</p>
            ) : (
              <ul className="timeline">
                {historial.map((h) => (
                  <li key={h.id_evento}>
                    {h.detalle}
                    <small className="muted">{formatFecha(h.fecha.slice(0, 10))}</small>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card title="Información personal">
        <dl className="detail-grid">
          <Dato etiqueta="CI" valor={texto(estudiante.ci)} />
          <Dato etiqueta="Fecha de nacimiento" valor={formatFecha(estudiante.fecha_nacimiento)} />
          <Dato etiqueta="Género" valor={texto(estudiante.genero)} />
          <Dato etiqueta="Teléfono" valor={texto(estudiante.telefono)} />
          <Dato etiqueta="Correo" valor={texto(estudiante.correo)} />
          <Dato etiqueta="Dirección" valor={texto(estudiante.direccion)} />
          <Dato etiqueta="Ciudad" valor={texto(estudiante.ciudad)} />
        </dl>
      </Card>

      <Card title="Información académica">
        <dl className="detail-grid">
          <Dato etiqueta="Código universitario" valor={texto(estudiante.codigo_universitario)} />
          <Dato etiqueta="Facultad" valor={texto(estudiante.facultad)} />
          <Dato etiqueta="Carrera" valor={texto(estudiante.carrera)} />
          <Dato etiqueta="Semestre" valor={texto(estudiante.semestre)} />
          <Dato etiqueta="Promedio" valor={estudiante.promedio !== undefined ? formatPuntaje(estudiante.promedio) : "-"} />
          <Dato etiqueta="Materias aprobadas" valor={texto(estudiante.materias_aprobadas)} />
          <Dato etiqueta="Materias reprobadas" valor={texto(estudiante.materias_reprobadas)} />
          <Dato etiqueta="Año de ingreso" valor={texto(estudiante.anio_ingreso)} />
        </dl>
      </Card>

      <Card title="Información socioeconómica">
        <dl className="detail-grid">
          <Dato etiqueta="Ingreso familiar" valor={estudiante.ingreso_familiar !== undefined ? formatMonedaBs(estudiante.ingreso_familiar) : "-"} />
          <Dato etiqueta="Integrantes del hogar" valor={texto(estudiante.integrantes_hogar)} />
          <Dato etiqueta="Dependientes" valor={texto(estudiante.dependientes)} />
          <Dato etiqueta="Tipo de vivienda" valor={texto(estudiante.tipo_vivienda)} />
          <Dato etiqueta="Procedencia" valor={texto(estudiante.procedencia)} />
          <Dato etiqueta="Discapacidad" valor={texto(estudiante.discapacidad)} />
          <Dato etiqueta="Situación laboral" valor={texto(estudiante.situacion_laboral)} />
        </dl>
      </Card>

      <Card title="Postulación y documentos">
        <dl className="detail-grid">
          <Dato etiqueta="Motivo" valor={texto(estudiante.motivo)} />
          <Dato
            etiqueta="Documentos"
            valor={(estudiante.documentos ?? []).length === 0 ? "-" : (estudiante.documentos ?? []).map((d) => d.nombre).join(", ")}
          />
        </dl>
      </Card>

      {confirmandoBaja && (
        <ConfirmDialog
          titulo="Eliminar estudiante"
          mensaje={`Se eliminará a ${nombreCompleto(estudiante)} y sus datos locales. Esta acción no se puede deshacer. ¿Continuar?`}
          textoConfirmar="Eliminar"
          onConfirmar={() => eliminar.mutate()}
          onCancelar={() => setConfirmandoBaja(false)}
        />
      )}
    </div>
  );
}