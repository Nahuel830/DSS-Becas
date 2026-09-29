import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { FormField } from "../components/FormField";
import { PageHeader } from "../components/PageHeader";
import { Spinner } from "../components/Spinner";
import { ROUTES } from "../routing/routes";
import { useAuth } from "../state/AuthContext";

/** Acceso al sistema con usuario o correo + contraseña. */
export function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [ver, setVer] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const ingresar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError("");
    if (!usuario.trim() || !password) {
      setError("Ingresá tu usuario y tu contraseña.");
      return;
    }
    setCargando(true);
    try {
      await auth.ingresar(usuario, password);
      const destino =
        (location.state as { desde?: string } | null)?.desde ?? ROUTES.dashboard;
      navigate(destino, { replace: true });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo ingresar.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="page login-page">
      <PageHeader title="Acceso al sistema" />
      {auth.aviso && <p className="error">{auth.aviso}</p>}
      <Card title="DSS-Becas · Bienestar Universitario">
        <form onSubmit={ingresar} noValidate>
          <FormField label="Usuario">
            <input
              className="input"
              placeholder="usuario o correo"
              autoComplete="username"
              autoFocus
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />
          </FormField>
          <FormField label="Contraseña">
            <div className="password-row">
              <input
                className="input"
                type={ver ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button className="btn btn-secondary" type="button" onClick={() => setVer((v) => !v)}>
                {ver ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </FormField>
          {error && <p className="error">{error}</p>}
          {cargando ? (
            <Spinner texto="Ingresando…" />
          ) : (
            <Button type="submit">Ingresar</Button>
          )}
        </form>
      </Card>
    </div>
  );
}
