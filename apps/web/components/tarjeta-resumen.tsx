export function TarjetaResumen({
  titulo,
  valor,
  detalle,
  estilo,
}: {
  titulo: string;
  valor: number;
  detalle: string;
  estilo: "azul" | "verde" | "gris" | "violeta";
}) {
  const icono = {
    azul: "bg-blue-50 text-blue-600",
    verde: "bg-emerald-50 text-emerald-600",
    gris: "bg-slate-100 text-slate-600",
    violeta: "bg-violet-50 text-violet-600",
  }[estilo];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{titulo}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {valor}
          </p>
          <p className="mt-1 text-xs text-slate-400">{detalle}</p>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${icono}`}
        >
          <span className="text-lg font-bold">•</span>
        </div>
      </div>
    </div>
  );
}
