"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [repetirPassword, setRepetirPassword] = useState("");
  const [modoRecuperacion, setModoRecuperacion] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const esReset = params.get("reset") === "1";

    if (esReset) {
      setModoRecuperacion(true);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setModoRecuperacion(true);
        setMensaje("");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function iniciarSesion(e: FormEvent) {
    e.preventDefault();
    setMensaje("");
    setEnviando(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setMensaje("❌ Correo o contraseña incorrectos.");
    } finally {
      setEnviando(false);
    }
  }

  async function recuperarPassword() {
    const correo = email.trim();

    if (!correo) {
      setMensaje("Escribe primero tu correo electrónico.");
      return;
    }

    setMensaje("");
    setEnviando(true);

    try {
      const redirectTo =
        `${window.location.origin}/login?reset=1`;

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          correo,
          { redirectTo }
        );

      if (error) {
        throw error;
      }

      setMensaje(
        "✅ Te hemos enviado un correo para crear una contraseña nueva."
      );
    } catch {
      setMensaje(
        "❌ No se pudo enviar el correo de recuperación."
      );
    } finally {
      setEnviando(false);
    }
  }

  async function guardarNuevaPassword(e: FormEvent) {
    e.preventDefault();
    setMensaje("");

    if (nuevaPassword.length < 8) {
      setMensaje(
        "La contraseña debe tener al menos 8 caracteres."
      );
      return;
    }

    if (nuevaPassword !== repetirPassword) {
      setMensaje("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);

    try {
      const { error } =
        await supabase.auth.updateUser({
          password: nuevaPassword,
        });

      if (error) {
        throw error;
      }

      setMensaje("✅ Contraseña cambiada correctamente.");

      window.setTimeout(() => {
        router.replace("/");
        router.refresh();
      }, 800);
    } catch {
      setMensaje(
        "❌ No se pudo cambiar la contraseña. Vuelve a abrir el enlace del correo."
      );
    } finally {
      setEnviando(false);
    }
  }

  if (modoRecuperacion) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-xl sm:p-9">
          <div className="text-center">
            <img
              src="/logo-espacio-padel.png"
              alt="Espacio Pádel Academy"
              className="mx-auto h-auto w-full max-w-[230px]"
            />
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
              Manager
            </p>
            <h1 className="mt-6 text-2xl font-bold text-slate-900">
              Crear nueva contraseña
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Escribe la contraseña que quieres utilizar a partir de ahora.
            </p>
          </div>

          <form
            onSubmit={guardarNuevaPassword}
            className="mt-7 space-y-4"
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
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Repetir contraseña
              </label>
              <input
                type="password"
                value={repetirPassword}
                onChange={(e) =>
                  setRepetirPassword(e.target.value)
                }
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                placeholder="Repite la contraseña"
              />
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-xl bg-teal-600 px-5 py-3 font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enviando
                ? "Guardando..."
                : "Guardar nueva contraseña"}
            </button>
          </form>

          {mensaje && (
            <p className="mt-5 rounded-xl bg-slate-50 p-3 text-center text-sm font-medium text-slate-700">
              {mensaje}
            </p>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-xl sm:p-9">
        <div className="text-center">
          <img
            src="/logo-espacio-padel.png"
            alt="Espacio Pádel Academy"
            className="mx-auto h-auto w-full max-w-[230px]"
          />
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
            Manager
          </p>
          <h1 className="mt-6 text-2xl font-bold text-slate-900">
            Iniciar sesión
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Accede a tu panel de gestión.
          </p>
        </div>

        <form
          onSubmit={iniciarSesion}
          className="mt-7 space-y-4"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              autoComplete="email"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              placeholder="Tu contraseña"
            />
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-xl bg-teal-600 px-5 py-3 font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enviando
              ? "Entrando..."
              : "Entrar"}
          </button>
        </form>

        <button
          type="button"
          onClick={recuperarPassword}
          disabled={enviando}
          className="mt-4 w-full text-center text-sm font-semibold text-teal-700 transition hover:text-teal-800 disabled:opacity-50"
        >
          ¿Has olvidado tu contraseña?
        </button>

        {mensaje && (
          <p className="mt-5 rounded-xl bg-slate-50 p-3 text-center text-sm font-medium text-slate-700">
            {mensaje}
          </p>
        )}
      </section>
    </main>
  );
}
