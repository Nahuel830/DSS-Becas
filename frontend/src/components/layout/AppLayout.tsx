import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const cerrar = () => setMenuAbierto(false);

  return (
    <div className="app-shell">
      <Sidebar abierto={menuAbierto} alNavegar={cerrar} />
      <div className="main">
        <Header alMenu={() => setMenuAbierto((v) => !v)} />
        <Outlet />
      </div>
    </div>
  );
}
