import { clasificarPuntaje } from "../../utils/dss";
import { USE_MOCKS, apiClient, simularRetardo } from "./client";
import { db } from "./db";
import type { Evaluacion } from "./types";

export const evaluacionesApi = {
  /** POST /evaluaciones. En mock persiste en db, actualiza el resultado y registra el evento. */
  create: async (data: Evaluacion): Promise<void> => {
    if (USE_MOCKS) {
      await simularRetardo();
      const { id_evaluacion: _sinId, ...resto } = data;
      void _sinId;
      const creada = db.create("evaluaciones", resto);
      const final = creada.puntaje_final ?? 0;
      const previa = db.getAll("resultados").find((r) => r.id_estudiante === creada.id_estudiante);
      const etiqueta = clasificarPuntaje(final);
      if (previa?.id_resultado) {
        db.update("resultados", previa.id_resultado, { resultado: etiqueta });
      } else {
        db.create("resultados", { id_estudiante: creada.id_estudiante, resultado: etiqueta });
      }
      db.registrarEvento({
        tipo: "evaluacion",
        id_estudiante: creada.id_estudiante ?? null,
        detalle: `Evaluación registrada con puntaje ${final}`,
      });
      return;
    }
    await apiClient.post<unknown>("/evaluaciones", data);
  },
};
