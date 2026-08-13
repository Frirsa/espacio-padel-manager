"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type IconoNombre =
  | "dashboard"
  | "agenda"
  | "clases"
  | "alumnos"
  | "grupos"
  | "ubicaciones"
  | "nodisponibilidad"
  | "bonos"
  | "pagos"
  | "tarifas"
  | "informes"
  | "copias"
  | "cuenta"
  | "salir"
  | "menu"
  | "cerrar";

const menu: Array<{
  nombre: string;
  ruta: string;
  icono: IconoNombre;
}> = [
  { nombre: "Dashboard", ruta: "/", icono: "dashboard" },
  { nombre: "Agenda", ruta: "/agenda", icono: "agenda" },
  { nombre: "Clases", ruta: "/clases", icono: "clases" },
  { nombre: "Alumnos", ruta: "/alumnos", icono: "alumnos" },
  { nombre: "Grupos", ruta: "/grupos", icono: "grupos" },
  { nombre: "Ubicaciones", ruta: "/ubicaciones", icono: "ubicaciones" },
  { nombre: "No disponibilidad", ruta: "/no-disponibilidad", icono: "nodisponibilidad" },
  { nombre: "Bonos", ruta: "/bonos", icono: "bonos" },
  { nombre: "Pagos", ruta: "/pagos", icono: "pagos" },
  { nombre: "Tarifas", ruta: "/tarifas", icono: "tarifas" },
  { nombre: "Informes", ruta: "/informes", icono: "informes" },
  { nombre: "Copias", ruta: "/copias", icono: "copias" },
];

const menuMovil = [
  { nombre: "Inicio", ruta: "/", icono: "dashboard" as IconoNombre },
  { nombre: "Agenda", ruta: "/agenda", icono: "agenda" as IconoNombre },
  { nombre: "Alumnos", ruta: "/alumnos", icono: "alumnos" as IconoNombre },
  { nombre: "Pagos", ruta: "/pagos", icono: "pagos" as IconoNombre },
];

function Icono({
  nombre,
  className = "h-5 w-5",
}: {
  nombre: IconoNombre;
  className?: string;
}) {
  const comunes = {
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.9,
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  switch (nombre) {
    case "dashboard":
      return <svg {...comunes}><path d="M3.75 12 12 4.5 20.25 12" /><path d="M5.25 10.75V20h13.5v-9.25" /><path d="M9.25 20v-5.75h5.5V20" /></svg>;
    case "agenda":
      return <svg {...comunes}><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M7.5 3.5v3M16.5 3.5v3M3.5 9h17" /><path d="M8 13h3M13 13h3M8 16.5h3M13 16.5h3" /></svg>;
    case "clases":
      return <svg {...comunes}><circle cx="12" cy="12" r="8.25" /><path d="M6.2 8.2c2.2 1.1 4 2.9 5.1 5.1M12.7 10.7c1.1 1.1 2 2.4 2.6 3.9" /></svg>;
    case "alumnos":
      return <svg {...comunes}><circle cx="12" cy="8" r="3.25" /><path d="M5 20c.55-4 2.9-6 7-6s6.45 2 7 6" /></svg>;
    case "grupos":
      return <svg {...comunes}><circle cx="8" cy="8.5" r="2.5" /><circle cx="16" cy="8.5" r="2.5" /><path d="M3.75 18.5c.45-3 1.85-4.75 4.25-4.75s3.8 1.75 4.25 4.75" /><path d="M11.75 18.5c.45-3 1.85-4.75 4.25-4.75s3.8 1.75 4.25 4.75" /></svg>;
    case "ubicaciones":
      return <svg {...comunes}><path d="M12 21s6-5.55 6-11a6 6 0 1 0-12 0c0 5.45 6 11 6 11Z" /><circle cx="12" cy="10" r="2.25" /></svg>;
    case "nodisponibilidad":
      return <svg {...comunes}><circle cx="12" cy="12" r="8.25" /><path d="m6.25 17.75 11.5-11.5" /></svg>;
    case "bonos":
      return <svg {...comunes}><path d="M4 7.25h16v9.5H4z" /><path d="M8 7.25v9.5M16 7.25v9.5" /><path d="M4 10.25a2 2 0 0 1 0 4M20 10.25a2 2 0 0 0 0 4" /></svg>;
    case "pagos":
      return <svg {...comunes}><circle cx="12" cy="12" r="8.25" /><path d="M14.75 8.25c-.65-.55-1.55-.85-2.55-.85-1.6 0-2.85.8-2.85 2s1.15 1.7 2.85 2c1.75.3 2.9.85 2.9 2.2 0 1.25-1.2 2.1-2.9 2.1-1.15 0-2.2-.35-2.95-1.05M12 5.8v12.4" /></svg>;
    case "tarifas":
      return <svg {...comunes}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 9h16M9 4v16M15 4v16M4 15h16" /></svg>;
    case "informes":
      return <svg {...comunes}><path d="M5 19.5V12M10 19.5V8M15 19.5V10.5M20 19.5V4.5" /><path d="M3.5 19.5h18" /></svg>;
    case "copias":
      return <svg {...comunes}><rect x="7" y="7" width="12.5" height="12.5" rx="2" /><path d="M16.5 7V5.5A2 2 0 0 0 14.5 3.5h-10a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2H7" /></svg>;
    case "cuenta":
      return <svg {...comunes}><rect x="3.5" y="5" width="17" height="14" rx="2.25" /><circle cx="9" cy="10" r="2.25" /><path d="M5.75 16c.4-2.15 1.5-3.25 3.25-3.25S11.85 13.85 12.25 16M14.5 9h3M14.5 12h3M14.5 15h2" /></svg>;
    case "salir":
      return <svg {...comunes}><path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10" /><path d="M13 8.25 16.75 12 13 15.75M8 12h8.5" /></svg>;
    case "cerrar":
      return <svg {...comunes}><path d="m6.5 6.5 11 11M17.5 6.5l-11 11" /></svg>;
    default:
      return <svg {...comunes}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
  }
}

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [comprobandoSesion, setComprobandoSesion] = useState(true);
  const [haySesion, setHaySesion] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

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

  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  async function comprobarSesion() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setHaySesion(!!session);
    setComprobandoSesion(false);

    if (!session && pathname !== "/login") {
      router.replace("/login");
    }
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function estaActivo(ruta: string) {
    return ruta === "/" ? pathname === "/" : pathname.startsWith(ruta);
  }

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (comprobandoSesion || !haySesion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F8FA]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#00A79C]" />
          <p className="text-sm font-medium text-slate-500">
            Cargando Espacio Pádel Manager...
          </p>
        </div>
      </div>
    );
  }

  const contenidoMenu = (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="px-2 pt-1">
          <img
            src="/logo-espacio-padel-blanco.png"
            alt="Espacio Pádel Academy"
            className="mx-auto h-auto w-full max-w-[150px] lg:max-w-[178px]"
          />

          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="h-px w-7 bg-white/15" />
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
              Manager<span className="lg:hidden"> · V2</span>
            </p>
            <span className="h-px w-7 bg-white/15" />
          </div>
        </div>

        <nav className="mt-5 space-y-1 overflow-y-auto pr-1 lg:mt-7">
          {menu.map((opcion) => {
            const activo = estaActivo(opcion.ruta);

            return (
              <Link
                key={opcion.ruta}
                href={opcion.ruta}
                className={
                  activo
                    ? "group flex items-center gap-3 rounded-xl bg-[#00A79C] px-3.5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(0,167,156,0.22)]"
                    : "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
                }
              >
                <span className={activo ? "text-white" : "text-slate-400 transition group-hover:text-white"}>
                  <Icono nombre={opcion.icono} />
                </span>
                <span className="min-w-0 truncate">{opcion.nombre}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-5 border-t border-white/10 pt-5">
        <Link
          href="/mi-cuenta"
          className={
            pathname.startsWith("/mi-cuenta")
              ? "flex items-center gap-3 rounded-xl bg-white/[0.09] px-3.5 py-3 text-sm font-semibold text-white"
              : "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
          }
        >
          <span className="text-slate-400"><Icono nombre="cuenta" /></span>
          <span>Mi cuenta</span>
        </Link>

        <button
          onClick={cerrarSesion}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium text-slate-400 transition hover:bg-white/[0.07] hover:text-white"
        >
          <Icono nombre="salir" />
          <span>Cerrar sesión</span>
        </button>

        <div className="mt-4 hidden items-center justify-center rounded-xl border border-[#00A79C]/30 bg-[#00A79C]/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#55D9D0] lg:flex">
          V2 · Desarrollo
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F6F8FA] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col bg-[#0F2742] px-5 py-6 text-white lg:flex print:hidden">
        {contenidoMenu}
      </aside>

      <div className="lg:ml-[272px] print:ml-0">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0F2742] lg:hidden print:hidden">
          <div className="flex h-[84px] items-center justify-between gap-3 px-4">
            <button
              type="button"
              onClick={() => setMenuAbierto(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-white transition hover:bg-white/[0.13]"
              aria-label="Abrir menú"
            >
              <Icono nombre="menu" />
            </button>

            <img
              src="/logo-espacio-padel-blanco.png"
              alt="Espacio Pádel Academy"
              className="h-[72px] w-auto max-w-none object-contain"
            />

            <Link
              href="/mi-cuenta"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#00A79C] text-white"
              aria-label="Mi cuenta"
            >
              <Icono nombre="cuenta" className="h-5 w-5" />
            </Link>
          </div>
        </header>

        <main className="min-w-0 pb-24 lg:pb-0 print:pb-0">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.06)] backdrop-blur lg:hidden print:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {menuMovil.map((opcion) => {
            const activo = estaActivo(opcion.ruta);

            return (
              <Link
                key={opcion.ruta}
                href={opcion.ruta}
                className={
                  activo
                    ? "flex min-w-0 flex-col items-center gap-1 rounded-xl bg-[#E8F7F5] px-1 py-2 text-[#008C83]"
                    : "flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-slate-500"
                }
              >
                <Icono nombre={opcion.icono} className="h-5 w-5" />
                <span className="max-w-full truncate text-[10px] font-bold">{opcion.nombre}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMenuAbierto(true)}
            className="flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-slate-500"
          >
            <Icono nombre="menu" className="h-5 w-5" />
            <span className="text-[10px] font-bold">Más</span>
          </button>
        </div>
      </nav>

      {menuAbierto && (
        <div className="fixed inset-0 z-50 lg:hidden print:hidden">
          <button
            onClick={() => setMenuAbierto(false)}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]"
            aria-label="Cerrar menú"
          />

          <aside className="relative flex h-full w-[82%] max-w-[310px] flex-col bg-[#0F2742] px-5 pb-5 pt-6 text-white shadow-2xl">
            <button
              onClick={() => setMenuAbierto(false)}
              className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.08] text-slate-200 transition hover:bg-white/[0.13] hover:text-white"
              aria-label="Cerrar menú"
            >
              <Icono nombre="cerrar" />
            </button>

            {contenidoMenu}
          </aside>
        </div>
      )}
    </div>
  );
}
