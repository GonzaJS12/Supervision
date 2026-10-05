import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/sesion";
import { listarUsuarios } from "@/lib/server/usuarios";

export default async function UsuariosPage() {
  const sesion = await obtenerSesion();

  if (!sesion || sesion.rol !== "ADMIN") {
    redirect("/dashboard");
  }

  let usuarios: Awaited<ReturnType<typeof listarUsuarios>> = [];
  let error = "";

  try {
    usuarios = await listarUsuarios();
  } catch {
    error = "No se pudieron cargar los usuarios.";
  }

  const activos = usuarios.filter((usuario) => usuario.activo).length;
  const supervisores = usuarios.filter(
    (usuario) => usuario.rol === "SUPERVISOR",
  ).length;
  const administradores = usuarios.filter(
    (usuario) => usuario.rol === "ADMIN",
  ).length;

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="flex items-center justify-between">
        <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
        Administración
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Usuarios
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Administre las cuentas con acceso al sistema, sus roles, áreas
            operativas y estado.
          </p>
        </div>
        <Link
          href="/admin/usuarios/nuevo"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
        >
          Nuevo usuario
        </Link>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Resumen titulo="Usuarios" valor={usuarios.length} detalle="Cuentas registradas" />
        <Resumen titulo="Activos" valor={activos} detalle="Con acceso habilitado" />
        <Resumen titulo="Supervisores" valor={supervisores} detalle="Usuarios territoriales" />
        <Resumen titulo="Administradores" valor={administradores} detalle="Gestión del sistema" />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Usuarios registrados
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Cuentas habilitadas para acceder y operar dentro del sistema.
            </p>
          </div>
          {usuarios.length > 0 && (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {usuarios.length} {usuarios.length === 1 ? "usuario" : "usuarios"}
            </span>
          )}
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Área operativa</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 && (
              <tr>
                <td
                  className="px-4 py-8 text-center text-slate-500"
                  colSpan={5}
                >
                  <p className="font-medium text-slate-700">
                    No hay usuarios registrados
                  </p>
                  <p className="mt-1">
                    Cree la primera cuenta para comenzar a administrar el
                    acceso al sistema.
                  </p>
                  <Link
                    href="/admin/usuarios/nuevo"
                    className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
                  >
                    Nuevo usuario
                  </Link>
                </td>
              </tr>
            )}
            {usuarios.map((usuario) => (
              <tr key={usuario.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800">
                    {usuario.apellido}, {usuario.nombre}
                  </p>
                  <p className="text-xs text-slate-500">{usuario.email}</p>
                </td>
                <td className="px-4 py-3">
                  {usuario.rol === "ADMIN" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                      Administrador
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      Supervisor
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {usuario.rol === "SUPERVISOR"
                    ? usuario.areaOperativa?.nombre ?? "Sin área"
                    : "No corresponde"}
                </td>
                <td className="px-4 py-3">
                  {usuario.activo ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      Inactivo
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                    href={`/admin/usuarios/${usuario.id}`}
                  >
                    Modificar usuario
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function Resumen({
  titulo,
  valor,
  detalle,
}: {
  titulo: string;
  valor: number;
  detalle: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs text-slate-500">{titulo}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{valor}</p>
      <p className="mt-1 text-xs text-slate-400">{detalle}</p>
    </div>
  );
}
