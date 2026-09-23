/** Formato DECIMAL(5,2) de la BD para puntajes. */
export function formatPuntaje(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return value.toFixed(2).replace(/\.00$/, ".0").replace(/0$/, "");
}
