"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  borrarClaseDeGoogleCalendar,
  sincronizarClaseConGoogleCalendar,
} from "../../lib/googleCalendarClient";

type Alumno = {
  id: string;
  nombre: string;
  apellidos: string | null;
  precio_habitual: number | null;
  ubicacion_habitual_id: string | null;
  procedencia: string | null;
  tipo_clase_habitual: string | null;
};

type Ubicacion = {
  id: string;
  nombre: string;
  tipo: string;
  coste_pista: number | null;
};

type Grupo = {
  id: string;
  nombre: string;
  grupo_alumnos: {
    alumno_id: string;
  }[];
};

type Bono = {
  id: string;
  alumno_id: string;
  numero_clases: number;
  clases_restantes: number;
  importe_pagado: number;
  activo: boolean;
};

type RelacionBonoAlumno = {
  bono_id: string;
  alumno_id: string;
};

type ParticipanteClase = {
  alumno_id: string;
  importe: number;
  usa_bono: boolean;
  bono_id: string | null;

  alumnos: {
    nombre: string;
    apellidos: string | null;
  } | null;
};

type Clase = {
  id: string;
  serie_id: string | null;
  google_calendar_event_id: string | null;
  google_calendar_synced_at: string | null;
  fecha: string;
  hora_inicio: string;
  duracion_minutos: number;
  ubicacion_id: string | null;
  grupo_id: string | null;
  importe_club: number;
  coste_pista: number;
  ingreso_extra: number;
  tipo: string;
  estado: string;
  observaciones: string | null;

  ubicaciones: {
    nombre: string;
  } | null;

  clase_alumnos: ParticipanteClase[];
};

type PagoClase = {
  id: string;
  clase_id: string | null;
  alumno_id: string | null;
  importe: number;
  metodo: string;
  estado: string;
};

type Tarifa = {
  id: string;
  ubicacion_id: string | null;
  concepto: string;
  duracion_minutos: number;
  numero_alumnos: number;
  importe: number;
  activa: boolean;
};

function IconoCalendario() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
      />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function IconoReloj() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function IconoUbicacion() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle
        cx="12"
        cy="10"
        r="2.5"
      />
    </svg>
  );
}

function IconoPersonas() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle
        cx="9"
        cy="8"
        r="3"
      />
      <path d="M3 20c0-4 2.5-7 6-7s6 3 6 7" />
      <path d="M16 5.5a3 3 0 0 1 0 5.5M17 14c2.5.5 4 2.5 4 5" />
    </svg>
  );
}

function IconoClase() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14" />
      <path d="M8 21h8M8 8h8M8 12h5" />
    </svg>
  );
}

export default function ClasesPage() {
  const [alumnos, setAlumnos] =
    useState<Alumno[]>([]);

  const [ubicaciones, setUbicaciones] =
    useState<Ubicacion[]>([]);

  const [grupos, setGrupos] =
    useState<Grupo[]>([]);

  const [bonos, setBonos] =
    useState<Bono[]>([]);

  const [
    relacionesBonoAlumno,
    setRelacionesBonoAlumno,
  ] =
    useState<RelacionBonoAlumno[]>([]);

  const [clases, setClases] =
    useState<Clase[]>([]);

  const [pagosClase, setPagosClase] =
    useState<PagoClase[]>([]);

  const [tarifas, setTarifas] =
    useState<Tarifa[]>([]);

  const [fecha, setFecha] =
    useState("");

  const [hora, setHora] =
    useState("");

  const [duracion, setDuracion] =
    useState("60");

  const [ubicacionId, setUbicacionId] =
    useState("");

  const [tipo, setTipo] =
    useState("club");

  const [grupoId, setGrupoId] =
    useState("");

  const [estado, setEstado] =
    useState("programada");

  const [
    observaciones,
    setObservaciones,
  ] =
    useState("");

  const [
    alumnosSeleccionados,
    setAlumnosSeleccionados,
  ] =
    useState<string[]>([]);

  const [
    importesAlumnos,
    setImportesAlumnos,
  ] =
    useState<Record<string, string>>({});

  const [
    modoPagoAlumnos,
    setModoPagoAlumnos,
  ] =
    useState<
      Record<
        string,
        "normal" | "bono"
      >
    >({});

  const [
    bonosSeleccionados,
    setBonosSeleccionados,
  ] =
    useState<Record<string, string>>({});

  const [
    estadoPagoAlumnos,
    setEstadoPagoAlumnos,
  ] =
    useState<
      Record<
        string,
        "pagado" | "pendiente"
      >
    >({});

  const [
    metodoPagoAlumnos,
    setMetodoPagoAlumnos,
  ] =
    useState<Record<string, string>>({});

  const [
    importeClub,
    setImporteClub,
  ] =
    useState("");

  const [
    costePista,
    setCostePista,
  ] =
    useState("");

  const [
    ingresoExtra,
    setIngresoExtra,
  ] =
    useState("");

  const [
    busquedaAlumno,
    setBusquedaAlumno,
  ] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  const [
    claseEditandoId,
    setClaseEditandoId,
  ] =
    useState<string | null>(null);

  const [
    busquedaClases,
    setBusquedaClases,
  ] =
    useState("");

  const [
    filtroEstado,
    setFiltroEstado,
  ] =
    useState("todas");

  const [
    filtroMes,
    setFiltroMes,
  ] =
    useState("");

  const [
    formularioAbierto,
    setFormularioAbierto,
  ] = useState(false);

  const [
    filtroFechaDesde,
    setFiltroFechaDesde,
  ] = useState("");

  const [
    filtroFechaHasta,
    setFiltroFechaHasta,
  ] = useState("");

  const [
    modoCreacion,
    setModoCreacion,
  ] = useState<"individual" | "serie">("individual");

  const [
    fechaFinSerie,
    setFechaFinSerie,
  ] = useState("");

  const [
    diasSerie,
    setDiasSerie,
  ] = useState<number[]>([]);

  const [
    clasePendienteBorrar,
    setClasePendienteBorrar,
  ] = useState<Clase | null>(null);

  const [
    clasePendienteEditar,
    setClasePendienteEditar,
  ] = useState<Clase | null>(null);

  const alcanceEdicionSerieRef =
    useRef<
      "una" |
      "siguientes" |
      "serie" |
      null
    >(null);

  const [
    borrandoSerie,
    setBorrandoSerie,
  ] = useState(false);

  const volverAgendaRef =
    useRef<string | null>(null);

  useEffect(() => {
    const parametros =
      new URLSearchParams(
        window.location.search
      );

    volverAgendaRef.current =
      parametros.get("volver");

    cargarDatos();
  }, []);

  useEffect(() => {
    const parametros =
      new URLSearchParams(
        window.location.search
      );

    const fechaDesdeAgenda =
      parametros.get("fecha");

    const horaDesdeAgenda =
      parametros.get("hora");

    if (
      fechaDesdeAgenda &&
      !claseEditandoId
    ) {
      setFecha(
        fechaDesdeAgenda
      );

      if (
        horaDesdeAgenda
      ) {
        setHora(
          horaDesdeAgenda
        );
      }

      setFormularioAbierto(
        true
      );

      const url =
        new URL(
          window.location.href
        );

      url.searchParams.delete(
        "fecha"
      );

      url.searchParams.delete(
        "hora"
      );

      window.history.replaceState(
        {},
        "",
        `${url.pathname}${url.search}${url.hash}`
      );
    }
  }, [claseEditandoId]);

  useEffect(() => {
    if (
      clases.length ===
      0
    ) {
      return;
    }

    const parametros =
      new URLSearchParams(
        window.location.search
      );

    const claseId =
      parametros.get("editar");

    if (!claseId) {
      return;
    }

    const claseEncontrada =
      clases.find(
        (clase) =>
          clase.id ===
          claseId
      );

    if (
      !claseEncontrada
    ) {
      return;
    }

    editarClase(
      claseEncontrada
    );

    const url =
      new URL(
        window.location.href
      );

    url.searchParams.delete(
      "editar"
    );

    window.history.replaceState(
      {},
      "",
      `${url.pathname}${url.search}${url.hash}`
    );
  }, [clases]);

  function volverAlOrigenSiExiste() {
    const volver =
      volverAgendaRef.current;

    if (!volver) {
      return false;
    }

    window.location.href =
      volver;

    return true;
  }

  async function cargarDatos() {
    const {
      data: alumnosData,
    } =
      await supabase
        .from("alumnos")
        .select(
          "id,nombre,apellidos,precio_habitual,ubicacion_habitual_id,procedencia,tipo_clase_habitual"
        )
        .eq(
          "activo",
          true
        )
        .order(
          "nombre"
        );

    const {
      data: ubicacionesData,
    } =
      await supabase
        .from("ubicaciones")
        .select(
          "id,nombre,tipo,coste_pista"
        )
        .eq(
          "activa",
          true
        )
        .order(
          "nombre"
        );

    const {
      data: gruposData,
    } =
      await supabase
        .from("grupos")
        .select(`
          id,
          nombre,
          grupo_alumnos (
            alumno_id
          )
        `)
        .eq(
          "activo",
          true
        )
        .order(
          "nombre"
        );

    const {
      data: bonosData,
    } =
      await supabase
        .from("bonos")
        .select(
          "id,alumno_id,numero_clases,clases_restantes,importe_pagado,activo"
        )
        .order(
          "fecha_compra",
          {
            ascending: true,
          }
        );

    const {
      data: relacionesBonoData,
    } =
      await supabase
        .from(
          "bono_alumnos"
        )
        .select(
          "bono_id,alumno_id"
        );

    const {
      data: clasesData,
    } =
      await supabase
        .from("clases")
        .select(`
          id,
          serie_id,
          google_calendar_event_id,
          google_calendar_synced_at,
          fecha,
          hora_inicio,
          duracion_minutos,
          ubicacion_id,
          grupo_id,
          tipo,
          estado,
          observaciones,
          importe_club,
          coste_pista,
          ingreso_extra,
          ubicaciones (
            nombre
          ),
          clase_alumnos (
            alumno_id,
            importe,
            usa_bono,
            bono_id,
            alumnos (
              nombre,
              apellidos
            )
          )
        `)
        .order(
          "fecha",
          {
            ascending: false,
          }
        )
        .order(
          "hora_inicio",
          {
            ascending: false,
          }
        );

    const {
      data: pagosData,
    } =
      await supabase
        .from("pagos")
        .select(`
          id,
          clase_id,
          alumno_id,
          importe,
          metodo,
          estado
        `)
        .not(
          "clase_id",
          "is",
          null
        );

    const {
      data: tarifasData,
    } =
      await supabase
        .from("tarifas")
        .select(
          "id,ubicacion_id,concepto,duracion_minutos,numero_alumnos,importe,activa"
        )
        .eq(
          "activa",
          true
        );

    setAlumnos(
      alumnosData ||
        []
    );

    setUbicaciones(
      ubicacionesData ||
        []
    );

    setGrupos(
      (gruposData ||
        []) as Grupo[]
    );

    setBonos(
      (bonosData ||
        []) as Bono[]
    );

    setRelacionesBonoAlumno(
      (relacionesBonoData ||
        []) as RelacionBonoAlumno[]
    );

    setClases(
      (clasesData ||
        []) as unknown as Clase[]
    );

    setPagosClase(
      (pagosData ||
        []) as PagoClase[]
    );

    setTarifas(
      (tarifasData ||
        []) as Tarifa[]
    );
  }

  function limpiarFormulario() {
    setClaseEditandoId(
      null
    );

    setFecha("");
    setHora("");
    setDuracion("60");
    setUbicacionId("");
    setTipo("club");
    setGrupoId("");
    setEstado("programada");
    setObservaciones("");

    setAlumnosSeleccionados(
      []
    );

    setImportesAlumnos(
      {}
    );

    setModoPagoAlumnos(
      {}
    );

    setBonosSeleccionados(
      {}
    );

    setEstadoPagoAlumnos(
      {}
    );

    setMetodoPagoAlumnos(
      {}
    );

    setImporteClub("");
    setCostePista("");
    setIngresoExtra("");
    setBusquedaAlumno("");
    setFechaFinSerie("");
    setDiasSerie([]);
    setModoCreacion("individual");
  }

  function buscarTarifa(
    conceptoBuscado: string,
    ubicacionBuscada: string,
    duracionBuscada: number,
    numeroAlumnosBuscado: number
  ) {
    return tarifas.find(
      (tarifa) =>
        tarifa.activa &&
        tarifa.ubicacion_id ===
          ubicacionBuscada &&
        tarifa.concepto ===
          conceptoBuscado &&
        tarifa.duracion_minutos ===
          duracionBuscada &&
        tarifa.numero_alumnos ===
          numeroAlumnosBuscado
    );
  }

  function actualizarImportesAutomaticos(
    tipoClase: string,
    nuevaUbicacionId: string,
    nuevaDuracion = Number(duracion),
    nuevoNumeroAlumnos =
      alumnosSeleccionados.length
  ) {
    if (
      !nuevaUbicacionId ||
      nuevoNumeroAlumnos <= 0
    ) {
      if (tipoClase === "club") {
        setImporteClub("");
      }

      if (tipoClase === "propia") {
        setCostePista("");
      }

      return;
    }

    if (tipoClase === "club") {
      const tarifaClub =
        buscarTarifa(
          "club_paga",
          nuevaUbicacionId,
          nuevaDuracion,
          nuevoNumeroAlumnos
        );

      setImporteClub(
        tarifaClub
          ? String(
              tarifaClub.importe
            )
          : ""
      );

      setCostePista("0");
      return;
    }

    setImporteClub("");

    if (tipoClase === "privada") {
      setCostePista("0");
      return;
    }

    const tarifaPista =
      buscarTarifa(
        "coste_pista",
        nuevaUbicacionId,
        nuevaDuracion,
        nuevoNumeroAlumnos
      );

    if (tarifaPista) {
      setCostePista(
        String(
          tarifaPista.importe
        )
      );
      return;
    }

    const ubicacion =
      ubicaciones.find(
        (item) =>
          item.id ===
          nuevaUbicacionId
      );

    if (
      !ubicacion ||
      ubicacion.tipo ===
        "privada" ||
      ubicacion.tipo ===
        "urbanizacion"
    ) {
      setCostePista("0");
      return;
    }

    setCostePista(
      String(
        ubicacion.coste_pista ||
          0
      )
    );
  }

  function actualizarCostePistaAutomatico(
    tipoClase: string,
    nuevaUbicacionId: string
  ) {
    actualizarImportesAutomaticos(
      tipoClase,
      nuevaUbicacionId
    );
  }


  useEffect(() => {
    if (
      claseEditandoId ||
      alumnosSeleccionados.length === 0
    ) {
      return;
    }

    actualizarImportesAutomaticos(
      tipo,
      ubicacionId,
      Number(duracion),
      alumnosSeleccionados.length
    );
  }, [
    tipo,
    ubicacionId,
    duracion,
    alumnosSeleccionados.length,
    tarifas,
  ]);

  function seleccionarGrupoRapido(
    nuevoGrupoId: string
  ) {
    setGrupoId(
      nuevoGrupoId
    );

    if (!nuevoGrupoId) {
      setAlumnosSeleccionados(
        []
      );

      setImportesAlumnos(
        {}
      );

      setModoPagoAlumnos(
        {}
      );

      setBonosSeleccionados(
        {}
      );

      setEstadoPagoAlumnos(
        {}
      );

      setMetodoPagoAlumnos(
        {}
      );

      return;
    }

    const grupo =
      grupos.find(
        (item) =>
          item.id ===
          nuevoGrupoId
      );

    if (!grupo) {
      return;
    }

    const idsGrupo =
      grupo.grupo_alumnos.map(
        (item) =>
          item.alumno_id
      );

    const alumnosGrupo =
      idsGrupo
        .map((id) =>
          alumnos.find(
            (item) =>
              item.id === id
          )
        )
        .filter(Boolean);

    const primerAlumno =
      alumnosGrupo[0];

    const nuevaUbicacionId =
      primerAlumno
        ?.ubicacion_habitual_id ||
      ubicacionId;

    const nuevoTipo =
      primerAlumno
        ?.tipo_clase_habitual ||
      tipo;

    if (
      primerAlumno
        ?.ubicacion_habitual_id
    ) {
      setUbicacionId(
        primerAlumno
          .ubicacion_habitual_id
      );
    }

    if (
      primerAlumno
        ?.tipo_clase_habitual
    ) {
      setTipo(
        primerAlumno
          .tipo_clase_habitual
      );
    }

    setAlumnosSeleccionados(
      idsGrupo
    );

    const nuevosImportes:
      Record<string, string> =
        {};

    const nuevosModos:
      Record<
        string,
        "normal" | "bono"
      > = {};

    const nuevosBonos:
      Record<string, string> =
        {};

    const nuevosEstados:
      Record<
        string,
        "pagado" | "pendiente"
      > = {};

    const nuevosMetodos:
      Record<string, string> =
        {};

    idsGrupo.forEach(
      (alumnoId) => {
        const alumno =
          alumnos.find(
            (item) =>
              item.id ===
              alumnoId
          );

        nuevosImportes[
          alumnoId
        ] =
          alumno
            ?.precio_habitual !==
          null &&
          alumno
            ?.precio_habitual !==
          undefined
            ? String(
                alumno
                  .precio_habitual
              )
            : "";

        const bonosAlumno =
          bonosDelAlumno(
            alumnoId
          );

        const tieneBono =
          bonosAlumno.length >
          0;

        nuevosModos[
          alumnoId
        ] =
          tieneBono
            ? "bono"
            : "normal";

        nuevosEstados[
          alumnoId
        ] =
          "pendiente";

        nuevosMetodos[
          alumnoId
        ] =
          "efectivo";

        if (tieneBono) {
          nuevosBonos[
            alumnoId
          ] =
            bonosAlumno[0].id;
        }
      }
    );

    setImportesAlumnos(
      nuevosImportes
    );

    setModoPagoAlumnos(
      nuevosModos
    );

    setBonosSeleccionados(
      nuevosBonos
    );

    setEstadoPagoAlumnos(
      nuevosEstados
    );

    setMetodoPagoAlumnos(
      nuevosMetodos
    );

    actualizarImportesAutomaticos(
      nuevoTipo,
      nuevaUbicacionId,
      Number(duracion),
      idsGrupo.length
    );
  }

  function bonosDelAlumno(
    alumnoId: string
  ) {
    const bonosAutorizados =
      new Set(
        relacionesBonoAlumno
          .filter(
            (
              relacion
            ) =>
              relacion.alumno_id ===
              alumnoId
          )
          .map(
            (
              relacion
            ) =>
              relacion.bono_id
          )
      );

    return bonos.filter(
      (bono) =>
        bono.activo &&
        bono.clases_restantes >
          0 &&
        (
          bono.alumno_id ===
            alumnoId ||
          bonosAutorizados.has(
            bono.id
          )
        )
    );
  }

  function textoBono(
    bono: Bono,
    alumnoId: string
  ) {
    const esPropio =
      bono.alumno_id ===
      alumnoId;

    if (esPropio) {
      return `Bono propio · ${bono.numero_clases} clases · ${bono.clases_restantes} restantes`;
    }

    const titular =
      alumnos.find(
        (alumno) =>
          alumno.id ===
          bono.alumno_id
      );

    const nombreTitular =
      titular
        ? `${titular.nombre} ${
            titular.apellidos ||
            ""
          }`.trim()
        : "otro alumno";

    return `Bono de ${nombreTitular} · ${bono.numero_clases} clases · ${bono.clases_restantes} restantes`;
  }
  function cambiarAlumno(
    alumno: Alumno
  ) {
    const seleccionado =
      alumnosSeleccionados.includes(
        alumno.id
      );

    if (seleccionado) {
      setAlumnosSeleccionados(
        (
          actuales
        ) =>
          actuales.filter(
            (id) =>
              id !==
              alumno.id
          )
      );

      setImportesAlumnos(
        (
          actuales
        ) => {
          const copia = {
            ...actuales,
          };

          delete copia[
            alumno.id
          ];

          return copia;
        }
      );

      setModoPagoAlumnos(
        (
          actuales
        ) => {
          const copia = {
            ...actuales,
          };

          delete copia[
            alumno.id
          ];

          return copia;
        }
      );

      setBonosSeleccionados(
        (
          actuales
        ) => {
          const copia = {
            ...actuales,
          };

          delete copia[
            alumno.id
          ];

          return copia;
        }
      );

      setEstadoPagoAlumnos(
        (
          actuales
        ) => {
          const copia = {
            ...actuales,
          };

          delete copia[
            alumno.id
          ];

          return copia;
        }
      );

      setMetodoPagoAlumnos(
        (
          actuales
        ) => {
          const copia = {
            ...actuales,
          };

          delete copia[
            alumno.id
          ];

          return copia;
        }
      );

      return;
    }

    if (
      alumnosSeleccionados.length === 0
    ) {
      const tipoHabitual =
        alumno.tipo_clase_habitual ||
        tipo;

      if (alumno.tipo_clase_habitual) {
        setTipo(
          alumno.tipo_clase_habitual
        );
      }

      if (
        alumno.ubicacion_habitual_id
      ) {
        setUbicacionId(
          alumno.ubicacion_habitual_id
        );

        actualizarImportesAutomaticos(
          tipoHabitual,
          alumno.ubicacion_habitual_id,
          Number(duracion),
          1
        );
      }

      const grupoHabitual =
        grupos.find(
          (grupo) =>
            grupo.grupo_alumnos.some(
              (relacion) =>
                relacion.alumno_id ===
                alumno.id
            )
        );

      setGrupoId(
        grupoHabitual?.id ||
          ""
      );
    }

    const bonosAlumno =
      bonosDelAlumno(
        alumno.id
      );

    const tieneBono =
      bonosAlumno.length >
      0;

    setAlumnosSeleccionados(
      (
        actuales
      ) => [
        ...actuales,
        alumno.id,
      ]
    );

    setImportesAlumnos(
      (
        actuales
      ) => ({
        ...actuales,

        [alumno.id]:
          alumno.precio_habitual !==
          null
            ? String(
                alumno.precio_habitual
              )
            : "",
      })
    );

    setModoPagoAlumnos(
      (
        actuales
      ) => ({
        ...actuales,

        [alumno.id]:
          tieneBono
            ? "bono"
            : "normal",
      })
    );

    setEstadoPagoAlumnos(
      (
        actuales
      ) => ({
        ...actuales,

        [alumno.id]:
          "pendiente",
      })
    );

    setMetodoPagoAlumnos(
      (
        actuales
      ) => ({
        ...actuales,

        [alumno.id]:
          "efectivo",
      })
    );

    if (tieneBono) {
      setBonosSeleccionados(
        (
          actuales
        ) => ({
          ...actuales,

          [alumno.id]:
            bonosAlumno[0]
              .id,
        })
      );
    }
  }

  function contarUsoBonos(
    participantes: {
      usa_bono: boolean;
      bono_id:
        | string
        | null;
    }[],
    estadoClase: string
  ) {
    const resultado:
      Record<
        string,
        number
      > =
      {};

    if (
      estadoClase !==
      "realizada"
    ) {
      return resultado;
    }

    participantes.forEach(
      (
        participante
      ) => {
        if (
          participante.usa_bono &&
          participante.bono_id
        ) {
          resultado[
            participante.bono_id
          ] =
            (
              resultado[
                participante
                  .bono_id
              ] || 0
            ) + 1;
        }
      }
    );

    return resultado;
  }

  async function ajustarBonos(
    usoAnterior:
      Record<
        string,
        number
      >,
    usoNuevo:
      Record<
        string,
        number
      >
  ) {
    const ids =
      Array.from(
        new Set([
          ...Object.keys(
            usoAnterior
          ),
          ...Object.keys(
            usoNuevo
          ),
        ])
      );

    for (
      const bonoId of
      ids
    ) {
      const anterior =
        usoAnterior[
          bonoId
        ] || 0;

      const nuevo =
        usoNuevo[
          bonoId
        ] || 0;

      const diferencia =
        nuevo -
        anterior;

      if (
        diferencia ===
        0
      ) {
        continue;
      }

      const {
        data:
          bonoActual,
        error,
      } =
        await supabase
          .from(
            "bonos"
          )
          .select(
            "id,numero_clases,clases_restantes"
          )
          .eq(
            "id",
            bonoId
          )
          .single();

      if (
        error ||
        !bonoActual
      ) {
        throw new Error(
          "No se pudo actualizar uno de los bonos."
        );
      }

      const nuevasRestantes =
        Number(
          bonoActual
            .clases_restantes
        ) -
        diferencia;

      if (
        nuevasRestantes <
        0
      ) {
        throw new Error(
          "Uno de los bonos no tiene clases suficientes."
        );
      }

      const restantesFinales =
        Math.min(
          nuevasRestantes,
          Number(
            bonoActual
              .numero_clases
          )
        );

      const {
        error:
          errorActualizar,
      } =
        await supabase
          .from(
            "bonos"
          )
          .update({
            clases_restantes:
              restantesFinales,

            activo:
              restantesFinales >
              0,
          })
          .eq(
            "id",
            bonoId
          );

      if (
        errorActualizar
      ) {
        throw new Error(
          "No se pudo actualizar uno de los bonos."
        );
      }
    }
  }

  async function sincronizarPagos(
    claseId: string,
    estadoClase: string,
    participantes: {
      alumno_id: string;
      importe: number;
      usa_bono: boolean;
    }[],
    tipoClase: string
  ) {
    const {
      data:
        existentes,
      error,
    } =
      await supabase
        .from("pagos")
        .select(
          "id,alumno_id"
        )
        .eq(
          "clase_id",
          claseId
        );

    if (error) {
      throw new Error(
        "No se pudieron comprobar los pagos de la clase."
      );
    }

    const pagosExistentes =
      existentes ||
      [];

    if (
      estadoClase !==
        "realizada" ||
      tipoClase ===
        "club"
    ) {
      const {
        error:
          errorBorrar,
      } =
        await supabase
          .from(
            "pagos"
          )
          .delete()
          .eq(
            "clase_id",
            claseId
          );

      if (
        errorBorrar
      ) {
        throw new Error(
          "No se pudieron actualizar los pagos."
        );
      }

      return;
    }

    const alumnosPagoNormal =
      participantes
        .filter(
          (p) =>
            !p.usa_bono
        )
        .map(
          (p) =>
            p.alumno_id
        );

    for (
      const pago of
      pagosExistentes
    ) {
      if (
        !pago.alumno_id ||
        !alumnosPagoNormal.includes(
          pago.alumno_id
        )
      ) {
        await supabase
          .from(
            "pagos"
          )
          .delete()
          .eq(
            "id",
            pago.id
          );
      }
    }

    for (
      const participante of
      participantes
    ) {
      if (
        participante.usa_bono
      ) {
        continue;
      }

      const pagoExistente =
        pagosExistentes.find(
          (pago) =>
            pago.alumno_id ===
            participante.alumno_id
        );

      const datosPago = {
        alumno_id:
          participante.alumno_id,

        clase_id:
          claseId,

        importe:
          participante.importe,

        metodo:
          metodoPagoAlumnos[
            participante
              .alumno_id
          ] ||
          "efectivo",

        estado:
          estadoPagoAlumnos[
            participante
              .alumno_id
          ] ||
          "pendiente",

        fecha_pago:
          fecha,

        notas:
          "Generado automáticamente desde Clases",
      };

      if (
        pagoExistente
      ) {
        const {
          error:
            errorActualizar,
        } =
          await supabase
            .from(
              "pagos"
            )
            .update(
              datosPago
            )
            .eq(
              "id",
              pagoExistente
                .id
            );

        if (
          errorActualizar
        ) {
          throw new Error(
            "No se pudo actualizar uno de los pagos."
          );
        }
      } else {
        const {
          error:
            errorInsertar,
        } =
          await supabase
            .from(
              "pagos"
            )
            .insert(
              datosPago
            );

        if (
          errorInsertar
        ) {
          throw new Error(
            "No se pudo crear uno de los pagos."
          );
        }
      }
    }
  }

  function editarClase(
    clase: Clase
  ) {
    setClaseEditandoId(
      clase.id
    );

    setModoCreacion(
      "individual"
    );

    setFormularioAbierto(
      true
    );

    setFecha(
      clase.fecha
    );

    setHora(
      clase.hora_inicio.slice(
        0,
        5
      )
    );

    setDuracion(
      String(
        clase.duracion_minutos
      )
    );

    setUbicacionId(
      clase.ubicacion_id ||
        ""
    );

    setGrupoId(
      clase.grupo_id ||
        ""
    );

    setTipo(
      clase.tipo
    );

    setEstado(
      clase.estado
    );

    setObservaciones(
      clase.observaciones ||
        ""
    );

    setImporteClub(
      String(
        clase.importe_club ||
          ""
      )
    );

    setCostePista(
      String(
        clase.coste_pista ||
          ""
      )
    );

    setIngresoExtra(
      clase.ingreso_extra
        ? String(
            clase.ingreso_extra
          )
        : ""
    );

    setBusquedaAlumno(
      ""
    );

    setAlumnosSeleccionados(
      clase.clase_alumnos.map(
        (
          participante
        ) =>
          participante.alumno_id
      )
    );

    const importes:
      Record<
        string,
        string
      > =
      {};

    const modos:
      Record<
        string,
        "normal" | "bono"
      > =
      {};

    const bonosElegidos:
      Record<
        string,
        string
      > =
      {};

    const estadosPago:
      Record<
        string,
        "pagado" | "pendiente"
      > =
      {};

    const metodosPago:
      Record<
        string,
        string
      > =
      {};

    clase.clase_alumnos.forEach(
      (
        participante
      ) => {
        importes[
          participante.alumno_id
        ] =
          String(
            participante.importe ||
              ""
          );

        modos[
          participante.alumno_id
        ] =
          participante.usa_bono
            ? "bono"
            : "normal";

        if (
          participante.usa_bono &&
          participante.bono_id
        ) {
          bonosElegidos[
            participante.alumno_id
          ] =
            participante.bono_id;
        }

        const pago =
          pagosClase.find(
            (item) =>
              item.clase_id ===
                clase.id &&
              item.alumno_id ===
                participante.alumno_id
          );

        estadosPago[
          participante.alumno_id
        ] =
          pago?.estado ===
          "pagado"
            ? "pagado"
            : "pendiente";

        metodosPago[
          participante.alumno_id
        ] =
          pago?.metodo ||
          "efectivo";
      }
    );

    setImportesAlumnos(
      importes
    );

    setModoPagoAlumnos(
      modos
    );

    setBonosSeleccionados(
      bonosElegidos
    );

    setEstadoPagoAlumnos(
      estadosPago
    );

    setMetodoPagoAlumnos(
      metodosPago
    );

    setMensaje(
      "Editando clase"
    );

    window.scrollTo({
      top: 0,
      behavior:
        "smooth",
    });
  }

  function cambiarDiaSerie(
    dia: number
  ) {
    setDiasSerie(
      (actuales) =>
        actuales.includes(dia)
          ? actuales.filter(
              (item) =>
                item !== dia
            )
          : [
              ...actuales,
              dia,
            ]
    );
  }

  function fechasDeSerie() {
    if (
      !fecha ||
      !fechaFinSerie ||
      diasSerie.length === 0
    ) {
      return [];
    }

    const inicio =
      new Date(
        `${fecha}T12:00:00`
      );

    const fin =
      new Date(
        `${fechaFinSerie}T12:00:00`
      );

    if (
      fin < inicio
    ) {
      return [];
    }

    const fechas:
      string[] = [];

    const actual =
      new Date(inicio);

    while (
      actual <= fin
    ) {
      if (
        diasSerie.includes(
          actual.getDay()
        )
      ) {
        const anio =
          actual.getFullYear();

        const mes =
          String(
            actual.getMonth() + 1
          ).padStart(2, "0");

        const dia =
          String(
            actual.getDate()
          ).padStart(2, "0");

        fechas.push(
          `${anio}-${mes}-${dia}`
        );
      }

      actual.setDate(
        actual.getDate() + 1
      );
    }

    return fechas;
  }

  async function obtenerNoDisponibilidad(
    fechaComprobar: string
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("no_disponibilidades")
      .select("id,fecha_inicio,fecha_fin,motivo")
      .lte("fecha_inicio", fechaComprobar)
      .gte("fecha_fin", fechaComprobar)
      .limit(1);

    if (error) {
      return null;
    }

    return data?.[0] || null;
  }

  function datosGoogleDesdeFormulario(
    claseId: string,
    googleEventId: string | null | undefined,
    fechaClase: string,
    estadoClase: string
  ) {
    const nombres =
      alumnosSeleccionados
        .map((alumnoId) => {
          const alumno = alumnos.find(
            (item) => item.id === alumnoId
          );

          if (!alumno) {
            return "";
          }

          return `${alumno.nombre} ${alumno.apellidos || ""}`.trim();
        })
        .filter(Boolean);

    const ubicacion =
      ubicaciones.find(
        (item) => item.id === ubicacionId
      )?.nombre || null;

    return {
      id: claseId,
      google_calendar_event_id: googleEventId || null,
      fecha: fechaClase,
      hora_inicio: hora,
      duracion_minutos: Number(duracion),
      tipo,
      estado: estadoClase,
      observaciones: observaciones.trim() || null,
      ubicacion,
      alumnos: nombres,
    };
  }

  async function guardarSerie() {
    if (
      !fecha ||
      !fechaFinSerie
    ) {
      setMensaje(
        "❌ Indica la fecha de inicio y la fecha final de la serie."
      );
      return;
    }

    if (
      diasSerie.length === 0
    ) {
      setMensaje(
        "❌ Selecciona al menos un día de la semana."
      );
      return;
    }

    const fechas =
      fechasDeSerie();

    if (
      fechas.length === 0
    ) {
      setMensaje(
        "❌ No hay fechas que coincidan con los días seleccionados."
      );
      return;
    }

    for (const fechaSerie of fechas) {
      const bloqueo =
        await obtenerNoDisponibilidad(
          fechaSerie
        );

      if (bloqueo) {
        setMensaje(
          `❌ No puedes crear la serie. El ${fechaSerie} está marcado como no disponible${
            bloqueo.motivo
              ? `: ${bloqueo.motivo}`
              : "."
          }`
        );
        return;
      }
    }

    const participantes =
      tipo === "club"
        ? alumnosSeleccionados.map(
            (alumnoId) => ({
              alumno_id:
                alumnoId,
              importe: 0,
              pagado: true,
              usa_bono: false,
              bono_id: null,
              asistio: true,
            })
          )
        : alumnosSeleccionados.map(
            (alumnoId) => {
              const usaBono =
                modoPagoAlumnos[
                  alumnoId
                ] === "bono";

              return {
                alumno_id:
                  alumnoId,

                importe:
                  usaBono
                    ? (() => {
                        const bono =
                          bonos.find(
                            (item) =>
                              item.id ===
                              bonosSeleccionados[
                                alumnoId
                              ]
                          );

                        if (
                          !bono ||
                          !bono.numero_clases
                        ) {
                          return 0;
                        }

                        return (
                          Number(
                            bono.importe_pagado ||
                              0
                          ) /
                          Number(
                            bono.numero_clases
                          )
                        );
                      })()
                    : importesAlumnos[
                        alumnoId
                      ]
                    ? Number(
                        importesAlumnos[
                          alumnoId
                        ]
                      )
                    : 0,

                pagado:
                  usaBono
                    ? true
                    : estadoPagoAlumnos[
                        alumnoId
                      ] ===
                      "pagado",

                usa_bono:
                  usaBono,

                bono_id:
                  usaBono
                    ? bonosSeleccionados[
                        alumnoId
                      ]
                    : null,

                asistio: true,
              };
            }
          );

    const {
      data:
        serieCreada,
      error:
        errorSerie,
    } =
      await supabase
        .from(
          "series_clases"
        )
        .insert({
          fecha_inicio:
            fecha,
          fecha_fin:
            fechaFinSerie,
          dias_semana:
            diasSerie,
          hora_inicio:
            hora,
          duracion_minutos:
            Number(duracion),
          ubicacion_id:
            ubicacionId || null,
          grupo_id:
            grupoId || null,
          tipo,
          observaciones:
            observaciones.trim() ||
            null,
        })
        .select("id")
        .single();

    if (
      errorSerie ||
      !serieCreada
    ) {
      setMensaje(
        "❌ No se pudo crear la serie: " +
          (
            errorSerie?.message ||
            ""
          )
      );
      return;
    }

    const registrosClases =
      fechas.map(
        (fechaClase) => ({
          serie_id:
            serieCreada.id,
          fecha:
            fechaClase,
          hora_inicio:
            hora,
          duracion_minutos:
            Number(duracion),
          ubicacion_id:
            ubicacionId || null,
          grupo_id:
            grupoId || null,
          tipo,
          importe_club:
            tipo === "club"
              ? importeClub
                ? Number(importeClub)
                : 0
              : 0,
          coste_pista:
            tipo === "club"
              ? 0
              : costePista
              ? Number(costePista)
              : 0,
          ingreso_extra:
            ingresoExtra
              ? Number(ingresoExtra)
              : 0,
          estado:
            "programada",
          observaciones:
            observaciones.trim() ||
            null,
        })
      );

    const {
      data:
        clasesCreadas,
      error:
        errorClases,
    } =
      await supabase
        .from("clases")
        .insert(
          registrosClases
        )
        .select("id");

    if (
      errorClases ||
      !clasesCreadas
    ) {
      await supabase
        .from(
          "series_clases"
        )
        .delete()
        .eq(
          "id",
          serieCreada.id
        );

      setMensaje(
        "❌ No se pudieron crear las clases de la serie: " +
          (
            errorClases?.message ||
            ""
          )
      );
      return;
    }

    if (
      participantes.length > 0
    ) {
      const relaciones =
        clasesCreadas.flatMap(
          (claseCreada) =>
            participantes.map(
              (participante) => ({
                clase_id:
                  claseCreada.id,
                ...participante,
              })
            )
        );

      const {
        error:
          errorParticipantes,
      } =
        await supabase
          .from(
            "clase_alumnos"
          )
          .insert(
            relaciones
          );

      if (
        errorParticipantes
      ) {
        setMensaje(
          "⚠️ La serie se creó, pero hubo un problema al añadir los alumnos."
        );

        await cargarDatos();
        return;
      }
    }

    let falloGoogleSerie = false;

    for (let i = 0; i < clasesCreadas.length; i += 1) {
      const claseCreada = clasesCreadas[i];
      const fechaClase = fechas[i];

      try {
        await sincronizarClaseConGoogleCalendar(
          datosGoogleDesdeFormulario(
            claseCreada.id,
            null,
            fechaClase,
            "programada"
          )
        );
      } catch {
        falloGoogleSerie = true;
      }
    }

    setMensaje(
      `✅ Serie creada correctamente: ${fechas.length} clase(s) programada(s)${
        falloGoogleSerie
          ? " · ⚠️ Alguna clase no pudo sincronizarse con Google Calendar."
          : ""
      }`
    );

    limpiarFormulario();
    setFormularioAbierto(
      false
    );

    await cargarDatos();
  }

  function acumularUsoBonos(
    clasesSeleccionadas:
      Clase[]
  ) {
    const total:
      Record<
        string,
        number
      > = {};

    clasesSeleccionadas.forEach(
      (clase) => {
        const uso =
          contarUsoBonos(
            clase.clase_alumnos,
            clase.estado
          );

        Object.entries(
          uso
        ).forEach(
          ([
            bonoId,
            cantidad,
          ]) => {
            total[bonoId] =
              (
                total[
                  bonoId
                ] || 0
              ) +
              cantidad;
          }
        );
      }
    );

    return total;
  }

  async function ejecutarBorrado(
    clase: Clase,
    alcance:
      | "una"
      | "siguientes"
      | "serie"
  ) {
    setBorrandoSerie(
      true
    );

    try {
      let clasesABorrar:
        Clase[] = [
          clase,
        ];

      if (
        clase.serie_id
      ) {
        const clasesSerie =
          clases.filter(
            (item) =>
              item.serie_id ===
              clase.serie_id
          );

        if (
          alcance ===
          "serie"
        ) {
          clasesABorrar =
            clasesSerie;
        }

        if (
          alcance ===
          "siguientes"
        ) {
          const referencia =
            `${clase.fecha} ${clase.hora_inicio}`;

          clasesABorrar =
            clasesSerie.filter(
              (item) =>
                `${item.fecha} ${item.hora_inicio}` >=
                referencia
            );
        }
      }

      const ids =
        clasesABorrar.map(
          (item) =>
            item.id
        );

      const usoAnterior =
        acumularUsoBonos(
          clasesABorrar
        );

      let falloGoogle = false;

      for (const claseABorrar of clasesABorrar) {
        try {
          await borrarClaseDeGoogleCalendar({
            id: claseABorrar.id,
            google_calendar_event_id:
              claseABorrar.google_calendar_event_id,
          });
        } catch {
          falloGoogle = true;
        }
      }

      if (
        ids.length > 0
      ) {
        const {
          error:
            errorPagos,
        } =
          await supabase
            .from("pagos")
            .delete()
            .in(
              "clase_id",
              ids
            );

        if (
          errorPagos
        ) {
          throw new Error(
            "No se pudieron eliminar los pagos asociados."
          );
        }

        const {
          error:
            errorClases,
        } =
          await supabase
            .from("clases")
            .delete()
            .in(
              "id",
              ids
            );

        if (
          errorClases
        ) {
          throw new Error(
            errorClases.message
          );
        }

        await ajustarBonos(
          usoAnterior,
          {}
        );
      }

      if (
        alcance ===
          "serie" &&
        clase.serie_id
      ) {
        await supabase
          .from(
            "series_clases"
          )
          .delete()
          .eq(
            "id",
            clase.serie_id
          );
      }

      if (
        claseEditandoId &&
        ids.includes(
          claseEditandoId
        )
      ) {
        limpiarFormulario();
        setFormularioAbierto(
          false
        );
      }

      setClasePendienteBorrar(
        null
      );

      const mensajeBorrado =
        alcance === "una"
          ? "✅ Clase borrada correctamente"
          : alcance ===
            "siguientes"
          ? "✅ Esta clase y las siguientes se han borrado correctamente"
          : "✅ Serie completa borrada correctamente";

      setMensaje(
        mensajeBorrado +
          (falloGoogle
            ? " · ⚠️ Algún evento no pudo borrarse de Google Calendar."
            : "")
      );

      await cargarDatos();
    } catch (
      error
    ) {
      const texto =
        error instanceof Error
          ? error.message
          : "Error desconocido";

      setMensaje(
        "❌ " + texto
      );
    } finally {
      setBorrandoSerie(
        false
      );
    }
  }

  async function borrarClase(
    clase: Clase
  ) {
    if (
      clase.serie_id
    ) {
      setClasePendienteBorrar(
        clase
      );
      return;
    }

    const confirmar =
      window.confirm(
        "¿Seguro que quieres borrar esta clase?"
      );

    if (
      !confirmar
    ) {
      return;
    }

    await ejecutarBorrado(
      clase,
      "una"
    );
  }

  function sumarDiasAFecha(
    fechaBase: string,
    dias: number
  ) {
    const [
      anio,
      mes,
      dia,
    ] =
      fechaBase
        .split("-")
        .map(Number);

    const fechaLocal =
      new Date(
        anio,
        mes - 1,
        dia,
        12,
        0,
        0
      );

    fechaLocal.setDate(
      fechaLocal.getDate() +
        dias
    );

    return `${fechaLocal.getFullYear()}-${String(
      fechaLocal.getMonth() + 1
    ).padStart(2, "0")}-${String(
      fechaLocal.getDate()
    ).padStart(2, "0")}`;
  }

  function diferenciaDias(
    fechaOrigen: string,
    fechaDestino: string
  ) {
    const origen =
      new Date(
        `${fechaOrigen}T12:00:00`
      );

    const destino =
      new Date(
        `${fechaDestino}T12:00:00`
      );

    return Math.round(
      (
        destino.getTime() -
        origen.getTime()
      ) /
      (
        24 *
        60 *
        60 *
        1000
      )
    );
  }

  function continuarEdicionSerie(
    alcance:
      | "una"
      | "siguientes"
      | "serie"
  ) {
    alcanceEdicionSerieRef.current =
      alcance;

    setClasePendienteEditar(
      null
    );

    setTimeout(
      () => {
        const formulario =
          document.getElementById(
            "formulario-clase"
          ) as HTMLFormElement | null;

        formulario?.requestSubmit();
      },
      0
    );
  }

  async function guardarClase(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setMensaje("");

    if (!claseEditandoId) {
      const bloqueo =
        await obtenerNoDisponibilidad(
          fecha
        );

      if (bloqueo) {
        setMensaje(
          `❌ No puedes crear una clase ese día. Está marcado como no disponible${
            bloqueo.motivo
              ? `: ${bloqueo.motivo}`
              : "."
          }`
        );
        return;
      }
    }

    if (
      modoCreacion ===
        "serie" &&
      !claseEditandoId
    ) {
      await guardarSerie();
      return;
    }

    if (
      tipo !==
      "club"
    ) {
      for (
        const alumnoId of
        alumnosSeleccionados
      ) {
        if (
          modoPagoAlumnos[
            alumnoId
          ] ===
            "bono" &&
          !bonosSeleccionados[
            alumnoId
          ]
        ) {
          setMensaje(
            "❌ Hay un alumno marcado con bono pero no tiene bono seleccionado."
          );

          return;
        }
      }
    }

    const claseAnterior =
      claseEditandoId
        ? clases.find(
            (clase) =>
              clase.id ===
              claseEditandoId
          )
        : null;

    if (
      claseAnterior?.serie_id &&
      alcanceEdicionSerieRef.current ===
        null
    ) {
      setClasePendienteEditar(
        claseAnterior
      );

      return;
    }

    const usoAnterior =
      claseAnterior
        ? contarUsoBonos(
            claseAnterior
              .clase_alumnos,
            claseAnterior
              .estado
          )
        : {};

    const participantesNuevos =
      tipo ===
      "club"
        ? alumnosSeleccionados.map(
            (
              alumnoId
            ) => ({
              alumno_id:
                alumnoId,

              importe:
                0,

              pagado:
                true,

              usa_bono:
                false,

              bono_id:
                null,

              asistio:
                true,
            })
          )
        : alumnosSeleccionados.map(
            (
              alumnoId
            ) => {
              const usaBono =
                modoPagoAlumnos[
                  alumnoId
                ] ===
                "bono";

              return {
                alumno_id:
                  alumnoId,

                importe:
                  usaBono
                    ? (() => {
                        const bono =
                          bonos.find(
                            (item) =>
                              item.id ===
                              bonosSeleccionados[
                                alumnoId
                              ]
                          );

                        if (
                          !bono ||
                          !bono.numero_clases
                        ) {
                          return 0;
                        }

                        return (
                          Number(
                            bono.importe_pagado ||
                              0
                          ) /
                          Number(
                            bono.numero_clases
                          )
                        );
                      })()
                    : importesAlumnos[
                        alumnoId
                      ]
                    ? Number(
                        importesAlumnos[
                          alumnoId
                        ]
                      )
                    : 0,

                pagado:
                  usaBono
                    ? true
                    : estadoPagoAlumnos[
                        alumnoId
                      ] ===
                      "pagado",

                usa_bono:
                  usaBono,

                bono_id:
                  usaBono
                    ? bonosSeleccionados[
                        alumnoId
                      ]
                    : null,

                asistio:
                  true,
              };
            }
          );

    const usoNuevo =
      contarUsoBonos(
        participantesNuevos,
        estado
      );

    const datosClase = {
      fecha,

      hora_inicio:
        hora,

      duracion_minutos:
        Number(
          duracion
        ),

      ubicacion_id:
        ubicacionId ||
        null,

      grupo_id:
        grupoId ||
        null,

      tipo,

      importe_club:
        tipo ===
        "club"
          ? importeClub
            ? Number(
                importeClub
              )
            : 0
          : 0,

      coste_pista:
        tipo ===
        "club"
          ? 0
          : costePista
          ? Number(
              costePista
            )
          : 0,

      ingreso_extra:
        ingresoExtra
          ? Number(
              ingresoExtra
            )
          : 0,

      estado,

      observaciones:
        observaciones.trim() ||
        null,
    };

    const alcanceEdicionSerie =
      alcanceEdicionSerieRef.current;

    if (
      claseEditandoId &&
      claseAnterior?.serie_id &&
      alcanceEdicionSerie &&
      alcanceEdicionSerie !==
        "una"
    ) {
      const referencia =
        `${claseAnterior.fecha} ${claseAnterior.hora_inicio}`;

      const clasesSerie =
        clases
          .filter(
            (item) =>
              item.serie_id ===
              claseAnterior.serie_id
          )
          .filter(
            (item) =>
              alcanceEdicionSerie ===
                "serie" ||
              `${item.fecha} ${item.hora_inicio}` >=
                referencia
          )
          .sort(
            (a, b) =>
              `${a.fecha} ${a.hora_inicio}`.localeCompare(
                `${b.fecha} ${b.hora_inicio}`
              )
          );

      const desplazamiento =
        diferenciaDias(
          claseAnterior.fecha,
          fecha
        );

      try {
        for (
          const claseObjetivo of
          clasesSerie
        ) {
          const fechaObjetivo =
            sumarDiasAFecha(
              claseObjetivo.fecha,
              desplazamiento
            );

          const usoAnteriorObjetivo =
            contarUsoBonos(
              claseObjetivo.clase_alumnos,
              claseObjetivo.estado
            );

          const usoNuevoObjetivo =
            contarUsoBonos(
              participantesNuevos,
              estado
            );

          const {
            error:
              errorActualizarClase,
          } =
            await supabase
              .from("clases")
              .update({
                ...datosClase,
                fecha:
                  fechaObjetivo,
              })
              .eq(
                "id",
                claseObjetivo.id
              );

          if (
            errorActualizarClase
          ) {
            throw new Error(
              errorActualizarClase.message
            );
          }

          const {
            error:
              errorBorrarAlumnos,
          } =
            await supabase
              .from(
                "clase_alumnos"
              )
              .delete()
              .eq(
                "clase_id",
                claseObjetivo.id
              );

          if (
            errorBorrarAlumnos
          ) {
            throw new Error(
              "No se pudieron actualizar los alumnos de una de las clases."
            );
          }

          if (
            participantesNuevos.length >
            0
          ) {
            const registros =
              participantesNuevos.map(
                (
                  participante
                ) => ({
                  clase_id:
                    claseObjetivo.id,
                  ...participante,
                })
              );

            const {
              error:
                errorInsertarAlumnos,
            } =
              await supabase
                .from(
                  "clase_alumnos"
                )
                .insert(
                  registros
                );

            if (
              errorInsertarAlumnos
            ) {
              throw new Error(
                "No se pudieron guardar los alumnos de una de las clases."
              );
            }
          }

          await ajustarBonos(
            usoAnteriorObjetivo,
            usoNuevoObjetivo
          );

          await sincronizarPagos(
            claseObjetivo.id,
            estado,
            participantesNuevos,
            tipo
          );

          try {
            await sincronizarClaseConGoogleCalendar(
              datosGoogleDesdeFormulario(
                claseObjetivo.id,
                claseObjetivo.google_calendar_event_id,
                fechaObjetivo,
                estado
              )
            );
          } catch {
            // La clase queda guardada en Manager aunque Google falle.
          }
        }

        alcanceEdicionSerieRef.current =
          null;

        setMensaje(
          alcanceEdicionSerie ===
            "siguientes"
            ? "✅ Esta clase y las siguientes se han actualizado correctamente"
            : "✅ Toda la serie se ha actualizado correctamente"
        );

        if (
          volverAlOrigenSiExiste()
        ) {
          return;
        }

        limpiarFormulario();

        setFormularioAbierto(
          false
        );

        await cargarDatos();

        return;
      } catch (
        error
      ) {
        alcanceEdicionSerieRef.current =
          null;

        const texto =
          error instanceof Error
            ? error.message
            : "Error desconocido";

        setMensaje(
          "❌ No se pudo actualizar la serie: " +
            texto
        );

        return;
      }
    }

    let claseGuardada;
    let errorClase;

    if (
      claseEditandoId
    ) {
      const resultado =
        await supabase
          .from(
            "clases"
          )
          .update(
            datosClase
          )
          .eq(
            "id",
            claseEditandoId
          )
          .select()
          .single();

      claseGuardada =
        resultado.data;

      errorClase =
        resultado.error;
    } else {
      const resultado =
        await supabase
          .from(
            "clases"
          )
          .insert(
            datosClase
          )
          .select()
          .single();

      claseGuardada =
        resultado.data;

      errorClase =
        resultado.error;
    }

    if (
      errorClase ||
      !claseGuardada
    ) {
      setMensaje(
        "❌ Error al guardar la clase: " +
          (
            errorClase?.message ||
            ""
          )
      );

      return;
    }

    if (
      claseEditandoId
    ) {
      const {
        error,
      } =
        await supabase
          .from(
            "clase_alumnos"
          )
          .delete()
          .eq(
            "clase_id",
            claseEditandoId
          );

      if (error) {
        setMensaje(
          "❌ Error al actualizar los alumnos: " +
            error.message
        );

        return;
      }
    }

    if (
      participantesNuevos.length >
      0
    ) {
      const registros =
        participantesNuevos.map(
          (
            participante
          ) => ({
            clase_id:
              claseGuardada.id,

            ...participante,
          })
        );

      const {
        error,
      } =
        await supabase
          .from(
            "clase_alumnos"
          )
          .insert(
            registros
          );

      if (error) {
        setMensaje(
          "⚠️ Clase guardada, pero hubo un error al añadir alumnos: " +
            error.message
        );

        return;
      }
    }

    try {
      await ajustarBonos(
        usoAnterior,
        usoNuevo
      );

      await sincronizarPagos(
        claseGuardada.id,
        estado,
        participantesNuevos,
        tipo
      );
    } catch {
      setMensaje(
        "⚠️ La clase se guardó, pero hubo un problema actualizando bonos o pagos."
      );

      cargarDatos();

      return;
    }

    let falloGoogle = false;

    try {
      await sincronizarClaseConGoogleCalendar(
        datosGoogleDesdeFormulario(
          claseGuardada.id,
          claseGuardada.google_calendar_event_id ||
            claseAnterior?.google_calendar_event_id ||
            null,
          fecha,
          estado
        )
      );
    } catch {
      falloGoogle = true;
    }

    alcanceEdicionSerieRef.current =
      null;

    setMensaje(
      "✅ Clase guardada correctamente" +
        (falloGoogle
          ? " · ⚠️ No se pudo sincronizar con Google Calendar."
          : "")
    );

    if (
      volverAlOrigenSiExiste()
    ) {
      return;
    }

    limpiarFormulario();
    setFormularioAbierto(
      false
    );

    cargarDatos();
  }

  const alumnosGrupoSeleccionado =
    grupoId
      ? (
          grupos.find(
            (grupo) =>
              grupo.id ===
              grupoId
          )?.grupo_alumnos ||
          []
        )
          .map((item) =>
            alumnos.find(
              (alumno) =>
                alumno.id ===
                item.alumno_id
            )
          )
          .filter(Boolean)
      : [];

  const alumnosFiltrados =
    alumnos.filter(
      (alumno) => {
        const texto =
          `${alumno.nombre} ${
            alumno.apellidos ||
            ""
          }`.toLowerCase();

        return texto.includes(
          busquedaAlumno.toLowerCase()
        );
      }
    );

  const alumnosElegidos =
    alumnos.filter(
      (alumno) =>
        alumnosSeleccionados.includes(
          alumno.id
        )
    );

  const clasesFiltradas =
    clases.filter(
      (clase) => {
        const nombres =
          clase.clase_alumnos
            .map(
              (item) =>
                item.alumnos
            )
            .filter(
              Boolean
            )
            .map(
              (alumno) =>
                `${
                  alumno?.nombre ||
                  ""
                } ${
                  alumno?.apellidos ||
                  ""
                }`.trim()
            )
            .join(" ")
            .toLowerCase();

        const ubicacion =
          (
            clase
              .ubicaciones
              ?.nombre ||
            ""
          ).toLowerCase();

        const texto =
          busquedaClases.toLowerCase();

        return (
          (
            nombres.includes(
              texto
            ) ||
            ubicacion.includes(
              texto
            )
          ) &&
          (
            filtroEstado ===
              "todas" ||
            clase.estado ===
              filtroEstado
          ) &&
          (
            !filtroMes ||
            clase.fecha.startsWith(
              filtroMes
            )
          ) &&
          (
            !filtroFechaDesde ||
            (
              filtroFechaDesde &&
              !filtroFechaHasta
                ? clase.fecha ===
                  filtroFechaDesde
                : clase.fecha >=
                  filtroFechaDesde
            )
          ) &&
          (
            !filtroFechaHasta ||
            clase.fecha <=
              filtroFechaHasta
          )
        );
      }
    );

  const clasesMostradas =
    claseEditandoId
      ? clasesFiltradas.filter(
          (
            clase
          ) =>
            clase.id ===
            claseEditandoId
        )
      : clasesFiltradas;
  function calcularHorario(
    clase: Clase
  ) {
    const [
      horas,
      minutos,
    ] =
      clase.hora_inicio
        .split(":")
        .map(Number);

    const inicio =
      new Date();

    inicio.setHours(
      horas,
      minutos,
      0,
      0
    );

    const fin =
      new Date(
        inicio.getTime() +
          clase.duracion_minutos *
            60 *
            1000
      );

    const horaInicio =
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
      )}`;

    const horaFin =
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
      )}`;

    return {
      horaInicio,
      horaFin,
    };
  }

  function textoTipo(
    tipoClase: string
  ) {
    if (
      tipoClase ===
      "club"
    ) {
      return "Clase para club";
    }

    if (
      tipoClase ===
      "propia"
    ) {
      return "Clase propia";
    }

    if (
      tipoClase ===
      "privada"
    ) {
      return "Pista privada";
    }

    return tipoClase;
  }

  function nombreCompletoAlumno(
    alumno:
      | {
          nombre: string;
          apellidos:
            | string
            | null;
        }
      | null
  ) {
    if (!alumno) {
      return "Sin alumno";
    }

    return `${alumno.nombre} ${
      alumno.apellidos ||
      ""
    }`.trim();
  }

  function pagoDeAlumno(
    claseId: string,
    alumnoId: string
  ) {
    return pagosClase.find(
      (pago) =>
        pago.clase_id ===
          claseId &&
        pago.alumno_id ===
          alumnoId
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-7 sm:px-7 lg:px-9">

      <div className="mx-auto w-full max-w-[1540px]">

        <div className="mb-7">

          <h1 className="text-4xl font-bold text-slate-900">
            Clases
          </h1>

          <p className="mt-2 text-slate-600">
            Registro y control de clases
          </p>

        </div>

        {!formularioAbierto && (
          <div className="mb-7 flex flex-wrap justify-end gap-3">

            <button
              type="button"
              onClick={() => {
                limpiarFormulario();
                setMensaje("");
                setModoCreacion(
                  "serie"
                );
                setFormularioAbierto(
                  true
                );
              }}
              className="rounded-xl border border-[#09a9a3] bg-white px-6 py-3 font-semibold text-[#078b86] shadow-sm transition hover:bg-teal-50"
            >
              + Nueva serie
            </button>

            <button
              type="button"
              onClick={() => {
                limpiarFormulario();
                setMensaje("");
                setModoCreacion(
                  "individual"
                );
                setFormularioAbierto(
                  true
                );
              }}
              className="rounded-xl bg-[#09a9a3] px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-[#078f8a]"
            >
              + Nueva clase
            </button>

          </div>
        )}

        {formularioAbierto && (
        <form
          id="formulario-clase"
          onSubmit={
            guardarClase
          }
          className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5"
        >

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[#09a9a3]">
                <IconoClase />
              </div>

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  {claseEditandoId
                    ? "Editar clase"
                    : modoCreacion ===
                      "serie"
                    ? "Nueva serie de clases"
                    : "Nueva clase"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {claseEditandoId
                    ? "Modifica los datos de la clase"
                    : modoCreacion ===
                      "serie"
                    ? "Programa automáticamente clases recurrentes"
                    : "Datos y gestión de la clase"}
                </p>

              </div>

            </div>

            {claseEditandoId && (

              <button
                type="button"
                onClick={() => {
                  if (
                    volverAlOrigenSiExiste()
                  ) {
                    return;
                  }

                  limpiarFormulario();
                  setMensaje("");
                  setFormularioAbierto(
                    false
                  );
                }}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar edición
              </button>

            )}

          </div>

          {!claseEditandoId && (
            <section className="mt-4 rounded-2xl border border-teal-200 bg-teal-50/50 p-4">

              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#078b86]">
                    1. Selecciona alumno o grupo
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Al elegir el primer alumno se completan automáticamente sus datos habituales.
                  </p>
                </div>

                {alumnosSeleccionados.length > 0 && (
                  <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-[#078b86]">
                    {alumnosSeleccionados.length} seleccionado{alumnosSeleccionados.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              <div className="mt-3 grid gap-3 xl:grid-cols-[280px_minmax(0,1fr)]">

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Grupo
                  </label>

                  <select
                    value={grupoId}
                    onChange={(e) =>
                      seleccionarGrupoRapido(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#09a9a3] focus:ring-2 focus:ring-teal-100"
                  >
                    <option value="">
                      Sin grupo / elegir alumnos
                    </option>

                    {grupos.map(
                      (grupo) => (
                        <option
                          key={grupo.id}
                          value={grupo.id}
                        >
                          {grupo.nombre}
                        </option>
                      )
                    )}
                  </select>

                  {grupoId &&
                    alumnosGrupoSeleccionado.length > 0 && (
                    <div className="mt-2 rounded-xl border border-teal-200 bg-white px-3 py-2.5">

                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Alumnos del grupo
                      </p>

                      <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-700">
                        {alumnosGrupoSeleccionado
                          .map(
                            (alumno) =>
                              `${alumno?.nombre || ""} ${alumno?.apellidos || ""}`.trim()
                          )
                          .join(", ")}
                      </p>

                    </div>
                  )}

                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Alumno
                  </label>

                  <input
                    id="buscador-alumno-principal"
                    type="text"
                    placeholder="Buscar alumno..."
                    value={busquedaAlumno}
                    onChange={(e) =>
                      setBusquedaAlumno(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#09a9a3] focus:ring-2 focus:ring-teal-100"
                  />

                  <div className="mt-2 grid max-h-[125px] gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">

                    {alumnosFiltrados.map(
                      (alumno) => {
                        const seleccionado =
                          alumnosSeleccionados.includes(
                            alumno.id
                          );

                        return (
                          <label
                            key={alumno.id}
                            className={
                              seleccionado
                                ? "flex cursor-pointer items-center gap-2 rounded-lg border border-teal-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-800"
                                : "flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 transition hover:border-teal-200"
                            }
                          >
                            <input
                              type="checkbox"
                              checked={seleccionado}
                              onChange={() =>
                                cambiarAlumno(
                                  alumno
                                )
                              }
                              className="h-3.5 w-3.5 accent-[#09a9a3]"
                            />

                            <span className="min-w-0 truncate">
                              {alumno.nombre} {alumno.apellidos}
                            </span>
                          </label>
                        );
                      }
                    )}

                  </div>
                </div>

              </div>

            </section>
          )}

          <div className="mt-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              2. Datos de la clase
            </p>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">

            <div>

              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                {modoCreacion ===
                  "serie"
                    ? "Fecha inicio"
                    : "Fecha"}
              </label>

              <input
                type="date"
                value={fecha}
                onChange={(e) =>
                  setFecha(
                    e.target.value
                  )
                }
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#09a9a3] focus:ring-2 focus:ring-teal-100"
              />

            </div>

            {modoCreacion ===
              "serie" && (

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Fecha final
                </label>

                <input
                  type="date"
                  value={
                    fechaFinSerie
                  }
                  min={fecha}
                  onChange={(e) =>
                    setFechaFinSerie(
                      e.target.value
                    )
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#09a9a3] focus:ring-2 focus:ring-teal-100"
                />

              </div>

            )}

            <div>

              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Hora
              </label>

              <input
                type="time"
                value={hora}
                onChange={(e) =>
                  setHora(
                    e.target.value
                  )
                }
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#09a9a3] focus:ring-2 focus:ring-teal-100"
              />

            </div>

            <div>

              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Duración
              </label>

              <select
                value={
                  duracion
                }
                onChange={(e) => {
                  const nuevaDuracion =
                    e.target.value;

                  setDuracion(
                    nuevaDuracion
                  );

                  if (
                    !claseEditandoId &&
                    alumnosSeleccionados.length >
                      0
                  ) {
                    actualizarImportesAutomaticos(
                      tipo,
                      ubicacionId,
                      Number(
                        nuevaDuracion
                      ),
                      alumnosSeleccionados.length
                    );
                  }
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#09a9a3] focus:ring-2 focus:ring-teal-100"
              >
                <option value="30">
                  30 minutos
                </option>

                <option value="45">
                  45 minutos
                </option>

                <option value="60">
                  60 minutos
                </option>

                <option value="75">
                  75 minutos
                </option>

                <option value="90">
                  90 minutos
                </option>

                <option value="120">
                  120 minutos
                </option>
              </select>

            </div>

            <div>

              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Ubicación
              </label>

              <select
                value={
                  ubicacionId
                }
                onChange={(e) => {
                  const nuevaUbicacionId =
                    e.target.value;

                  setUbicacionId(
                    nuevaUbicacionId
                  );

                  actualizarCostePistaAutomatico(
                    tipo,
                    nuevaUbicacionId
                  );
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#09a9a3] focus:ring-2 focus:ring-teal-100"
              >
                <option value="">
                  Seleccionar ubicación
                </option>

                {ubicaciones.map(
                  (
                    ubicacion
                  ) => (
                    <option
                      key={
                        ubicacion.id
                      }
                      value={
                        ubicacion.id
                      }
                    >
                      {
                        ubicacion.nombre
                      }
                    </option>
                  )
                )}

              </select>

            </div>

            <div className="hidden">

              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Grupo
              </label>

              <select
                value={
                  grupoId
                }
                onChange={(e) => {
                  const nuevoGrupoId =
                    e.target.value;

                  setGrupoId(
                    nuevoGrupoId
                  );

                  if (
                    !nuevoGrupoId
                  ) {
                    return;
                  }

                  const grupo =
                    grupos.find(
                      (
                        item
                      ) =>
                        item.id ===
                        nuevoGrupoId
                    );

                  if (!grupo) {
                    return;
                  }

                  const idsGrupo =
                    grupo.grupo_alumnos.map(
                      (
                        item
                      ) =>
                        item.alumno_id
                    );

                  if (!ubicacionId) {
                    const primerAlumnoConUbicacion =
                      idsGrupo
                        .map((id) =>
                          alumnos.find(
                            (item) =>
                              item.id === id
                          )
                        )
                        .find(
                          (alumno) =>
                            alumno?.ubicacion_habitual_id
                        );

                    if (
                      primerAlumnoConUbicacion
                        ?.ubicacion_habitual_id
                    ) {
                      setUbicacionId(
                        primerAlumnoConUbicacion
                          .ubicacion_habitual_id
                      );

                      actualizarCostePistaAutomatico(
                        tipo,
                        primerAlumnoConUbicacion
                          .ubicacion_habitual_id
                      );
                    }
                  }

                  setAlumnosSeleccionados(
                    idsGrupo
                  );

                  const nuevosImportes:
                    Record<
                      string,
                      string
                    > =
                    {};

                  const nuevosModos:
                    Record<
                      string,
                      "normal" | "bono"
                    > =
                    {};

                  const nuevosBonos:
                    Record<
                      string,
                      string
                    > =
                    {};

                  const nuevosEstados:
                    Record<
                      string,
                      "pagado" | "pendiente"
                    > =
                    {};

                  const nuevosMetodos:
                    Record<
                      string,
                      string
                    > =
                    {};

                  idsGrupo.forEach(
                    (
                      alumnoId
                    ) => {
                      const alumno =
                        alumnos.find(
                          (
                            item
                          ) =>
                            item.id ===
                            alumnoId
                        );

                      nuevosImportes[
                        alumnoId
                      ] =
                        alumno
                          ?.precio_habitual !==
                        null &&
                        alumno
                          ?.precio_habitual !==
                        undefined
                          ? String(
                              alumno.precio_habitual
                            )
                          : "";

                      const bonosAlumno =
                        bonosDelAlumno(
                          alumnoId
                        );

                      const tieneBono =
                        bonosAlumno.length >
                        0;

                      nuevosModos[
                        alumnoId
                      ] =
                        tieneBono
                          ? "bono"
                          : "normal";

                      nuevosEstados[
                        alumnoId
                      ] =
                        "pendiente";

                      nuevosMetodos[
                        alumnoId
                      ] =
                        "efectivo";

                      if (
                        tieneBono
                      ) {
                        nuevosBonos[
                          alumnoId
                        ] =
                          bonosAlumno[0]
                            .id;
                      }
                    }
                  );

                  setImportesAlumnos(
                    nuevosImportes
                  );

                  setModoPagoAlumnos(
                    nuevosModos
                  );

                  setBonosSeleccionados(
                    nuevosBonos
                  );

                  setEstadoPagoAlumnos(
                    nuevosEstados
                  );

                  setMetodoPagoAlumnos(
                    nuevosMetodos
                  );
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#09a9a3] focus:ring-2 focus:ring-teal-100"
              >

                <option value="">
                  Sin grupo
                </option>

                {grupos.map(
                  (
                    grupo
                  ) => (
                    <option
                      key={
                        grupo.id
                      }
                      value={
                        grupo.id
                      }
                    >
                      {
                        grupo.nombre
                      }
                    </option>
                  )
                )}

              </select>

            </div>

            <div>

              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Tipo de clase
              </label>

              <select
                value={tipo}
                onChange={(e) => {
                  const nuevoTipo =
                    e.target.value;

                  setTipo(
                    nuevoTipo
                  );

                  actualizarImportesAutomaticos(
                    nuevoTipo,
                    ubicacionId,
                    Number(duracion),
                    alumnosSeleccionados.length
                  );

                  if (
                    nuevoTipo !==
                    "club"
                  ) {
                    setImporteClub(
                      ""
                    );
                  }

                  if (
                    nuevoTipo ===
                    "club"
                  ) {
                    setCostePista(
                      "0"
                    );
                  }
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#09a9a3] focus:ring-2 focus:ring-teal-100"
              >
                <option value="club">
                  Clase para club
                </option>

                <option value="propia">
                  Clase propia en club / pista de pago
                </option>

                <option value="privada">
                  Clase propia en pista privada
                </option>
              </select>

            </div>

          </div>
          </div>

          {modoCreacion ===
            "serie" && (

            <div className="mt-5 rounded-2xl border border-teal-200 bg-teal-50/60 p-5">

              <p className="text-xs font-bold uppercase tracking-wide text-[#078b86]">
                Días de repetición
              </p>

              <p className="mt-1 text-sm text-slate-600">
                Selecciona uno o varios días de la semana.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">

                {[
                  [1, "Lunes"],
                  [2, "Martes"],
                  [3, "Miércoles"],
                  [4, "Jueves"],
                  [5, "Viernes"],
                  [6, "Sábado"],
                  [0, "Domingo"],
                ].map(
                  ([
                    numero,
                    nombre,
                  ]) => {

                    const activo =
                      diasSerie.includes(
                        Number(
                          numero
                        )
                      );

                    return (

                      <button
                        key={
                          String(
                            numero
                          )
                        }
                        type="button"
                        onClick={() =>
                          cambiarDiaSerie(
                            Number(
                              numero
                            )
                          )
                        }
                        className={
                          activo
                            ? "rounded-xl bg-[#09a9a3] px-4 py-2.5 text-sm font-semibold text-white"
                            : "rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        }
                      >
                        {nombre}
                      </button>

                    );
                  }
                )}

              </div>

              {fecha &&
                fechaFinSerie &&
                diasSerie.length >
                  0 && (

                <p className="mt-4 text-sm font-semibold text-[#078b86]">
                  Se crearán{" "}
                  {
                    fechasDeSerie()
                      .length
                  }{" "}
                  clase(s).
                </p>

              )}

            </div>

          )}

          <div
            className={
              tipo ===
              "club"
                ? "mt-4"
                : "mt-4"
            }
          >

            <div className="hidden">

              <div className="flex items-center gap-3">

                <div className="text-[#09a9a3]">
                  <IconoPersonas />
                </div>

                <div>

                  <h3 className="font-bold text-slate-900">
                    Alumnos
                  </h3>

                  <p className="text-xs text-slate-500">
                    Selecciona los alumnos de esta clase
                  </p>

                </div>

              </div>

              <input
                type="text"
                placeholder="Buscar alumno..."
                value={
                  busquedaAlumno
                }
                onChange={(e) =>
                  setBusquedaAlumno(
                    e.target.value
                  )
                }
                className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#09a9a3] focus:ring-2 focus:ring-teal-100"
              />

              <div className="mt-3 grid max-h-[230px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">

                {alumnosFiltrados.map(
                  (
                    alumno
                  ) => {
                    const seleccionado =
                      alumnosSeleccionados.includes(
                        alumno.id
                      );

                    return (
                      <label
                        key={
                          alumno.id
                        }
                        className={
                          seleccionado
                            ? "flex cursor-pointer items-center gap-3 rounded-xl border border-teal-300 bg-teal-50 px-3 py-2.5 text-sm font-medium text-slate-800"
                            : "flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition hover:border-teal-200 hover:bg-teal-50/40"
                        }
                      >

                        <input
                          type="checkbox"
                          checked={
                            seleccionado
                          }
                          onChange={() =>
                            cambiarAlumno(
                              alumno
                            )
                          }
                          className="h-4 w-4 accent-[#09a9a3]"
                        />

                        <span className="min-w-0 truncate">
                          {
                            alumno.nombre
                          }{" "}
                          {
                            alumno.apellidos
                          }
                        </span>

                      </label>
                    );
                  }
                )}

              </div>

            </div>

            {tipo !==
              "club" && (

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">

                <div>

                  <h3 className="font-bold text-slate-900">
                    Precio y forma de pago
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Configura el cobro de cada alumno
                  </p>

                </div>

                {alumnosElegidos.length ===
                0 ? (

                  <div className="mt-4 flex min-h-[150px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/60 px-5 text-center">

                    <p className="text-sm text-slate-400">
                      Selecciona al menos un alumno para configurar el pago.
                    </p>

                  </div>

                ) : (

                  <div className="mt-3 grid gap-2 xl:grid-cols-2">

                    {alumnosElegidos.map(
                      (
                        alumno
                      ) => {
                        const bonosAlumno =
                          bonosDelAlumno(
                            alumno.id
                          );

                        const modo =
                          modoPagoAlumnos[
                            alumno.id
                          ] ||
                          "normal";

                        return (
                          <div
                            key={
                              alumno.id
                            }
                            className="rounded-xl border border-slate-200 bg-white p-3"
                          >

                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                              <p className="font-bold text-slate-900">
                                {
                                  alumno.nombre
                                }{" "}
                                {
                                  alumno.apellidos
                                }
                              </p>

                              <div className="flex rounded-lg bg-slate-100 p-1">

                                <button
                                  type="button"
                                  onClick={() =>
                                    setModoPagoAlumnos(
                                      (
                                        actuales
                                      ) => ({
                                        ...actuales,
                                        [alumno.id]:
                                          "normal",
                                      })
                                    )
                                  }
                                  className={
                                    modo ===
                                    "normal"
                                      ? "rounded-md bg-white px-3 py-1.5 text-xs font-bold text-slate-900 shadow-sm"
                                      : "rounded-md px-3 py-1.5 text-xs font-semibold text-slate-500"
                                  }
                                >
                                  Pago normal
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    bonosAlumno.length ===
                                    0
                                  }
                                  onClick={() => {
                                    if (
                                      bonosAlumno.length ===
                                      0
                                    ) {
                                      return;
                                    }

                                    setModoPagoAlumnos(
                                      (
                                        actuales
                                      ) => ({
                                        ...actuales,
                                        [alumno.id]:
                                          "bono",
                                      })
                                    );

                                    if (
                                      !bonosSeleccionados[
                                        alumno.id
                                      ]
                                    ) {
                                      setBonosSeleccionados(
                                        (
                                          actuales
                                        ) => ({
                                          ...actuales,
                                          [alumno.id]:
                                            bonosAlumno[0]
                                              .id,
                                        })
                                      );
                                    }
                                  }}
                                  className={
                                    modo ===
                                    "bono"
                                      ? "rounded-md bg-white px-3 py-1.5 text-xs font-bold text-[#078b86] shadow-sm"
                                      : bonosAlumno.length ===
                                        0
                                      ? "cursor-not-allowed rounded-md px-3 py-1.5 text-xs font-semibold text-slate-300"
                                      : "rounded-md px-3 py-1.5 text-xs font-semibold text-slate-500"
                                  }
                                >
                                  Bono
                                </button>

                              </div>

                            </div>

                            {modo ===
                            "bono" ? (

                              <div className="mt-3">

                                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                  Bono
                                </label>

                                <select
                                  value={
                                    bonosSeleccionados[
                                      alumno.id
                                    ] ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    setBonosSeleccionados(
                                      (
                                        actuales
                                      ) => ({
                                        ...actuales,
                                        [alumno.id]:
                                          e.target.value,
                                      })
                                    )
                                  }
                                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                                >

                                  {bonosAlumno.map(
                                    (
                                      bono
                                    ) => (
                                      <option
                                        key={
                                          bono.id
                                        }
                                        value={
                                          bono.id
                                        }
                                      >
                                        {textoBono(
                                          bono,
                                          alumno.id
                                        )}
                                      </option>
                                    )
                                  )}

                                </select>

                              </div>

                            ) : (

                              <div className="mt-3 grid gap-3 sm:grid-cols-3">

                                <div>

                                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                    Importe
                                  </label>

                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                      importesAlumnos[
                                        alumno.id
                                      ] ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      setImportesAlumnos(
                                        (
                                          actuales
                                        ) => ({
                                          ...actuales,
                                          [alumno.id]:
                                            e.target.value,
                                        })
                                      )
                                    }
                                    placeholder="0,00"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                                  />

                                </div>

                                <div>

                                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                    Estado
                                  </label>

                                  <select
                                    value={
                                      estadoPagoAlumnos[
                                        alumno.id
                                      ] ||
                                      "pendiente"
                                    }
                                    onChange={(e) =>
                                      setEstadoPagoAlumnos(
                                        (
                                          actuales
                                        ) => ({
                                          ...actuales,
                                          [alumno.id]:
                                            e.target
                                              .value as
                                              | "pagado"
                                              | "pendiente",
                                        })
                                      )
                                    }
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                                  >
                                    <option value="pendiente">
                                      Pendiente
                                    </option>

                                    <option value="pagado">
                                      Pagado
                                    </option>
                                  </select>

                                </div>

                                <div>

                                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                    Método
                                  </label>

                                  <select
                                    value={
                                      metodoPagoAlumnos[
                                        alumno.id
                                      ] ||
                                      "efectivo"
                                    }
                                    onChange={(e) =>
                                      setMetodoPagoAlumnos(
                                        (
                                          actuales
                                        ) => ({
                                          ...actuales,
                                          [alumno.id]:
                                            e.target.value,
                                        })
                                      )
                                    }
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                                  >
                                    <option value="efectivo">
                                      Efectivo
                                    </option>

                                    <option value="bizum">
                                      Bizum
                                    </option>

                                    <option value="transferencia">
                                      Transferencia
                                    </option>

                                    <option value="tarjeta">
                                      Tarjeta
                                    </option>
                                  </select>

                                </div>

                              </div>

                            )}

                          </div>
                        );
                      }
                    )}

                  </div>

                )}

              </div>

            )}

          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">

            {tipo ===
              "club" && (

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Importe que paga el club
                </label>

                <div className="relative">

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      importeClub
                    }
                    onChange={(e) =>
                      setImporteClub(
                        e.target.value
                      )
                    }
                    placeholder="0,00"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-10 text-slate-800 outline-none transition focus:border-[#09a9a3] focus:ring-2 focus:ring-teal-100"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                    €
                  </span>

                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Se busca automáticamente en Tarifas según ubicación, duración y número de alumnos. Puedes cambiarlo manualmente para esta clase.
                </p>

              </div>

            )}

            {tipo ===
              "propia" && (

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Coste de pista
                </label>

                <div className="relative">

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      costePista
                    }
                    onChange={(e) =>
                      setCostePista(
                        e.target.value
                      )
                    }
                    placeholder="0,00"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-10 text-slate-800 outline-none transition focus:border-[#09a9a3] focus:ring-2 focus:ring-teal-100"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                    €
                  </span>

                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Se busca primero en Tarifas según ubicación, duración y número de alumnos. Si no existe, usa el coste habitual de la ubicación. Puedes cambiarlo manualmente para esta clase.
                </p>

              </div>

            )}

            {tipo ===
              "privada" && (

              <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3">

                <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
                  Pista privada
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  No hay coste de pista. El cobro se gestiona directamente con los alumnos.
                </p>

              </div>

            )}

            <div>

              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Ingreso extra
              </label>

              <div className="relative">

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    ingresoExtra
                  }
                  onChange={(e) =>
                    setIngresoExtra(
                      e.target.value
                    )
                  }
                  placeholder="0,00"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-10 text-slate-800 outline-none transition focus:border-[#09a9a3] focus:ring-2 focus:ring-teal-100"
                />

                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  €
                </span>

              </div>

              <p className="mt-2 text-xs text-slate-500">
                Opcional. Para propinas u otros ingresos excepcionales de esta clase.
              </p>

            </div>

            <div>

              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Estado
              </label>

              <select
                value={
                  estado
                }
                onChange={(e) =>
                  setEstado(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#09a9a3] focus:ring-2 focus:ring-teal-100"
              >
                <option value="programada">
                  Programada
                </option>

                <option value="realizada">
                  Realizada
                </option>

                <option value="cancelada">
                  Cancelada
                </option>
              </select>

            </div>

          </div>

          <div
            className={
              estado === "cancelada"
                ? "mt-4 rounded-2xl border border-red-200 bg-red-50 p-4"
                : "mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
            }
          >

            <label
              className={
                estado === "cancelada"
                  ? "block text-xs font-bold uppercase tracking-wide text-red-700"
                  : "block text-xs font-bold uppercase tracking-wide text-slate-600"
              }
            >
              {estado === "cancelada"
                ? "Motivo de cancelación / anotación"
                : "Anotación"}
            </label>

            <textarea
              value={
                observaciones
              }
              onChange={(e) =>
                setObservaciones(
                  e.target.value
                )
              }
              rows={2}
              placeholder={
                estado === "cancelada"
                  ? "Indica el motivo de la cancelación o cualquier anotación..."
                  : "Añade una anotación sobre esta clase..."
              }
              className={
                estado === "cancelada"
                  ? "mt-2 w-full resize-none rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-red-300"
                  : "mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#09a9a3]"
              }
            />

            <p className="mt-2 text-xs text-slate-500">
              Opcional. La anotación quedará visible en la clase registrada.
            </p>

          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              {mensaje && (
                <p
                  className={
                    mensaje.startsWith(
                      "❌"
                    )
                      ? "text-sm font-semibold text-red-600"
                      : mensaje.startsWith(
                          "⚠️"
                        )
                      ? "text-sm font-semibold text-amber-600"
                      : mensaje ===
                        "Editando clase"
                      ? "text-sm font-semibold text-blue-600"
                      : "text-sm font-semibold text-green-600"
                  }
                >
                  {mensaje}
                </p>
              )}

            </div>

            <div className="flex gap-3">

              <button
                type="button"
                onClick={() => {
                  if (
                    volverAlOrigenSiExiste()
                  ) {
                    return;
                  }

                  limpiarFormulario();
                  setMensaje("");
                  setFormularioAbierto(
                    false
                  );
                }}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="min-w-[180px] rounded-xl bg-[#09a9a3] px-6 py-3 font-bold text-white transition hover:bg-[#078b86]"
              >
                {claseEditandoId
                  ? "Guardar cambios"
                  : modoCreacion ===
                    "serie"
                  ? "Crear serie"
                  : "Guardar clase"}
              </button>

            </div>

          </div>

        </form>
        )}
        <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-7">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <IconoCalendario />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {claseEditandoId
                    ? "Clase que estás editando"
                    : "Clases registradas"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {claseEditandoId
                    ? "Solo se muestra la clase seleccionada"
                    : "Consulta y gestiona las clases por orden cronológico"}
                </p>
              </div>

            </div>

            {!claseEditandoId && (
              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                {clasesFiltradas.length}{" "}
                {clasesFiltradas.length === 1
                  ? "clase"
                  : "clases"}
              </div>
            )}

          </div>

          {!claseEditandoId && (

            <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(320px,1fr)_150px_150px_150px_150px_150px]">

              <input
                type="text"
                placeholder="Buscar alumno o ubicación..."
                value={busquedaClases}
                onChange={(e) =>
                  setBusquedaClases(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#09a9a3] focus:ring-2 focus:ring-teal-100"
              />

              <select
                value={filtroEstado}
                onChange={(e) =>
                  setFiltroEstado(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#09a9a3] focus:ring-2 focus:ring-teal-100"
              >
                <option value="todas">
                  Todos los estados
                </option>

                <option value="programada">
                  Programadas
                </option>

                <option value="realizada">
                  Realizadas
                </option>

                <option value="cancelada">
                  Canceladas
                </option>
              </select>

              <input
                type="month"
                value={filtroMes}
                onChange={(e) =>
                  setFiltroMes(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#09a9a3] focus:ring-2 focus:ring-teal-100"
              />

              <input
                type="date"
                aria-label="Desde"
                title="Desde"
                value={filtroFechaDesde}
                onChange={(e) =>
                  setFiltroFechaDesde(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#09a9a3] focus:ring-2 focus:ring-teal-100"
              />

              <input
                type="date"
                aria-label="Hasta"
                title="Hasta"
                value={filtroFechaHasta}
                onChange={(e) =>
                  setFiltroFechaHasta(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#09a9a3] focus:ring-2 focus:ring-teal-100"
              />

              <button
                type="button"
                onClick={() => {
                  setBusquedaClases("");
                  setFiltroEstado("todas");
                  setFiltroMes("");
                  setFiltroFechaDesde("");
                  setFiltroFechaHasta("");
                }}
                className="w-full rounded-xl bg-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-300"
              >
                Limpiar
              </button>

            </div>

          )}

          <div className="mt-5 space-y-3">

            {clasesMostradas.length === 0 && (

              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">

                <p className="font-semibold text-slate-600">
                  No hay clases para mostrar
                </p>

              </div>

            )}

            {clasesMostradas.map(
              (clase) => {

                const {
                  horaInicio,
                  horaFin,
                } =
                  calcularHorario(
                    clase
                  );

                const [
                  anio,
                  mes,
                  dia,
                ] =
                  clase.fecha.split(
                    "-"
                  );

                const importeTotalAlumnos =
                  clase.clase_alumnos.reduce(
                    (
                      total,
                      participante
                    ) =>
                      total +
                      Number(
                        participante.importe ||
                          0
                      ),
                    0
                  );

                const resultadoClase =
                  (
                    clase.tipo === "club"
                      ? Number(
                          clase.importe_club ||
                            0
                        )
                      : importeTotalAlumnos -
                        Number(
                          clase.coste_pista ||
                            0
                        )
                  ) +
                  Number(
                    clase.ingreso_extra ||
                      0
                  );

                return (

                  <article
                    key={clase.id}
                    className={
                      clase.estado === "cancelada"
                        ? "rounded-2xl border border-red-200 bg-white p-4 shadow-sm"
                        : "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
                    }
                  >

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[0.8fr_1fr_1.55fr_1.45fr_auto] xl:items-center">

                      <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                          <IconoCalendario />
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Fecha
                          </p>

                          <p className="mt-0.5 text-sm font-bold text-slate-900">
                            {dia}/{mes}/{anio}
                          </p>
                        </div>

                      </div>

                      <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                          <IconoReloj />
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Horario
                          </p>

                          <p className="mt-0.5 whitespace-nowrap text-sm font-bold text-slate-900">
                            {horaInicio} - {horaFin}
                          </p>
                        </div>

                      </div>

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[#09a9a3]">
                          <IconoPersonas />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Alumnos
                          </p>

                          <p className="mt-0.5 text-sm font-semibold leading-tight text-slate-900">
                            {clase.clase_alumnos.length > 0
                              ? clase.clase_alumnos
                                  .map(
                                    (
                                      participante
                                    ) =>
                                      nombreCompletoAlumno(
                                        participante.alumnos
                                      )
                                  )
                                  .join(", ")
                              : "Sin alumnos"}
                          </p>
                        </div>

                      </div>

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                          <IconoUbicacion />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Ubicación
                          </p>

                          <p className="mt-0.5 text-sm font-semibold leading-tight text-slate-900">
                            {clase.ubicaciones?.nombre ||
                              "Sin ubicación"}
                          </p>
                        </div>

                      </div>

                      <div className="flex xl:justify-end">

                        <span
                          className={
                            clase.estado === "cancelada"
                              ? "rounded-full bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700"
                              : clase.estado === "realizada"
                              ? "rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700"
                              : "rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700"
                          }
                        >
                          {clase.serie_id && (
                      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                        Serie
                      </span>
                    )}

                    {clase.estado === "cancelada"
                            ? "Cancelada"
                            : clase.estado === "realizada"
                            ? "Realizada"
                            : "Programada"}
                        </span>

                      </div>

                    </div>

                    <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:grid-cols-5">

                      <div className="rounded-xl bg-slate-50 px-3 py-2.5">

                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Tipo
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {textoTipo(
                            clase.tipo
                          )}
                        </p>

                      </div>

                      <div className="rounded-xl bg-slate-50 px-3 py-2.5">

                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Duración
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {clase.duracion_minutos} min
                        </p>

                      </div>

                      {clase.tipo === "club" ? (

                        <div className="rounded-xl bg-green-50 px-3 py-2.5">

                          <p className="text-[10px] font-bold uppercase tracking-wide text-green-700">
                            Pago del club
                          </p>

                          <p className="mt-1 text-sm font-bold text-green-700">
                            {Number(
                              clase.importe_club ||
                                0
                            ).toFixed(2)} €
                          </p>

                        </div>

                      ) : (

                        <div className="rounded-xl bg-blue-50 px-3 py-2.5">

                          <p className="text-[10px] font-bold uppercase tracking-wide text-blue-700">
                            Valor alumnos
                          </p>

                          <p className="mt-1 text-sm font-bold text-blue-700">
                            {importeTotalAlumnos.toFixed(
                              2
                            )} €
                          </p>

                        </div>

                      )}

                      {clase.tipo === "propia" ? (

                        <div className="rounded-xl bg-red-50 px-3 py-2.5">

                          <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                            Coste de pista
                          </p>

                          <p className="mt-1 text-sm font-bold text-red-600">
                            {Number(
                              clase.coste_pista ||
                                0
                            ).toFixed(2)} €
                          </p>

                        </div>

                      ) : clase.tipo === "privada" ? (

                        <div className="rounded-xl bg-teal-50 px-3 py-2.5">

                          <p className="text-[10px] font-bold uppercase tracking-wide text-teal-700">
                            Pista
                          </p>

                          <p className="mt-1 text-sm font-bold text-teal-700">
                            Sin coste
                          </p>

                        </div>

                      ) : (

                        <div className="rounded-xl bg-slate-50 px-3 py-2.5">

                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Coste de pista
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            0,00 €
                          </p>

                        </div>

                      )}

                      {Number(
                        clase.ingreso_extra ||
                          0
                      ) > 0 && (

                        <div className="rounded-xl bg-purple-50 px-3 py-2.5">

                          <p className="text-[10px] font-bold uppercase tracking-wide text-purple-600">
                            Ingreso extra
                          </p>

                          <p className="mt-1 text-sm font-bold text-purple-700">
                            +{" "}
                            {Number(
                              clase.ingreso_extra ||
                                0
                            ).toFixed(2)} €
                          </p>

                        </div>

                      )}

                      <div
                        className={
                          resultadoClase > 0
                            ? "rounded-xl border border-green-200 bg-green-50 px-3 py-2.5"
                            : resultadoClase < 0
                            ? "rounded-xl border border-red-200 bg-red-50 px-3 py-2.5"
                            : "rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                        }
                      >

                        <p
                          className={
                            resultadoClase > 0
                              ? "text-[10px] font-bold uppercase tracking-wide text-green-700"
                              : resultadoClase < 0
                              ? "text-[10px] font-bold uppercase tracking-wide text-red-600"
                              : "text-[10px] font-bold uppercase tracking-wide text-slate-500"
                          }
                        >
                          Resultado
                        </p>

                        <p
                          className={
                            resultadoClase > 0
                              ? "mt-1 text-lg font-bold text-green-700"
                              : resultadoClase < 0
                              ? "mt-1 text-lg font-bold text-red-600"
                              : "mt-1 text-lg font-bold text-slate-700"
                          }
                        >
                          {resultadoClase.toFixed(
                            2
                          )} €
                        </p>

                      </div>

                    </div>

                    {clase.clase_alumnos.length > 0 && (

                      <div className="mt-3 flex flex-wrap gap-2">

                        {clase.clase_alumnos.map(
                          (
                            participante
                          ) => {

                            const pago =
                              pagoDeAlumno(
                                clase.id,
                                participante.alumno_id
                              );

                            return (

                              <div
                                key={
                                  participante.alumno_id
                                }
                                className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                              >

                                <span className="text-xs font-semibold text-slate-700">
                                  {nombreCompletoAlumno(
                                    participante.alumnos
                                  )}
                                </span>

                                {clase.tipo === "club" ? (

                                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                                    Alumno del club
                                  </span>

                                ) : participante.usa_bono ? (

                                  <span className="rounded-full bg-teal-100 px-2.5 py-1 text-[11px] font-bold text-teal-700">
                                    Bono
                                  </span>

                                ) : clase.estado !== "realizada" ? (

                                  <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                    Pago normal ·{" "}
                                    {Number(
                                      participante.importe ||
                                        0
                                    ).toFixed(2)} €
                                  </span>

                                ) : pago?.estado === "pagado" ? (

                                  <span className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-700">
                                    Pagado ·{" "}
                                    {Number(
                                      participante.importe ||
                                        0
                                    ).toFixed(2)} € ·{" "}
                                    {pago.metodo
                                      .charAt(0)
                                      .toUpperCase() +
                                      pago.metodo.slice(1)}
                                  </span>

                                ) : (

                                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700">
                                    Pendiente ·{" "}
                                    {Number(
                                      participante.importe ||
                                        0
                                    ).toFixed(2)} €
                                  </span>

                                )}

                              </div>

                            );
                          }
                        )}

                      </div>

                    )}

                    {clase.observaciones && (

                      <div
                        className={
                          clase.estado === "cancelada"
                            ? "mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5"
                            : "mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5"
                        }
                      >

                        <p
                          className={
                            clase.estado === "cancelada"
                              ? "text-[10px] font-bold uppercase tracking-wide text-red-700"
                              : "text-[10px] font-bold uppercase tracking-wide text-slate-500"
                          }
                        >
                          {clase.estado === "cancelada"
                            ? "Motivo de cancelación / anotación"
                            : "Anotación"}
                        </p>

                        <p
                          className={
                            clase.estado === "cancelada"
                              ? "mt-1 text-sm text-red-900"
                              : "mt-1 text-sm text-slate-700"
                          }
                        >
                          {clase.observaciones}
                        </p>

                      </div>

                    )}

                    <div className="mt-3 flex flex-wrap items-center justify-end gap-2">

                      {!claseEditandoId && (

                        <button
                          type="button"
                          onClick={() =>
                            editarClase(
                              clase
                            )
                          }
                          className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700"
                        >
                          Editar
                        </button>

                      )}

                      <button
                        type="button"
                        onClick={() =>
                          borrarClase(
                            clase
                          )
                        }
                        className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-red-700"
                      >
                        Borrar
                      </button>

                    </div>

                  </article>

                );
              }
            )}

          </div>

        </section>

      </div>


      {clasePendienteEditar && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">

          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">

            <h2 className="text-xl font-bold text-slate-900">
              Guardar cambios de una serie
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Esta clase pertenece a una serie recurrente. Elige a qué clases quieres aplicar los cambios.
            </p>

            <div className="mt-6 grid gap-3">

              <button
                type="button"
                onClick={() =>
                  continuarEdicionSerie(
                    "una"
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-left font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Solo esta clase
              </button>

              <button
                type="button"
                onClick={() =>
                  continuarEdicionSerie(
                    "siguientes"
                  )
                }
                className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 text-left font-semibold text-amber-900 transition hover:bg-amber-100"
              >
                Esta clase y las siguientes
              </button>

              <button
                type="button"
                onClick={() =>
                  continuarEdicionSerie(
                    "serie"
                  )
                }
                className="rounded-xl bg-[#09a9a3] px-5 py-3 text-left font-semibold text-white transition hover:bg-[#078b86]"
              >
                Toda la serie
              </button>

            </div>

            <button
              type="button"
              onClick={() => {
                alcanceEdicionSerieRef.current =
                  null;

                setClasePendienteEditar(
                  null
                );
              }}
              className="mt-5 w-full rounded-xl bg-slate-200 px-5 py-3 font-semibold text-slate-800"
            >
              Cancelar
            </button>

          </div>

        </div>

      )}

      {clasePendienteBorrar && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">

          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">

            <h2 className="text-xl font-bold text-slate-900">
              Borrar clase de una serie
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Esta clase pertenece a una serie recurrente. Elige qué quieres borrar.
            </p>

            <div className="mt-6 grid gap-3">

              <button
                type="button"
                disabled={
                  borrandoSerie
                }
                onClick={() =>
                  ejecutarBorrado(
                    clasePendienteBorrar,
                    "una"
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-left font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Solo esta clase
              </button>

              <button
                type="button"
                disabled={
                  borrandoSerie
                }
                onClick={() =>
                  ejecutarBorrado(
                    clasePendienteBorrar,
                    "siguientes"
                  )
                }
                className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 text-left font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-50"
              >
                Esta clase y las siguientes
              </button>

              <button
                type="button"
                disabled={
                  borrandoSerie
                }
                onClick={() =>
                  ejecutarBorrado(
                    clasePendienteBorrar,
                    "serie"
                  )
                }
                className="rounded-xl bg-red-600 px-5 py-3 text-left font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                Toda la serie
              </button>

            </div>

            <button
              type="button"
              disabled={
                borrandoSerie
              }
              onClick={() =>
                setClasePendienteBorrar(
                  null
                )
              }
              className="mt-5 w-full rounded-xl bg-slate-200 px-5 py-3 font-semibold text-slate-800 disabled:opacity-50"
            >
              Cancelar
            </button>

          </div>

        </div>

      )}

    </main>
  );
}                