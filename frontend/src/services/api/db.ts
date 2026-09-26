/**
 * Base de datos local (localStorage, clave "dss-becas-db").
 * Con VITE_USE_MOCKS=true los servicios leen/escriben aquí: la primera
 * carga siembra desde services/api/mocks.ts y luego todo persiste al recargar.
 * Fechas de creación/actualización se registran como eventos (ver eventosDe).
 */
import type { EstudianteExtendido } from "../../models/domain";
import { MOCK_BECAS, MOCK_ESTUDIANTES, MOCK_EVALUACIONES, MOCK_RESULTADOS } from "./mocks";
import type { Beca, Evaluacion, Resultado } from "./types";

export type Coleccion = "estudiantes" | "evaluaciones" | "resultados" | "becas";

export interface EventoDb {
  id_evento: number;
  fecha: string;
  tipo: "creacion" | "edicion" | "eliminacion" | "evaluacion" | "reseteo";
  id_estudiante: number | null;
  detalle: string;
}

export interface BaseDeDatos {
  estudiantes: EstudianteExtendido[];
  evaluaciones: Evaluacion[];
  resultados: Resultado[];
  becas: Beca[];
  eventos: EventoDb[];
}

const CLAVE = "dss-becas-db";

const ID_DE: Record<Coleccion, string> = {
  estudiantes: "id_estudiante",
  evaluaciones: "id_evaluacion",
  resultados: "id_resultado",
  becas: "id_beca",
};

type Ids = "id_estudiante" | "id_evaluacion" | "id_resultado" | "id_beca" | "id_evento";
type SinId<T extends object> = Omit<T, Extract<Ids, keyof T>> & Partial<Pick<T, Extract<Ids, keyof T>>>;

function sembrar(): BaseDeDatos {
  return {
    estudiantes: MOCK_ESTUDIANTES.map((e) => ({ ...e })),
    evaluaciones: MOCK_EVALUACIONES.map((e) => ({ ...e })),
    resultados: MOCK_RESULTADOS.map((r) => ({ ...r })),
    becas: MOCK_BECAS.map((b) => ({ ...b })),
    eventos: [
      {
        id_evento: 1,
        fecha: new Date().toISOString(),
        tipo: "creacion",
        id_estudiante: null,
        detalle: "Base de datos de prueba inicializada",
      },
    ],
  };
}

function leer(): BaseDeDatos {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) {
      const db = sembrar();
      guardar(db);
      return db;
    }
    return JSON.parse(crudo) as BaseDeDatos;
  } catch {
    const db = sembrar();
    guardar(db);
    return db;
  }
}

function guardar(db: BaseDeDatos): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(db));
  } catch {
    // Almacenamiento lleno o bloqueado: se continúa solo en memoria.
  }
}

function siguienteId(base: BaseDeDatos, coleccion: Coleccion): number {
  const items = base[coleccion] as unknown as Array<Record<string, unknown>>;
  let max = 0;
  for (const it of items) {
    const v = it[ID_DE[coleccion]];
    if (typeof v === "number" && v > max) max = v;
  }
  return max + 1;
}

function registrar(
  base: BaseDeDatos,
  tipo: EventoDb["tipo"],
  id_estudiante: number | null,
  detalle: string,
): void {
  const max = base.eventos.reduce((m, e) => Math.max(m, e.id_evento), 0);
  base.eventos.push({
    id_evento: max + 1,
    fecha: new Date().toISOString(),
    tipo,
    id_estudiante,
    detalle,
  });
}

export interface DatosEvento {
  tipo: EventoDb["tipo"];
  id_estudiante: number | null;
  detalle: string;
}

export const db = {
  getAll<C extends Coleccion>(coleccion: C): BaseDeDatos[C] {
    return leer()[coleccion];
  },

  getById<C extends Coleccion>(coleccion: C, id: number): BaseDeDatos[C][number] | undefined {
    const items = leer()[coleccion] as unknown as Array<Record<string, unknown>>;
    const hallado = items.find((it) => it[ID_DE[coleccion]] === id);
    return hallado as unknown as BaseDeDatos[C][number] | undefined;
  },

  create<C extends Coleccion>(
    coleccion: C,
    datos: SinId<BaseDeDatos[C][number]>,
    evento?: DatosEvento,
  ): BaseDeDatos[C][number] {
    const base = leer();
    const nuevo = { ...datos, [ID_DE[coleccion]]: siguienteId(base, coleccion) } as unknown as BaseDeDatos[C][number];
    (base[coleccion] as unknown as Array<unknown>).push(nuevo);
    if (evento) registrar(base, evento.tipo, evento.id_estudiante, evento.detalle);
    guardar(base);
    return nuevo;
  },

  update<C extends Coleccion>(
    coleccion: C,
    id: number,
    cambios: Partial<SinId<BaseDeDatos[C][number]>>,
    evento?: DatosEvento,
  ): BaseDeDatos[C][number] | undefined {
    const base = leer();
    const items = base[coleccion] as unknown as Array<Record<string, unknown>>;
    const i = items.findIndex((it) => it[ID_DE[coleccion]] === id);
    if (i < 0) return undefined;
    items[i] = { ...items[i], ...cambios };
    if (evento) registrar(base, evento.tipo, evento.id_estudiante, evento.detalle);
    guardar(base);
    return items[i] as unknown as BaseDeDatos[C][number];
  },

  remove<C extends Coleccion>(coleccion: C, id: number, evento?: DatosEvento): boolean {
    const base = leer();
    const items = base[coleccion] as unknown as Array<Record<string, unknown>>;
    const i = items.findIndex((it) => it[ID_DE[coleccion]] === id);
    if (i < 0) return false;
    items.splice(i, 1);
    if (evento) registrar(base, evento.tipo, evento.id_estudiante, evento.detalle);
    guardar(base);
    return true;
  },

  eventosDe(idEstudiante: number): EventoDb[] {
    return leer()
      .eventos.filter((e) => e.id_estudiante === idEstudiante)
      .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  },

  /** Registra un evento suelto (p. ej. tras un create, cuando el id ya existe). */
  registrarEvento(datos: DatosEvento): void {
    const base = leer();
    registrar(base, datos.tipo, datos.id_estudiante, datos.detalle);
    guardar(base);
  },

  reset(): void {
    try {
      localStorage.removeItem(CLAVE);
    } catch {
      // Sin acceso a localStorage: no hay nada que limpiar.
    }
    const base = sembrar();
    registrar(base, "reseteo", null, "Datos de prueba restablecidos");
    guardar(base);
  },
};
