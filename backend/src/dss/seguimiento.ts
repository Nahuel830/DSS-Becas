import { PROMEDIO_MINIMO } from "./elegibilidad";

export type EstadoSeguimiento = "Al día" | "En riesgo" | "Suspendida";

/** Regla #6: promedio del periodo bajo el mínimo → "En riesgo". */
export function evaluarPeriodo(promedioPeriodo: number, minimo = PROMEDIO_MINIMO): EstadoSeguimiento {
  return promedioPeriodo < minimo ? "En riesgo" : "Al día";
}

/** Dos periodos seguidos en riesgo → sugerir "Suspendida". */
export function sugerirSuspension(estadosPrevios: string[]): boolean {
  const ultimos = estadosPrevios.slice(-2);
  return ultimos.length === 2 && ultimos.every((e) => e === "En riesgo");
}
