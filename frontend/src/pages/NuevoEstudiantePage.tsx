import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { FormField } from "../components/FormField";
import { FormSection } from "../components/FormSection";
import { PageHeader } from "../components/PageHeader";
import { Spinner } from "../components/Spinner";
import { TIPO_BECA, type DocumentoAdjunto, type EstudianteExtendido } from "../models/domain";
import { ROUTES } from "../routing/routes";
import { ApiError } from "../services/api/client";
import { catalogosApi } from "../services/api/catalogos";
import { documentosApi } from "../services/api/documentos";
import { fetchDashboard } from "../services/api/dashboard";
import { estudiantesApi } from "../services/api/estudiantes";
import { useToast } from "../state/ToastContext";
import { formatMonedaBs, parseDecimal } from "../utils/format";

interface FormState {
  nombre: string; apellido: string; ci: string; fechaNacimiento: string; genero: string;
  telefono: string; correo: string; direccion: string; ciudad: string; carrera: string;
  codigoUniversitario: string; facultad: string; semestre: string; promedio: string;
  materiasAprobadas: string; materiasReprobadas: string; anioIngreso: string;
  ingreso: string; integrantesHogar: string; dependientes: string; tipoVivienda: string;
  procedencia: string; discapacidad: string; situacionLaboral: string;
  tipoBeca: string; motivo: string; fechaSolicitud: string;
}

const INICIAL: FormState = {
  nombre: "", apellido: "", ci: "", fechaNacimiento: "", genero: "", telefono: "",
  correo: "", direccion: "", ciudad: "", carrera: "", codigoUniversitario: "", facultad: "",
  semestre: "", promedio: "", materiasAprobadas: "", materiasReprobadas: "", anioIngreso: "",
  ingreso: "", integrantesHogar: "", dependientes: "", tipoVivienda: "", procedencia: "",
  discapacidad: "", situacionLaboral: "", tipoBeca: "", motivo: "", fechaSolicitud: "",
};

type Errores = Partial<Record<keyof FormState, string>>;

/** Campos del backend → campos del formulario (errores por campo). */
const MAPA_SERVIDOR: Record<string, keyof FormState> = {
  nombre: "nombre",
  apellido: "apellido",
  ci: "ci",
  fecha_nacimiento: "fechaNacimiento",
  correo: "correo",
  carrera: "carrera",
  promedio: "promedio",
  semestre: "semestre",
  ingreso_familiar: "ingreso",
  integrantes_hogar: "integrantesHogar",
};

const CI_RE = /^[0-9]+(-[0-9A-Za-z]{1,2})?$/;
const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function edad(fechaISO: string): number | null {
  const nac = new Date(`${fechaISO}T00:00:00`);
  if (Number.isNaN(nac.getTime())) return null;
  const hoy = new Date();
  let e = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e -= 1;
  return e;
}

function enteroEnRango(v: string, min: number, max: number): boolean {
  if (!v.trim()) return true;
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max;
}

/** Validaciones del Módulo 6 (contrato + reglas de negocio). */
function validar(
  f: FormState,
  otros: EstudianteExtendido[],
  idPropio?: number,
): Errores {
  const e: Errores = {};
  const req = (v: string) => v.trim().length > 0;
  if (!req(f.nombre)) e.nombre = "Requerido.";
  else if (f.nombre.trim().length > 100) e.nombre = "Máximo 100 caracteres.";
  if (!req(f.apellido)) e.apellido = "Requerido.";
  else if (f.apellido.trim().length > 100) e.apellido = "Máximo 100 caracteres.";
  if (!req(f.ci)) e.ci = "Requerido.";
  else if (!CI_RE.test(f.ci.trim())) e.ci = "Formato inválido (solo números, con complemento opcional).";
  else if (otros.some((o) => o.ci === f.ci.trim() && o.id_estudiante !== idPropio)) e.ci = "Este CI ya está registrado.";
  if (!req(f.fechaNacimiento)) e.fechaNacimiento = "Requerida.";
  else {
    const a = edad(f.fechaNacimiento);
    if (a === null) e.fechaNacimiento = "Fecha inválida.";
    else if (a < 16 || a > 60) e.fechaNacimiento = "La edad debe estar entre 16 y 60 años.";
  }
  if (!req(f.carrera)) e.carrera = "Requerida.";
  else if (f.carrera.trim().length > 100) e.carrera = "Máximo 100 caracteres.";
  if (f.correo.trim() && !CORREO_RE.test(f.correo.trim())) e.correo = "Correo inválido.";
  else if (
    f.correo.trim() &&
    otros.some((o) => o.correo?.toLowerCase() === f.correo.trim().toLowerCase() && o.id_estudiante !== idPropio)
  ) e.correo = "Este correo ya está registrado.";
  if (!req(f.promedio)) e.promedio = "Requerido.";
  else {
    const v = parseDecimal(f.promedio);
    if (v === undefined || !Number.isFinite(v) || v < 0 || v > 100) e.promedio = "Debe ser un número entre 0 y 100 (se acepta coma decimal).";
  }
  if (!enteroEnRango(f.semestre, 1, 10)) e.semestre = "Debe ser un entero entre 1 y 10.";
  if (!req(f.ingreso)) e.ingreso = "Requerido.";
  else {
    const v = parseDecimal(f.ingreso);
    if (v === undefined || !Number.isFinite(v) || v < 0) e.ingreso = "Debe ser un número mayor o igual a 0 (se acepta coma decimal).";
  }
  if (f.integrantesHogar.trim() && !enteroEnRango(f.integrantesHogar, 1, 30)) e.integrantesHogar = "Debe ser un entero mayor o igual a 1.";
  if (!enteroEnRango(f.dependientes, 0, 30)) e.dependientes = "Debe ser un entero mayor o igual a 0.";
  if (!enteroEnRango(f.materiasAprobadas, 0, 100)) e.materiasAprobadas = "Debe ser un entero mayor o igual a 0.";
  if (!enteroEnRango(f.materiasReprobadas, 0, 100)) e.materiasReprobadas = "Debe ser un entero mayor o igual a 0.";
  if (f.anioIngreso.trim() && !enteroEnRango(f.anioIngreso, 1980, new Date().getFullYear())) e.anioIngreso = "Año inválido.";
  return e;
}

function desdeEntidad(e: EstudianteExtendido): { form: FormState; documentos: DocumentoAdjunto[] } {
  const txt = (v: string | number | undefined) => (v === undefined || v === null ? "" : String(v));
  return {
    form: {
      ...INICIAL,
      nombre: e.nombre ?? "", apellido: e.apellido ?? "", ci: e.ci ?? "",
      fechaNacimiento: e.fecha_nacimiento ?? "", genero: e.genero ?? "", telefono: e.telefono ?? "",
      correo: e.correo ?? "", direccion: e.direccion ?? "", ciudad: e.ciudad ?? "",
      carrera: e.carrera ?? "", codigoUniversitario: e.codigo_universitario ?? "",
      facultad: e.facultad ?? "", semestre: txt(e.semestre), promedio: txt(e.promedio),
      materiasAprobadas: txt(e.materias_aprobadas), materiasReprobadas: txt(e.materias_reprobadas),
      anioIngreso: txt(e.anio_ingreso), ingreso: txt(e.ingreso_familiar),
      integrantesHogar: txt(e.integrantes_hogar), dependientes: txt(e.dependientes),
      tipoVivienda: e.tipo_vivienda ?? "", procedencia: e.procedencia ?? "",
      discapacidad: e.discapacidad ?? "", situacionLaboral: e.situacion_laboral ?? "",
      tipoBeca: e.tipo_beca_solicitada ?? "", motivo: e.motivo ?? "", fechaSolicitud: e.fecha_solicitud ?? "",
    },
    documentos: e.documentos ?? [],
  };
}

/** nuevo-estudiante.png → /estudiantes/nuevo y /estudiantes/:id/editar. */
export function NuevoEstudiantePage() {
  const { idEstudiante } = useParams();
  const modoEdicion = window.location.pathname.includes("/editar");
  const id = Number(idEstudiante);
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormState>(INICIAL);
  const [documentos, setDocumentos] = useState<DocumentoAdjunto[]>([]);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [progreso, setProgreso] = useState<number | null>(null);
  const [tocados, setTocados] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [enviado, setEnviado] = useState(false);
  const [erroresServidor, setErroresServidor] = useState<Errores>({});
  const [confirmandoSalida, setConfirmandoSalida] = useState(false);
  const [base, setBase] = useState<string>("");

  const original = useQuery({
    queryKey: ["estudiante", id],
    queryFn: () => estudiantesApi.getById(id),
    enabled: modoEdicion && Number.isInteger(id) && id > 0,
  });
  const lista = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard });
  const carrerasApi = useQuery({ queryKey: ["cfg-carreras"], queryFn: catalogosApi.carrerasCrud.listar });
  const tiposApi = useQuery({ queryKey: ["cfg-tipos"], queryFn: catalogosApi.tiposBeca.listar });
  const carrerasSugeridas = (carrerasApi.data ?? []).map((c) => c.nombre);
  const tiposSugeridos = (tiposApi.data ?? []).map((t) => t.nombre);
  const tiposBeca = tiposSugeridos.length > 0 ? tiposSugeridos : [...TIPO_BECA];

  useEffect(() => {
    if (modoEdicion && original.data) {
      const { form: f, documentos: d } = desdeEntidad(original.data);
      setForm(f);
      setDocumentos(d);
      setBase(JSON.stringify({ f, d }));
    }
  }, [modoEdicion, original.data]);

  const errores = useMemo(
    () => ({
      ...validar(form, lista.data?.estudiantes ?? [], modoEdicion ? id : undefined),
      ...erroresServidor,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, lista.data, modoEdicion, id, erroresServidor],
  );
  const sucio = JSON.stringify({ f: form, d: documentos }) !== (modoEdicion ? base : JSON.stringify({ f: INICIAL, d: [] }));
  const verError = (k: keyof FormState) => (enviado || tocados[k] ? errores[k] : undefined);

  const mutation = useMutation({
    mutationFn: async (): Promise<number> => {
      const payload: EstudianteExtendido = {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        ci: form.ci.trim() || undefined,
        fecha_nacimiento: form.fechaNacimiento || undefined,
        genero: form.genero || undefined,
        telefono: form.telefono.trim() || undefined,
        correo: form.correo.trim() || undefined,
        direccion: form.direccion.trim() || undefined,
        ciudad: form.ciudad.trim() || undefined,
        carrera: form.carrera.trim(),
        codigo_universitario: form.codigoUniversitario.trim() || undefined,
        facultad: form.facultad.trim() || undefined,
        semestre: parseDecimal(form.semestre),
        promedio: parseDecimal(form.promedio) ?? NaN,
        materias_aprobadas: parseDecimal(form.materiasAprobadas),
        materias_reprobadas: parseDecimal(form.materiasReprobadas),
        anio_ingreso: parseDecimal(form.anioIngreso),
        ingreso_familiar: parseDecimal(form.ingreso) ?? NaN,
        integrantes_hogar: parseDecimal(form.integrantesHogar),
        dependientes: parseDecimal(form.dependientes),
        tipo_vivienda: form.tipoVivienda || undefined,
        procedencia: (form.procedencia || undefined) as "urbano" | "rural" | undefined,
        discapacidad: form.discapacidad || undefined,
        situacion_laboral: form.situacionLaboral || undefined,
        motivo: form.motivo.trim() || undefined,
        tipo_beca_solicitada: form.tipoBeca || undefined,
        fecha_solicitud: form.fechaSolicitud || undefined,
        documentos,
      };
      let destinoId: number;
      if (modoEdicion) {
        await estudiantesApi.update(id, payload);
        destinoId = id;
      } else {
        const creado = await estudiantesApi.create(payload);
        destinoId = creado.id_estudiante ?? 0;
        if (!destinoId) throw new Error("Sin id generado");
      }
      // Subida real de archivos pendientes (en mock ya viajan en el payload).
      // Si una subida falla, el estudiante queda guardado: solo se avisa.
      const fallos: string[] = [];
      if (archivos.length > 0) {
        let i = 0;
        for (const archivo of archivos) {
          setProgreso(Math.round((i / archivos.length) * 100));
          try {
            const subido = await documentosApi.subir(destinoId, archivo, (pct) =>
              setProgreso(Math.round(((i + pct / 100) / archivos.length) * 100)),
            );
            setDocumentos((d) => [...d, { nombre: subido.nombre, tamanio: subido.tamanio }]);
          } catch {
            fallos.push(archivo.name);
          }
          i += 1;
        }
        setProgreso(100);
      }
      if (fallos.length > 0) throw new Error(`AVISO_SUBIDA:${fallos.join(", ")}:${destinoId}`);
      return destinoId;
    },
    onSuccess: (nuevoId) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["estudiante", nuevoId] });
      queryClient.invalidateQueries({ queryKey: ["estudiantes"] });
      queryClient.invalidateQueries({ queryKey: ["historial", nuevoId] });
      toast.exito(modoEdicion ? "Estudiante actualizado." : "Estudiante registrado.");
      navigate(`/estudiantes/${nuevoId}`);
    },
    onError: (e: unknown) => {
      if (e instanceof Error && e.message.startsWith("AVISO_SUBIDA:")) {
        const [, nombres, idStr] = e.message.split(":");
        const nuevoId = Number(idStr);
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["estudiantes"] });
        toast.advertencia(`Estudiante guardado, pero falló la subida de: ${nombres}.`);
        navigate(`/estudiantes/${nuevoId}`);
        return;
      }
      if (e instanceof ApiError && e.detalles) {
        const deServidor: Errores = {};
        for (const [campo, mensaje] of Object.entries(e.detalles)) {
          const local = MAPA_SERVIDOR[campo];
          if (local) deServidor[local] = mensaje;
        }
        if (Object.keys(deServidor).length > 0) {
          setErroresServidor((prev) => ({ ...prev, ...deServidor }));
          setEnviado(true);
        }
      }
      toast.error(e instanceof Error ? e.message : "No se pudo guardar al estudiante.");
    },
  });

  const set =
    (k: keyof FormState) =>
    (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: ev.target.value }));

  const tocar = (k: keyof FormState) => () => setTocados((t) => ({ ...t, [k]: true }));

  const guardar = (ev: React.FormEvent) => {
    ev.preventDefault();
    setEnviado(true);
    setErroresServidor({});
    const locales = validar(form, lista.data?.estudiantes ?? [], modoEdicion ? id : undefined);
    if (Object.keys(locales).length > 0) {
      requestAnimationFrame(() => {
        const primero = document.querySelector(".field-error");
        const campo = primero?.closest(".field");
        campo?.scrollIntoView({ behavior: "smooth", block: "center" });
        campo?.querySelector<HTMLElement>("input, select, textarea")?.focus();
      });
      return;
    }
    mutation.mutate();
  };

  const cancelar = () => {
    if (sucio) setConfirmandoSalida(true);
    else navigate(ROUTES.estudiantes);
  };

  const agregarDocumentos = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const archivos = ev.target.files;
    if (!archivos) return;
    const nuevos = [...archivos];
    setArchivos((a) => [...a, ...nuevos]);
    setDocumentos((d) => [...d, ...nuevos.map((a) => ({ nombre: a.name, tamanio: a.size }))]);
    ev.target.value = "";
  };

  const quitarDocumento = (i: number) => {
    setArchivos((a) => a.filter((_, j) => j !== i));
    setDocumentos((d) => d.filter((_, j) => j !== i));
  };

  if (modoEdicion && (!Number.isInteger(id) || id <= 0)) {
    return <div className="page error">ID de estudiante inválido.</div>;
  }
  if (modoEdicion && original.isPending) {
    return (
      <div className="page">
        <PageHeader title="Editar estudiante" />
        <Spinner texto="Cargando datos…" />
      </div>
    );
  }
  if (modoEdicion && !original.data) {
    return (
      <div className="page">
        <PageHeader title="Editar estudiante" />
        <EmptyState
          titulo="Estudiante no encontrado"
          detalle="El estudiante no existe o fue eliminado."
          accion={<Link to={ROUTES.estudiantes}>Volver al listado</Link>}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader title={modoEdicion ? "Editar estudiante" : "Nuevo estudiante"} />
      <form onSubmit={guardar} noValidate>
        <Card title={modoEdicion ? "Edición" : "Registro"}>
          <FormSection title="Datos personales">
            <FormField label="Nombres *" error={verError("nombre")}>
              <input className="input" value={form.nombre} onChange={set("nombre")} onBlur={tocar("nombre")} maxLength={100} />
            </FormField>
            <FormField label="Apellidos *" error={verError("apellido")}>
              <input className="input" value={form.apellido} onChange={set("apellido")} onBlur={tocar("apellido")} maxLength={100} />
            </FormField>
            <FormField label="Carnet de identidad *" error={verError("ci")}>
              <input className="input" value={form.ci} onChange={set("ci")} onBlur={tocar("ci")} placeholder="1234567 o 1234567-1A" />
            </FormField>
            <FormField label="Fecha de nacimiento *" error={verError("fechaNacimiento")}>
              <input className="input" type="date" value={form.fechaNacimiento} onChange={set("fechaNacimiento")} onBlur={tocar("fechaNacimiento")} />
            </FormField>
            <FormField label="Género">
              <select className="input" value={form.genero} onChange={set("genero")}>
                <option value="">Seleccionar…</option>
                <option value="femenino">Femenino</option>
                <option value="masculino">Masculino</option>
                <option value="otro">Otro</option>
              </select>
            </FormField>
            <FormField label="Teléfono">
              <input className="input" value={form.telefono} onChange={set("telefono")} />
            </FormField>
            <FormField label="Correo">
              <input className="input" type="email" value={form.correo} onChange={set("correo")} onBlur={tocar("correo")} />
            </FormField>
            <FormField label="Dirección">
              <input className="input" value={form.direccion} onChange={set("direccion")} />
            </FormField>
            <FormField label="Ciudad / Departamento">
              <input className="input" value={form.ciudad} onChange={set("ciudad")} />
            </FormField>
            <FormField label="Carrera *" error={verError("carrera")}>
              <input className="input" list="carreras" value={form.carrera} onChange={set("carrera")} onBlur={tocar("carrera")} maxLength={100} />
              <datalist id="carreras">
                {carrerasSugeridas.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </FormField>
          </FormSection>

          <FormSection title="Datos académicos">
            <FormField label="Código universitario">
              <input className="input" value={form.codigoUniversitario} onChange={set("codigoUniversitario")} />
            </FormField>
            <FormField label="Facultad">
              <input className="input" value={form.facultad} onChange={set("facultad")} />
            </FormField>
            <FormField label="Semestre" error={verError("semestre")}>
              <input className="input" type="number" min={1} max={10} value={form.semestre} onChange={set("semestre")} onBlur={tocar("semestre")} />
            </FormField>
            <FormField label="Promedio académico *" error={verError("promedio")}>
              <input className="input" type="number" min={0} max={100} step="0.01" value={form.promedio} onChange={set("promedio")} onBlur={tocar("promedio")} />
            </FormField>
            <FormField label="Materias aprobadas" error={verError("materiasAprobadas")}>
              <input className="input" type="number" min={0} value={form.materiasAprobadas} onChange={set("materiasAprobadas")} onBlur={tocar("materiasAprobadas")} />
            </FormField>
            <FormField label="Materias reprobadas" error={verError("materiasReprobadas")}>
              <input className="input" type="number" min={0} value={form.materiasReprobadas} onChange={set("materiasReprobadas")} onBlur={tocar("materiasReprobadas")} />
            </FormField>
            <FormField label="Año de ingreso" error={verError("anioIngreso")}>
              <input className="input" type="number" value={form.anioIngreso} onChange={set("anioIngreso")} onBlur={tocar("anioIngreso")} />
            </FormField>
          </FormSection>

          <FormSection title="Datos socioeconómicos">
            <FormField label="Ingreso familiar mensual *" error={verError("ingreso")}>
              <input className="input" type="number" min={0} step="0.01" value={form.ingreso} onChange={set("ingreso")} onBlur={tocar("ingreso")} />
            </FormField>
            <FormField label="Integrantes del hogar" error={verError("integrantesHogar")}>
              <input className="input" type="number" min={1} value={form.integrantesHogar} onChange={set("integrantesHogar")} onBlur={tocar("integrantesHogar")} />
            </FormField>
            <FormField label="Dependientes" error={verError("dependientes")}>
              <input className="input" type="number" min={0} value={form.dependientes} onChange={set("dependientes")} onBlur={tocar("dependientes")} />
            </FormField>
            <FormField label="Tipo de vivienda">
              <select className="input" value={form.tipoVivienda} onChange={set("tipoVivienda")}>
                <option value="">Seleccionar…</option>
                <option value="propia">Propia</option>
                <option value="alquilada">Alquilada</option>
                <option value="anticretico">Anticrético</option>
                <option value="otra">Otra</option>
              </select>
            </FormField>
            <FormField label="Procedencia">
              <select className="input" value={form.procedencia} onChange={set("procedencia")}>
                <option value="">Seleccionar…</option>
                <option value="urbano">Urbano</option>
                <option value="rural">Rural</option>
              </select>
            </FormField>
            <FormField label="Discapacidad">
              <select className="input" value={form.discapacidad} onChange={set("discapacidad")}>
                <option value="">Seleccionar…</option>
                <option value="no">No</option>
                <option value="si">Sí</option>
              </select>
            </FormField>
            <FormField label="Situación laboral">
              <input className="input" value={form.situacionLaboral} onChange={set("situacionLaboral")} />
            </FormField>
          </FormSection>

          <FormSection title="Solicitud de beca">
            <FormField label="Tipo de beca solicitada">
              <select className="input" value={form.tipoBeca} onChange={set("tipoBeca")}>
                <option value="">Seleccionar…</option>
                {tiposBeca.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Motivo / Justificación">
              <textarea className="input" rows={3} value={form.motivo} onChange={set("motivo")} />
            </FormField>
            <FormField label="Fecha de solicitud">
              <input className="input" type="date" value={form.fechaSolicitud} onChange={set("fechaSolicitud")} />
            </FormField>
            <FormField label="Documentos adjuntos">
              <input className="input" type="file" multiple onChange={agregarDocumentos} />
              {documentos.length > 0 && (
                <ul className="doc-list">
                  {documentos.map((d, i) => (
                    <li key={`${d.nombre}-${i}`}>
                      {d.nombre} ({Math.max(1, Math.round(d.tamanio / 1024))} KB)
                      <button
                        className="link-btn danger"
                        type="button"
                        onClick={() => quitarDocumento(i)}
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </FormField>
          </FormSection>

          {progreso !== null && mutation.isPending && (
            <p className="muted">Subiendo documentos… {progreso} %</p>
          )}
          {progreso !== null && mutation.isPending && (
            <progress value={progreso} max={100} aria-label="Progreso de subida" />
          )}
          <div className="form-actions">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando…" : modoEdicion ? "Guardar cambios" : "Guardar"}
            </Button>
            <Button variant="secondary" type="button" onClick={cancelar}>
              Cancelar
            </Button>
          </div>
        </Card>
      </form>

      {confirmandoSalida && (
        <ConfirmDialog
          titulo="Descartar cambios"
          mensaje="Hay cambios sin guardar que se perderán. ¿Salir de todos modos?"
          textoConfirmar="Descartar"
          onConfirmar={() => navigate(ROUTES.estudiantes)}
          onCancelar={() => setConfirmandoSalida(false)}
        />
      )}
    </div>
  );
}
