import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { FormField } from "../components/FormField";
import { PageHeader } from "../components/PageHeader";
import { Spinner } from "../components/Spinner";
import { ROUTES } from "../routing/routes";
import { USE_MOCKS } from "../services/api/client";
import { authApi } from "../services/api/auth";
import { useAuth } from "../state/AuthContext";
import { useToast } from "../state/ToastContext";

/** Cambio de contraseña (obligatorio al primer ingreso o desde el menú). */
export function CambiarPasswordPage({ obligatorio = false }: { obligatorio?: boolean }) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const auth = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const guardar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError("");
    if (nueva.length < 8 || !/[A-Za-z]/.test(nueva) || !/[0-9]/.test(nueva)) {
      setError("La nueva contraseña debe tener mínimo 8 caracteres, letra y número.");
      return;
    }
    if (nueva !== confirmar) {
      setError("La confirmación no coincide.");
      return;
    }
    setCargando(true);
    try {
      const r = await authApi.cambiarPassword(actual, nueva);
      if (!USE_MOCKS) {
        localStorage.setItem("dss-becas-token", r.token);
      }
      toast.exito("Contraseña actualizada. Tus otras sesiones se cerraron.");
      auth.salir();
      navigate(ROUTES.login, { replace: true });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo cambiar la contraseña.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="page">
      <PageHeader title={obligatorio ? "Cambiá tu contraseña para continuar" : "Cambiar contraseña"} />
      <Card title="Contraseña">
        <form onSubmit={guardar} noValidate>
          <FormField label="Contraseña actual">
            <input className="input" type="password" autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)} />
          </FormField>
          <FormField label="Nueva contraseña">
            <input className="input" type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} />
          </FormField>
          <FormField label="Confirmar nueva">
            <input className="input" type="password" autoComplete="new-password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
          </FormField>
          {error && <p className="error">{error}</p>}
          {cargando ? <Spinner texto="Guardando…" /> : <Button type="submit">Guardar</Button>}
        </form>
      </Card>
    </div>
  );
}
