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
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-600">
            Cuenta
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Mi cuenta
          </h1>
          <p className="mt-2 text-slate-500">
            Gestiona tus datos de acceso a Espacio Pádel Manager.
          </p>
        </div>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-slate-900">
            Usuario
          </h2>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600"
            />
            <p className="mt-2 text-xs text-slate-400">
              Este es el correo con el que accedes a la aplicación.
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-slate-900">
            Cambiar contraseña
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            No necesitas escribir la contraseña anterior porque ya has iniciado sesión.
          </p>

          <form
            onSubmit={cambiarPassword}
            className="mt-6 space-y-4"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={nuevaPassword}
                onChange={(e) =>
                  setNuevaPassword(e.target.value)
                }
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Repetir nueva contraseña
              </label>
              <input
                type="password"
                value={repetirPassword}
                onChange={(e) =>
                  setRepetirPassword(e.target.value)
                }
                autoComplete="new-password"
                placeholder="Repite la nueva contraseña"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="rounded-xl bg-teal-600 px-5 py-3 font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {guardando
                ? "Guardando..."
                : "Cambiar contraseña"}
            </button>
          </form>

          {mensaje && (
            <p className="mt-5 rounded-xl bg-slate-50 p-3 text-sm font-medium text-slate-700">
              {mensaje}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
