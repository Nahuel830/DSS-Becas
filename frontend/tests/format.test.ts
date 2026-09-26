import { describe, expect, it } from "vitest";
import { calcularResumen } from "../src/services/api/dashboard";
import { formatFecha, formatMonedaBs, formatPorcentaje, formatPuntaje } from "../src/utils/format";

describe("formatos", () => {
  it("puntaje DECIMAL(5,2)", () => {
    expect(formatPuntaje(92.5)).toBe("92.5");
    expect(formatPuntaje(74.0)).toBe("74.0");
    expect(formatPuntaje(null)).toBe("-");
  });

  it("moneda en bolivianos", () => {
    expect(formatMonedaBs(500)).toContain("500");
    expect(formatMonedaBs(null)).toBe("-");
  });

  it("fecha a dd/mm/aaaa", () => {
    expect(formatFecha("2025-08-01")).toBe("01/08/2025");
    expect(formatFecha("")).toBe("-");
  });

  it("porcentaje con un decimal", () => {
    expect(formatPorcentaje(92.54)).toBe("92.5 %");
    expect(formatPorcentaje(undefined)).toBe("-");
  });
});

describe("resumen del dashboard", () => {
  it("calcula indicadores sin hardcodear", () => {
    const r = calcularResumen([
      { puntaje_final: 92.5 },
      { puntaje_final: 74.0 },
      { puntaje_final: 58.2 },
    ]);
    expect(r).toEqual({ evaluados: 3, recomendados: 1, en_revision: 1, en_riesgo: 1 });
  });
});
