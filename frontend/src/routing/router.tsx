import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { AdministracionPage } from "../pages/AdministracionPage";
import { BecasPage } from "../pages/BecasPage";
import { DashboardPage } from "../pages/DashboardPage";
import { DetalleEstudiantePage } from "../pages/DetalleEstudiantePage";
import { EstudiantesPage } from "../pages/EstudiantesPage";
import { EvaluacionPage } from "../pages/EvaluacionPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { NuevoEstudiantePage } from "../pages/NuevoEstudiantePage";
import { PlaceholderPage } from "../pages/PlaceholderPage";
import { ROUTES } from "./routes";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to={ROUTES.dashboard} replace /> },
      { path: ROUTES.dashboard, element: <DashboardPage /> },
      { path: ROUTES.estudiantes, element: <EstudiantesPage /> },
      { path: ROUTES.nuevoEstudiante, element: <NuevoEstudiantePage /> },
      { path: ROUTES.detalleEstudiante(), element: <DetalleEstudiantePage /> },
      { path: ROUTES.nuevaEvaluacion, element: <EvaluacionPage /> },
      { path: ROUTES.becas, element: <BecasPage /> },
      // Sin endpoint ni mock: placeholder hasta fase 2.
      { path: ROUTES.seguimiento, element: <PlaceholderPage title="Seguimiento" /> },
      { path: ROUTES.reportes, element: <PlaceholderPage title="Reportes" /> },
      { path: ROUTES.administracion, element: <AdministracionPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
