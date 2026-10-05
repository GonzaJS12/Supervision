import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/sesion";
import {
  buscarUsuario,
  listarAreasActivas,
} from "@/lib/server/usuarios";
import { ErrorNegocio, parseIdPagina } from "@/lib/errores";
import { FormularioEditarUsuario } from "./formulario";

export default async function DetalleUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const usuarioId = parseIdPagina(id);

  if (usuarioId == null) {
    return <ErrorDetalleUsuario mensaje="No se indicó un usuario." />;
  }

  let usuario;

  try {
    usuario = await buscarUsuario(usuarioId);
  } catch (error) {
    if (error instanceof ErrorNegocio) {
      return <ErrorDetalleUsuario mensaje="No se pudo cargar el usuario." />;
    }
    throw error;
  }

  let areas: Awaited<ReturnType<typeof listarAreasActivas>> = [];

  if (usuario.rol === "SUPERVISOR") {
    try {
      areas = await listarAreasActivas();
    } catch {
      return (
        <ErrorDetalleUsuario mensaje="No se pudo cargar el usuario." />
      );
    }
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Modificar usuario
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Modifique los datos de la cuenta seleccionada.
          </p>
        </div>
        <Link
          href="/admin/usuarios"
          className="self-start rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Volver
        </Link>
      </div>
      <FormularioEditarUsuario usuario={usuario} areas={areas} />
    </main>
  );
}

function ErrorDetalleUsuario({ mensaje }: { mensaje: string }) {
  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {mensaje}
      </div>
      <Link
        href="/admin/usuarios"
        className="mt-4 inline-block text-sm font-semibold text-blue-600"
      >
        Volver
      </Link>
    </main>
  );
}
