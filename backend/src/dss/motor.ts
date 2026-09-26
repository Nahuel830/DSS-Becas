import { CRITERIOS, recomendar, validarPesos, type Recomendacion } from "./criterios";

export interface PuntajesCriterio {
  rendimiento: number;
  asistencia: number;
  situacion: number;
  carga: number;
  vulnerable: number;
}

export interface ResultadoCalculo {
  puntaje_academico: number;
  puntaje_social: number;
  puntaje_final: number;
  recomendacion: Recomendacion;
}

const redondear2 = (n: number): number => Math.round(n * 100) / 100;

/** Suma ponderada con los pesos de CRITERIOS. No guarda nada. */
export function calcular(criterios: PuntajesCriterio): ResultadoCalculo {
  validarPesos(CRITERIOS);
  const peso: Record<keyof PuntajesCriterio, number> = {
    rendimiento: 30,
    asistencia: 15,
    situacion: 25,
    carga: 15,
    vulnerable: 15,
  };
  const academico = redondear2((criterios.rendimiento + criterios.asistencia) / 2);
  const social = redondear2(
    (criterios.situacion + criterios.carga + criterios.vulnerable) / 3,
  );
  const final = redondear2(
    (criterios.rendimiento * peso.rendimiento +
      criterios.asistencia * peso.asistencia +
      criterios.situacion * peso.situacion +
      criterios.carga * peso.carga +
      criterios.vulnerable * peso.vulnerable) /
      100,
  );
  return {
    puntaje_academico: academico,
    puntaje_social: social,
    puntaje_final: final,
    recomendacion: recomendar(final),
  };
}

/**
 * Criterios derivados para "evaluar todos" cuando solo hay datos básicos
 * (D32): rendimiento = promedio; asistencia neutra 90; situación = escala
 * inversa del ingreso (0–6000 Bs); carga y vulnerable neutros.
 */
export function derivarCriterios(promedio: number, ingresoFamiliar: number): PuntajesCriterio {
  const situacion = Math.max(0, Math.min(100, 100 - (ingresoFamiliar / 6000) * 100));
  return {
    rendimiento: promedio,
    asistencia: 90,
    situacion: redondear2(situacion),
    carga: 70,
    vulnerable: 60,
  };
}
