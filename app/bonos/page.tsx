"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Alumno = {
  id: string;
  nombre: string;
  apellidos: string | null;
};

type Bono = {
  id: string;
  alumno_id: string;
  numero_clases: number;
  clases_restantes: number;
  importe_pagado: number;
  fecha_compra: string;
  activo: boolean;
  alumnos: {
    nombre: string;
    apellidos: string | null;
  } | null;
};

export default function BonosPage() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [bonos, setBonos] = useState<Bono[]>([]);

  const [alumnoId, setAlumnoId] = useState("");
  const [numeroClases, setNumeroClases] = useState("5");
  const [clasesRestantes, setClasesRestantes] = useState("5");
  const [importe, setImporte] = useState("");
  const [fechaCompra, setFechaCompra] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [activo, setActivo] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [bonoEditandoId, setBonoEditandoId] = useState<string | null>(null);

  async function cargarDatos() {
    const { data: alumnosData } = await supabase
      .from("alumnos")
      .select("id,nombre,apellidos")
      .eq("activo", true)
      .order("nombre");

    const { data: bonosData } = await supabase
      .from("bonos")
      .select(`
        id,
        alumno_id,
        numero_clases,
        clases_restantes,
        importe_pagado,
        fecha_compra,
        activo,
        alumnos (
          nombre,
          apellidos
        )
      `)
      .order("fecha_compra", { ascending: false });

    setAlumnos(alumnosData || []);
    setBonos((bonosData || []) as Bono[]);
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  function limpiarFormulario() {
    setAlumnoId("");
    setNumeroClases("5");
    setClasesRestantes("5");
    setImporte("");
    setFechaCompra(new Date().toISOString().slice(0, 10));
    setActivo(true);
    setBonoEditandoId(null);
  }

  async function guardarBono(e: React.FormEvent) {
    e.preventDefault();
    setMensaje("");

    const datos = {
      alumno_id: alumnoId,
      numero_clases: Number(numeroClases),
      clases_restantes: Number(clasesRestantes),
      importe_pagado: importe ? Number(importe) : 0,
      fecha_compra: fechaCompra,
      activo,
    };

    let error;

    if (bonoEditandoId) {
      const resultado = await supabase
        .from("bonos")
        .update(datos)
        .eq("id", bonoEditandoId);

      error = resultado.error;
    } else {
      const resultado = await supabase
        .from("bonos")
        .insert(datos);

      error = resultado.error;
    }

    if (error) {
      setMensaje("❌ Error al guardar el bono: " + error.message);
      return;
    }

    setMensaje(
      bonoEditandoId
        ? "✅ Bono actualizado correctamente"
        : "✅ Bono creado correctamente"
    );

    limpiarFormulario();
    cargarDatos();
  }

  function editarBono(bono: Bono) {
    setBonoEditandoId(bono.id);
    setAlumnoId(bono.alumno_id);
    setNumeroClases(String(bono.numero_clases));
    setClasesRestantes(String(bono.clases_restantes));
    setImporte(String(bono.importe_pagado || ""));
    setFechaCompra(bono.fecha_compra);
    setActivo(bono.activo);
    setMensaje("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function borrarBono(id: string) {
    const confirmar = window.confirm(
      "¿Seguro que quieres borrar este bono?"
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("bonos")
      .delete()
      .eq("id", id);

    if (error) {
      setMensaje("❌ Error al borrar el bono: " + error.message);
      return;
    }

    if (bonoEditandoId === id) {
      limpiarFormulario();
    }

    setMensaje("✅ Bono borrado correctamente");
    cargarDatos();
  }

  async function restarClase(bono: Bono) {
    if (bono.clases_restantes <= 0) return;

    const nuevasRestantes = bono.clases_restantes - 1;

    const { error } = await supabase
      .from("bonos")
      .update({
        clases_restantes: nuevasRestantes,
        activo: nuevasRestantes > 0,
      })
      .eq("id", bono.id);

    if (error) {
      setMensaje("❌ Error al descontar clase: " + error.message);
      return;
    }

    setMensaje("✅ Clase descontada del bono");
    cargarDatos();
  }

  async function devolverClase(bono: Bono) {
    if (bono.clases_restantes >= bono.numero_clases) return;

    const nuevasRestantes = bono.clases_restantes + 1;

    const { error } = await supabase
      .from("bonos")
      .update({
        clases_restantes: nuevasRestantes,
        activo: true,
      })
      .eq("id", bono.id);

    if (error) {
      setMensaje("❌ Error al devolver clase: " + error.message);
      return;
    }

    setMensaje("✅ Clase devuelta al bono");
    cargarDatos();
  }

  const bonosActivos = bonos.filter(
    (bono) => bono.activo && bono.clases_restantes > 0
  ).length;

  const clasesDisponibles = bonos.reduce(
    (total, bono) => total + Number(bono.clases_restantes || 0),
    0
  );

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-slate-900">
          Bonos
        </h1>

        <p className="mt-2 text-slate-600">
          Gestión de bonos de clases
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-sm text-slate-500">
              Bonos activos
            </p>

            <p className="mt-2 text-3xl font-bold">
              {bonosActivos}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-sm text-slate-500">
              Clases disponibles
            </p>

            <p className="mt-2 text-3xl font-bold">
              {clasesDisponibles}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold">
              {bonoEditandoId ? "Editar bono" : "Nuevo bono"}
            </h2>

            <form onSubmit={guardarBono} className="mt-6 space-y-4">
              <select
                value={alumnoId}
                onChange={(e) => setAlumnoId(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="">
                  Seleccionar alumno
                </option>

                {alumnos.map((alumno) => (
                  <option key={alumno.id} value={alumno.id}>
                    {alumno.nombre} {alumno.apellidos || ""}
                  </option>
                ))}
              </select>

              <select
                value={numeroClases}
                onChange={(e) => {
                  setNumeroClases(e.target.value);

                  if (!bonoEditandoId) {
                    setClasesRestantes(e.target.value);
                  }
                }}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="5">
                  Bono de 5 clases
                </option>

                <option value="10">
                  Bono de 10 clases
                </option>
              </select>

              {bonoEditandoId && (
                <input
                  type="number"
                  min="0"
                  max={numeroClases}
                  placeholder="Clases restantes"
                  value={clasesRestantes}
                  onChange={(e) =>
                    setClasesRestantes(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              )}

              <input
                type="date"
                value={fechaCompra}
                onChange={(e) => setFechaCompra(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                required
              />

              <input
                type="number"
                step="0.01"
                placeholder="Importe pagado"
                value={importe}
                onChange={(e) => setImporte(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />

              {bonoEditandoId && (
                <select
                  value={activo ? "activo" : "inactivo"}
                  onChange={(e) =>
                    setActivo(e.target.value === "activo")
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                >
                  <option value="activo">
                    Activo
                  </option>

                  <option value="inactivo">
                    Inactivo
                  </option>
                </select>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white"
              >
                {bonoEditandoId
                  ? "Guardar cambios"
                  : "Crear bono"}
              </button>

              {bonoEditandoId && (
                <button
                  type="button"
                  onClick={() => {
                    limpiarFormulario();
                    setMensaje("");
                  }}
                  className="w-full rounded-xl bg-slate-200 px-5 py-3 font-semibold text-slate-800"
                >
                  Cancelar edición
                </button>
              )}
            </form>

            {mensaje && (
              <p className="mt-4 text-sm">
                {mensaje}
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow lg:col-span-2">
            <h2 className="text-xl font-bold">
              Bonos registrados
            </h2>

            <div className="mt-6 space-y-3">
              {bonos.length === 0 && (
                <p className="text-slate-500">
                  Todavía no hay bonos registrados.
                </p>
              )}

              {bonos.map((bono) => {
                const [anio, mes, dia] =
                  bono.fecha_compra.split("-");

                const fechaFormateada =
                  `${dia}/${mes}/${anio}`;

                return (
                  <div
                    key={bono.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">
                          {bono.alumnos?.nombre}{" "}
                          {bono.alumnos?.apellidos || ""}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          Bono de {bono.numero_clases} clases
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Comprado: {fechaFormateada}
                        </p>

                        <p
                          className={
                            bono.activo &&
                            bono.clases_restantes > 0
                              ? "mt-2 text-sm font-semibold text-green-600"
                              : "mt-2 text-sm font-semibold text-red-600"
                          }
                        >
                          {bono.activo &&
                          bono.clases_restantes > 0
                            ? "Activo"
                            : "Finalizado / inactivo"}
                        </p>

                        <p className="mt-2 text-sm font-medium">
                          Importe:{" "}
                          {Number(
                            bono.importe_pagado || 0
                          ).toFixed(2)}{" "}
                          €
                        </p>
                      </div>

                      <div className="sm:text-right">
                        <p className="text-3xl font-bold text-teal-700">
                          {bono.clases_restantes}
                        </p>

                        <p className="text-sm text-slate-500">
                          clases restantes
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2 sm:justify-end">
                          <button
                            onClick={() => restarClase(bono)}
                            disabled={
                              bono.clases_restantes <= 0
                            }
                            className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
                          >
                            -1 clase
                          </button>

                          <button
                            onClick={() => devolverClase(bono)}
                            disabled={
                              bono.clases_restantes >=
                              bono.numero_clases
                            }
                            className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 disabled:opacity-40"
                          >
                            +1 clase
                          </button>

                          <button
                            onClick={() => editarBono(bono)}
                            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => borrarBono(bono.id)}
                            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white"
                          >
                            Borrar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}