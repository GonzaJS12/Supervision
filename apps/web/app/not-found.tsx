import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
        404
      </p>
      <h1 className="text-2xl font-semibold text-slate-900">
        Página no encontrada
      </h1>
      <p className="text-slate-600">
        El recurso no existe o ya no está disponible.
      </p>
      <Link
        href="/login"
        className="inline-flex w-fit rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Ir al inicio de sesión
      </Link>
    </main>
  );
}
