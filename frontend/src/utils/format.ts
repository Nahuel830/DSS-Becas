/** Formato DECIMAL(5,2) de la BD para puntajes. */
export function formatPuntaje(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return value.toFixed(2).replace(/\.00$/, ".0").replace(/0$/, "");
}

/** Moneda en bolivianos (Bs). */
export function formatMonedaBs(monto: number | null | undefined): string {
  if (monto === null || monto === undefined || Number.isNaN(monto)) return "-";
  return new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB", maximumFractionDigits: 2 }).format(monto);
}

/** Fecha ISO (aaaa-mm-dd) a dd/mm/aaaa. */
export function formatFecha(fechaISO: string | null | undefined): string {
  if (!fechaISO) return "-";
  const [anio, mes, dia] = fechaISO.slice(0, 10).split("-");
  if (!anio || !mes || !dia) return fechaISO;
  return `${dia}/${mes}/${anio}`;
}

/** Porcentaje con un decimal. */
export function formatPorcentaje(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "-";
  return `${valor.toFixed(1)} %`;
}
