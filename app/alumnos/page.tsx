"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

import FichaAlumno from "../../components/alumnos/FichaAlumno";
import HistorialAlumno from "../../components/alumnos/HistorialAlumno";
import FormularioAlumno from "../../components/alumnos/FormularioAlumno";

type Alumno = {
  id: string;
  nombre: string;
  apellidos: string | null;
  telefono: string | null;
  email: string | null;
  precio_habitual: number | null;
  activo: boolean;
  foto_url: string | null;
  procedencia: string | null;
  club_origen: string | null;
  ubicacion_habitual_id: string | null;
  tipo_clase_habitual: string | null;
};

type Ubicacion = {
  id: string;
  nombre: string;
};

type BonoResumen = {
  id: string;
  alumno_id: string;
  numero_clases: number;
  clases_restantes: number;
  activo: boolean;
};

type PagoResumen = {
  id: string;
  alumno_id: string | null;
  clase_id: string | null;
  importe: number;
  estado: string;
  metodo: string;
  fecha_pago: string;
};

type ClaseAlumnoResumen = {
  alumno_id: string;
  importe: number;
  usa_bono: boolean;

  clases: {
    id: string;
    fecha: string;
    hora_inicio: string;
    duracion_minutos: number;
    estado: string;
    tipo: string;

    ubicaciones: {
      nombre: string;
    } | null;
  } | null;
};

export default function AlumnosPage() {
  const router = useRouter();

  const [alumnos, setAlumnos] =
    useState<Alumno[]>([]);

  const [ubicaciones, setUbicaciones] =
    useState<Ubicacion[]>([]);

  const [bonos, setBonos] =
    useState<BonoResumen[]>([]);

  const [pagos, setPagos] =
    useState<PagoResumen[]>([]);

  const [
    historialClases,
    setHistorialClases,
  ] = useState<ClaseAlumnoResumen[]>([]);

  const [nombre, setNombre] =
    useState("");

  const [apellidos, setApellidos] =
    useState("");

  const [telefono, setTelefono] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [precio, setPrecio] =
    useState("");

  const [procedencia, setProcedencia] =
    useState("propio");

  const [clubOrigen, setClubOrigen] =
    useState("");

  const [
    ubicacionHabitualId,
    setUbicacionHabitualId,
  ] = useState("");

  const [
    tipoClaseHabitual,
    setTipoClaseHabitual,
  ] = useState("");

  const [activo, setActivo] =
    useState(true);

  const [fotoUrl, setFotoUrl] =
    useState("");

  const [
    fotoArchivo,
    setFotoArchivo,
  ] = useState<File | null>(null);

  const [mensaje, setMensaje] =
    useState("");

  const [
    alumnoEditandoId,
    setAlumnoEditandoId,
  ] =
    useState<string | null>(null);

  const [busqueda, setBusqueda] =
    useState("");

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState("todos");

  const [
    filtroProcedencia,
    setFiltroProcedencia,
  ] = useState("todos");

  const [
    historialesAbiertos,
    setHistorialesAbiertos,
  ] = useState<string[]>([]);

  useEffect(() => {
    cargarAlumnos();
  }, []);

  async function cargarAlumnos() {
    const {
      data,
      error,
    } = await supabase
      .from("alumnos")
      .select("*")
      .order("nombre");

    if (error) {
      setMensaje(
        "❌ Error al cargar alumnos: " +
          error.message
      );

      return;
    }

    const {
      data: ubicacionesData,
    } = await supabase
      .from("ubicaciones")
      .select("id,nombre")
      .eq("activa", true)
      .order("nombre");

    const {
      data: bonosData,
    } = await supabase
      .from("bonos")
      .select(`
        id,
        alumno_id,
        numero_clases,
        clases_restantes,
        activo
      `);

    const {
      data: pagosData,
    } = await supabase
      .from("pagos")
      .select(`
        id,
        alumno_id,
        clase_id,
        importe,
        estado,
        metodo,
        fecha_pago
      `);

    const {
      data: historialData,
    } = await supabase
      .from("clase_alumnos")
      .select(`
        alumno_id,
        importe,
        usa_bono,
        clases (
          id,
          fecha,
          hora_inicio,
          duracion_minutos,
          estado,
          tipo,
          ubicaciones (
            nombre
          )
        )
      `);

    setAlumnos(
      (data || []) as Alumno[]
    );

    setUbicaciones(
      (ubicacionesData || []) as Ubicacion[]
    );

    setBonos(
      (bonosData ||
        []) as BonoResumen[]
    );

    setPagos(
      (pagosData ||
        []) as PagoResumen[]
    );

    setHistorialClases(
      (historialData ||
        []) as unknown as ClaseAlumnoResumen[]
    );
  }

  function limpiarFormulario() {
    setNombre("");
    setApellidos("");
    setTelefono("");
    setEmail("");
    setPrecio("");
    setProcedencia("propio");
    setClubOrigen("");
    setUbicacionHabitualId("");
    setTipoClaseHabitual("");
    setActivo(true);

    setFotoArchivo(null);
    setFotoUrl("");

    setAlumnoEditandoId(null);
  }

  function seleccionarFoto(
    archivo: File | null
  ) {
    if (!archivo) {
      return;
    }

    const formatosPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !formatosPermitidos.includes(
        archivo.type
      )
    ) {
      setMensaje(
        "❌ La foto debe ser JPG, PNG o WEBP"
      );

      return;
    }

    const limite =
      5 * 1024 * 1024;

    if (
      archivo.size > limite
    ) {
      setMensaje(
        "❌ La foto no puede superar 5 MB"
      );

      return;
    }

    setFotoArchivo(
      archivo
    );

    setFotoUrl(
      URL.createObjectURL(
        archivo
      )
    );

    setMensaje("");
  }

  async function subirFoto() {
    if (!fotoArchivo) {
      return fotoUrl || null;
    }

    const extension =
      fotoArchivo.name
        .split(".")
        .pop()
        ?.toLowerCase() ||
      "jpg";

    const nombreArchivo =
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${extension}`;

    const rutaArchivo =
      `perfiles/${nombreArchivo}`;

    const {
      error: errorSubida,
    } = await supabase.storage
      .from("alumnos")
      .upload(
        rutaArchivo,
        fotoArchivo,
        {
          cacheControl: "3600",
          upsert: false,
        }
      );

    if (errorSubida) {
      throw new Error(
        errorSubida.message
      );
    }

    const {
      data: urlData,
    } = supabase.storage
      .from("alumnos")
      .getPublicUrl(
        rutaArchivo
      );

    return (
      urlData.publicUrl ||
      null
    );
  }

  async function guardarAlumno(
    e: FormEvent
  ) {
    e.preventDefault();

    setMensaje("");

    let fotoFinal:
      string | null = null;

    try {
      fotoFinal =
        await subirFoto();
    } catch (error) {
      const mensajeError =
        error instanceof Error
          ? error.message
          : "Error desconocido";

      setMensaje(
        "❌ Error al subir la foto: " +
          mensajeError
      );

      return;
    }

    const datos = {
      nombre,
      apellidos:
        apellidos || null,
      telefono:
        telefono || null,
      email:
        email || null,
      precio_habitual:
        precio
          ? Number(precio)
          : null,
      procedencia,
      club_origen:
        procedencia === "otro_club"
          ? clubOrigen || null
          : procedencia === "iql"
          ? "IQL"
          : null,
      ubicacion_habitual_id:
        ubicacionHabitualId || null,
      tipo_clase_habitual:
        tipoClaseHabitual || null,
      activo,
      foto_url:
        fotoFinal,
    };

    let error;

    if (alumnoEditandoId) {
      const resultado =
        await supabase
          .from("alumnos")
          .update(datos)
          .eq(
            "id",
            alumnoEditandoId
          );

      error =
        resultado.error;
    } else {
      const resultado =
        await supabase
          .from("alumnos")
          .insert(datos);

      error =
        resultado.error;
    }

    if (error) {
      setMensaje(
        "❌ Error al guardar alumno: " +
          error.message
      );

      return;
    }

    const alumnoQueSeEstabaEditando =
      alumnoEditandoId;

    setMensaje(
      alumnoEditandoId
        ? "✅ Alumno actualizado correctamente"
        : "✅ Alumno creado correctamente"
    );

    limpiarFormulario();

    await cargarAlumnos();

    if (
      alumnoQueSeEstabaEditando
    ) {
      setTimeout(
        () => {
          document
            .getElementById(
              `alumno-${alumnoQueSeEstabaEditando}`
            )
            ?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
        },
        100
      );
    }
  }

  function editarAlumno(
    alumno: Alumno
  ) {
    setAlumnoEditandoId(
      alumno.id
    );

    setNombre(
      alumno.nombre
    );

    setApellidos(
      alumno.apellidos ||
        ""
    );

    setTelefono(
      alumno.telefono ||
        ""
    );

    setEmail(
      alumno.email ||
        ""
    );

    setPrecio(
      alumno.precio_habitual !==
        null
        ? String(
            alumno.precio_habitual
          )
        : ""
    );

    setProcedencia(
      alumno.procedencia || "propio"
    );

    setClubOrigen(
      alumno.club_origen || ""
    );

    setUbicacionHabitualId(
      alumno.ubicacion_habitual_id || ""
    );

    setTipoClaseHabitual(
      alumno.tipo_clase_habitual || ""
    );

    setActivo(
      alumno.activo
    );

    setFotoArchivo(null);

    setFotoUrl(
      alumno.foto_url ||
        ""
    );

    setMensaje("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function borrarAlumno(
    id: string
  ) {
    const confirmar =
      window.confirm(
        "¿Seguro que quieres borrar este alumno?"
      );

    if (!confirmar) {
      return;
    }

    const {
      error,
    } = await supabase
      .from("alumnos")
      .delete()
      .eq("id", id);

    if (error) {
      setMensaje(
        "❌ Error al borrar alumno: " +
          error.message
      );

      return;
    }

    if (
      alumnoEditandoId ===
      id
    ) {
      limpiarFormulario();
    }

    setMensaje(
      "✅ Alumno borrado correctamente"
    );

    await cargarAlumnos();
  }

  async function cambiarEstadoAlumno(
    alumno: Alumno
  ) {
    const {
      error,
    } = await supabase
      .from("alumnos")
      .update({
        activo:
          !alumno.activo,
      })
      .eq(
        "id",
        alumno.id
      );

    if (error) {
      setMensaje(
        "❌ Error al cambiar el estado: " +
          error.message
      );

      return;
    }

    await cargarAlumnos();
  }

  function cambiarHistorial(
    alumnoId: string
  ) {
    setHistorialesAbiertos(
      (actuales) =>
        actuales.includes(
          alumnoId
        )
          ? actuales.filter(
              (id) =>
                id !==
                alumnoId
            )
          : [
              ...actuales,
              alumnoId,
            ]
    );
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

  function diferenciaDias(
    fecha: string
  ) {
    const hoy =
      new Date();

    hoy.setHours(
      0,
      0,
      0,
      0
    );

    const fechaClase =
      new Date(
        `${fecha}T00:00:00`
      );

    fechaClase.setHours(
      0,
      0,
      0,
      0
    );

    const diferencia =
      hoy.getTime() -
      fechaClase.getTime();

    return Math.max(
      0,
      Math.floor(
        diferencia /
          (
            1000 *
            60 *
            60 *
            24
          )
      )
    );
  }

  function obtenerResumenAlumno(
    alumnoId: string
  ) {
    const bonosAlumno =
      bonos.filter(
        (bono) =>
          bono.alumno_id ===
            alumnoId &&
          bono.activo &&
          bono.clases_restantes >
            0
      );

    const clasesRestantes =
      bonosAlumno.reduce(
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

    const pendienteCobro =
      pagos
        .filter(
          (pago) =>
            pago.alumno_id ===
              alumnoId &&
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
              pago.importe ||
                0
            ),
          0
        );

    const registrosAlumno =
      historialClases.filter(
        (registro) =>
          registro.alumno_id ===
            alumnoId &&
          registro.clases
      );

    const clasesRealizadas =
      registrosAlumno
        .filter(
          (registro) =>
            registro.clases
              ?.estado ===
            "realizada"
        )
        .sort(
          (
            a,
            b
          ) => {
            const fechaA =
              `${
                a.clases
                  ?.fecha ||
                ""
              } ${
                a.clases
                  ?.hora_inicio ||
                ""
              }`;

            const fechaB =
              `${
                b.clases
                  ?.fecha ||
                ""
              } ${
                b.clases
                  ?.hora_inicio ||
                ""
              }`;

            return fechaB.localeCompare(
              fechaA
            );
          }
        );

    const ultimaClase =
      clasesRealizadas.length >
      0
        ? clasesRealizadas[0]
            .clases
        : null;

    let ultimaClaseFecha =
      "Sin clases";

    let ultimaClaseHorario =
      "—";

    let diasDesdeUltimaClase:
      number | null = null;

    if (ultimaClase) {
      ultimaClaseFecha =
        formatearFecha(
          ultimaClase.fecha
        );

      ultimaClaseHorario =
        calcularHorario(
          ultimaClase.hora_inicio,
          ultimaClase.duracion_minutos
        );

      diasDesdeUltimaClase =
        diferenciaDias(
          ultimaClase.fecha
        );
    }

    const ahora =
      new Date();

    const clasesFuturas =
      registrosAlumno
        .filter(
          (registro) => {
            const clase =
              registro.clases;

            if (!clase) {
              return false;
            }

            if (
              clase.estado ===
              "cancelada"
            ) {
              return false;
            }

            const fechaHora =
              new Date(
                `${clase.fecha}T${clase.hora_inicio}`
              );

            return (
              fechaHora.getTime() >=
              ahora.getTime()
            );
          }
        )
        .sort(
          (
            a,
            b
          ) => {
            const fechaA =
              `${
                a.clases
                  ?.fecha ||
                ""
              } ${
                a.clases
                  ?.hora_inicio ||
                ""
              }`;

            const fechaB =
              `${
                b.clases
                  ?.fecha ||
                ""
              } ${
                b.clases
                  ?.hora_inicio ||
                ""
              }`;

            return fechaA.localeCompare(
              fechaB
            );
          }
        );

    const proximaClase =
      clasesFuturas.length >
      0
        ? clasesFuturas[0]
            .clases
        : null;

    let proximaClaseFecha =
      "Sin clase";

    let proximaClaseHorario =
      "—";

    if (proximaClase) {
      proximaClaseFecha =
        formatearFecha(
          proximaClase.fecha
        );

      proximaClaseHorario =
        calcularHorario(
          proximaClase.hora_inicio,
          proximaClase.duracion_minutos
        );
    }

    return {
      clasesRestantes,
      pendienteCobro,
      totalClasesRealizadas:
        clasesRealizadas.length,
      ultimaClaseFecha,
      ultimaClaseHorario,
      proximaClaseFecha,
      proximaClaseHorario,
      diasDesdeUltimaClase,
    };
  }

  function obtenerClasesAlumno(
    alumnoId: string
  ) {
    return historialClases
      .filter(
        (registro) =>
          registro.alumno_id ===
            alumnoId &&
          registro.clases
      )
      .sort(
        (
          a,
          b
        ) => {
          const fechaA =
            `${
              a.clases
                ?.fecha ||
              ""
            } ${
              a.clases
                ?.hora_inicio ||
              ""
            }`;

          const fechaB =
            `${
              b.clases
                ?.fecha ||
              ""
            } ${
              b.clases
                ?.hora_inicio ||
              ""
            }`;

          return fechaB.localeCompare(
            fechaA
          );
        }
      );
  }

  function obtenerPagosAlumno(
    alumnoId: string
  ) {
    return pagos
      .filter(
        (pago) =>
          pago.alumno_id ===
          alumnoId
      )
      .sort(
        (
          a,
          b
        ) =>
          b.fecha_pago.localeCompare(
            a.fecha_pago
          )
      );
  }

  const alumnosFiltrados =
    alumnos.filter(
      (alumno) => {
        const texto =
          `${alumno.nombre} ${
            alumno.apellidos ||
            ""
          } ${
            alumno.telefono ||
            ""
          } ${
            alumno.email ||
            ""
          } ${
            alumno.club_origen ||
            ""
          }`.toLowerCase();

        const coincideBusqueda =
          texto.includes(
            busqueda.toLowerCase()
          );

        const coincideEstado =
          filtroEstado ===
            "todos" ||
          (filtroEstado ===
            "activos" &&
            alumno.activo) ||
          (filtroEstado ===
            "inactivos" &&
            !alumno.activo);

        const procedenciaAlumno =
          alumno.procedencia || "propio";

        const coincideProcedencia =
          filtroProcedencia === "todos" ||
          procedenciaAlumno === filtroProcedencia;

        return (
          coincideBusqueda &&
          coincideEstado &&
          coincideProcedencia
        );
      }
    );

  const alumnosActivos =
    alumnos.filter(
      (alumno) =>
        alumno.activo
    ).length;

  const alumnosInactivos =
    alumnos.filter(
      (alumno) =>
        !alumno.activo
    ).length;

  return (
    <main className="min-h-screen bg-slate-100 p-8">

      <div className="mx-auto max-w-7xl">

        <div>

          <h1 className="text-4xl font-bold text-slate-900">
            Alumnos
          </h1>

          <p className="mt-2 text-slate-600">
            Gestión y seguimiento de alumnos
          </p>

        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">

          <div className="rounded-2xl bg-white p-5 shadow">

            <p className="text-sm text-slate-500">
              Alumnos activos
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {alumnosActivos}
            </p>

          </div>

          <div className="rounded-2xl bg-white p-5 shadow">

            <p className="text-sm text-slate-500">
              Alumnos inactivos
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-500">
              {alumnosInactivos}
            </p>

          </div>

        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[330px_1fr]">

          <FormularioAlumno
            nombre={nombre}
            apellidos={apellidos}
            telefono={telefono}
            email={email}
            precio={precio}
            procedencia={procedencia}
            clubOrigen={clubOrigen}
            ubicaciones={ubicaciones}
            ubicacionHabitualId={ubicacionHabitualId}
            tipoClaseHabitual={tipoClaseHabitual}
            activo={activo}
            fotoUrl={fotoUrl}
            alumnoEditandoId={
              alumnoEditandoId
            }
            mensaje={mensaje}
            setNombre={setNombre}
            setApellidos={
              setApellidos
            }
            setTelefono={
              setTelefono
            }
            setEmail={setEmail}
            setPrecio={setPrecio}
            setProcedencia={setProcedencia}
            setClubOrigen={setClubOrigen}
            setUbicacionHabitualId={setUbicacionHabitualId}
            setTipoClaseHabitual={setTipoClaseHabitual}
            setActivo={setActivo}
            onFotoSeleccionada={
              seleccionarFoto
            }
            onGuardar={
              guardarAlumno
            }
            onCancelar={() => {
              const alumnoQueSeEstabaEditando =
                alumnoEditandoId;

              limpiarFormulario();
              setMensaje("");

              if (
                alumnoQueSeEstabaEditando
              ) {
                setTimeout(
                  () => {
                    document
                      .getElementById(
                        `alumno-${alumnoQueSeEstabaEditando}`
                      )
                      ?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                  },
                  100
                );
              }
            }}
          />

          <div>

            <div className="rounded-2xl bg-white p-6 shadow">

              <h2 className="text-xl font-bold text-slate-900">
                Alumnos registrados
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {alumnosFiltrados.length} alumno(s) mostrado(s)
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-[1fr_160px_180px_160px]">

                <input
                  type="text"
                  placeholder="Buscar nombre, teléfono o email..."
                  value={busqueda}
                  onChange={(e) =>
                    setBusqueda(
                      e.target.value
                    )
                  }
                  className="rounded-xl border border-slate-300 px-4 py-3"
                />

                <select
                  value={filtroEstado}
                  onChange={(e) =>
                    setFiltroEstado(
                      e.target.value
                    )
                  }
                  className="rounded-xl border border-slate-300 px-4 py-3"
                >
                  <option value="todos">
                    Todos
                  </option>

                  <option value="activos">
                    Activos
                  </option>

                  <option value="inactivos">
                    Inactivos
                  </option>
                </select>

                <select
                  value={filtroProcedencia}
                  onChange={(e) =>
                    setFiltroProcedencia(
                      e.target.value
                    )
                  }
                  className="rounded-xl border border-slate-300 px-4 py-3"
                >
                  <option value="todos">
                    Todas las procedencias
                  </option>

                  <option value="propio">
                    Alumnos propios
                  </option>

                  <option value="iql">
                    IQL
                  </option>

                  <option value="otro_club">
                    Otros clubs
                  </option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setBusqueda("");
                    setFiltroEstado(
                      "todos"
                    );
                    setFiltroProcedencia(
                      "todos"
                    );
                  }}
                  className="rounded-xl bg-slate-200 px-4 py-3 font-semibold text-slate-800"
                >
                  Limpiar filtros
                </button>

              </div>

            </div>

            <div className="mt-5 space-y-4">

              {alumnosFiltrados.length ===
                0 && (

                <div className="rounded-2xl bg-white p-6 shadow">

                  <p className="text-slate-500">
                    No hay alumnos que coincidan con los filtros.
                  </p>

                </div>

              )}

              {alumnosFiltrados.map(
                (alumno) => {
                  const resumen =
                    obtenerResumenAlumno(
                      alumno.id
                    );

                  const clasesAlumno =
                    obtenerClasesAlumno(
                      alumno.id
                    );

                  const pagosAlumno =
                    obtenerPagosAlumno(
                      alumno.id
                    );

                  const historialAbierto =
                    historialesAbiertos.includes(
                      alumno.id
                    );

                  return (
                    <div
                      key={alumno.id}
                      id={`alumno-${alumno.id}`}
                    >
                    <FichaAlumno
                      alumno={alumno}
                      ubicacionHabitualNombre={
                        ubicaciones.find(
                          (ubicacion) =>
                            ubicacion.id ===
                            alumno.ubicacion_habitual_id
                        )?.nombre || null
                      }
                      tipoClaseHabitual={alumno.tipo_clase_habitual}
                      resumen={resumen}
                      historialAbierto={
                        historialAbierto
                      }
                      onRegistrarPago={() =>
                        router.push(
                          `/pagos?alumno=${alumno.id}`
                        )
                      }
                      onGestionarBono={() =>
                        router.push(
                          `/bonos?alumno=${alumno.id}`
                        )
                      }
                      onVerHistorial={() =>
                        cambiarHistorial(
                          alumno.id
                        )
                      }
                      onEditar={() =>
                        editarAlumno(
                          alumno
                        )
                      }
                      onCambiarEstado={() =>
                        cambiarEstadoAlumno(
                          alumno
                        )
                      }
                      onBorrar={() =>
                        borrarAlumno(
                          alumno.id
                        )
                      }
                    >

                      <HistorialAlumno
                        clasesAlumno={
                          clasesAlumno
                        }
                        pagosAlumno={
                          pagosAlumno
                        }
                        formatearFecha={
                          formatearFecha
                        }
                        calcularHorario={
                          calcularHorario
                        }
                      />

                    </FichaAlumno>
                    </div>
                  );
                }
              )}

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}