import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "../components/Card";
import { EstadoBadge } from "../components/EstadoBadge";
import { FormField } from "../components/FormField";
import { PageHeader } from "../components/PageHeader";
import { UmbralLegend } from "../components/UmbralLegend";
import { ROUTES } from "../routing/routes";
import { USE_MOCKS, ApiError } from "../services/api/client";
import { fetchDashboard } from "../services/api/dashboard";
import { evaluacionesApi } from "../services/api/evaluaciones";
import { useToast } from "../state/ToastContext";
import { useAuth } from "../state/AuthContext";
import { PESOS_CRITERIOS, clasificarPuntaje, nombreCompleto } from "../utils/dss";
import { formatPuntaje } from "../utils/format";

interface Scores {
  rendimiento: string;
  asistencia: string;
  situacion: string;
  carga: string;
  vulnerable: string;
}

const VACIO: Scores = { rendimiento: "", asistencia: "", situacion: "", carga: "", vulnerable: "" };

const CAMPOS: { key: keyof Scores; label: string; peso: number }[] = [
  { key: "rendimiento", label: "Rendimiento académico", peso: PESOS_CRITERIOS.rendimiento_academico },
  { key: "asistencia", label: "Asistencia", peso: PESOS_CRITERIOS.asistencia },
  { key: "situacion", label: "Situación socioeconómica", peso: PESOS_CRITERIOS.situacion_socioeconomica },
  { key: "carga", label: "Carga familiar", peso: PESOS_CRITERIOS.carga_familiar },
  { key: "vulnerable", label: "Condición vulnerable", peso: PESOS_CRITERIOS.condicion_vulnerable },
];

function parseScore(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : NaN;
}

/** evaluacion-dss.png → /evaluaciones/nueva. POST /evaluaciones. */
export function EvaluacionPage() {
  const { idEstudiante: idPreseleccionado } = useParams();
  const [idEstudiante, setIdEstudiante] = useState(idPreseleccionado ?? "");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [scores, setScores] = useState<Scores>(VACIO);
  const [error, setError] = useState("");
  const [registrada, setRegistrada] = useState(false);
  const [sinBackend, setSinBackend] = useState(false);
  const [avisoElegibilidad, setAvisoElegibilidad] = useState<string[] | null>(null);

  const dash = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard });
  const auth = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: evaluacionesApi.create,
  });

  const setScore = (k: keyof Scores) => (ev: React.ChangeEvent<HTMLInputElement>) => {
    setRegistrada(false);
    setSinBackend(false);
    setAvisoElegibilidad(null);
    setScores((s) => ({ ...s, [k]: ev.target.value }));
  };

  const nums = CAMPOS.map((c) => parseScore(scores[c.key]));
  const validos = nums.every((n) => n !== null && !Number.isNaN(n)) && idEstudiante !== "" && fecha !== "";
  const puntajeFinal =
    validos && nums.every((n): n is number => n !== null && !Number.isNaN(n))
      ? Math.round(
          ((nums[0] * 30 + nums[1] * 15 + nums[2] * 25 + nums[3] * 15 + nums[4] * 15) / 100) * 100,
        ) / 100
      : null;

  const calcular = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError("");
    setRegistrada(false);
    setSinBackend(false);
    setAvisoElegibilidad(null);
    if (idEstudiante === "") {
      setError("Seleccioná un estudiante.");
      return;
    }
    if (nums.some((n) => n === null || Number.isNaN(n))) {
      setError("Completá los 5 criterios con valores entre 0 y 100.");
      return;
    }
    if (puntajeFinal === null) return;
    const [r, a, s, c, v] = nums as number[];
    // #3: en modo real el motor confirma puntajes y elegibilidad antes de guardar.
    let payload = {
      id_estudiante: Number(idEstudiante),
      fecha,
      puntaje_academico: Math.round(((r + a) / 2) * 100) / 100,
      puntaje_social: Math.round(((s + c + v) / 3) * 100) / 100,
      puntaje_final: puntajeFinal,
    };
    if (!USE_MOCKS) {
      try {
        const calc = await evaluacionesApi.calcular(Number(idEstudiante), {
          rendimiento: r, asistencia: a, situacion: s, carga: c, vulnerable: v,
        });
        if (!calc.elegible) setAvisoElegibilidad(calc.motivos_no_elegible);
        payload = {
          id_estudiante: Number(idEstudiante),
          fecha,
          puntaje_academico: calc.puntaje_academico,
          puntaje_social: calc.puntaje_social,
          puntaje_final: calc.puntaje_final,
        };
      } catch {
        setError("No se pudo calcular con el servidor.");
        return;
      }
    }
    mutation.mutate(payload, {
      onSuccess: () => {
        setRegistrada(true);
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["estudiantes"] });
        queryClient.invalidateQueries({ queryKey: ["resultado"] });
        queryClient.invalidateQueries({ queryKey: ["historial"] });
        queryClient.invalidateQueries({ queryKey: ["ranking"] });
        toast.exito("Evaluación registrada.");
      },
      onError: (e: unknown) => {
        if (e instanceof ApiError) setError(e.message);
        else setSinBackend(true);
      },
    });
  };

  return (
    <div className="page">
      <PageHeader title="Evaluación DSS - Nueva evaluación" />
      {!auth.puedeEditar ? (
        <div>
          <h1>Acceso denegado</h1>
          <p className="muted">Tu rol no permite registrar evaluaciones.</p>
        </div>
      ) : (
      <div className="cols-2">
        <Card title="Criterios ponderados">
          <form onSubmit={calcular} noValidate>
            <div className="eval-estudiante">
              <FormField label="Estudiante">
                <select className="input" value={idEstudiante} onChange={(e) => setIdEstudiante(e.target.value)}>
                  <option value="">Seleccionar…</option>
                  {(dash.data?.estudiantes ?? []).map((e) => (
                    <option key={e.id_estudiante} value={e.id_estudiante}>
                      {nombreCompleto(e)}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Fecha">
                <input className="input" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </FormField>
            </div>
            {CAMPOS.map((c) => (
              <div className="criterio-row" key={c.key}>
                <span>{c.label}</span>
                <span className="criterio-inputs">
                  <input
                    className="input criterio-score"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="0–100"
                    value={scores[c.key]}
                    onChange={setScore(c.key)}
                  />
                  <span className="peso-box">{c.peso}%</span>
                </span>
              </div>
            ))}
            {error && <p className="error">{error}</p>}
            {avisoElegibilidad && avisoElegibilidad.length > 0 && (
              <p className="error">No elegible: {avisoElegibilidad.join(" ")}</p>
            )}
            <button className="btn btn-primary" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Registrando…" : "Calcular puntaje DSS"}
            </button>
          </form>
        </Card>

        <div>
          <Card title="Resultado de la evaluación">
            <p className="muted">Puntaje DSS</p>
            <strong className="score-big">{puntajeFinal === null ? "-" : formatPuntaje(puntajeFinal)}</strong>
            <p>
              {puntajeFinal === null ? (
                <span className="muted">Completá los criterios para ver la recomendación.</span>
              ) : (
                <span>Recomendación: <EstadoBadge estado={clasificarPuntaje(puntajeFinal)} /></span>
              )}
            </p>
            {registrada && idEstudiante !== "" && (
              <p>
                Evaluación registrada{USE_MOCKS ? " (simulado, no persiste)" : ""}.{" "}
                <Link to={ROUTES.detalleEstudiante(idEstudiante)}>Ver detalle del estudiante</Link>
              </p>
            )}
            {sinBackend && (
              <p className="error">Sin backend disponible: puntaje calculado localmente, no persistido (POST /evaluaciones falló).</p>
            )}
          </Card>

          <Card title="Comparación con umbral">
            <UmbralLegend />
          </Card>
        </div>
      </div>
      )}
    </div>
  );
}
