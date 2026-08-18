"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";
import { generarImagenTarifas } from "../../components/tarifas/generarImagenTarifas";

type Ubicacion = {
  id: string;
  nombre: string;
  tipo: string;
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

type SeccionTarifas =
  | "comerciales"
  | "escuela"
  | "clubs";

const ALUMNOS = [1, 2, 3, 4];
const DURACIONES_CLUB = [60, 90, 120];
const HORAS_ESCUELA = [1, 2, 3] as const;
const PERIODOS_ESCUELA = [
  {
    clave: "mensual",
    titulo: "Mensual",
    subtitulo: "Monthly",
  },
  {
    clave: "trimestral",
    titulo: "Trimestral",
    subtitulo: "Quarterly",
  },
] as const;

const VALORES_INICIALES_ESCUELA: Record<
  string,
  number
> = {
  "escuela_mensual-1": 45,
  "escuela_trimestral-1": 125,
  "escuela_mensual-2": 85,
  "escuela_trimestral-2": 240,
  "escuela_mensual-3": 120,
  "escuela_trimestral-3": 335,
};

const TARIFAS_COMERCIALES = [
  {
    concepto: "clase_suelta",
    titulo: "Clase suelta",
    subtitulo: "1 clase · 60 min",
    clases: 1,
  },
  {
    concepto: "bono_5",
    titulo: "Bono 5",
    subtitulo: "5 clases · 60 min",
    clases: 5,
  },
  {
    concepto: "bono_10",
    titulo: "Bono 10",
    subtitulo: "10 clases · 60 min",
    clases: 10,
  },
] as const;

const VALORES_INICIALES: Record<
  string,
  number
> = {
  "clase_suelta-60-1": 35,
  "clase_suelta-60-2": 40,
  "clase_suelta-60-3": 45,
  "clase_suelta-60-4": 50,

  "bono_5-60-1": 165,
  "bono_5-60-2": 185,
  "bono_5-60-3": 205,
  "bono_5-60-4": 225,

  "bono_10-60-1": 310,
  "bono_10-60-2": 340,
  "bono_10-60-3": 380,
  "bono_10-60-4": 410,
};

function claveTarifa(
  concepto: string,
  duracion: number,
  alumnos: number
) {
  return `${concepto}-${duracion}-${alumnos}`;
}

const PREFIJO_TARIFA_ALTERNATIVA =
  "alternativa:";

function conceptoTarifaAlternativa(
  nombreTarifa: string,
  conceptoBase: string
) {
  return `${PREFIJO_TARIFA_ALTERNATIVA}${encodeURIComponent(
    nombreTarifa
  )}:${conceptoBase}`;
}

function extraerNombreTarifaAlternativa(
  concepto: string
) {
  if (
    !concepto.startsWith(
      PREFIJO_TARIFA_ALTERNATIVA
    )
  ) {
    return null;
  }

  const resto =
    concepto.slice(
      PREFIJO_TARIFA_ALTERNATIVA.length
    );

  const ultimoSeparador =
    resto.lastIndexOf(":");

  if (
    ultimoSeparador <= 0
  ) {
    return null;
  }

  try {
    return decodeURIComponent(
      resto.slice(
        0,
        ultimoSeparador
      )
    );
  } catch {
    return null;
  }
}

function conceptoComercialReal(
  tarifaSeleccionada: string,
  conceptoBase: string
) {
  return tarifaSeleccionada ===
    "normal"
    ? conceptoBase
    : conceptoTarifaAlternativa(
        tarifaSeleccionada,
        conceptoBase
      );
}

function claveEscuela(
  periodo: "mensual" | "trimestral",
  horas: number
) {
  return `escuela_${periodo}-${horas}`;
}

function conceptoEscuela(
  periodo: "mensual" | "trimestral"
) {
  return `escuela_${periodo}`;
}

function Icono({
  nombre,
  className = "h-5 w-5",
}: {
  nombre:
    | "tarifas"
    | "clase"
    | "bono"
    | "club"
    | "pista"
    | "imagen"
    | "guardar";
  className?: string;
}) {
  const comunes = {
    viewBox: "0 0 24 24",
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (nombre === "tarifas") {
    return (
      <svg {...comunes}>
        <rect
          x="4"
          y="4"
          width="16"
          height="16"
          rx="2"
        />
        <path d="M4 9h16M9 4v16M15 4v16M4 15h16" />
      </svg>
    );
  }

  if (nombre === "clase") {
    return (
      <svg {...comunes}>
        <circle
          cx="12"
          cy="12"
          r="8.25"
        />
        <path d="M6.2 8.2c2.2 1.1 4 2.9 5.1 5.1M12.7 10.7c1.1 1.1 2 2.4 2.6 3.9" />
      </svg>
    );
  }

  if (nombre === "bono") {
    return (
      <svg {...comunes}>
        <path d="M4 7.25h16v9.5H4z" />
        <path d="M8 7.25v9.5M16 7.25v9.5" />
        <path d="M4 10.25a2 2 0 0 1 0 4M20 10.25a2 2 0 0 0 0 4" />
      </svg>
    );
  }

  if (nombre === "club") {
    return (
      <svg {...comunes}>
        <path d="M4 8h16l-2-4H6L4 8Z" />
        <path d="M5 8v11h14V8M9 19v-6h6v6" />
      </svg>
    );
  }

  if (nombre === "pista") {
    return (
      <svg {...comunes}>
        <rect
          x="4"
          y="5"
          width="16"
          height="14"
          rx="2"
        />
        <path d="M12 5v14M4 12h16" />
      </svg>
    );
  }

  if (nombre === "imagen") {
    return (
      <svg {...comunes}>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <circle cx="9" cy="10" r="1.5" />
        <path d="m6.5 17 4.2-4 2.5 2.2 2.1-2 2.2 3.8" />
      </svg>
    );
  }

  return (
    <svg {...comunes}>
      <path d="M5 4h11l3 3v13H5z" />
      <path d="M8 4v6h8V4M8 16h8" />
    </svg>
  );
}

function CampoImporte({
  valor,
  onChange,
  secundario,
}: {
  valor: string;
  onChange: (valor: string) => void;
  secundario?: string;
}) {
  return (
    <div>
      <div className="relative">
        <input
          type="number"
          min="0"
          step="0.01"
          value={valor}
          onChange={(e) =>
            onChange(e.target.value)
          }
          placeholder="—"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-9 text-right text-sm font-bold text-[#17324D] outline-none transition placeholder:text-slate-300 focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
        />

        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
          €
        </span>
      </div>

      {secundario && (
        <p className="mt-1.5 text-center text-[10px] font-semibold text-slate-400">
          {secundario}
        </p>
      )}
    </div>
  );
}

export default function TarifasPage() {
  const [
    seccionActiva,
    setSeccionActiva,
  ] =
    useState<SeccionTarifas>(
      "comerciales"
    );

  const [
    ubicaciones,
    setUbicaciones,
  ] = useState<Ubicacion[]>([]);

  const [
    tarifas,
    setTarifas,
  ] = useState<Tarifa[]>([]);

  const [
    ubicacionId,
    setUbicacionId,
  ] = useState("");

  const [
    valoresComerciales,
    setValoresComerciales,
  ] = useState<
    Record<string, string>
  >({});

  const [
    tarifaComercialSeleccionada,
    setTarifaComercialSeleccionada,
  ] = useState("normal");

  const [
    creandoTarifa,
    setCreandoTarifa,
  ] = useState(false);

  const [
    nombreNuevaTarifa,
    setNombreNuevaTarifa,
  ] = useState("");

  const [
    valoresClub,
    setValoresClub,
  ] = useState<
    Record<string, string>
  >({});

  const [
    valoresEscuela,
    setValoresEscuela,
  ] = useState<
    Record<string, string>
  >({});

  const [
    guardandoComerciales,
    setGuardandoComerciales,
  ] = useState(false);

  const [
    guardandoClub,
    setGuardandoClub,
  ] = useState(false);

  const [
    guardandoEscuela,
    setGuardandoEscuela,
  ] = useState(false);

  const [
    generandoImagen,
    setGenerandoImagen,
  ] = useState(false);

  const [
    generandoImagenEscuela,
    setGenerandoImagenEscuela,
  ] = useState(false);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    cargarValoresComerciales();
  }, [
    tarifas,
    tarifaComercialSeleccionada,
  ]);

  useEffect(() => {
    cargarValoresClub();
  }, [
    tarifas,
    ubicacionId,
  ]);

  useEffect(() => {
    cargarValoresEscuela();
  }, [tarifas]);

  async function cargarDatos() {
    const {
      data:
        ubicacionesData,
      error:
        errorUbicaciones,
    } =
      await supabase
        .from("ubicaciones")
        .select(
          "id,nombre,tipo"
        )
        .eq("activa", true)
        .order("nombre");

    if (errorUbicaciones) {
      setMensaje(
        "❌ No se pudieron cargar las ubicaciones."
      );
      return;
    }

    const {
      data: tarifasData,
      error: errorTarifas,
    } =
      await supabase
        .from("tarifas")
        .select(
          "id,ubicacion_id,concepto,duracion_minutos,numero_alumnos,importe,activa"
        )
        .order(
          "duracion_minutos"
        )
        .order(
          "numero_alumnos"
        );

    if (errorTarifas) {
      setMensaje(
        "❌ No se pudieron cargar las tarifas."
      );
      return;
    }

    const clubs =
      (
        ubicacionesData ||
        []
      ).filter(
        (ubicacion) =>
          ubicacion.tipo ===
          "club"
      );

    setUbicaciones(clubs);

    setTarifas(
      (tarifasData ||
        []) as Tarifa[]
    );

    if (
      clubs.length > 0
    ) {
      setUbicacionId(
        (actual) =>
          actual ||
          clubs[0].id
      );
    }
  }

  function cargarValoresComerciales() {
    const nuevos:
      Record<string, string> =
      {};

    for (
      const configuracion of
      TARIFAS_COMERCIALES
    ) {
      for (
        const alumnos of ALUMNOS
      ) {
        const clave =
          claveTarifa(
            configuracion.concepto,
            60,
            alumnos
          );

        const conceptoReal =
          conceptoComercialReal(
            tarifaComercialSeleccionada,
            configuracion.concepto
          );

        const existente =
          tarifas.find(
            (tarifa) =>
              tarifa.ubicacion_id ===
                null &&
              tarifa.concepto ===
                conceptoReal &&
              tarifa.duracion_minutos ===
                60 &&
              tarifa.numero_alumnos ===
                alumnos &&
              tarifa.activa
          );

        if (existente) {
          nuevos[clave] =
            String(
              existente.importe
            );
        } else if (
          tarifaComercialSeleccionada ===
            "normal" &&
          VALORES_INICIALES[
            clave
          ] !== undefined
        ) {
          nuevos[clave] =
            String(
              VALORES_INICIALES[
                clave
              ]
            );
        }
      }
    }

    setValoresComerciales(
      nuevos
    );
  }

  function cargarValoresClub() {
    if (!ubicacionId) {
      setValoresClub({});
      return;
    }

    const nuevos:
      Record<string, string> =
      {};

    tarifas
      .filter(
        (tarifa) =>
          tarifa.ubicacion_id ===
            ubicacionId &&
          tarifa.activa
      )
      .forEach(
        (tarifa) => {
          nuevos[
            claveTarifa(
              tarifa.concepto,
              tarifa.duracion_minutos,
              tarifa.numero_alumnos
            )
          ] =
            String(
              tarifa.importe
            );
        }
      );

    setValoresClub(nuevos);
  }

  function cargarValoresEscuela() {
    const nuevos:
      Record<string, string> =
      {};

    for (const horas of HORAS_ESCUELA) {
      for (const periodo of PERIODOS_ESCUELA) {
        const concepto =
          conceptoEscuela(
            periodo.clave
          );
        const clave =
          claveEscuela(
            periodo.clave,
            horas
          );

        const existente =
          tarifas.find(
            (tarifa) =>
              tarifa.ubicacion_id ===
                null &&
              tarifa.concepto ===
                concepto &&
              tarifa.duracion_minutos ===
                horas &&
              tarifa.numero_alumnos ===
                0 &&
              tarifa.activa
          );

        if (existente) {
          nuevos[clave] =
            String(
              existente.importe
            );
        } else if (
          VALORES_INICIALES_ESCUELA[
            clave
          ] !== undefined
        ) {
          nuevos[clave] =
            String(
              VALORES_INICIALES_ESCUELA[
                clave
              ]
            );
        }
      }
    }

    setValoresEscuela(nuevos);
  }

  function cambiarComercial(
    concepto: string,
    alumnos: number,
    valor: string
  ) {
    setValoresComerciales(
      (actuales) => ({
        ...actuales,
        [claveTarifa(
          concepto,
          60,
          alumnos
        )]: valor,
      })
    );
  }

  function cambiarClub(
    concepto: string,
    duracion: number,
    alumnos: number,
    valor: string
  ) {
    setValoresClub(
      (actuales) => ({
        ...actuales,
        [claveTarifa(
          concepto,
          duracion,
          alumnos
        )]: valor,
      })
    );
  }

  function cambiarEscuela(
    periodo: "mensual" | "trimestral",
    horas: number,
    valor: string
  ) {
    setValoresEscuela(
      (actuales) => ({
        ...actuales,
        [claveEscuela(
          periodo,
          horas
        )]: valor,
      })
    );
  }

  async function guardarTarifasComerciales() {
    setGuardandoComerciales(
      true
    );
    setMensaje("");

    try {
      const existentes =
        tarifas.filter(
          (tarifa) =>
            tarifa.ubicacion_id ===
            null
        );

      for (
        const configuracion of
        TARIFAS_COMERCIALES
      ) {
        for (
          const alumnos of
          ALUMNOS
        ) {
          const clave =
            claveTarifa(
              configuracion.concepto,
              60,
              alumnos
            );

          const valor =
            (
              valoresComerciales[
                clave
              ] || ""
            ).trim();

          const conceptoReal =
            conceptoComercialReal(
              tarifaComercialSeleccionada,
              configuracion.concepto
            );

          const existente =
            existentes.find(
              (tarifa) =>
                tarifa.concepto ===
                  conceptoReal &&
                tarifa.duracion_minutos ===
                  60 &&
                tarifa.numero_alumnos ===
                  alumnos
            );

          if (valor === "") {
            if (existente) {
              const {
                error,
              } =
                await supabase
                  .from("tarifas")
                  .delete()
                  .eq(
                    "id",
                    existente.id
                  );

              if (error) {
                throw error;
              }
            }

            continue;
          }

          const importe =
            Number(valor);

          if (
            Number.isNaN(
              importe
            )
          ) {
            continue;
          }

          if (existente) {
            const {
              error,
            } =
              await supabase
                .from("tarifas")
                .update({
                  importe,
                  activa: true,
                })
                .eq(
                  "id",
                  existente.id
                );

            if (error) {
              throw error;
            }
          } else {
            const {
              error,
            } =
              await supabase
                .from("tarifas")
                .insert({
                  ubicacion_id:
                    null,
                  concepto:
                    conceptoReal,
                  duracion_minutos:
                    60,
                  numero_alumnos:
                    alumnos,
                  importe,
                  activa: true,
                });

            if (error) {
              throw error;
            }
          }
        }
      }

      setMensaje(
        tarifaComercialSeleccionada ===
          "normal"
          ? "✅ Tarifa Normal guardada correctamente"
          : `✅ Tarifa "${tarifaComercialSeleccionada}" guardada correctamente`
      );

      await cargarDatos();
    } catch (error) {
      const texto =
        error instanceof Error
          ? error.message
          : "Error desconocido";

      setMensaje(
        "❌ No se pudieron guardar las tarifas comerciales: " +
          texto
      );
    } finally {
      setGuardandoComerciales(
        false
      );
    }
  }

  async function generarImagenTarifasActuales() {
    setGenerandoImagen(true);
    setMensaje("");

    try {
      await generarImagenTarifas({
        valores:
          valoresComerciales,
        anio:
          new Date().getFullYear(),
        nombreTarifa:
          tarifaComercialSeleccionada ===
          "normal"
            ? "Normal"
            : tarifaComercialSeleccionada,
      });

      setMensaje(
        "✅ Imagen de tarifas generada correctamente"
      );
    } catch (error) {
      const texto =
        error instanceof Error
          ? error.message
          : "Error desconocido";

      setMensaje(
        "❌ No se pudo generar la imagen de tarifas: " +
          texto
      );
    } finally {
      setGenerandoImagen(false);
    }
  }


  async function generarImagenTarifaEscuela() {
    setGenerandoImagenEscuela(
      true
    );
    setMensaje("");

    try {
      await generarImagenTarifas({
        valores: valoresEscuela,
        anio: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        tipo: "escuela",
      });

      setMensaje(
        "✅ Imagen de Tarifa Escuela generada correctamente"
      );
    } catch (error) {
      const texto =
        error instanceof Error
          ? error.message
          : "Error desconocido";

      setMensaje(
        "❌ No se pudo generar la imagen de Tarifa Escuela: " +
          texto
      );
    } finally {
      setGenerandoImagenEscuela(
        false
      );
    }
  }

  async function guardarTarifasEscuela() {
    setGuardandoEscuela(true);
    setMensaje("");

    try {
      const existentes =
        tarifas.filter(
          (tarifa) =>
            tarifa.ubicacion_id ===
            null &&
            [
              "escuela_mensual",
              "escuela_trimestral",
            ].includes(
              tarifa.concepto
            )
        );

      for (const horas of HORAS_ESCUELA) {
        for (const periodo of PERIODOS_ESCUELA) {
          const clave =
            claveEscuela(
              periodo.clave,
              horas
            );
          const valor =
            (
              valoresEscuela[
                clave
              ] || ""
            ).trim();
          const concepto =
            conceptoEscuela(
              periodo.clave
            );

          const existente =
            existentes.find(
              (tarifa) =>
                tarifa.concepto ===
                  concepto &&
                tarifa.duracion_minutos ===
                  horas &&
                tarifa.numero_alumnos ===
                  0
            );

          if (valor === "") {
            if (existente) {
              const {
                error,
              } =
                await supabase
                  .from("tarifas")
                  .delete()
                  .eq(
                    "id",
                    existente.id
                  );

              if (error) {
                throw error;
              }
            }

            continue;
          }

          const importe =
            Number(valor);

          if (
            Number.isNaN(
              importe
            )
          ) {
            continue;
          }

          if (existente) {
            const {
              error,
            } =
              await supabase
                .from("tarifas")
                .update({
                  importe,
                  activa: true,
                })
                .eq(
                  "id",
                  existente.id
                );

            if (error) {
              throw error;
            }
          } else {
            const {
              error,
            } =
              await supabase
                .from("tarifas")
                .insert({
                  ubicacion_id: null,
                  concepto,
                  duracion_minutos:
                    horas,
                  numero_alumnos: 0,
                  importe,
                  activa: true,
                });

            if (error) {
              throw error;
            }
          }
        }
      }

      setMensaje(
        "✅ Tarifa Escuela guardada correctamente"
      );

      await cargarDatos();
    } catch (error) {
      const texto =
        error instanceof Error
          ? error.message
          : "Error desconocido";

      setMensaje(
        "❌ No se pudo guardar la Tarifa Escuela: " +
          texto
      );
    } finally {
      setGuardandoEscuela(false);
    }
  }

  async function crearTarifaPersonalizada() {
    const nombre =
      nombreNuevaTarifa.trim();

    if (!nombre) {
      setMensaje(
        "❌ Escribe un nombre para la nueva tarifa."
      );
      return;
    }

    if (
      nombre.toLowerCase() ===
      "normal"
    ) {
      setMensaje(
        '❌ "Normal" está reservado para la tarifa principal.'
      );
      return;
    }

    if (
      nombresTarifasPersonalizadas.some(
        (existente) =>
          existente.toLowerCase() ===
          nombre.toLowerCase()
      )
    ) {
      setMensaje(
        "❌ Ya existe una tarifa con ese nombre."
      );
      return;
    }

    setGuardandoComerciales(
      true
    );
    setMensaje("");

    try {
      const filas: {
        ubicacion_id: null;
        concepto: string;
        duracion_minutos: number;
        numero_alumnos: number;
        importe: number;
        activa: boolean;
      }[] = [];

      for (
        const configuracion of
        TARIFAS_COMERCIALES
      ) {
        for (
          const alumnos of
          ALUMNOS
        ) {
          const clave =
            claveTarifa(
              configuracion.concepto,
              60,
              alumnos
            );

          const valor =
            Number(
              valoresComerciales[
                clave
              ] || 0
            );

          filas.push({
            ubicacion_id: null,
            concepto:
              conceptoTarifaAlternativa(
                nombre,
                configuracion.concepto
              ),
            duracion_minutos:
              60,
            numero_alumnos:
              alumnos,
            importe:
              Number.isFinite(
                valor
              )
                ? valor
                : 0,
            activa: true,
          });
        }
      }

      const {
        error,
      } =
        await supabase
          .from("tarifas")
          .insert(filas);

      if (error) {
        throw error;
      }

      setTarifaComercialSeleccionada(
        nombre
      );
      setNombreNuevaTarifa("");
      setCreandoTarifa(false);

      await cargarDatos();

      setMensaje(
        `✅ Tarifa "${nombre}" creada. Puedes modificar sus precios sin alterar la tarifa Normal.`
      );
    } catch (error) {
      const texto =
        error instanceof Error
          ? error.message
          : "Error desconocido";

      setMensaje(
        "❌ No se pudo crear la tarifa: " +
          texto
      );
    } finally {
      setGuardandoComerciales(
        false
      );
    }
  }

  async function eliminarTarifaPersonalizada() {
    if (
      tarifaComercialSeleccionada ===
      "normal"
    ) {
      return;
    }

    const nombre =
      tarifaComercialSeleccionada;

    const confirmar =
      window.confirm(
        `¿Eliminar la tarifa "${nombre}"? La tarifa Normal no se verá afectada.`
      );

    if (!confirmar) {
      return;
    }

    const ids =
      tarifas
        .filter(
          (tarifa) =>
            tarifa.ubicacion_id ===
              null &&
            extraerNombreTarifaAlternativa(
              tarifa.concepto
            ) === nombre
        )
        .map(
          (tarifa) =>
            tarifa.id
        );

    if (ids.length === 0) {
      setTarifaComercialSeleccionada(
        "normal"
      );
      return;
    }

    setGuardandoComerciales(
      true
    );
    setMensaje("");

    try {
      const {
        error,
      } =
        await supabase
          .from("tarifas")
          .delete()
          .in("id", ids);

      if (error) {
        throw error;
      }

      setTarifaComercialSeleccionada(
        "normal"
      );

      await cargarDatos();

      setMensaje(
        `✅ Tarifa "${nombre}" eliminada.`
      );
    } catch (error) {
      const texto =
        error instanceof Error
          ? error.message
          : "Error desconocido";

      setMensaje(
        "❌ No se pudo eliminar la tarifa: " +
          texto
      );
    } finally {
      setGuardandoComerciales(
        false
      );
    }
  }

  async function guardarTarifasClub() {
    if (!ubicacionId) {
      setMensaje(
        "❌ Selecciona un club."
      );
      return;
    }

    setGuardandoClub(true);
    setMensaje("");

    try {
      const existentes =
        tarifas.filter(
          (tarifa) =>
            tarifa.ubicacion_id ===
            ubicacionId
        );

      for (
        const concepto of [
          "club_paga",
          "coste_pista",
        ]
      ) {
        for (
          const duracion of
          DURACIONES_CLUB
        ) {
          for (
            const alumnos of
            ALUMNOS
          ) {
            const clave =
              claveTarifa(
                concepto,
                duracion,
                alumnos
              );

            const valor =
              (
                valoresClub[
                  clave
                ] || ""
              ).trim();

            const existente =
              existentes.find(
                (tarifa) =>
                  tarifa.concepto ===
                    concepto &&
                  tarifa.duracion_minutos ===
                    duracion &&
                  tarifa.numero_alumnos ===
                    alumnos
              );

            if (valor === "") {
              if (existente) {
                const {
                  error,
                } =
                  await supabase
                    .from("tarifas")
                    .delete()
                    .eq(
                      "id",
                      existente.id
                    );

                if (error) {
                  throw error;
                }
              }

              continue;
            }

            const importe =
              Number(valor);

            if (
              Number.isNaN(
                importe
              )
            ) {
              continue;
            }

            if (existente) {
              const {
                error,
              } =
                await supabase
                  .from("tarifas")
                  .update({
                    importe,
                    activa: true,
                  })
                  .eq(
                    "id",
                    existente.id
                  );

              if (error) {
                throw error;
              }
            } else {
              const {
                error,
              } =
                await supabase
                  .from("tarifas")
                  .insert({
                    ubicacion_id:
                      ubicacionId,
                    concepto,
                    duracion_minutos:
                      duracion,
                    numero_alumnos:
                      alumnos,
                    importe,
                    activa:
                      true,
                  });

              if (error) {
                throw error;
              }
            }
          }
        }
      }

      setMensaje(
        "✅ Tarifas del club guardadas correctamente"
      );

      await cargarDatos();
    } catch (error) {
      const texto =
        error instanceof Error
          ? error.message
          : "Error desconocido";

      setMensaje(
        "❌ No se pudieron guardar las tarifas del club: " +
          texto
      );
    } finally {
      setGuardandoClub(false);
    }
  }

  const clubSeleccionado =
    useMemo(
      () =>
        ubicaciones.find(
          (ubicacion) =>
            ubicacion.id ===
            ubicacionId
        ) || null,
      [
        ubicaciones,
        ubicacionId,
      ]
    );

  const nombresTarifasPersonalizadas =
    useMemo(
      () =>
        Array.from(
          new Set(
            tarifas
              .filter(
                (tarifa) =>
                  tarifa.ubicacion_id ===
                  null
              )
              .map(
                (tarifa) =>
                  extraerNombreTarifaAlternativa(
                    tarifa.concepto
                  )
              )
              .filter(
                (
                  nombre
                ): nombre is string =>
                  Boolean(nombre)
              )
          )
        ).sort(
          (a, b) =>
            a.localeCompare(
              b,
              "es"
            )
        ),
      [tarifas]
    );

  const totalTarifasComerciales =
    TARIFAS_COMERCIALES.length *
    ALUMNOS.length;

  const totalTarifasEscuela =
    HORAS_ESCUELA.length *
    PERIODOS_ESCUELA.length;

  const comercialesConfiguradas =
    TARIFAS_COMERCIALES.reduce(
      (total, configuracion) =>
        total +
        ALUMNOS.filter(
          (alumnos) =>
            Boolean(
              valoresComerciales[
                claveTarifa(
                  configuracion.concepto,
                  60,
                  alumnos
                )
              ]
            )
        ).length,
      0
    );

  const escuelaConfiguradas =
    HORAS_ESCUELA.reduce(
      (total, horas) =>
        total +
        PERIODOS_ESCUELA.filter(
          (periodo) =>
            Boolean(
              valoresEscuela[
                claveEscuela(
                  periodo.clave,
                  horas
                )
              ]
            )
        ).length,
      0
    );

  function TablaClub({
    concepto,
    titulo,
    descripcion,
    icono,
    tono,
  }: {
    concepto:
      | "club_paga"
      | "coste_pista";
    titulo: string;
    descripcion: string;
    icono: "club" | "pista";
    tono:
      | "emerald"
      | "red";
  }) {
    return (
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-[#FBFCFD] px-4 py-4 sm:px-5">
          <span
            className={
              tono ===
              "emerald"
                ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"
                : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"
            }
          >
            <Icono
              nombre={icono}
            />
          </span>

          <div>
            <h2 className="text-base font-bold text-[#17324D]">
              {titulo}
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              {descripcion}
            </p>
          </div>
        </div>

        {/* MÓVIL · FICHAS */}
        <div className="space-y-3 p-3 md:hidden">
          {DURACIONES_CLUB.map(
            (duracion) => (
              <article
                key={duracion}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <div className="flex items-center justify-between gap-3 bg-[#FBFCFD] px-3.5 py-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Duración
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-[#17324D]">
                      {duracion} min
                    </p>
                  </div>

                  <span
                    className={
                      tono === "emerald"
                        ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700"
                        : "rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700"
                    }
                  >
                    {concepto === "club_paga"
                      ? "Ingreso"
                      : "Coste"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 border-t border-slate-100 p-3">
                  {ALUMNOS.map(
                    (numero) => {
                      const clave =
                        claveTarifa(
                          concepto,
                          duracion,
                          numero
                        );

                      return (
                        <div
                          key={clave}
                          className="rounded-xl border border-slate-200 bg-[#FBFCFD] p-2.5"
                        >
                          <p className="mb-1.5 text-center text-[9px] font-bold uppercase tracking-[0.06em] text-slate-400">
                            {numero}{" "}
                            {numero === 1
                              ? "alumno"
                              : "alumnos"}
                          </p>

                          <CampoImporte
                            valor={
                              valoresClub[
                                clave
                              ] || ""
                            }
                            onChange={(
                              valor
                            ) =>
                              cambiarClub(
                                concepto,
                                duracion,
                                numero,
                                valor
                              )
                            }
                          />
                        </div>
                      );
                    }
                  )}
                </div>
              </article>
            )
          )}
        </div>

        {/* TABLET / PC · TABLA APROBADA */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] border-collapse">
            <thead className="bg-[#0F2742] text-white">
              <tr>
                <th className="border-r border-white/10 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-white/55">
                  Duración
                </th>

                {ALUMNOS.map(
                  (numero) => (
                    <th
                      key={numero}
                      className="border-r border-white/10 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-white/55 last:border-r-0"
                    >
                      {numero}{" "}
                      {numero ===
                      1
                        ? "alumno"
                        : "alumnos"}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {DURACIONES_CLUB.map(
                (duracion) => (
                  <tr
                    key={duracion}
                    className="border-t border-slate-100"
                  >
                    <td className="border-r border-slate-100 bg-slate-50/60 px-4 py-4">
                      <p className="font-bold text-[#17324D]">
                        {duracion} min
                      </p>
                    </td>

                    {ALUMNOS.map(
                      (numero) => {
                        const clave =
                          claveTarifa(
                            concepto,
                            duracion,
                            numero
                          );

                        return (
                          <td
                            key={clave}
                            className="border-r border-slate-100 p-3 last:border-r-0"
                          >
                            <CampoImporte
                              valor={
                                valoresClub[
                                  clave
                                ] ||
                                ""
                              }
                              onChange={(
                                valor
                              ) =>
                                cambiarClub(
                                  concepto,
                                  duracion,
                                  numero,
                                  valor
                                )
                              }
                            />
                          </td>
                        );
                      }
                    )}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F8FA] px-3 py-3.5 sm:px-7 sm:py-7 lg:px-9">
      <div className="mx-auto w-full max-w-[1540px]">
        {/* CABECERA CORPORATIVA */}
        <section className="overflow-hidden rounded-2xl bg-[#0F2742] p-4 text-white shadow-[0_14px_34px_rgba(15,39,66,0.16)] sm:p-5 lg:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#4DD4CA]">
                Configuración
              </p>

              <h1 className="mt-1 text-[28px] font-bold tracking-tight text-white sm:text-4xl">
                Tarifas
              </h1>

              <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-white/60 sm:mt-2 sm:text-sm">
                Configura precios de clases, bonos y relaciones económicas con los clubs.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[620px]">
              <div className="rounded-xl border border-[#4DD4CA]/20 bg-[#00A79C]/15 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#85E6DF]">
                  Clase suelta
                </p>
                <p className="mt-1 text-xl font-bold text-white">
                  1 h
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/45">
                  Bono corto
                </p>
                <p className="mt-1 text-xl font-bold text-white">
                  5
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/45">
                  Bono largo
                </p>
                <p className="mt-1 text-xl font-bold text-white">
                  10
                </p>
              </div>

              <div className="rounded-xl border border-emerald-300/15 bg-emerald-400/10 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-emerald-200/80">
                  Configuradas
                </p>
                <p className="mt-1 text-xl font-bold text-white">
                  {
                    comercialesConfiguradas
                  }
                  /
                  {
                    totalTarifasComerciales
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-white/10 pt-4">
            <div className="grid w-full grid-cols-3 rounded-xl border border-white/10 bg-white/10 p-1 sm:inline-flex sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setSeccionActiva(
                    "comerciales"
                  );
                  setMensaje("");
                }}
                className={
                  seccionActiva ===
                  "comerciales"
                    ? "h-9 rounded-lg bg-[#00A79C] px-4 text-[11px] font-bold text-white shadow-sm"
                    : "h-9 rounded-lg px-4 text-[11px] font-bold text-white/60 transition hover:bg-white/10 hover:text-white"
                }
              >
                Clases y bonos
              </button>

              <button
                type="button"
                onClick={() => {
                  setSeccionActiva(
                    "escuela"
                  );
                  setMensaje("");
                }}
                className={
                  seccionActiva ===
                  "escuela"
                    ? "h-9 rounded-lg bg-[#00A79C] px-4 text-[11px] font-bold text-white shadow-sm"
                    : "h-9 rounded-lg px-4 text-[11px] font-bold text-white/60 transition hover:bg-white/10 hover:text-white"
                }
              >
                Escuela
              </button>

              <button
                type="button"
                onClick={() => {
                  setSeccionActiva(
                    "clubs"
                  );
                  setMensaje("");
                }}
                className={
                  seccionActiva ===
                  "clubs"
                    ? "h-9 rounded-lg bg-[#00A79C] px-4 text-[11px] font-bold text-white shadow-sm"
                    : "h-9 rounded-lg px-4 text-[11px] font-bold text-white/60 transition hover:bg-white/10 hover:text-white"
                }
              >
                Clubs y pistas
              </button>
            </div>
          </div>
        </section>

        {mensaje && (
          <section
            className={
              mensaje.startsWith(
                "✅"
              )
                ? "mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
                : "mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
            }
          >
            {mensaje}
          </section>
        )}

        {seccionActiva ===
        "comerciales" ? (
          <>
            <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:mt-5">
              <div className="flex flex-col gap-3 bg-[#0F2742] px-4 py-4 text-white sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#4DD4CA]">
                    <Icono nombre="tarifas" />
                  </span>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#4DD4CA]">
                      Tarifas comerciales
                    </p>

                    <h2 className="mt-0.5 text-lg font-bold">
                      Precios para alumnos
                    </h2>

                    <p className="mt-0.5 text-[11px] text-white/55">
                      Precio total según modalidad y número de participantes.
                    </p>
                  </div>
                </div>

                <div className="grid w-full gap-2 sm:flex sm:w-auto sm:items-center">
                  <button
                    type="button"
                    disabled={
                      generandoImagen
                    }
                    onClick={
                      generarImagenTarifasActuales
                    }
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-bold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    <Icono
                      nombre="imagen"
                      className="h-4 w-4"
                    />
                    {generandoImagen
                      ? "Generando..."
                      : "Generar imagen"}
                  </button>

                  <button
                    type="button"
                    disabled={
                      guardandoComerciales
                    }
                    onClick={
                      guardarTarifasComerciales
                    }
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#00A79C] px-4 text-xs font-bold text-white transition hover:bg-[#008F86] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    <Icono
                      nombre="guardar"
                      className="h-4 w-4"
                    />
                    {guardandoComerciales
                      ? "Guardando..."
                      : tarifaComercialSeleccionada ===
                        "normal"
                      ? "Guardar tarifa Normal"
                      : "Guardar esta tarifa"}
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <div className="rounded-2xl border border-slate-200 bg-[#FBFCFD] p-3 sm:p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                        Tarifa seleccionada
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#17324D]">
                        {tarifaComercialSeleccionada ===
                        "normal"
                          ? "Normal"
                          : tarifaComercialSeleccionada}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTarifaComercialSeleccionada(
                            "normal"
                          );
                          setCreandoTarifa(
                            false
                          );
                          setMensaje("");
                        }}
                        className={
                          tarifaComercialSeleccionada ===
                          "normal"
                            ? "inline-flex h-9 items-center gap-2 rounded-xl bg-[#17324D] px-3.5 text-[11px] font-bold text-white shadow-sm"
                            : "inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-[11px] font-bold text-[#17324D] transition hover:border-[#00A79C]/30 hover:bg-[#E8F7F5]"
                        }
                      >
                        Normal
                        <span
                          className={
                            tarifaComercialSeleccionada ===
                            "normal"
                              ? "rounded-full bg-[#00A79C] px-1.5 py-0.5 text-[8px] uppercase tracking-wide text-white"
                              : "rounded-full bg-[#E8F7F5] px-1.5 py-0.5 text-[8px] uppercase tracking-wide text-[#008F86]"
                          }
                        >
                          Principal
                        </span>
                      </button>

                      {nombresTarifasPersonalizadas.map(
                        (nombre) => (
                          <button
                            key={nombre}
                            type="button"
                            onClick={() => {
                              setTarifaComercialSeleccionada(
                                nombre
                              );
                              setCreandoTarifa(
                                false
                              );
                              setMensaje("");
                            }}
                            className={
                              tarifaComercialSeleccionada ===
                              nombre
                                ? "h-9 rounded-xl bg-[#17324D] px-3.5 text-[11px] font-bold text-white shadow-sm"
                                : "h-9 rounded-xl border border-slate-200 bg-white px-3.5 text-[11px] font-bold text-[#17324D] transition hover:border-[#00A79C]/30 hover:bg-[#E8F7F5]"
                            }
                          >
                            {nombre}
                          </button>
                        )
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setCreandoTarifa(
                            (actual) =>
                              !actual
                          )
                        }
                        className="h-9 rounded-xl border border-dashed border-[#00A79C]/40 bg-[#E8F7F5] px-3.5 text-[11px] font-bold text-[#008F86] transition hover:bg-[#DDF4F1]"
                      >
                        + Nueva tarifa
                      </button>

                      {tarifaComercialSeleccionada !==
                        "normal" && (
                        <button
                          type="button"
                          disabled={
                            guardandoComerciales
                          }
                          onClick={
                            eliminarTarifaPersonalizada
                          }
                          className="h-9 rounded-xl border border-red-200 bg-red-50 px-3.5 text-[11px] font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>

                  {creandoTarifa && (
                    <div className="mt-3 grid gap-2 border-t border-slate-200 pt-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                      <input
                        type="text"
                        value={
                          nombreNuevaTarifa
                        }
                        onChange={(e) =>
                          setNombreNuevaTarifa(
                            e.target.value
                          )
                        }
                        maxLength={40}
                        placeholder="Ej. Verano, Promoción, Alumnos antiguos..."
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-[#17324D] outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
                      />

                      <button
                        type="button"
                        disabled={
                          guardandoComerciales
                        }
                        onClick={
                          crearTarifaPersonalizada
                        }
                        className="h-11 w-full rounded-xl bg-[#00A79C] px-4 text-xs font-bold text-white transition hover:bg-[#008F86] disabled:opacity-50 sm:w-auto"
                      >
                        Crear tarifa
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCreandoTarifa(
                            false
                          );
                          setNombreNuevaTarifa(
                            ""
                          );
                        }}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-500 transition hover:bg-slate-50 sm:w-auto"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>

                <div
                  className={
                    tarifaComercialSeleccionada ===
                    "normal"
                      ? "mt-3 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3"
                      : "mt-3 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3"
                  }
                >
                  <p
                    className={
                      tarifaComercialSeleccionada ===
                      "normal"
                        ? "text-xs font-semibold leading-relaxed text-sky-800"
                        : "text-xs font-semibold leading-relaxed text-violet-800"
                    }
                  >
                    {tarifaComercialSeleccionada ===
                    "normal"
                      ? "La tarifa Normal es la tarifa principal. Sus importes de Bono 5 y Bono 10 son los que utiliza automáticamente la sección Bonos."
                      : `La tarifa "${tarifaComercialSeleccionada}" es alternativa. Puedes cambiar sus precios y generar su propia imagen sin modificar la tarifa Normal ni los importes automáticos.`}
                  </p>
                </div>

                {/* MÓVIL · UNA FICHA POR MODALIDAD */}
                <div className="mt-4 space-y-3 md:hidden">
                  {TARIFAS_COMERCIALES.map(
                    (
                      configuracion
                    ) => (
                      <article
                        key={
                          configuracion.concepto
                        }
                        className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                      >
                        <div className="flex items-center gap-3 bg-[#FBFCFD] px-3.5 py-3">
                          <span
                            className={
                              configuracion.concepto ===
                              "clase_suelta"
                                ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F7F5] text-[#008F86]"
                                : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600"
                            }
                          >
                            <Icono
                              nombre={
                                configuracion.concepto ===
                                "clase_suelta"
                                  ? "clase"
                                  : "bono"
                              }
                            />
                          </span>

                          <div>
                            <p className="text-sm font-bold text-[#17324D]">
                              {
                                configuracion.titulo
                              }
                            </p>
                            <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                              {
                                configuracion.subtitulo
                              }
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 border-t border-slate-100 p-3">
                          {ALUMNOS.map(
                            (numero) => {
                              const clave =
                                claveTarifa(
                                  configuracion.concepto,
                                  60,
                                  numero
                                );

                              const valor =
                                valoresComerciales[
                                  clave
                                ] || "";

                              const valorNumerico =
                                Number(
                                  valor
                                );

                              const precioClase =
                                valor &&
                                !Number.isNaN(
                                  valorNumerico
                                )
                                  ? valorNumerico /
                                    configuracion.clases
                                  : null;

                              return (
                                <div
                                  key={
                                    clave
                                  }
                                  className="rounded-xl border border-slate-200 bg-[#FBFCFD] p-2.5"
                                >
                                  <p className="mb-1.5 text-center text-[9px] font-bold uppercase tracking-[0.06em] text-slate-400">
                                    {numero}{" "}
                                    {numero ===
                                    1
                                      ? "alumno"
                                      : "alumnos"}
                                  </p>

                                  <CampoImporte
                                    valor={
                                      valor
                                    }
                                    onChange={(
                                      nuevoValor
                                    ) =>
                                      cambiarComercial(
                                        configuracion.concepto,
                                        numero,
                                        nuevoValor
                                      )
                                    }
                                    secundario={
                                      configuracion.clases >
                                      1
                                        ? precioClase !==
                                          null
                                          ? `${precioClase.toFixed(
                                              2
                                            )} € / clase`
                                          : ""
                                        : "Precio total"
                                    }
                                  />
                                </div>
                              );
                            }
                          )}
                        </div>
                      </article>
                    )
                  )}
                </div>

                {/* TABLET / PC · TABLA APROBADA */}
                <div className="mt-4 hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[820px] border-collapse">
                    <thead className="bg-[#0F2742] text-white">
                      <tr>
                        <th className="border-r border-white/10 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-white/55">
                          Modalidad
                        </th>

                        {ALUMNOS.map(
                          (numero) => (
                            <th
                              key={
                                numero
                              }
                              className="border-r border-white/10 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-white/55 last:border-r-0"
                            >
                              {numero}{" "}
                              {numero ===
                              1
                                ? "alumno"
                                : "alumnos"}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {TARIFAS_COMERCIALES.map(
                        (
                          configuracion
                        ) => (
                          <tr
                            key={
                              configuracion.concepto
                            }
                            className="border-t border-slate-100"
                          >
                            <td className="border-r border-slate-100 bg-[#FBFCFD] px-4 py-4">
                              <div className="flex items-center gap-3">
                                <span
                                  className={
                                    configuracion.concepto ===
                                    "clase_suelta"
                                      ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F7F5] text-[#008F86]"
                                      : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600"
                                  }
                                >
                                  <Icono
                                    nombre={
                                      configuracion.concepto ===
                                      "clase_suelta"
                                        ? "clase"
                                        : "bono"
                                    }
                                  />
                                </span>

                                <div>
                                  <p className="font-bold text-[#17324D]">
                                    {
                                      configuracion.titulo
                                    }
                                  </p>

                                  <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                    {
                                      configuracion.subtitulo
                                    }
                                  </p>
                                </div>
                              </div>
                            </td>

                            {ALUMNOS.map(
                              (numero) => {
                                const clave =
                                  claveTarifa(
                                    configuracion.concepto,
                                    60,
                                    numero
                                  );

                                const valor =
                                  valoresComerciales[
                                    clave
                                  ] ||
                                  "";

                                const valorNumerico =
                                  Number(
                                    valor
                                  );

                                const precioClase =
                                  valor &&
                                  !Number.isNaN(
                                    valorNumerico
                                  )
                                    ? valorNumerico /
                                      configuracion.clases
                                    : null;

                                return (
                                  <td
                                    key={
                                      clave
                                    }
                                    className="border-r border-slate-100 p-3 last:border-r-0"
                                  >
                                    <CampoImporte
                                      valor={
                                        valor
                                      }
                                      onChange={(
                                        nuevoValor
                                      ) =>
                                        cambiarComercial(
                                          configuracion.concepto,
                                          numero,
                                          nuevoValor
                                        )
                                      }
                                      secundario={
                                        configuracion.clases >
                                        1
                                          ? precioClase !==
                                            null
                                            ? `${precioClase.toFixed(
                                                2
                                              )} € / clase`
                                            : ""
                                          : "Precio total"
                                      }
                                    />
                                  </td>
                                );
                              }
                            )}
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        ) : seccionActiva ===
        "escuela" ? (
          <>
            <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:mt-5">
              <div className="flex flex-col gap-3 bg-[#0F2742] px-4 py-4 text-white sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#4DD4CA]">
                    <Icono nombre="tarifas" />
                  </span>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#4DD4CA]">
                      Tarifa Escuela
                    </p>

                    <h2 className="mt-0.5 text-lg font-bold">
                      Escuela · grupos de 3 a 4 alumnos
                    </h2>

                    <p className="mt-0.5 text-[11px] text-white/55">
                      Configura precios para 1, 2 o 3 horas semanales con pago mensual o trimestral.
                    </p>
                  </div>
                </div>

                <div className="grid w-full gap-2 sm:flex sm:w-auto sm:items-center">
                  <button
                    type="button"
                    disabled={
                      generandoImagenEscuela
                    }
                    onClick={
                      generarImagenTarifaEscuela
                    }
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-bold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    <Icono
                      nombre="imagen"
                      className="h-4 w-4"
                    />
                    {generandoImagenEscuela
                      ? "Generando..."
                      : "Generar imagen"}
                  </button>

                  <button
                    type="button"
                    disabled={
                      guardandoEscuela
                    }
                    onClick={
                      guardarTarifasEscuela
                    }
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#00A79C] px-4 text-xs font-bold text-white transition hover:bg-[#008F86] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    <Icono
                      nombre="guardar"
                      className="h-4 w-4"
                    />
                    {guardandoEscuela
                      ? "Guardando..."
                      : "Guardar tarifa Escuela"}
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <div className="rounded-2xl border border-slate-200 bg-[#FBFCFD] p-4 sm:p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                        Configuración actual
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#17324D]">
                        Curso {new Date().getFullYear()}-{new Date().getFullYear() + 1}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Tarifa pensada para grupos de escuela de 3-4 alumnos.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">
                        Mínimo 3 alumnos
                      </span>
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-bold text-sky-700">
                        Máximo 4 alumnos
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold text-[#17324D]">
                        {escuelaConfiguradas}/{totalTarifasEscuela} importes
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:hidden">
                    {HORAS_ESCUELA.map(
                      (horas) => (
                        <article
                          key={horas}
                          className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                        >
                          <div className="flex items-center justify-between gap-3 bg-[#FBFCFD] px-3.5 py-3">
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                                Horas semanales
                              </p>
                              <p className="mt-0.5 text-sm font-bold text-[#17324D]">
                                {horas} {horas === 1 ? "hora" : "horas"} / semana
                              </p>
                            </div>

                            <span className="rounded-full border border-[#00A79C]/20 bg-[#E8F7F5] px-2.5 py-1 text-[10px] font-bold text-[#008F86]">
                              Escuela
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2.5 border-t border-slate-100 p-3">
                            {PERIODOS_ESCUELA.map(
                              (periodo) => {
                                const clave =
                                  claveEscuela(
                                    periodo.clave,
                                    horas
                                  );

                                return (
                                  <div
                                    key={clave}
                                    className="rounded-xl border border-slate-200 bg-[#FBFCFD] p-2.5"
                                  >
                                    <p className="mb-1.5 text-center text-[9px] font-bold uppercase tracking-[0.06em] text-slate-400">
                                      {periodo.titulo}
                                    </p>

                                    <CampoImporte
                                      valor={
                                        valoresEscuela[
                                          clave
                                        ] || ""
                                      }
                                      onChange={(
                                        valor
                                      ) =>
                                        cambiarEscuela(
                                          periodo.clave,
                                          horas,
                                          valor
                                        )
                                      }
                                      secundario={
                                        periodo.clave ===
                                        "mensual"
                                          ? "Pago mensual"
                                          : "Pago trimestral"
                                      }
                                    />
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </article>
                      )
                    )}
                  </div>

                  <div className="mt-4 hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[760px] border-collapse">
                      <thead className="bg-[#0F2742] text-white">
                        <tr>
                          <th className="border-r border-white/10 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-white/55">
                            Horas semanales
                          </th>

                          {PERIODOS_ESCUELA.map(
                            (periodo) => (
                              <th
                                key={periodo.clave}
                                className="border-r border-white/10 px-4 py-3 text-center last:border-r-0"
                              >
                                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/55">
                                  {periodo.titulo}
                                </p>
                                <p className="mt-0.5 text-[10px] font-semibold text-[#4DD4CA]">
                                  {periodo.subtitulo}
                                </p>
                              </th>
                            )
                          )}
                        </tr>
                      </thead>

                      <tbody>
                        {HORAS_ESCUELA.map(
                          (horas) => (
                            <tr
                              key={horas}
                              className="border-t border-slate-100"
                            >
                              <td className="border-r border-slate-100 bg-[#FBFCFD] px-4 py-4">
                                <p className="font-bold text-[#17324D]">
                                  {horas} {horas === 1 ? "hora" : "horas"}
                                </p>
                                <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                  por semana
                                </p>
                              </td>

                              {PERIODOS_ESCUELA.map(
                                (periodo) => {
                                  const clave =
                                    claveEscuela(
                                      periodo.clave,
                                      horas
                                    );

                                  return (
                                    <td
                                      key={clave}
                                      className="border-r border-slate-100 p-3 last:border-r-0"
                                    >
                                      <CampoImporte
                                        valor={
                                          valoresEscuela[
                                            clave
                                          ] || ""
                                        }
                                        onChange={(
                                          valor
                                        ) =>
                                          cambiarEscuela(
                                            periodo.clave,
                                            horas,
                                            valor
                                          )
                                        }
                                        secundario={
                                          periodo.clave ===
                                          "mensual"
                                            ? "Pago mensual"
                                            : "Pago trimestral"
                                        }
                                      />
                                    </td>
                                  );
                                }
                              )}
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            {ubicaciones.length ===
            0 ? (
              <section className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm sm:mt-5">
                <p className="font-bold text-[#17324D]">
                  No hay ubicaciones configuradas como Club.
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Crea o edita una ubicación y selecciona el tipo Club / centro deportivo.
                </p>
              </section>
            ) : (
              <>
                <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:mt-5">
                  <div className="bg-[#0F2742] px-4 py-4 text-white sm:px-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#4DD4CA]">
                          <Icono nombre="club" />
                        </span>

                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#4DD4CA]">
                            Club seleccionado
                          </p>

                          <h2 className="mt-0.5 text-lg font-bold">
                            Tarifas de club y pista
                          </h2>

                          <p className="mt-0.5 text-[11px] text-white/55">
                            Configura ingreso del club y coste de pista por duración y alumnos.
                          </p>
                        </div>
                      </div>

                      <div className="grid w-full gap-2 sm:grid-cols-[minmax(240px,1fr)_auto] lg:w-auto lg:min-w-[520px]">
                        <label className="block">
                          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-white/45">
                            Club / centro
                          </span>

                          <select
                            value={
                              ubicacionId
                            }
                            onChange={(
                              e
                            ) => {
                              setUbicacionId(
                                e.target
                                  .value
                              );
                              setMensaje(
                                ""
                              );
                            }}
                            className="h-10 w-full rounded-xl border border-white/15 bg-[#243E58] px-3 text-xs font-bold text-white outline-none transition hover:bg-[#2A4763] focus:border-[#4DD4CA]/45"
                          >
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
                        </label>

                        <button
                          type="button"
                          disabled={
                            guardandoClub
                          }
                          onClick={
                            guardarTarifasClub
                          }
                          className="inline-flex h-10 w-full self-end items-center justify-center gap-2 rounded-xl bg-[#00A79C] px-4 text-xs font-bold text-white transition hover:bg-[#008F86] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                          <Icono
                            nombre="guardar"
                            className="h-4 w-4"
                          />
                          {guardandoClub
                            ? "Guardando..."
                            : "Guardar"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {clubSeleccionado && (
                    <div className="border-t border-slate-100 bg-[#FBFCFD] px-4 py-3 sm:px-5">
                      <p className="text-xs text-slate-500">
                        Editando tarifas de{" "}
                        <strong className="text-[#17324D]">
                          {
                            clubSeleccionado.nombre
                          }
                        </strong>
                      </p>
                    </div>
                  )}
                </section>

                <div className="mt-4 space-y-4">
                  {TablaClub({
                    concepto:
                      "club_paga",
                    titulo:
                      "Lo que me paga el club",
                    descripcion:
                      "Importe que recibes del club por cada clase.",
                    icono: "club",
                    tono: "emerald",
                  })}

                  {TablaClub({
                    concepto:
                      "coste_pista",
                    titulo:
                      "Lo que pago por la pista",
                    descripcion:
                      "Coste que asumes por utilizar la pista.",
                    icono: "pista",
                    tono: "red",
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
