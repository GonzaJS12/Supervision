export const ds = {
  kicker:
    "text-xs font-semibold uppercase tracking-[0.16em] text-blue-600",
  titulo: "text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl",
  subtitulo: "mt-1 text-sm leading-6 text-slate-500",
  tarjeta:
    "rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
  tarjetaLink:
    "rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40",
  botonPrimario:
    "inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60",
  botonSecundario:
    "inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60",
  input:
    "mt-2 w-full min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50",
  etiqueta: "block text-sm font-semibold text-slate-700",
  alertaError:
    "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800",
  alertaOk:
    "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800",
  alertaAviso:
    "rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900",
} as const;
