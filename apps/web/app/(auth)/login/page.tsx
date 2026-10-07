"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CampoPassword } from "@/components/campo-password";
import { ds } from "@/lib/ds";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function onSubmit(evento: FormEvent) {
    evento.preventDefault();
    setError("");
    setCargando(true);

    try {
      const respuesta = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      await respuesta.json();

      if (!respuesta.ok) {
        setError("Correo o contraseña incorrectos.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-blue-950 px-12 py-16 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
            Salud pública
          </p>
          <h1 className="mt-4 max-w-lg text-4xl font-bold leading-tight">
            Sistema de Supervisión de Agentes Sanitarios
          </h1>
          <p className="mt-6 max-w-lg text-slate-300">
            Plataforma para el registro, seguimiento y evaluación de las
            supervisiones realizadas a los agentes sanitarios.
          </p>
          <div className="mt-10 grid max-w-lg grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="font-medium text-white">Supervisión</p>
              <p className="mt-1 text-sm leading-5 text-slate-400">
                Registro estructurado de evaluaciones.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="font-medium text-white">Seguimiento</p>
              <p className="mt-1 text-sm leading-5 text-slate-400">
                Información organizada para la gestión.
              </p>
            </div>
          </div>
        </div>
        <p className="mt-10 text-xs text-slate-500">
          Acceso exclusivo para usuarios autorizados
        </p>
      </section>

      <section className="flex min-h-screen items-center px-6 py-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-blue-600">
              Supervisión sanitaria
            </p>
          </div>
          <p className={ds.kicker}>Bienvenido</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Iniciar sesión
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Ingresá tus credenciales para acceder al sistema de supervisión.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <label className={ds.etiqueta}>
              Correo electrónico
              <input
                className={ds.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="nombre@correo.com"
                required
                disabled={cargando}
              />
            </label>

            <CampoPassword
              label="Contraseña"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              placeholder="Ingresá tu contraseña"
              required
              disabled={cargando}
            />

            {error && (
              <div role="alert" className={ds.alertaError}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className={`w-full ${ds.botonPrimario}`}
            >
              {cargando ? "Ingresando..." : "Ingresar al sistema"}
            </button>
          </form>
          <p className="mt-8 border-t border-slate-200 pt-6 text-center text-xs leading-5 text-slate-400">
            Sistema de Supervisión de Agentes Sanitarios
          </p>
        </div>
      </section>
    </main>
  );
}
