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
import { RequireAuth, RequireRol } from "./guards";

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
          { path: ROUTES.nuevoEstudiante, element: <NuevoEstudiantePage /> },
          { path: ROUTES.detalleEstudiante(), element: <DetalleEstudiantePage /> },
          { path: ROUTES.editarEstudiante(), element: <NuevoEstudiantePage /> },
          { path: ROUTES.nuevaEvaluacion, element: <EvaluacionPage /> },
          { path: ROUTES.evaluacionPorId(), element: <EvaluacionPage /> },
          { path: ROUTES.becas, element: <BecasPage /> },
          { path: ROUTES.configuracion, element: <ConfiguracionPage /> },
          { path: ROUTES.seguimiento, element: <SeguimientoPage /> },
          { path: ROUTES.reportes, element: <ReportesPage /> },
          {
            element: <RequireRol roles={["Administrador"]} />,
            children: [{ path: ROUTES.administracion, element: <AdministracionPage /> }],
          },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
