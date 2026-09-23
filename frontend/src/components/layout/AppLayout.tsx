import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <Header />
        <Outlet />
      </div>
    </div>
  );
}
