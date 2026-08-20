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
  apodo: string | null;
  fecha_nacimiento: string | null;
  localidad: string | null;
  pais: string | null;
  observaciones: string | null;
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

type RelacionBonoAlumno = {
  bono_id: string;
  alumno_id: string;
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

  const [
    relacionesBonoAlumno,
    setRelacionesBonoAlumno,
  ] = useState<RelacionBonoAlumno[]>([]);

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

  const [apodo, setApodo] =
    useState("");

  const [
    fechaNacimiento,
    setFechaNacimiento,
  ] = useState("");

  const [localidad, setLocalidad] =
    useState("");

  const [pais, setPais] =
    useState("");

  const [observaciones, setObservaciones] =
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

  const [
    alumnoSeleccionadoId,
    setAlumnoSeleccionadoId,
  ] = useState<string | null>(null);

  const [
    formularioAbierto,
    setFormularioAbierto,
  ] = useState(false);

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
      data: relacionesBonoData,
      error: errorRelacionesBono,
    } = await supabase
      .from("bono_alumnos")
      .select(`
        bono_id,
        alumno_id
      `);

    if (errorRelacionesBono) {
      setMensaje(
        "❌ Error al cargar bonos compartidos: " +
          errorRelacionesBono.message
      );

      return;
    }

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

    const alumnosCargados =
      (data || []) as Alumno[];

    setAlumnos(
      alumnosCargados
    );

    setAlumnoSeleccionadoId(
      (actual) =>
        actual &&
        alumnosCargados.some(
          (alumno) =>
            alumno.id === actual
        )
          ? actual
          : alumnosCargados[0]?.id ||
            null
    );

    setUbicaciones(
      (ubicacionesData || []) as Ubicacion[]
    );

    setBonos(
      (bonosData ||
        []) as BonoResumen[]
    );

    setRelacionesBonoAlumno(
      (relacionesBonoData ||
        []) as RelacionBonoAlumno[]
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
    setApodo("");
    setFechaNacimiento("");
    setLocalidad("");
    setPais("");
    setObservaciones("");
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

  function quitarFoto() {
    if (fotoUrl.startsWith("blob:")) {
      URL.revokeObjectURL(fotoUrl);
    }

    setFotoArchivo(null);
    setFotoUrl("");
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
      apodo:
        apodo.trim() || null,
      fecha_nacimiento:
        fechaNacimiento || null,
      localidad:
        localidad.trim() || null,
      pais:
        pais.trim() || null,
      observaciones:
        observaciones.trim() || null,
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
    setFormularioAbierto(false);

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
    setAlumnoSeleccionadoId(
      alumno.id
    );

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

    setApodo(
      alumno.apodo || ""
    );

    setFechaNacimiento(
      alumno.fecha_nacimiento || ""
    );

    setLocalidad(
      alumno.localidad || ""
    );

    setPais(
      alumno.pais || ""
    );

    setObservaciones(
      alumno.observaciones || ""
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
    setFormularioAbierto(true);

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
    const bonosActivosAlumno =
      bonos.filter(
        (bono) => {
          if (
            !bono.activo ||
            Number(
              bono.clases_restantes ||
                0
            ) <= 0
          ) {
            return false;
          }

          const esTitular =
            bono.alumno_id ===
            alumnoId;

          const estaAutorizado =
            relacionesBonoAlumno.some(
              (relacion) =>
                relacion.bono_id ===
                  bono.id &&
                relacion.alumno_id ===
                  alumnoId
            );

          return (
            esTitular ||
            estaAutorizado
          );
        }
      );

    const clasesRestantes =
      bonosActivosAlumno.reduce(
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

    const bonosCompartidos =
      bonosActivosAlumno.filter(
        (bono) => {
          const miembros =
            relacionesBonoAlumno.filter(
              (relacion) =>
                relacion.bono_id ===
                bono.id
            );

          return (
            miembros.length > 1
          );
        }
      );

    const bonoCompartido =
      bonosCompartidos.length > 0;

    const idsOtrosMiembros =
      Array.from(
        new Set(
          bonosCompartidos.flatMap(
            (bono) =>
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
                )
          )
        )
      );

    const nombresOtrosMiembros =
      idsOtrosMiembros
        .map((id) => {
          const alumno =
            alumnos.find(
              (item) =>
                item.id === id
            );

          if (!alumno) {
            return "";
          }

          return `${alumno.nombre} ${
            alumno.apellidos || ""
          }`.trim();
        })
        .filter(Boolean);

    const titularesCompartidos =
      Array.from(
        new Set(
          bonosCompartidos.map(
            (bono) =>
              bono.alumno_id
          )
        )
      )
        .map((id) => {
          const alumno =
            alumnos.find(
              (item) =>
                item.id === id
            );

          if (!alumno) {
            return "";
          }

          return `${alumno.nombre} ${
            alumno.apellidos || ""
          }`.trim();
        })
        .filter(Boolean);

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
      tieneBonoActivo:
        bonosActivosAlumno.length > 0,
      bonoCompartido,
      bonoCompartidoCon:
        nombresOtrosMiembros.join(", "),
      bonoTitularNombre:
        titularesCompartidos.join(", "),
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
          } ${
            alumno.apodo ||
            ""
          } ${
            alumno.localidad ||
            ""
          } ${
            alumno.pais ||
            ""
          } ${
            alumno.observaciones ||
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

  const alumnoSeleccionado =
    alumnosFiltrados.find(
      (alumno) =>
        alumno.id ===
        alumnoSeleccionadoId
    ) ||
    alumnosFiltrados[0] ||
    null;

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
    <main className="min-h-screen bg-[#F6F8FA] px-3 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-7">
      <div className="mx-auto w-full max-w-[1540px]">

        {/* CABECERA */}
        <header className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#17324D] sm:text-4xl">
              Alumnos
            </h1>

            <p className="mt-1.5 text-sm text-slate-500">
              Directorio, seguimiento y ficha de cada alumno
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              limpiarFormulario();
              setMensaje("");
              setFormularioAbierto(true);
            }}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#00A79C] px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(0,167,156,0.14)] transition hover:bg-[#008F86] sm:w-auto"
          >
            + Nuevo alumno
          </button>
        </header>

        {/* DIRECTORIO + FICHA */}
        <section className="mt-4 grid min-h-0 grid-cols-1 gap-4 lg:mt-5 lg:min-h-[690px] lg:grid-cols-[350px_minmax(0,1fr)] lg:gap-0 lg:overflow-hidden lg:rounded-2xl lg:border lg:border-slate-200 lg:bg-white lg:shadow-[0_10px_30px_rgba(15,23,42,0.045)]">

          {/* DIRECTORIO */}
          <aside className="flex max-h-[410px] min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-[#FBFCFD] shadow-[0_8px_24px_rgba(15,23,42,0.035)] lg:max-h-none lg:rounded-none lg:border-0 lg:border-r lg:border-slate-200 lg:shadow-none">
            <div className="border-b border-slate-200 p-4">
              <div className="relative">
                <svg
                  viewBox="0 0 24 24"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>

                <input
                  type="text"
                  placeholder="Buscar alumno..."
                  value={busqueda}
                  onChange={(e) =>
                    setBusqueda(
                      e.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-[#17324D] outline-none transition placeholder:text-slate-400 focus:border-[#00A79C]/50 focus:ring-2 focus:ring-[#00A79C]/10"
                />
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <select
                  value={filtroEstado}
                  onChange={(e) =>
                    setFiltroEstado(
                      e.target.value
                    )
                  }
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-[#17324D] outline-none focus:border-[#00A79C]/50"
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
                  value={
                    filtroProcedencia
                  }
                  onChange={(e) =>
                    setFiltroProcedencia(
                      e.target.value
                    )
                  }
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-[#17324D] outline-none focus:border-[#00A79C]/50"
                >
                  <option value="todos">
                    Vinculación
                  </option>
                  <option value="propio">
                    Propios
                  </option>
                  <option value="iql">
                    IQL
                  </option>
                  <option value="otro_club">
                    Otros clubs
                  </option>
                </select>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-400">
                  {alumnosFiltrados.length} de {alumnos.length} alumnos
                </p>

                {(busqueda ||
                  filtroEstado !==
                    "todos" ||
                  filtroProcedencia !==
                    "todos") && (
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
                    className="text-[11px] font-bold text-[#00A79C] hover:underline"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {alumnosFiltrados.length ===
                0 && (
                <div className="m-2 rounded-xl border border-dashed border-slate-200 bg-white p-5 text-center">
                  <p className="text-xs font-medium text-slate-400">
                    No hay alumnos que coincidan con los filtros.
                  </p>
                </div>
              )}

              <div className="space-y-1">
                {alumnosFiltrados.map(
                  (alumno) => {
                    const resumen =
                      obtenerResumenAlumno(
                        alumno.id
                      );

                    const seleccionado =
                      alumnoSeleccionado?.id ===
                      alumno.id;

                    return (
                      <button
                        key={alumno.id}
                        type="button"
                        onClick={() => {
                          setAlumnoSeleccionadoId(
                            alumno.id
                          );
                          setHistorialesAbiertos(
                            []
                          );

                          if (
                            window.innerWidth <
                            1024
                          ) {
                            setTimeout(
                              () => {
                                document
                                  .getElementById(
                                    "ficha-alumno-movil"
                                  )
                                  ?.scrollIntoView({
                                    behavior:
                                      "smooth",
                                    block:
                                      "start",
                                  });
                              },
                              80
                            );
                          }
                        }}
                        className={
                          seleccionado
                            ? "w-full rounded-xl border border-[#00A79C]/25 bg-[#00A79C]/10 p-3 text-left transition"
                            : "w-full rounded-xl border border-transparent p-3 text-left transition hover:border-slate-200 hover:bg-white"
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
                            <img
                              src={
                                alumno.foto_url ||
                                "/logo-espacio-padel.png"
                              }
                              alt={`${alumno.nombre} ${alumno.apellidos || ""}`}
                              className={
                                alumno.foto_url
                                  ? "h-full w-full object-cover"
                                  : "h-[86%] w-[86%] object-contain"
                              }
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2">
                              <p className="truncate text-sm font-bold text-[#17324D]">
                                {alumno.nombre}{" "}
                                {alumno.apellidos ||
                                  ""}
                              </p>

                              <span
                                className={
                                  alumno.activo
                                    ? "h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                                    : "h-2 w-2 shrink-0 rounded-full bg-red-500"
                                }
                                title={
                                  alumno.activo
                                    ? "Activo"
                                    : "Inactivo"
                                }
                              />
                            </div>

                            <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">
                              {alumno.telefono ||
                                alumno.email ||
                                "Sin contacto"}
                            </p>

                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {resumen.pendienteCobro >
                                0 && (
                                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-600">
                                  {resumen.pendienteCobro.toFixed(
                                    0
                                  )}{" "}
                                  € pendiente
                                </span>
                              )}

                              {resumen.tieneBonoActivo && (
                                <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-bold text-violet-700">
                                  {resumen.bonoCompartido
                                    ? "Bono compartido · "
                                    : "Bono · "}
                                  {resumen.clasesRestantes}
                                </span>
                              )}

                            </div>
                          </div>

                          <svg
                            viewBox="0 0 24 24"
                            className={
                              seleccionado
                                ? "h-4 w-4 shrink-0 text-[#00A79C]"
                                : "h-4 w-4 shrink-0 text-slate-300"
                            }
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 px-4 py-3">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                <span>
                  {alumnosActivos} activos
                </span>
                <span>
                  {alumnosInactivos} inactivos
                </span>
              </div>
            </div>
          </aside>

          {/* FICHA SELECCIONADA */}
          <div id="ficha-alumno-movil" className="min-w-0 bg-transparent p-0 lg:bg-white lg:p-6">
            {!alumnoSeleccionado ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 lg:h-full lg:min-h-[600px] lg:rounded-none lg:border-0 lg:p-0">
                <div className="max-w-sm text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="8" r="3.25" />
                      <path d="M5 20c.55-4 2.9-6 7-6s6.45 2 7 6" />
                    </svg>
                  </div>

                  <p className="mt-4 text-sm font-bold text-[#17324D]">
                    Selecciona un alumno
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    La ficha completa aparecerá aquí.
                  </p>
                </div>
              </div>
            ) : (
              (() => {
                const resumen =
                  obtenerResumenAlumno(
                    alumnoSeleccionado.id
                  );

                const clasesAlumno =
                  obtenerClasesAlumno(
                    alumnoSeleccionado.id
                  );

                const pagosAlumno =
                  obtenerPagosAlumno(
                    alumnoSeleccionado.id
                  );

                const historialAbierto =
                  historialesAbiertos.includes(
                    alumnoSeleccionado.id
                  );

                return (
                  <FichaAlumno
                    alumno={
                      alumnoSeleccionado
                    }
                    ubicacionHabitualNombre={
                      ubicaciones.find(
                        (ubicacion) =>
                          ubicacion.id ===
                          alumnoSeleccionado.ubicacion_habitual_id
                      )?.nombre || null
                    }
                    tipoClaseHabitual={
                      alumnoSeleccionado.tipo_clase_habitual
                    }
                    resumen={resumen}
                    historialAbierto={
                      historialAbierto
                    }
                    onRegistrarPago={() =>
                      router.push(
                        `/pagos?alumno=${alumnoSeleccionado.id}`
                      )
                    }
                    onGestionarBono={() =>
                      router.push(
                        `/bonos?alumno=${alumnoSeleccionado.id}`
                      )
                    }
                    onVerHistorial={() =>
                      cambiarHistorial(
                        alumnoSeleccionado.id
                      )
                    }
                    onEditar={() =>
                      editarAlumno(
                        alumnoSeleccionado
                      )
                    }
                    onCambiarEstado={() =>
                      cambiarEstadoAlumno(
                        alumnoSeleccionado
                      )
                    }
                    onBorrar={() =>
                      borrarAlumno(
                        alumnoSeleccionado.id
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
                );
              })()
            )}
          </div>
        </section>

        {/* MODAL DE ALTA / EDICIÓN
            De momento conserva el formulario funcional actual.
            Su rediseño se hará después de aprobar esta pantalla principal. */}
        {formularioAbierto && (
          <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-[#0F172A]/45 p-3 backdrop-blur-[2px] sm:p-6">
            <div className="my-3 w-full max-w-xl sm:my-8">
              <FormularioAlumno
                nombre={nombre}
                apellidos={apellidos}
                apodo={apodo}
                fechaNacimiento={
                  fechaNacimiento
                }
                localidad={localidad}
                pais={pais}
                observaciones={
                  observaciones
                }
                telefono={telefono}
                email={email}
                precio={precio}
                procedencia={procedencia}
                clubOrigen={clubOrigen}
                ubicaciones={ubicaciones}
                ubicacionHabitualId={
                  ubicacionHabitualId
                }
                tipoClaseHabitual={
                  tipoClaseHabitual
                }
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
                setApodo={setApodo}
                setFechaNacimiento={
                  setFechaNacimiento
                }
                setLocalidad={
                  setLocalidad
                }
                setPais={setPais}
                setObservaciones={
                  setObservaciones
                }
                setTelefono={
                  setTelefono
                }
                setEmail={setEmail}
                setPrecio={setPrecio}
                setProcedencia={
                  setProcedencia
                }
                setClubOrigen={
                  setClubOrigen
                }
                setUbicacionHabitualId={
                  setUbicacionHabitualId
                }
                setTipoClaseHabitual={
                  setTipoClaseHabitual
                }
                setActivo={setActivo}
                onFotoSeleccionada={
                  seleccionarFoto
                }
                onQuitarFoto={
                  quitarFoto
                }
                onGuardar={
                  guardarAlumno
                }
                onCancelar={() => {
                  limpiarFormulario();
                  setMensaje("");
                  setFormularioAbierto(false);
                }}
              />
            </div>
          </div>
        )}

      </div>
    </main>
  );
}