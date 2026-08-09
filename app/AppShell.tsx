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
  { nombre: "No disponibilidad", ruta: "/no-disponibilidad" },
  { nombre: "Bonos", ruta: "/bonos" },
  { nombre: "Pagos", ruta: "/pagos" },
  { nombre: "Tarifas", ruta: "/tarifas" },
  { nombre: "Informes", ruta: "/informes" },
  { nombre: "Copias", ruta: "/copias" },
];

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [comprobandoSesion, setComprobandoSesion] =
    useState(true);

  const [haySesion, setHaySesion] =
    useState(false);

  const [menuAbierto, setMenuAbierto] =
    useState(false);

  useEffect(() => {
    comprobarSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setHaySesion(!!session);
        setComprobandoSesion(false);

        if (
          !session &&
          pathname !== "/login"
        ) {
          router.replace("/login");
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  async function comprobarSesion() {
    const {
      data: { session },
    } =
      await supabase.auth.getSession();

    setHaySesion(!!session);
    setComprobandoSesion(false);

    if (
      !session &&
      pathname !== "/login"
    ) {
      router.replace("/login");
    }

  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (
    comprobandoSesion ||
    !haySesion
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
        Cargando...
      </div>
    );
  }

  const contenidoMenu = (
    <>
      <div>
        <img
          src="/logo-espacio-padel-blanco.png"
          alt="Espacio Pádel Academy"
          className="mx-auto h-auto w-full max-w-[185px]"
        />

        <p className="mt-4 text-center text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
          Manager
        </p>
      </div>

      <nav className="mt-9 space-y-2">
        {menu.map((opcion) => {
          const activo =
            opcion.ruta === "/"
              ? pathname === "/"
              : pathname.startsWith(
                  opcion.ruta
                );

          return (
            <Link
              key={opcion.ruta}
              href={opcion.ruta}
              className={
                activo
                  ? "block rounded-xl bg-teal-600 px-4 py-3 font-medium text-white shadow-sm"
                  : "block rounded-xl px-4 py-3 text-slate-200 transition hover:bg-slate-800 hover:text-white"
              }
            >
              {opcion.nombre}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 pt-8">
        <Link
          href="/mi-cuenta"
          className={
            pathname.startsWith("/mi-cuenta")
              ? "block w-full rounded-xl bg-slate-800 px-4 py-3 text-left text-sm font-semibold text-white"
              : "block w-full rounded-xl border border-slate-700 px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
          }
        >
          Mi cuenta
        </Link>

        <button
          onClick={cerrarSesion}
          className="w-full rounded-xl border border-slate-700 px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
        >
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-slate-900 p-6 text-white lg:flex print:hidden">
        {contenidoMenu}
      </aside>

      <div className="lg:ml-64 print:ml-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-slate-900 px-4 py-3 lg:hidden print:hidden">
          <div className="flex items-center gap-3">
            <img
              src="/logo-espacio-padel-blanco.png"
              alt="Espacio Pádel Academy"
              className="h-auto w-[110px]"
            />

            <span className="border-l border-slate-700 pl-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Manager
            </span>
          </div>

          <button
            onClick={() =>
              setMenuAbierto(true)
            }
            className="rounded-xl bg-teal-600 px-4 py-2 font-semibold text-white"
          >
            Menú
          </button>
        </header>

        {menuAbierto && (
          <div className="fixed inset-0 z-50 lg:hidden print:hidden">
            <button
              onClick={() =>
                setMenuAbierto(false)
              }
              className="absolute inset-0 bg-black/40"
              aria-label="Cerrar menú"
            />

            <aside className="relative flex h-full w-72 flex-col bg-slate-900 p-6 text-white shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <img
                    src="/logo-espacio-padel-blanco.png"
                    alt="Espacio Pádel Academy"
                    className="mx-auto h-auto w-full max-w-[165px]"
                  />

                  <p className="mt-4 text-center text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Manager
                  </p>
                </div>

                <button
                  onClick={() =>
                    setMenuAbierto(false)
                  }
                  className="rounded-lg bg-slate-800 px-3 py-2 text-sm"
                >
                  Cerrar
                </button>
              </div>

              <nav className="mt-8 space-y-2">
                {menu.map((opcion) => {
                  const activo =
                    opcion.ruta === "/"
                      ? pathname === "/"
                      : pathname.startsWith(
                          opcion.ruta
                        );

                  return (
                    <Link
                      key={opcion.ruta}
                      href={opcion.ruta}
                      className={
                        activo
                          ? "block rounded-xl bg-teal-600 px-4 py-3 font-medium text-white"
                          : "block rounded-xl px-4 py-3 text-slate-200 hover:bg-slate-800 hover:text-white"
                      }
                    >
                      {opcion.nombre}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto space-y-2 pt-8">
                <Link
                  href="/mi-cuenta"
                  className={
                    pathname.startsWith("/mi-cuenta")
                      ? "block w-full rounded-xl bg-slate-800 px-4 py-3 text-left text-sm font-semibold text-white"
                      : "block w-full rounded-xl border border-slate-700 px-4 py-3 text-left text-sm font-medium text-slate-300"
                  }
                >
                  Mi cuenta
                </Link>

                <button
                  onClick={cerrarSesion}
                  className="w-full rounded-xl border border-slate-700 px-4 py-3 text-left text-sm font-medium text-slate-300"
                >
                  Cerrar sesión
                </button>
              </div>
            </aside>
          </div>
        )}

        <div className="min-w-0 print:min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
