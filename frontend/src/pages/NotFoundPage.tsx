import { Link } from "react-router-dom";
import { ROUTES } from "../routing/routes";

export function NotFoundPage() {
  return (
    <div className="page">
      <h1>Página no encontrada</h1>
      <p>
        <Link to={ROUTES.dashboard}>Volver al Dashboard</Link>
      </p>
    </div>
  );
}
