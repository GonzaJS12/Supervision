import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/sesion";
import { NavegacionPanel } from "./navegacion";

export const dynamic = "force-dynamic";

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
      <NavegacionPanel
        sesion={{
          nombre: sesion.nombre,
          apellido: sesion.apellido,
          rol: sesion.rol,
          areaOperativaNombre: sesion.areaOperativaNombre ?? null,
        }}
      >
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </NavegacionPanel>
    </div>
  );
}
