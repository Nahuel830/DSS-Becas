import { describe, expect, it } from "vitest";
import { calcularResumen } from "../src/services/api/dashboard";
import { formatFecha, formatMonedaBs, formatPorcentaje, formatPuntaje, parseDecimal } from "../src/utils/format";

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

describe("parseDecimal", () => {
  it("acepta coma decimal y miles con punto", () => {
    expect(parseDecimal("1499,99")).toBeCloseTo(1499.99, 5);
    expect(parseDecimal("1.499,99")).toBeCloseTo(1499.99, 5);
    expect(parseDecimal("85")).toBe(85);
    expect(parseDecimal("85,5")).toBeCloseTo(85.5, 5);
  });

  it("vacío es undefined e inválido es NaN", () => {
    expect(parseDecimal("")).toBeUndefined();
    expect(parseDecimal("   ")).toBeUndefined();
    expect(parseDecimal("abc")).toSatisfy(Number.isNaN);
  });
});
