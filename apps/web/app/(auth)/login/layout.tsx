import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/sesion";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesion = await obtenerSesion();

  if (sesion) {
    redirect("/dashboard");
  }

  return children;
}
