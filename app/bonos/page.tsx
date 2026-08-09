"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

import ResumenBonos from "../../components/bonos/ResumenBonos";
import FormularioBono from "../../components/bonos/FormularioBono";
import ListadoBonos from "../../components/bonos/ListadoBonos";
import { generarImagenBono } from "../../components/bonos/generarImagenBono";

type Alumno = {
  id: string;
  nombre: string;
  apellidos: string | null;
};

type UsoBono = {
  bono_id: string | null;
  alumno_id: string;
  usa_bono: boolean;

  alumnos: {
    nombre: string;
    apellidos: string | null;
  } | null;

  clases: {
    fecha: string;
    hora_inicio: string;
    duracion_minutos: number;
    estado: string;

    ubicaciones: {
      nombre: string;
    } | null;
  } | null;
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

  clase_alumnos: UsoBono[];
};

type RelacionBonoAlumno = {
  bono_id: string;
  alumno_id: string;
};

export default function BonosPage() {
  const searchParams =
    useSearchParams();

  const alumnoDesdeFicha =
    searchParams.get("alumno");
  const filtroDesdeDashboard =
    searchParams.get("filtro");

  const [alumnos, setAlumnos] =
    useState<Alumno[]>([]);

  const [bonos, setBonos] =
    useState<Bono[]>([]);

  const [
    relacionesBonoAlumno,
    setRelacionesBonoAlumno,
  ] =
    useState<RelacionBonoAlumno[]>([]);

  const [alumnoId, setAlumnoId] =
    useState("");

  const [
    alumnosAutorizados,
    setAlumnosAutorizados,
  ] =
    useState<string[]>([]);

  const [
    busquedaAlumno,
    setBusquedaAlumno,
  ] = useState("");

  const [
    numeroClases,
    setNumeroClases,
  ] = useState("5");

  const [
    clasesRestantes,
    setClasesRestantes,
  ] = useState("5");

  const [importe, setImporte] =
    useState("");

  const [
    fechaCompra,
    setFechaCompra,
  ] = useState(
    new Date()
      .toISOString()
      .slice(0, 10)
  );

  const [activo, setActivo] =
    useState(true);

  const [mensaje, setMensaje] =
    useState("");

  const [
    bonoEditandoId,
    setBonoEditandoId,
  ] =
    useState<string | null>(null);

  const [
    busquedaBonos,
    setBusquedaBonos,
  ] = useState("");

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState("todos");

  const [
    filtroMes,
    setFiltroMes,
  ] = useState("");


  const [
    generandoImagenBono,
    setGenerandoImagenBono,
  ] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

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
      data: bonosData,
      error: errorBonos,
    } = await supabase
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
        ),

        clase_alumnos (
          bono_id,
          alumno_id,
          usa_bono,

          alumnos (
            nombre,
            apellidos
          ),

          clases (
            fecha,
            hora_inicio,
            duracion_minutos,
            estado,

            ubicaciones (
              nombre
            )
          )
        )
      `)
      .order(
        "fecha_compra",
        {
          ascending: false,
        }
      );

    if (errorBonos) {
      setMensaje(
        "❌ Error al cargar los bonos: " +
          errorBonos.message
      );

      return;
    }

    const {
      data: relacionesData,
      error: errorRelaciones,
    } = await supabase
      .from("bono_alumnos")
      .select(
        "bono_id,alumno_id"
      );

    if (errorRelaciones) {
      setMensaje(
        "❌ Error al cargar los alumnos autorizados: " +
          errorRelaciones.message
      );

      return;
    }

    setAlumnos(
      (alumnosData ||
        []) as Alumno[]
    );

    setBonos(
      (bonosData ||
        []) as unknown as Bono[]
    );

    setRelacionesBonoAlumno(
      (relacionesData ||
        []) as RelacionBonoAlumno[]
    );
  }

  function limpiarFormulario() {
    setAlumnoId("");
    setAlumnosAutorizados([]);
    setBusquedaAlumno("");
    setNumeroClases("5");
    setClasesRestantes("5");
    setImporte("");

    setFechaCompra(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

    setActivo(true);
    setBonoEditandoId(null);
  }

  async function guardarRelacionesBono(
    bonoId: string,
    titularId: string
  ) {
    const alumnosDelBono =
      Array.from(
        new Set([
          titularId,
          ...alumnosAutorizados,
        ])
      );

    const {
      error: errorBorrar,
    } = await supabase
      .from("bono_alumnos")
      .delete()
      .eq(
        "bono_id",
        bonoId
      );

    if (errorBorrar) {
      throw new Error(
        errorBorrar.message
      );
    }

    const relaciones =
      alumnosDelBono.map(
        (id) => ({
          bono_id: bonoId,
          alumno_id: id,
        })
      );

    const {
      error: errorInsertar,
    } = await supabase
      .from("bono_alumnos")
      .insert(relaciones);

    if (errorInsertar) {
      throw new Error(
        errorInsertar.message
      );
    }
  }

  async function guardarBono(
    e: FormEvent
  ) {
    e.preventDefault();

    setMensaje("");

    if (!alumnoId) {
      setMensaje(
        "❌ Selecciona el titular del bono"
      );

      return;
    }

    const datos = {
      alumno_id:
        alumnoId,

      numero_clases:
        Number(numeroClases),

      clases_restantes:
        Number(clasesRestantes),

      importe_pagado:
        importe
          ? Number(importe)
          : 0,

      fecha_compra:
        fechaCompra,

      activo,
    };

    try {
      let bonoId =
        bonoEditandoId;

      if (bonoEditandoId) {
        const {
          error,
        } = await supabase
          .from("bonos")
          .update(datos)
          .eq(
            "id",
            bonoEditandoId
          );

        if (error) {
          throw new Error(
            error.message
          );
        }
      } else {
        const {
          data,
          error,
        } = await supabase
          .from("bonos")
          .insert(datos)
          .select("id")
          .single();

        if (error) {
          throw new Error(
            error.message
          );
        }

        bonoId =
          data.id;
      }

      if (!bonoId) {
        throw new Error(
          "No se ha podido identificar el bono"
        );
      }

      await guardarRelacionesBono(
        bonoId,
        alumnoId
      );

      setMensaje(
        bonoEditandoId
          ? "✅ Bono actualizado correctamente"
          : "✅ Bono creado correctamente"
      );

      limpiarFormulario();

      await cargarDatos();
    } catch (error) {
      const mensajeError =
        error instanceof Error
          ? error.message
          : "Error desconocido";

      setMensaje(
        "❌ Error al guardar el bono: " +
          mensajeError
      );
    }
  }
  function editarBono(
    bono: Bono
  ) {
    setBonoEditandoId(
      bono.id
    );

    setAlumnoId(
      bono.alumno_id
    );

    const autorizados =
      relacionesBonoAlumno
        .filter(
          (relacion) =>
            relacion.bono_id ===
              bono.id &&
            relacion.alumno_id !==
              bono.alumno_id
        )
        .map(
          (relacion) =>
            relacion.alumno_id
        );

    setAlumnosAutorizados(
      autorizados
    );

    setBusquedaAlumno("");

    setNumeroClases(
      String(
        bono.numero_clases
      )
    );

    setClasesRestantes(
      String(
        bono.clases_restantes
      )
    );

    setImporte(
      String(
        bono.importe_pagado ||
          ""
      )
    );

    setFechaCompra(
      bono.fecha_compra
    );

    setActivo(
      bono.activo
    );

    setMensaje("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function borrarBono(
    id: string
  ) {
    const confirmar =
      window.confirm(
        "¿Seguro que quieres borrar este bono?"
      );

    if (!confirmar) {
      return;
    }

    const bono =
      bonos.find(
        (item) =>
          item.id === id
      );

    const tieneUsos =
      bono?.clase_alumnos.some(
        (uso) =>
          uso.usa_bono &&
          uso.clases?.estado ===
            "realizada"
      );

    if (tieneUsos) {
      const confirmarConHistorial =
        window.confirm(
          "Este bono tiene clases utilizadas registradas. ¿Seguro que quieres borrarlo?"
        );

      if (
        !confirmarConHistorial
      ) {
        return;
      }
    }

    const {
      error,
    } = await supabase
      .from("bonos")
      .delete()
      .eq(
        "id",
        id
      );

    if (error) {
      setMensaje(
        "❌ Error al borrar el bono: " +
          error.message
      );

      return;
    }

    if (
      bonoEditandoId ===
      id
    ) {
      limpiarFormulario();
    }

    setMensaje(
      "✅ Bono borrado correctamente"
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

  function calcularHorario(
    horaInicio: string,
    duracionMinutos: number
  ) {
    const [
      hora,
      minuto,
    ] =
      horaInicio
        .split(":")
        .map(Number);

    const inicio =
      new Date();

    inicio.setHours(
      hora,
      minuto,
      0,
      0
    );

    const fin =
      new Date(
        inicio.getTime() +
          duracionMinutos *
            60 *
            1000
      );

    const inicioTexto =
      `${String(
        inicio.getHours()
      ).padStart(
        2,
        "0"
      )}:` +
      `${String(
        inicio.getMinutes()
      ).padStart(
        2,
        "0"
      )} h`;

    const finTexto =
      `${String(
        fin.getHours()
      ).padStart(
        2,
        "0"
      )}:` +
      `${String(
        fin.getMinutes()
      ).padStart(
        2,
        "0"
      )} h`;

    return `${inicioTexto} a ${finTexto}`;
  }

  const bonosFiltrados =
    bonos.filter(
      (bono) => {
        if (
          filtroDesdeDashboard === "por-terminar" &&
          !(bono.activo && bono.clases_restantes >= 1 && bono.clases_restantes <= 2)
        ) {
          return false;
        }

        const nombreAlumno =
          bono.alumnos
            ? `${bono.alumnos.nombre} ${
                bono.alumnos
                  .apellidos ||
                ""
              }`.toLowerCase()
            : "";

        const coincideBusqueda =
          nombreAlumno.includes(
            busquedaBonos.toLowerCase()
          );

        let coincideEstado =
          true;

        if (
          filtroEstado ===
          "activos"
        ) {
          coincideEstado =
            bono.activo &&
            bono.clases_restantes >
              0;
        }

        if (
          filtroEstado ===
          "finalizados"
        ) {
          coincideEstado =
            bono.clases_restantes <=
            0;
        }

        if (
          filtroEstado ===
          "inactivos"
        ) {
          coincideEstado =
            !bono.activo &&
            bono.clases_restantes >
              0;
        }

        const coincideMes =
          !filtroMes ||
          bono.fecha_compra.startsWith(
            filtroMes
          );

        return (
          coincideBusqueda &&
          coincideEstado &&
          coincideMes
        );
      }
    );

  async function descargarImagenBono(bono: Bono) {
    setGenerandoImagenBono(true);
    setMensaje("");

    try {
      await generarImagenBono(bono);
      setMensaje("✅ Imagen del bono generada correctamente");
    } catch (error) {
      const texto =
        error instanceof Error
          ? error.message
          : "Error desconocido";

      setMensaje(
        "❌ No se pudo generar la imagen del bono: " + texto
      );
    } finally {
      setGenerandoImagenBono(false);
    }
  }

  const bonosActivos =
    bonosFiltrados.filter(
      (bono) =>
        bono.activo &&
        bono.clases_restantes >
          0
    ).length;

  const clasesDisponibles =
    bonosFiltrados
      .filter(
        (bono) =>
          bono.activo &&
          bono.clases_restantes >
            0
      )
      .reduce(
        (
          total,
          bono
        ) =>
          total +
          Number(
            bono.clases_restantes ||
              0
          ),
        0
      );

  const bonosFinalizados =
    bonosFiltrados.filter(
      (bono) =>
        bono.clases_restantes <=
        0
    ).length;

  const importeBonos =
    bonosFiltrados.reduce(
      (
        total,
        bono
      ) =>
        total +
        Number(
          bono.importe_pagado ||
            0
        ),
      0
    );

  return (
    <main className="min-h-screen bg-slate-100 p-8">

      <div className="mx-auto max-w-7xl">

        <div>

          <h1 className="text-4xl font-bold text-slate-900">
            Bonos
          </h1>

          <p className="mt-2 text-slate-600">
            Gestión de bonos de clases
          </p>

        </div>

        {filtroDesdeDashboard === "por-terminar" && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <div>
              <p className="font-bold text-amber-800">Bonos próximos a agotarse</p>
              <p className="mt-1 text-sm text-amber-700">Solo se muestran bonos activos con 1 o 2 clases restantes.</p>
            </div>
            <a href="/bonos" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-amber-700 shadow-sm">
              Quitar filtro
            </a>
          </div>
        )}

        <ResumenBonos
          bonosActivos={
            bonosActivos
          }
          clasesDisponibles={
            clasesDisponibles
          }
          bonosFinalizados={
            bonosFinalizados
          }
          importeBonos={
            importeBonos
          }
        />

        <div className="mt-8 grid gap-8 xl:grid-cols-[370px_minmax(0,1fr)]">

          <FormularioBono
            alumnos={alumnos}
            alumnoId={
              alumnoId
            }
            alumnosAutorizados={
              alumnosAutorizados
            }
            busquedaAlumno={
              busquedaAlumno
            }
            numeroClases={
              numeroClases
            }
            clasesRestantes={
              clasesRestantes
            }
            importe={importe}
            fechaCompra={
              fechaCompra
            }
            activo={activo}
            bonoEditandoId={
              bonoEditandoId
            }
            mensaje={mensaje}
            setAlumnoId={
              setAlumnoId
            }
            setAlumnosAutorizados={
              setAlumnosAutorizados
            }
            setBusquedaAlumno={
              setBusquedaAlumno
            }
            setNumeroClases={
              setNumeroClases
            }
            setClasesRestantes={
              setClasesRestantes
            }
            setImporte={
              setImporte
            }
            setFechaCompra={
              setFechaCompra
            }
            setActivo={
              setActivo
            }
            onGuardar={
              guardarBono
            }
            onCancelar={() => {
              limpiarFormulario();
              setMensaje("");
            }}
          />
          <ListadoBonos
            bonos={
              bonosFiltrados
            }
            alumnos={
              alumnos
            }
            relacionesBonoAlumno={
              relacionesBonoAlumno
            }
            busquedaBonos={
              busquedaBonos
            }
            filtroEstado={
              filtroEstado
            }
            filtroMes={
              filtroMes
            }
            setBusquedaBonos={
              setBusquedaBonos
            }
            setFiltroEstado={
              setFiltroEstado
            }
            setFiltroMes={
              setFiltroMes
            }
            onLimpiarFiltros={() => {
              setBusquedaBonos("");
              setFiltroEstado(
                "todos"
              );
              setFiltroMes("");
            }}
            onEditar={
              editarBono
            }
            onBorrar={
              borrarBono
            }
            onGenerarImagen={
              descargarImagenBono
            }
            generandoImagenBono={
              generandoImagenBono
            }
            formatearFecha={
              formatearFecha
            }
            calcularHorario={
              calcularHorario
            }
          />

        </div>

      </div>

    </main>
  );
}
            