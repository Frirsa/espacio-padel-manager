"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

import ResumenPagos from "../../components/pagos/ResumenPagos";
import FormularioPago from "../../components/pagos/FormularioPago";
import ListadoPagos from "../../components/pagos/ListadoPagos";
import CobrosClub from "../../components/pagos/CobrosClub";

type Alumno = {
  id: string;
  nombre: string;
  apellidos: string | null;
};

type Pago = {
  id: string;
  alumno_id: string | null;
  importe: number;
  metodo: string;
  estado: string;
  fecha_pago: string;
  notas: string | null;

  clases: {
    id: string;
    fecha: string;
    hora_inicio: string;
    duracion_minutos: number;
    tipo: string;
    ubicaciones: {
      nombre: string;
    } | null;
  } | null;

  alumnos: {
    nombre: string;
    apellidos: string | null;
  } | null;
};

export default function PagosPage() {
  const searchParams =
    useSearchParams();

  const alumnoDesdeFicha =
    searchParams.get("alumno");
  const filtroDesdeDashboard =
    searchParams.get("filtro");

  const [alumnos, setAlumnos] =
    useState<Alumno[]>([]);

  const [pagos, setPagos] =
    useState<Pago[]>([]);

  const [alumnoId, setAlumnoId] =
    useState("");

  const [
    busquedaAlumno,
    setBusquedaAlumno,
  ] = useState("");

  const [importe, setImporte] =
    useState("");

  const [metodo, setMetodo] =
    useState("efectivo");

  const [estado, setEstado] =
    useState("pagado");

  const [
    fechaPago,
    setFechaPago,
  ] = useState(
    new Date()
      .toISOString()
      .slice(0, 10)
  );

  const [notas, setNotas] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  const [
    pagoEditandoId,
    setPagoEditandoId,
  ] =
    useState<string | null>(null);

  const [
    busquedaPagos,
    setBusquedaPagos,
  ] = useState("");

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState("todos");

  const [
    filtroMetodo,
    setFiltroMetodo,
  ] = useState("todos");

  const [
    filtroMes,
    setFiltroMes,
  ] = useState("");

  const [
    seccionActiva,
    setSeccionActiva,
  ] = useState<"pagos" | "clubs">("pagos");

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (filtroDesdeDashboard === "pendientes") {
      setFiltroEstado("pendiente");
    }
  }, [filtroDesdeDashboard]);

  useEffect(() => {
    if (alumnoDesdeFicha) {
      setAlumnoId(
        alumnoDesdeFicha
      );

      setBusquedaAlumno("");
    }
  }, [alumnoDesdeFicha]);

  async function cargarDatos() {
    const {
      data: alumnosData,
    } = await supabase
      .from("alumnos")
      .select(
        "id,nombre,apellidos"
      )
      .eq("activo", true)
      .order("nombre");

    const {
      data: pagosData,
      error,
    } = await supabase
      .from("pagos")
      .select(`
        id,
        alumno_id,
        importe,
        metodo,
        estado,
        fecha_pago,
        notas,
        clases (
          id,
          fecha,
          hora_inicio,
          duracion_minutos,
          tipo,
          ubicaciones (
            nombre
          )
        ),
        alumnos (
          nombre,
          apellidos
        )
      `)
      .order(
        "fecha_pago",
        {
          ascending: false,
        }
      );

    if (error) {
      setMensaje(
        "❌ Error al cargar los pagos: " +
          error.message
      );

      return;
    }

    setAlumnos(
      (alumnosData ||
        []) as Alumno[]
    );

    setPagos(
      (pagosData ||
        []) as unknown as Pago[]
    );
  }

  function limpiarFormulario() {
    setAlumnoId("");
    setBusquedaAlumno("");
    setImporte("");
    setMetodo("efectivo");
    setEstado("pagado");

    setFechaPago(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

    setNotas("");
    setPagoEditandoId(null);
  }

  async function guardarPago(
    e: FormEvent
  ) {
    e.preventDefault();

    setMensaje("");

    if (!importe) {
      setMensaje(
        "❌ Introduce un importe"
      );

      return;
    }

    const datos = {
      alumno_id:
        alumnoId || null,
      importe:
        Number(importe),
      metodo,
      estado,
      fecha_pago:
        fechaPago,
      notas:
        notas || null,
    };

    let error;

    if (pagoEditandoId) {
      const resultado =
        await supabase
          .from("pagos")
          .update(datos)
          .eq(
            "id",
            pagoEditandoId
          );

      error =
        resultado.error;
    } else {
      const resultado =
        await supabase
          .from("pagos")
          .insert(datos);

      error =
        resultado.error;
    }

    if (error) {
      setMensaje(
        "❌ Error al guardar el pago: " +
          error.message
      );

      return;
    }

    setMensaje(
      pagoEditandoId
        ? "✅ Pago actualizado correctamente"
        : "✅ Pago registrado correctamente"
    );

    limpiarFormulario();

    await cargarDatos();
  }

  function editarPago(
    pago: Pago
  ) {
    setPagoEditandoId(
      pago.id
    );

    setAlumnoId(
      pago.alumno_id || ""
    );

    setBusquedaAlumno("");

    setImporte(
      String(pago.importe)
    );

    setMetodo(
      pago.metodo
    );

    setEstado(
      pago.estado
    );

    setFechaPago(
      pago.fecha_pago
    );

    setNotas(
      pago.notas || ""
    );

    setMensaje("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function cobrarRapido(
    pago: Pago,
    metodoCobro: string
  ) {
    setMensaje("");

    const {
      error,
    } = await supabase
      .from("pagos")
      .update({
        estado: "pagado",
        metodo: metodoCobro,
        fecha_pago:
          new Date()
            .toISOString()
            .slice(0, 10),
      })
      .eq(
        "id",
        pago.id
      );

    if (error) {
      setMensaje(
        "❌ No se pudo registrar el cobro: " +
          error.message
      );
      return;
    }

    setMensaje(
      "✅ Cobro registrado correctamente"
    );

    await cargarDatos();
  }

  async function borrarPago(
    id: string
  ) {
    const confirmar =
      window.confirm(
        "¿Seguro que quieres borrar este pago?"
      );

    if (!confirmar) {
      return;
    }

    const {
      error,
    } = await supabase
      .from("pagos")
      .delete()
      .eq("id", id);

    if (error) {
      setMensaje(
        "❌ Error al borrar el pago: " +
          error.message
      );

      return;
    }

    if (
      pagoEditandoId === id
    ) {
      limpiarFormulario();
    }

    setMensaje(
      "✅ Pago borrado correctamente"
    );

    await cargarDatos();
  }

  function formatearFecha(
    fecha: string
  ) {
    const [
      anio,
      mes,
      dia,
    ] =
      fecha.split("-");

    return `${dia}/${mes}/${anio}`;
  }

  function textoMetodo(
    metodoPago: string
  ) {
    if (
      metodoPago ===
      "efectivo"
    ) {
      return "Efectivo";
    }

    if (
      metodoPago ===
      "bizum"
    ) {
      return "Bizum";
    }

    if (
      metodoPago ===
      "transferencia"
    ) {
      return "Transferencia";
    }

    if (
      metodoPago ===
      "tarjeta"
    ) {
      return "Tarjeta";
    }

    return metodoPago;
  }

  const pagosFiltrados =
    pagos.filter((pago) => {
      const nombreAlumno =
        pago.alumnos
          ? `${pago.alumnos.nombre} ${
              pago.alumnos
                .apellidos || ""
            }`.toLowerCase()
          : "sin alumno";

      const coincideBusqueda =
        nombreAlumno.includes(
          busquedaPagos.toLowerCase()
        );

      const coincideEstado =
        filtroEstado ===
          "todos" ||
        pago.estado ===
          filtroEstado;

      const coincideMetodo =
        filtroMetodo ===
          "todos" ||
        pago.metodo ===
          filtroMetodo;

      const coincideMes =
        !filtroMes ||
        pago.fecha_pago.startsWith(
          filtroMes
        );

      return (
        coincideBusqueda &&
        coincideEstado &&
        coincideMetodo &&
        coincideMes
      );
    });

  const pagosPendientesRapidos =
    pagos
      .filter(
        (pago) =>
          pago.estado ===
          "pendiente"
      )
      .sort(
        (a, b) =>
          a.fecha_pago.localeCompare(
            b.fecha_pago
          )
      );

  const totalPendienteRapido =
    pagosPendientesRapidos.reduce(
      (total, pago) =>
        total +
        Number(
          pago.importe || 0
        ),
      0
    );

  const pendientesPorAlumno =
    Object.values(
      pagosPendientesRapidos.reduce(
        (
          acumulado,
          pago
        ) => {
          const clave =
            pago.alumno_id ||
            "sin-alumno";

          const nombre =
            pago.alumnos
              ? `${pago.alumnos.nombre} ${pago.alumnos.apellidos || ""}`.trim()
              : "Sin alumno";

          if (
            !acumulado[
              clave
            ]
          ) {
            acumulado[
              clave
            ] = {
              nombre,
              total: 0,
              cantidad: 0,
            };
          }

          acumulado[
            clave
          ].total +=
            Number(
              pago.importe ||
                0
            );

          acumulado[
            clave
          ].cantidad += 1;

          return acumulado;
        },
        {} as Record<
          string,
          {
            nombre: string;
            total: number;
            cantidad: number;
          }
        >
      )
    ).sort(
      (a, b) =>
        b.total -
        a.total
    );

  function textoTipoClase(
    tipo: string
  ) {
    if (tipo === "club") {
      return "Clase para club";
    }

    if (tipo === "propia") {
      return "Clase propia";
    }

    if (tipo === "privada") {
      return "Clase propia · pista privada";
    }

    return tipo;
  }

  const totalCobrado =
    pagosFiltrados
      .filter(
        (pago) =>
          pago.estado ===
          "pagado"
      )
      .reduce(
        (
          total,
          pago
        ) =>
          total +
          Number(
            pago.importe || 0
          ),
        0
      );

  const totalPendiente =
    pagosFiltrados
      .filter(
        (pago) =>
          pago.estado ===
          "pendiente"
      )
      .reduce(
        (
          total,
          pago
        ) =>
          total +
          Number(
            pago.importe || 0
          ),
        0
      );

  const totalPrevisto =
    totalCobrado +
    totalPendiente;

  const numeroPagos =
    pagosFiltrados.length;

  return (
    <main className="min-h-screen bg-slate-100 p-8">

      <div className="mx-auto max-w-7xl">

        <div>

          <h1 className="text-4xl font-bold text-slate-900">
            Pagos
          </h1>

          <p className="mt-2 text-slate-600">
            Registro de cobros y pagos pendientes
          </p>

        </div>


        <div className="mt-6 inline-flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => setSeccionActiva("pagos")}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
              seccionActiva === "pagos"
                ? "bg-[#09a9a3] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Pagos normales
          </button>

          <button
            type="button"
            onClick={() => setSeccionActiva("clubs")}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
              seccionActiva === "clubs"
                ? "bg-[#09a9a3] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Cobros de clubs
          </button>
        </div>

        {seccionActiva === "clubs" && (
          <div className="mt-6">
            <CobrosClub />
          </div>
        )}

        {seccionActiva === "pagos" && (
          <>
        {filtroDesdeDashboard === "pendientes" && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <div>
              <p className="font-bold text-red-700">Pagos pendientes</p>
              <p className="mt-1 text-sm text-red-600">Solo se muestran los pagos pendientes de cobro.</p>
            </div>
            <a href="/pagos" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-red-600 shadow-sm">
              Quitar filtro
            </a>
          </div>
        )}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Cobros pendientes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Registra un cobro con un solo clic
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">

              {pagosPendientesRapidos.length > 0 && (
                <div className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white">
                  {totalPendienteRapido.toFixed(2)} € pendientes
                </div>
              )}

              <div className={
                pagosPendientesRapidos.length > 0
                  ? "rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700"
                  : "rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700"
              }>
                {pagosPendientesRapidos.length > 0
                  ? `${pagosPendientesRapidos.length} cobro${
                      pagosPendientesRapidos.length === 1 ? "" : "s"
                    }`
                  : "✓ Todo cobrado"}
              </div>

            </div>

          </div>

          {pagosPendientesRapidos.length > 0 ? (

            <div className="mt-5">

              <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">

                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Pendiente por alumno
                </p>

                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">

                  {pendientesPorAlumno.map(
                    (item) => (
                      <div
                        key={item.nombre}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-800">
                            {item.nombre}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {item.cantidad} cobro{item.cantidad === 1 ? "" : "s"} pendiente{item.cantidad === 1 ? "" : "s"}
                          </p>
                        </div>

                        <strong className="shrink-0 text-sm text-red-600">
                          {item.total.toFixed(2)} €
                        </strong>
                      </div>
                    )
                  )}

                </div>

              </div>

              <div className="space-y-3">

              {pagosPendientesRapidos.map(
                (pago) => {
                  const nombre =
                    pago.alumnos
                      ? `${pago.alumnos.nombre} ${pago.alumnos.apellidos || ""}`.trim()
                      : "Sin alumno";

                  return (
                    <div
                      key={pago.id}
                      className="flex flex-col gap-4 rounded-2xl border border-red-100 bg-red-50/40 p-4 lg:flex-row lg:items-center lg:justify-between"
                    >

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <p className="font-bold text-slate-900">
                            {nombre}
                          </p>

                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-red-600">
                            {Number(
                              pago.importe || 0
                            ).toFixed(2)} €
                          </span>

                        </div>

                        {pago.clases ? (
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">

                            <span className="font-semibold text-slate-700">
                              {formatearFecha(pago.clases.fecha)} · {pago.clases.hora_inicio.slice(0, 5)}
                            </span>

                            <span>
                              {pago.clases.duracion_minutos} min
                            </span>

                            <span>
                              {pago.clases.ubicaciones?.nombre || "Sin ubicación"}
                            </span>

                            <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-slate-600">
                              {textoTipoClase(pago.clases.tipo)}
                            </span>

                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-slate-500">
                            Pendiente desde {formatearFecha(pago.fecha_pago)}
                          </p>
                        )}

                        {pago.notas &&
                          pago.notas !== "Generado automáticamente desde Clases" && (
                          <p className="mt-1 truncate text-xs text-slate-400">
                            {pago.notas}
                          </p>
                        )}

                      </div>

                      <div className="flex flex-wrap gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            cobrarRapido(
                              pago,
                              "efectivo"
                            )
                          }
                          className="rounded-xl bg-[#09a9a3] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#078b86]"
                        >
                          Cobrado · Efectivo
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            cobrarRapido(
                              pago,
                              "bizum"
                            )
                          }
                          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                        >
                          Bizum
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            cobrarRapido(
                              pago,
                              "transferencia"
                            )
                          }
                          className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700"
                        >
                          Transferencia
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            editarPago(
                              pago
                            )
                          }
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Editar
                        </button>

                      </div>

                    </div>
                  );
                }
              )}

              </div>

            </div>

          ) : (

            <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-5 py-5">
              <p className="font-semibold text-green-700">
                ✓ No tienes cobros pendientes
              </p>
            </div>

          )}

        </section>

        <ResumenPagos
          totalCobrado={
            totalCobrado
          }
          totalPendiente={
            totalPendiente
          }
          totalPrevisto={
            totalPrevisto
          }
          numeroPagos={
            numeroPagos
          }
        />

        <div className="mt-8 grid gap-8 xl:grid-cols-[370px_minmax(0,1fr)]">

          <FormularioPago
            alumnos={alumnos}
            alumnoId={
              alumnoId
            }
            busquedaAlumno={
              busquedaAlumno
            }
            importe={importe}
            metodo={metodo}
            estado={estado}
            fechaPago={
              fechaPago
            }
            notas={notas}
            pagoEditandoId={
              pagoEditandoId
            }
            mensaje={mensaje}
            setAlumnoId={
              setAlumnoId
            }
            setBusquedaAlumno={
              setBusquedaAlumno
            }
            setImporte={
              setImporte
            }
            setMetodo={
              setMetodo
            }
            setEstado={
              setEstado
            }
            setFechaPago={
              setFechaPago
            }
            setNotas={
              setNotas
            }
            onGuardar={
              guardarPago
            }
            onCancelar={() => {
              limpiarFormulario();
              setMensaje("");
            }}
          />

          <ListadoPagos
            pagos={
              pagosFiltrados
            }
            busquedaPagos={
              busquedaPagos
            }
            filtroEstado={
              filtroEstado
            }
            filtroMetodo={
              filtroMetodo
            }
            filtroMes={
              filtroMes
            }
            setBusquedaPagos={
              setBusquedaPagos
            }
            setFiltroEstado={
              setFiltroEstado
            }
            setFiltroMetodo={
              setFiltroMetodo
            }
            setFiltroMes={
              setFiltroMes
            }
            onLimpiarFiltros={() => {
              setBusquedaPagos("");
              setFiltroEstado(
                "todos"
              );
              setFiltroMetodo(
                "todos"
              );
              setFiltroMes("");
            }}
            onEditar={
              editarPago
            }
            onBorrar={
              borrarPago
            }
            formatearFecha={
              formatearFecha
            }
            textoMetodo={
              textoMetodo
            }
          />

        </div>

          </>
        )}

      </div>

    </main>
  );
}