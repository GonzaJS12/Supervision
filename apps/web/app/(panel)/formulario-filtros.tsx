"use client";

import { useRef, type FormEvent, type ReactNode } from "react";

export function FormularioFiltros({
  action,
  className,
  children,
}: {
  action: string;
  className?: string;
  children: ReactNode;
}) {
  const debounceNombre = useRef<number | null>(null);

  function aplicarSiCorresponde(evento: FormEvent<HTMLFormElement>) {
    const destino = evento.target as HTMLInputElement | HTMLSelectElement;

    if (destino.name === "nombre") {
      if (debounceNombre.current) {
        window.clearTimeout(debounceNombre.current);
      }
      const formulario = evento.currentTarget;
      debounceNombre.current = window.setTimeout(() => {
        formulario.requestSubmit();
      }, 400);
      return;
    }

    if (destino.tagName === "SELECT" || destino.type === "date") {
      if (destino.name === "areaOperativaId") {
        const sector = evento.currentTarget.elements.namedItem("sectorId");
        if (sector instanceof HTMLSelectElement) {
          sector.value = "";
        }
      }
      evento.currentTarget.requestSubmit();
    }
  }

  return (
    <form
      action={action}
      className={className}
      onChange={aplicarSiCorresponde}
    >
      {children}
    </form>
  );
}
