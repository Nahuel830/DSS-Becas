import { useCallback, useEffect, useState } from "react";

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  recargar: () => void;
}

/** Hook de carga con estados loading/error/data y recarga manual. */
export function useAsync<T>(cargar: () => Promise<T>): AsyncState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vivo = true;
    setLoading(true);
    setError(null);
    // `cargar` se evalúa solo cuando cambia `intento` (firma estable por llamada).
    cargar()
      .then((d) => {
        if (vivo) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (vivo) {
          setError(e instanceof Error ? e.message : "Error inesperado");
          setLoading(false);
        }
      });
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intento]);

  const recargar = useCallback(() => setIntento((i) => i + 1), []);
  return { data, loading, error, recargar };
}
