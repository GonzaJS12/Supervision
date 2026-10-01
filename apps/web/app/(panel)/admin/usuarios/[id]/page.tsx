import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/sesion";
import {
  buscarUsuario,
  listarAreasActivas,
} from "@/lib/server/usuarios";
import { ErrorNegocio } from "@/lib/errores";
import { FormularioEditarUsuario } from "./formulario";
import { BotonEstado } from "../boton-estado";

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
  let usuario;

  try {
    usuario = await buscarUsuario(Number(id));
  } catch (error) {
    if (error instanceof ErrorNegocio && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const areas = await listarAreasActivas();

  return (
    <main className="mx-auto max-w-5xl p-8">
      <Link
        href="/admin/usuarios"
        className="text-sm text-slate-500 underline"
      >
        Volver a usuarios
      </Link>
      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {usuario.apellido}, {usuario.nombre}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {usuario.rol === "ADMIN" ? "Administrador" : "Supervisor"} ·{" "}
            {usuario.activo ? "Activo" : "Inactivo"}
          </p>
        </div>
        <BotonEstado id={usuario.id} activo={usuario.activo} />
      </div>
      <FormularioEditarUsuario usuario={usuario} areas={areas} />
    </main>
  );
}
