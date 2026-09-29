/** Formato DECIMAL(5,2) de la BD para puntajes (siempre al menos un decimal). */
export function formatPuntaje(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  const s = value.toFixed(2);
  if (s.endsWith(".00")) return s.slice(0, -1);
  if (s.endsWith("0")) return s.slice(0, -1);
  return s;
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

/** Fecha-hora ISO a dd/mm/aaaa hh:mm. */
export function formatFechaHora(fechaISO: string | null | undefined): string {
  if (!fechaISO) return "-";
  const d = new Date(fechaISO);
  if (Number.isNaN(d.getTime())) return fechaISO;
  const dos = (n: number): string => String(n).padStart(2, "0");
  return `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()} ${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

/** Porcentaje con un decimal. */
export function formatPorcentaje(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "-";
  return `${valor.toFixed(1)} %`;
}

/**
 * Decimal flexible: "1499,99" y "1.499,99" → 1499.99.
 * "" → undefined; inválido → NaN (lo frena la validación).
 */
export function parseDecimal(v: string): number | undefined {
  const t = v.trim();
  if (t === "") return undefined;
  const normalizado = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t;
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : NaN;
}
