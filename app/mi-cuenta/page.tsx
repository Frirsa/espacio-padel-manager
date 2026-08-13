"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function MiCuentaPage() {
  const [email, setEmail] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [repetirPassword, setRepetirPassword] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarUsuario();
  }, []);

  async function cargarUsuario() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setEmail(user?.email || "");
  }

  async function cambiarPassword(e: FormEvent) {
    e.preventDefault();
    setMensaje("");

    if (nuevaPassword.length < 8) {
      setMensaje("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (nuevaPassword !== repetirPassword) {
      setMensaje("Las contraseñas no coinciden.");
      return;
    }

    setGuardando(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: nuevaPassword,
      });

      if (error) {
        throw error;
      }

      setNuevaPassword("");
      setRepetirPassword("");
      setMensaje("✅ Contraseña cambiada correctamente.");
    } catch {
      setMensaje("❌ No se pudo cambiar la contraseña.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F6F8FA] px-3 py-4 sm:px-7 sm:py-7 lg:px-9">
      <div className="mx-auto w-full max-w-[1540px]">
        {/* CABECERA V2 */}
        <section className="overflow-hidden rounded-2xl bg-[#0F2742] p-4 text-white shadow-[0_14px_34px_rgba(15,39,66,0.16)] sm:p-5 lg:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#4DD4CA]">
                Cuenta
              </p>

              <h1 className="mt-1 text-[28px] font-bold tracking-tight text-white sm:text-4xl">
                Mi cuenta
              </h1>

              <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-white/60 sm:mt-2 sm:text-sm">
                Consulta tu usuario y gestiona de forma segura la contraseña de acceso a Espacio Pádel Manager.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:min-w-[380px]">
              <div className="rounded-xl border border-[#4DD4CA]/20 bg-[#00A79C]/15 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#85E6DF]">
                  Estado
                </p>
                <p className="mt-1 text-lg font-bold text-white sm:text-xl">
                  Cuenta activa
                </p>
                <p className="mt-0.5 text-[10px] text-white/45">
                  Sesión autenticada
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/45">
                  Seguridad
                </p>
                <p className="mt-1 text-lg font-bold text-white sm:text-xl">
                  Acceso privado
                </p>
                <p className="mt-0.5 text-[10px] text-white/45">
                  Protegido por contraseña
                </p>
              </div>
            </div>
          </div>
        </section>

        {mensaje && (
          <section
            className={
              mensaje.startsWith("✅")
                ? "mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
                : "mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
            }
          >
            {mensaje}
          </section>
        )}

        <div className="mt-4 grid gap-4 sm:mt-5 xl:grid-cols-[0.82fr_1.18fr]">
          {/* USUARIO */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
            <div className="bg-[#0F2742] px-4 py-4 text-white sm:px-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#4DD4CA]">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="8" r="3.25" />
                    <path d="M5 20c.55-4 2.9-6 7-6s6.45 2 7 6" />
                  </svg>
                </span>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#4DD4CA]">
                    Usuario
                  </p>
                  <h2 className="mt-0.5 text-lg font-bold">
                    Datos de acceso
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Correo electrónico
              </label>

              <div className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-[#FBFCFD] px-3.5">
                <span className="shrink-0 text-[#00A79C]">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4.5 w-4.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
                    <path d="m5 7 7 5 7-5" />
                  </svg>
                </span>

                <p className="min-w-0 break-all text-sm font-bold text-[#17324D]">
                  {email || "Cargando usuario..."}
                </p>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Este es el correo asociado a tu sesión y el que utilizas para entrar en la aplicación.
              </p>

              <div className="mt-5 rounded-xl border border-[#00A79C]/15 bg-[#E8F7F5] px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#008F86] shadow-sm">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 3 5 6v5c0 4.7 2.8 8 7 10 4.2-2 7-5.3 7-10V6l-7-3Z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </span>

                  <div>
                    <p className="text-xs font-bold text-[#17324D]">
                      Cuenta privada
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-[#17324D]/60">
                      Tu sesión está gestionada mediante Supabase Auth. No compartas la contraseña con otras personas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CONTRASEÑA */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
            <div className="bg-[#0F2742] px-4 py-4 text-white sm:px-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#4DD4CA]">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="5" y="10" width="14" height="10" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" />
                  </svg>
                </span>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#4DD4CA]">
                    Seguridad
                  </p>
                  <h2 className="mt-0.5 text-lg font-bold">
                    Cambiar contraseña
                  </h2>
                </div>
              </div>
            </div>

            <form
              onSubmit={cambiarPassword}
              className="p-4 sm:p-5"
            >
              <p className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs font-semibold leading-relaxed text-sky-800">
                Como ya has iniciado sesión, puedes establecer una contraseña nueva directamente. Debe tener al menos 8 caracteres.
              </p>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                    Nueva contraseña
                  </label>

                  <input
                    type="password"
                    value={nuevaPassword}
                    onChange={(e) =>
                      setNuevaPassword(
                        e.target.value
                      )
                    }
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-[#17324D] outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                    Repetir contraseña
                  </label>

                  <input
                    type="password"
                    value={repetirPassword}
                    onChange={(e) =>
                      setRepetirPassword(
                        e.target.value
                      )
                    }
                    autoComplete="new-password"
                    placeholder="Repite la nueva contraseña"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-[#17324D] outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] leading-relaxed text-slate-400">
                  Después del cambio podrás seguir utilizando la sesión actual.
                </p>

                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#00A79C] px-5 text-sm font-bold text-white transition hover:bg-[#008F86] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 4h11l3 3v13H5z" />
                    <path d="M8 4v6h8V4M8 16h8" />
                  </svg>

                  {guardando
                    ? "Guardando..."
                    : "Cambiar contraseña"}
                </button>
              </div>
            </form>
          </section>
        </div>

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:mt-5 sm:px-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#17324D]">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 10v6M12 7h.01" />
              </svg>
            </span>

            <div>
              <p className="text-sm font-bold text-[#17324D]">
                Recomendación de seguridad
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Si utilizas Espacio Pádel Manager desde un ordenador compartido, usa la opción “Cerrar sesión” del menú cuando termines.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
