import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Supervisión de Agentes Sanitarios",
  description: "Sistema de Supervisión de Agentes Sanitarios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
