"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
  { nombre: "Dashboard", ruta: "/" },
  { nombre: "Agenda", ruta: "/agenda" },
  { nombre: "Clases", ruta: "/clases" },
  { nombre: "Alumnos", ruta: "/alumnos" },
  { nombre: "Grupos", ruta: "/grupos" },
  { nombre: "Ubicaciones", ruta: "/ubicaciones" },
  { nombre: "Bonos", ruta: "/bonos" },
  { nombre: "Pagos", ruta: "/pagos" },
  { nombre: "Informes", ruta: "/informes" },
];

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="w-64 shrink-0 bg-slate-900 p-6 text-white">
        <h1 className="text-2xl font-bold">
          Espacio Pádel
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Manager
        </p>

        <nav className="mt-10 space-y-2">
          {menu.map((opcion) => {
            const activo =
              opcion.ruta === "/"
                ? pathname === "/"
                : pathname.startsWith(opcion.ruta);

            return (
              <Link
                key={opcion.ruta}
                href={opcion.ruta}
                className={
                  activo
                    ? "block rounded-xl bg-teal-600 px-4 py-3 font-medium"
                    : "block rounded-xl px-4 py-3 hover:bg-slate-800"
                }
              >
                {opcion.nombre}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        {children}
      </div>
    </div>
  );
}