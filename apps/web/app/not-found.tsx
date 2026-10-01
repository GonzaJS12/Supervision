import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-xl font-semibold text-slate-900">
        No encontrado
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Esa página o registro no existe, o no tenés permiso para verlo.
      </p>
      <Link href="/dashboard" className="mt-4 inline-block underline">
        Volver al inicio
      </Link>
    </main>
  );
}
