import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { AdministracionPage } from "../pages/AdministracionPage";
import { BecasPage } from "../pages/BecasPage";
import { CambiarPasswordPage } from "../pages/CambiarPasswordPage";
import { ConfiguracionPage } from "../pages/ConfiguracionPage";
import { SeguimientoPage } from "../pages/SeguimientoPage";
import { DashboardPage } from "../pages/DashboardPage";
import { DetalleEstudiantePage } from "../pages/DetalleEstudiantePage";
import { EstudiantesPage } from "../pages/EstudiantesPage";
import { EvaluacionPage } from "../pages/EvaluacionPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { NuevoEstudiantePage } from "../pages/NuevoEstudiantePage";
import { ReportesPage } from "../pages/ReportesPage";
import { ROUTES } from "./routes";
import { RequireAuth, RequirePermiso } from "./guards";

export const router = createBrowserRouter([
  { path: ROUTES.login, element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      { path: ROUTES.cambiarPassword, element: <CambiarPasswordPage /> },
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to={ROUTES.dashboard} replace /> },
          { path: ROUTES.dashboard, element: <DashboardPage /> },
          { path: ROUTES.estudiantes, element: <EstudiantesPage /> },
          {
            element: <RequirePermiso permiso="estudiantes:crear" />,
            children: [{ path: ROUTES.nuevoEstudiante, element: <NuevoEstudiantePage /> }],
          },
          { path: ROUTES.detalleEstudiante(), element: <DetalleEstudiantePage /> },
          {
            element: <RequirePermiso permiso="estudiantes:editar" />,
            children: [{ path: ROUTES.editarEstudiante(), element: <NuevoEstudiantePage /> }],
          },
          {
            element: <RequirePermiso permiso="evaluaciones:crear" />,
            children: [
              { path: ROUTES.nuevaEvaluacion, element: <EvaluacionPage /> },
              { path: ROUTES.evaluacionPorId(), element: <EvaluacionPage /> },
            ],
          },
          { path: ROUTES.becas, element: <BecasPage /> },
          {
            element: <RequirePermiso permiso="configuracion:ver" />,
            children: [{ path: ROUTES.configuracion, element: <ConfiguracionPage /> }],
          },
          { path: ROUTES.seguimiento, element: <SeguimientoPage /> },
          { path: ROUTES.reportes, element: <ReportesPage /> },
          {
            element: <RequirePermiso permiso="usuarios:gestionar" />,
            children: [{ path: ROUTES.administracion, element: <AdministracionPage /> }],
          },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
