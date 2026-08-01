"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Clase = {
  id: string;
  fecha: string;
  hora_inicio: string;
  duracion_minutos: number;
  tipo: string;
  estado: string;
  ubicaciones: {
    nombre: string;
  } | null;
};

export default function AgendaPage() {
  const [clases, setClases] = useState<Clase[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarClases();
  }, []);

  async function cargarClases() {
    const { data, error } = await supabase
      .from("clases")
      .select(`
        id,
        fecha,
        hora_inicio,
        duracion_minutos,
        tipo,
        estado,
        ubicaciones (
          nombre
        )
      `)
      .order("fecha", { ascending: true })
      .order("hora_inicio", { ascending: true });

    if (!error) {
      setClases((data || []) as Clase[]);
    }

    setCargando(false);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-slate-900">
          Agenda
        </h1>

        <p className="mt-2 text-slate-600">
          Próximas clases programadas
        </p>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow">
          {cargando && (
            <p className="text-slate-500">
              Cargando agenda...
            </p>
          )}

          {!cargando && clases.length === 0 && (
            <p className="text-slate-500">
              No hay clases programadas.
            </p>
          )}

          <div className="space-y-3">
            {clases.map((clase) => (
              <div
                key={clase.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
              >
                <div>
                  <p className="font-semibold">
                    {clase.fecha} · {clase.hora_inicio.slice(0, 5)}
                  </p>

                  <p className="text-sm text-slate-600">
                    {clase.ubicaciones?.nombre || "Sin ubicación"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium capitalize">
                    {clase.tipo}
                  </p>

                  <p className="text-sm text-slate-500">
                    {clase.duracion_minutos} min
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}