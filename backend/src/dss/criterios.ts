// Criterios y pesos del DSS. Valores de prototypes/evaluacion-dss.png
// (PLAN §h). Suman 100; validarPesos() lo garantiza.

export interface CriterioDSS {
  id: "rendimiento" | "asistencia" | "situacion" | "carga" | "vulnerable";
  nombre: string;
  peso: number;
}

export const CRITERIOS: CriterioDSS[] = [
  { id: "rendimiento", nombre: "Rendimiento académico", peso: 30 },
  { id: "asistencia", nombre: "Asistencia", peso: 15 },
  { id: "situacion", nombre: "Situación socioeconómica", peso: 25 },
  { id: "carga", nombre: "Carga familiar", peso: 15 },
  { id: "vulnerable", nombre: "Condición vulnerable", peso: 15 },
];

export const UMBRAL_RECOMENDADO = 80;
export const UMBRAL_REVISION = 60;

export type Recomendacion = "Recomendado" | "En revisión" | "En riesgo";

export function validarPesos(criterios: Array<{ peso: number }>): void {
  const total = criterios.reduce((s, c) => s + c.peso, 0);
  if (Math.abs(total - 100) > 0.001) {
    throw new Error(`Los pesos deben sumar 100 (actual: ${total})`);
  }
}

export function recomendar(puntajeFinal: number): Recomendacion {
  if (puntajeFinal >= UMBRAL_RECOMENDADO) return "Recomendado";
  if (puntajeFinal >= UMBRAL_REVISION) return "En revisión";
  return "En riesgo";
}

validarPesos(CRITERIOS);
