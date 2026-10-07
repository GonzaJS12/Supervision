"use client";

import { useState } from "react";
import { ds } from "@/lib/ds";

type Props = {
  label: string;
  name?: string;
  value?: string;
  onChange?: (valor: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  disabled?: boolean;
  className?: string;
};

export function CampoPassword({
  label,
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  minLength,
  disabled,
  className = "",
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <label className={ds.etiqueta}>
      {label}
      <span className="relative mt-2 block font-normal">
        <input
          name={name}
          value={value}
          onChange={
            onChange ? (evento) => onChange(evento.target.value) : undefined
          }
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          disabled={disabled}
          className={`${ds.input} mt-0 pr-24 ${className}`}
        />
        <button
          type="button"
          onClick={() => setVisible((actual) => !actual)}
          className="absolute inset-y-0 right-2 my-auto h-8 rounded px-2 text-xs font-semibold text-blue-600"
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </span>
    </label>
  );
}
