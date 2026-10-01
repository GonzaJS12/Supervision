import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/sesion";
import { listarUsuarios } from "@/lib/server/usuarios";
import { BotonEstado } from "./boton-estado";

export default async function UsuariosPage() {
  const sesion = await obtenerSesion();

  if (!sesion || sesion.rol !== "ADMIN") {
    redirect("/dashboard");
  }

  const usuarios = await listarUsuarios();

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Usuarios
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Cuentas de esta aplicación (no son agentes sanitarios).
          </p>
        </div>
        <Link
          href="/admin/usuarios/nuevo"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
        >
          Nuevo usuario
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Área</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <Link className="underline" href={`/admin/usuarios/${usuario.id}`}>
                    {usuario.apellido}, {usuario.nombre}
                  </Link>
                </td>
                <td className="px-4 py-3">{usuario.email}</td>
                <td className="px-4 py-3">
                  {usuario.rol === "ADMIN"
                    ? "Administrador"
                    : "Supervisor"}
                </td>
                <td className="px-4 py-3">
                  {usuario.areaOperativa?.nombre ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {usuario.activo ? "Activo" : "Inactivo"}
                </td>
                <td className="px-4 py-3">
                  <BotonEstado
                    id={usuario.id}
                    activo={usuario.activo}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
