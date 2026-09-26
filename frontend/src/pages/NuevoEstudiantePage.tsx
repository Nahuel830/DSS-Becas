import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { FormField } from "../components/FormField";
import { FormSection } from "../components/FormSection";
import { PageHeader } from "../components/PageHeader";
import { TIPO_BECA } from "../models/domain";
import { ROUTES } from "../routing/routes";
import { USE_MOCKS } from "../services/api/client";
import { estudiantesApi } from "../services/api/estudiantes";
import type { Estudiante } from "../services/api/types";

interface FormState {
  nombre: string;
  apellido: string;
  carnet: string;
  fechaNacimiento: string;
  contacto: string;
  carrera: string;
  promedio: string;
  asistencia: string;
  semestre: string;
  ingreso: string;
  cargaFamiliar: string;
  condicionVulnerable: string;
  tipoBeca: string;
  fechaSolicitud: string;
  documentos: string;
}

const INICIAL: FormState = {
  nombre: "", apellido: "", carnet: "", fechaNacimiento: "", contacto: "", carrera: "",
  promedio: "", asistencia: "", semestre: "", ingreso: "", cargaFamiliar: "",
  condicionVulnerable: "", tipoBeca: "", fechaSolicitud: "", documentos: "",
};

type Errores = Partial<Record<"nombre" | "apellido" | "carrera" | "promedio" | "ingreso", string>>;

/**
 * Valida SOLO los campos del contrato (openapi.yaml Estudiante + límites SQL).
 * El resto de campos del mock son UI-only y no se persisten (fase 1).
 */
function validar(f: FormState): Errores {
  const e: Errores = {};
  if (!f.nombre.trim()) e.nombre = "Requerido.";
  else if (f.nombre.trim().length > 100) e.nombre = "Máximo 100 caracteres.";
  if (!f.apellido.trim()) e.apellido = "Requerido.";
  else if (f.apellido.trim().length > 100) e.apellido = "Máximo 100 caracteres.";
  if (!f.carrera.trim()) e.carrera = "Requerida.";
  else if (f.carrera.trim().length > 100) e.carrera = "Máximo 100 caracteres.";
  if (!f.promedio.trim()) e.promedio = "Requerido.";
  else {
    const v = Number(f.promedio);
    if (!Number.isFinite(v) || v < 0 || v > 100) e.promedio = "Debe ser un número entre 0 y 100.";
  }
  if (!f.ingreso.trim()) e.ingreso = "Requerido.";
  else {
    const v = Number(f.ingreso);
    if (!Number.isFinite(v) || v < 0) e.ingreso = "Debe ser un número mayor o igual a 0.";
  }
  return e;
}

/** nuevo-estudiante.png → /estudiantes/nuevo. POST /estudiantes. */
export function NuevoEstudiantePage() {
  const [form, setForm] = useState<FormState>(INICIAL);
  const [errores, setErrores] = useState<Errores>({});
  const [falloApi, setFalloApi] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: Estudiante) => estudiantesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      navigate(ROUTES.estudiantes);
    },
    onError: () => setFalloApi(true),
  });

  const set = (k: keyof FormState) => (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: ev.target.value }));

  const guardar = (ev: React.FormEvent) => {
    ev.preventDefault();
    setFalloApi(false);
    const errs = validar(form);
    setErrores(errs);
    if (Object.keys(errs).length > 0) return;
    mutation.mutate({
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      carrera: form.carrera.trim(),
      promedio: Number(form.promedio),
      ingreso_familiar: Number(form.ingreso),
    });
  };

  return (
    <div className="page">
      <PageHeader title="Nuevo estudiante" />
      <form onSubmit={guardar} noValidate>
        <Card title="Registro">
          <FormSection title="Datos personales">
            <FormField label="Nombres" error={errores.nombre}>
              <input className="input" value={form.nombre} onChange={set("nombre")} maxLength={100} />
            </FormField>
            <FormField label="Apellidos" error={errores.apellido}>
              <input className="input" value={form.apellido} onChange={set("apellido")} maxLength={100} />
            </FormField>
            <FormField label="Carnet de identidad">
              <input className="input" value={form.carnet} onChange={set("carnet")} />
            </FormField>
            <FormField label="Fecha de nacimiento">
              <input className="input" type="date" value={form.fechaNacimiento} onChange={set("fechaNacimiento")} />
            </FormField>
            <FormField label="Teléfono / Correo">
              <input className="input" value={form.contacto} onChange={set("contacto")} />
            </FormField>
            <FormField label="Carrera" error={errores.carrera}>
              <input className="input" value={form.carrera} onChange={set("carrera")} maxLength={100} />
            </FormField>
          </FormSection>

          <FormSection title="Datos académicos">
            <FormField label="Promedio académico" error={errores.promedio}>
              <input className="input" type="number" min={0} max={100} step="0.01" value={form.promedio} onChange={set("promedio")} />
            </FormField>
            <FormField label="Porcentaje de asistencia">
              <input className="input" type="number" min={0} max={100} value={form.asistencia} onChange={set("asistencia")} />
            </FormField>
            <FormField label="Semestre / Gestión">
              <input className="input" value={form.semestre} onChange={set("semestre")} />
            </FormField>
          </FormSection>

          <FormSection title="Datos socioeconómicos">
            <FormField label="Ingreso familiar mensual" error={errores.ingreso}>
              <input className="input" type="number" min={0} step="0.01" value={form.ingreso} onChange={set("ingreso")} />
            </FormField>
            <FormField label="Carga familiar">
              <input className="input" value={form.cargaFamiliar} onChange={set("cargaFamiliar")} />
            </FormField>
            <FormField label="Condición vulnerable">
              <input className="input" value={form.condicionVulnerable} onChange={set("condicionVulnerable")} />
            </FormField>
          </FormSection>

          <FormSection title="Solicitud de beca">
            <FormField label="Tipo de beca solicitada">
              <select className="input" value={form.tipoBeca} onChange={set("tipoBeca")}>
                <option value="">Seleccionar…</option>
                {TIPO_BECA.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Fecha de solicitud">
              <input className="input" type="date" value={form.fechaSolicitud} onChange={set("fechaSolicitud")} />
            </FormField>
            <FormField label="Documentos adjuntos">
              <input className="input" value={form.documentos} onChange={set("documentos")} />
            </FormField>
          </FormSection>

          {falloApi && (
            <p className="error">Sin backend disponible: el estudiante no pudo registrarse (POST /estudiantes falló).</p>
          )}
          {USE_MOCKS && (
            <p className="muted">Modo demostración (VITE_USE_MOCKS=true): el registro se simula y no persiste.</p>
          )}
          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando…" : "Guardar"}
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => navigate(ROUTES.estudiantes)}>
              Cancelar
            </button>
          </div>
        </Card>
      </form>
    </div>
  );
}
