"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AlumnosPage() {
  const [mensaje, setMensaje] = useState("Comprobando conexión...");

  useEffect(() => {
    async function comprobar() {
      const { error } = await supabase.from("alumnos").select("*");

      if (error) {
        setMensaje("❌ Error de conexión: " + error.message);
      } else {
        setMensaje("✅ Conexión con Supabase correcta");
      }
    }

    comprobar();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-10">
      <h1 className="text-3xl font-bold">Alumnos</h1>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow">
        <p className="text-xl">{mensaje}</p>
      </div>
    </main>
  );
}