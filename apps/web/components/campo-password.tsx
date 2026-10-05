"use client";

import { useState } from "react";

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
  className = "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 pr-24 text-sm",
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block text-sm font-semibold text-slate-700">
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
          className={className}
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
