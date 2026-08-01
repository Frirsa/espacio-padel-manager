"use client";

import { useEffect, useMemo, useState } from "react";
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
  clase_alumnos: {
    alumnos: {
      nombre: string;
      apellidos: string | null;
    } | null;
  }[];
};

export default function AgendaPage() {
  const [clases, setClases] = useState<Clase[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("todas");

  useEffect(() => {
    cargarClases();
  }, []);

  async function cargarClases() {
    setCargando(true);

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
        ),
        clase_alumnos (
          alumnos (
            nombre,
            apellidos
          )
        )
      `)
      .order("fecha", { ascending: true })
      .order("hora_inicio", { ascending: true });

    if (!error) {
      setClases((data || []) as Clase[]);
    }

    setCargando(false);
  }

  const hoy = new Date().toISOString().slice(0, 10);

  const clasesFiltradas = useMemo(() => {
    if (filtroEstado === "todas") return clases;

    return clases.filter(
      (clase) => clase.estado === filtroEstado
    );
  }, [clases, filtroEstado]);

  const clasesHoy = clases.filter(
    (clase) => clase.fecha === hoy
  ).length;

  const proximasClases = clases.filter(
    (clase) =>
      clase.fecha >= hoy &&
      clase.estado !== "cancelada"
  ).length;

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-slate-900">
          Agenda
        </h1>

        <p className="mt-2 text-slate-600">
          Agenda de clases
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-sm text-slate-500">
              Clases de hoy
            </p>

            <p className="mt-2 text-3xl font-bold">
              {clasesHoy}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-sm text-slate-500">
              Próximas clases
            </p>

            <p className="mt-2 text-3xl font-bold text-teal-700">
              {proximasClases}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-5 shadow">
          <p className="mb-2 text-sm font-medium text-slate-600">
            Filtrar por estado
          </p>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 sm:w-64"
          >
            <option value="todas">Todas</option>
            <option value="programada">Programadas</option>
            <option value="realizada">Realizadas</option>
            <option value="cancelada">Canceladas</option>
          </select>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow">
          {cargando && (
            <p className="text-slate-500">
              Cargando agenda...
            </p>
          )}

          {!cargando && clasesFiltradas.length === 0 && (
            <p className="text-slate-500">
              No hay clases para mostrar.
            </p>
          )}

          <div className="space-y-3">
            {clasesFiltradas.map((clase) => {
              const [anio, mes, dia] = clase.fecha.split("-");
              const fechaFormateada = `${dia}/${mes}/${anio}`;

              const [hora, minuto] = clase.hora_inicio
                .split(":")
                .map(Number);

              const inicio = new Date();
              inicio.setHours(hora, minuto, 0, 0);

              const fin = new Date(
                inicio.getTime() +
                  clase.duracion_minutos * 60 * 1000
              );

              const horaInicio =
                `${String(inicio.getHours()).padStart(2, "0")}:` +
                `${String(inicio.getMinutes()).padStart(2, "0")}`;

              const horaFin =
                `${String(fin.getHours()).padStart(2, "0")}:` +
                `${String(fin.getMinutes()).padStart(2, "0")}`;

              const nombresAlumnos = clase.clase_alumnos
                .map((item) => item.alumnos)
                .filter(Boolean)
                .map(
                  (alumno) =>
                    `${alumno?.nombre || ""} ${
                      alumno?.apellidos || ""
                    }`.trim()
                )
                .join(", ");

              const esPasada = clase.fecha < hoy;

              return (
                <div
                  key={clase.id}
                  className={
                    esPasada
                      ? "rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-75"
                      : "rounded-xl border border-slate-200 bg-white p-4"
                  }
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">
                        {fechaFormateada}
                      </p>

                      <p className="mt-1 text-lg font-medium">
                        {horaInicio} a {horaFin} h
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        {clase.ubicaciones?.nombre ||
                          "Sin ubicación"}
                      </p>

                      <p className="mt-2 text-sm font-medium text-slate-800">
                        {nombresAlumnos || "Sin alumnos"}
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <p
                        className={
                          clase.estado === "realizada"
                            ? "text-sm font-semibold text-green-600"
                            : clase.estado === "cancelada"
                            ? "text-sm font-semibold text-red-600"
                            : "text-sm font-semibold text-blue-600"
                        }
                      >
                        {clase.estado}
                      </p>

                      <p className="mt-1 text-sm capitalize text-slate-600">
                        {clase.tipo}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {clase.duracion_minutos} min
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}