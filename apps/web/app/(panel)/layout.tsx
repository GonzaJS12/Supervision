import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/sesion";
import { CerrarSesionBoton } from "./cerrar-sesion";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesion = await obtenerSesion();

  if (!sesion) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Supervisión APS
            </p>
            <p className="text-xs text-slate-500">
              {sesion.nombre} {sesion.apellido} · {sesion.rol}
            </p>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link className="text-slate-600 hover:text-slate-900" href="/dashboard">
              Inicio
            </Link>
            <Link className="text-slate-600 hover:text-slate-900" href="/agentes">
              Agentes
            </Link>
            <Link className="text-slate-600 hover:text-slate-900" href="/supervisiones">
              Supervisiones
            </Link>
            {sesion.rol === "ADMIN" && (
              <>
                <Link className="text-slate-600 hover:text-slate-900" href="/admin/usuarios">
                  Usuarios
                </Link>
                <Link className="text-slate-600 hover:text-slate-900" href="/admin/bloques">
                  Evaluación
                </Link>
              </>
            )}
            <CerrarSesionBoton />
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
