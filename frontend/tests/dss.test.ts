import { describe, expect, it } from "vitest";
import { clasificarPuntaje, codigoEstudiante, getEvaluacion, nombreCompleto } from "../src/utils/dss";

describe("reglas DSS", () => {
  it("clasifica por umbrales 80/60", () => {
    expect(clasificarPuntaje(92.5)).toBe("Recomendado");
    expect(clasificarPuntaje(80)).toBe("Recomendado");
    expect(clasificarPuntaje(81.4)).toBe("Recomendado");
    expect(clasificarPuntaje(79.9)).toBe("En revisión");
    expect(clasificarPuntaje(60)).toBe("En revisión");
    expect(clasificarPuntaje(59.9)).toBe("En riesgo");
  });

  it("genera código EST-NNN", () => {
    expect(codigoEstudiante(1)).toBe("EST-001");
    expect(codigoEstudiante(27)).toBe("EST-027");
    expect(codigoEstudiante(undefined)).toBe("-");
  });

  it("compone nombre completo", () => {
    expect(nombreCompleto({ nombre: "María", apellido: "Fernández" })).toBe("María Fernández");
    expect(nombreCompleto({})).toBe("-");
  });

  it("busca evaluación por estudiante", () => {
    const evals = [{ id_estudiante: 1, puntaje_final: 92.5 }, { id_estudiante: 2, puntaje_final: 70 }];
    expect(getEvaluacion(evals, 2)?.puntaje_final).toBe(70);
    expect(getEvaluacion(evals, 9)).toBeUndefined();
  });
});
