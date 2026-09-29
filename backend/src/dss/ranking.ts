export interface FilaRanking {
  id_estudiante: number;
  puntaje_final: number;
  promedio: number;
  ingreso_familiar: number;
}

/** Conserva solo la mejor evaluación por estudiante (evita duplicados, #1). */
export function mejorPorEstudiante<T extends FilaRanking>(filas: T[]): T[] {
  const mejores = new Map<number, T>();
  for (const f of filas) {
    const actual = mejores.get(f.id_estudiante);
    if (!actual || f.puntaje_final > actual.puntaje_final) mejores.set(f.id_estudiante, f);
  }
  return [...mejores.values()];
}

/**
 * Ordena por puntaje desc, desempata por promedio desc y luego por
 * menor ingreso familiar (más necesidad primero).
 */
export function ordenarRanking<T extends FilaRanking>(filas: T[]): T[] {
  return [...filas].sort((a, b) => {
    if (b.puntaje_final !== a.puntaje_final) return b.puntaje_final - a.puntaje_final;
    if (b.promedio !== a.promedio) return b.promedio - a.promedio;
    return a.ingreso_familiar - b.ingreso_familiar;
  });
}
