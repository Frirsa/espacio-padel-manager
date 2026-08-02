"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

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
  const router = useRouter();

  const [comprobandoSesion, setComprobandoSesion] = useState(true);
  const [haySesion, setHaySesion] = useState(false);

  useEffect(() => {
    comprobarSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHaySesion(!!session);
      setComprobandoSesion(false);

      if (!session && pathname !== "/login") {
        router.replace("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  async function comprobarSesion() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setHaySesion(!!session);
    setComprobandoSesion(false);

    if (!session && pathname !== "/login") {
      router.replace("/login");
    }

    if (session && pathname === "/login") {
      router.replace("/");
    }
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (comprobandoSesion || !haySesion) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          Cargando...
        </p>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="flex w-64 shrink-0 flex-col bg-slate-900 p-6 text-white">
        <div>
          <h1 className="text-2xl font-bold">
            Espacio Pádel
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Manager
          </p>
        </div>

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

        <div className="mt-auto pt-8">
          <button
            onClick={cerrarSesion}
            className="w-full rounded-xl border border-slate-700 px-4 py-3 text-left text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {children}
      </div>
    </div>
  );
}