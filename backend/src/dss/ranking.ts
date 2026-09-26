export interface FilaRanking {
  id_estudiante: number;
  puntaje_final: number;
  promedio: number;
  ingreso_familiar: number;
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
