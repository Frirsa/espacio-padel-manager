"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  borrarClaseDeGoogleCalendar,
  sincronizarClaseConGoogleCalendar,
} from "../../lib/googleCalendarClient";

export type ClaseAccionesRapidas = {
  id: string;
  google_calendar_event_id: string | null;
  google_calendar_synced_at: string | null;
  fecha: string;
  hora_inicio: string;
  duracion_minutos: number;
  tipo: string;
  estado: string;
  facturable: boolean;
  cobrada: boolean;
  observaciones: string | null;
  modo_cobro?: "por_alumno" | "total" | string | null;
  importe_total?: number | null;
  ubicaciones: { nombre: string } | null;
  clase_alumnos: {
    id: string;
    alumno_id: string;
    importe: number;
    pagado: boolean;
    usa_bono: boolean;
    bono_id: string | null;
    asistio: boolean;
    alumnos: {
      id: string;
      nombre: string;
      apellidos: string | null;
      apodo: string | null;
    } | null;
  }[];
};

type Props = {
  clase: ClaseAccionesRapidas;
  volverA: string;
  onCerrar: () => void;
  onClaseActualizada: () => Promise<void>;
};

function calcularHoraFin(
  horaInicio: string,
  duracionMinutos: number
) {
  const [hora, minuto] =
    horaInicio
      .slice(0, 5)
      .split(":")
      .map(Number);

  const fecha = new Date();

  fecha.setHours(
    hora,
    minuto,
    0,
    0
  );

  fecha.setMinutes(
    fecha.getMinutes() +
      duracionMinutos
  );

  return `${String(
    fecha.getHours()
  ).padStart(2, "0")}:${String(
    fecha.getMinutes()
  ).padStart(2, "0")}`;
}

function datosGoogleClase(
  clase: ClaseAccionesRapidas,
  cambios?: Partial<
    Pick<
      ClaseAccionesRapidas,
      "fecha" | "hora_inicio" | "estado" | "observaciones"
    >
  >
) {
  return {
    id: clase.id,
    google_calendar_event_id:
      clase.google_calendar_event_id,
    fecha:
      cambios?.fecha ||
      clase.fecha,
    hora_inicio:
      cambios?.hora_inicio ||
      clase.hora_inicio,
    duracion_minutos:
      clase.duracion_minutos,
    tipo: clase.tipo,
    estado:
      cambios?.estado ||
      clase.estado,
    observaciones:
      cambios?.observaciones !==
      undefined
        ? cambios.observaciones
        : clase.observaciones,
    ubicacion:
      clase.ubicaciones
        ?.nombre || null,
    alumnos:
      clase.clase_alumnos
        .map(
          (
            participante
          ) => {
            const alumno =
              participante.alumnos;

            if (!alumno) {
              return "";
            }

            return `${alumno.nombre} ${
              alumno.apellidos ||
              ""
            }`.trim();
          }
        )
        .filter(Boolean),
  };
}

function IconoCerrar() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function IconoBono() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V7Z" />
      <path
        d="M12 7v10"
        strokeDasharray="2 2"
      />
    </svg>
  );
}

function IconoEditar() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M4 20h4l11-11a2.1 2.1 0 0 0-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  );
}

function IconoPapelera() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

function IconoAlumno() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  );
}

function IconoCheckCircle() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.2 2.2L15.8 9" />
    </svg>
  );
}

function IconoCancelarCircle() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
  );
}

function IconoConfiguracion() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6Z" />
    </svg>
  );
}

function IconoEfectivo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M7 9h.01M17 15h.01" />
    </svg>
  );
}

function IconoBizumPago() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M9 4 6 10l4 2-3 8 8-10-4-2 2-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconoTransferencia() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 20h16" />
      <path d="M6 20V10l6-4 6 4v10" />
      <path d="M9 13h6M9 16h6" />
    </svg>
  );
}

function IconoTarjeta() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18M7 15h4" />
    </svg>
  );
}

export default function AccionesRapidasClase({
  clase,
  volverA,
  onCerrar,
  onClaseActualizada,
}: Props) {
  const [
    claseSeleccionada,
    setClaseSeleccionada,
  ] =
    useState<ClaseAccionesRapidas>(
      clase
    );

  const [
    actualizando,
    setActualizando,
  ] =
    useState(false);

  const [
    mensajeAccion,
    setMensajeAccion,
  ] =
    useState("");

  const [
    participanteCobroId,
    setParticipanteCobroId,
  ] =
    useState<
      string | null
    >(null);

  const [
    cancelacionFacturablePendiente,
    setCancelacionFacturablePendiente,
  ] =
    useState<
      boolean | null
    >(null);

  const [
    motivoCancelacion,
    setMotivoCancelacion,
  ] =
    useState("");

  useEffect(() => {
    setClaseSeleccionada(
      clase
    );
    setMensajeAccion("");
    setParticipanteCobroId(
      null
    );
    setCancelacionFacturablePendiente(
      null
    );
    setMotivoCancelacion(
      ""
    );
  }, [clase]);

  function editarClase(
    id: string
  ) {
    window.location.href =
      `/clases?editar=${id}&volver=${encodeURIComponent(
        volverA
      )}`;
  }

  async function ajustarBono(
    bonoId: string,
    diferencia: number
  ) {
    const {
      data: bono,
      error,
    } =
      await supabase
        .from("bonos")
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
      !bono
    ) {
      throw new Error(
        "No se pudo actualizar el bono."
      );
    }

    const nuevas =
      Number(
        bono.clases_restantes
      ) + diferencia;

    const restantes =
      Math.max(
        0,
        Math.min(
          Number(
            bono.numero_clases
          ),
          nuevas
        )
      );

    const {
      error:
        errorActualizar,
    } =
      await supabase
        .from("bonos")
        .update({
          clases_restantes:
            restantes,
          activo:
            restantes >
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
        "No se pudo actualizar el bono."
      );
    }
  }


  async function ajustarBonosDeParticipantes(
    participantes: {
      usa_bono: boolean;
      bono_id: string | null;
    }[],
    diferencia: number
  ) {
    const consumosPorBono =
      new Map<string, number>();

    for (
      const participante of
      participantes
    ) {
      if (
        !participante.usa_bono ||
        !participante.bono_id
      ) {
        continue;
      }

      consumosPorBono.set(
        participante.bono_id,
        (
          consumosPorBono.get(
            participante.bono_id
          ) || 0
        ) + 1
      );
    }

    const idsBono =
      Array.from(
        consumosPorBono.keys()
      );

    if (
      idsBono.length ===
      0
    ) {
      return;
    }

    const {
      data:
        bonosRelacionados,
      error:
        errorBonosRelacionados,
    } =
      await supabase
        .from("bonos")
        .select(
          "id,grupo_id"
        )
        .in(
          "id",
          idsBono
        );

    if (
      errorBonosRelacionados
    ) {
      throw new Error(
        "No se pudo comprobar el tipo de bono."
      );
    }

    for (
      const bonoId of
      idsBono
    ) {
      const bono =
        (
          bonosRelacionados ||
          []
        ).find(
          (item) =>
            item.id ===
            bonoId
        );

      const cantidad =
        bono?.grupo_id
          ? 1
          : consumosPorBono.get(
              bonoId
            ) || 0;

      if (
        cantidad <=
        0
      ) {
        continue;
      }

      await ajustarBono(
        bonoId,
        diferencia *
          cantidad
      );
    }
  }

  async function sincronizarPagosRapidos(
    claseTrabajo: ClaseAccionesRapidas,
    estadoNuevo: string,
    facturableNueva: boolean,
    metodoCobro?: string
  ) {
    const generaCobro =
      estadoNuevo === "realizada" ||
      (
        estadoNuevo === "cancelada" &&
        facturableNueva
      );

    if (
      !generaCobro ||
      claseTrabajo.tipo === "club"
    ) {
      await supabase
        .from("pagos")
        .delete()
        .eq(
          "clase_id",
          claseTrabajo.id
        );

      return;
    }

    const {
      data: pagosExistentes,
      error: errorPagos,
    } =
      await supabase
        .from("pagos")
        .select(
          "id,alumno_id,metodo,estado"
        )
        .eq(
          "clase_id",
          claseTrabajo.id
        );

    if (errorPagos) {
      throw new Error(
        "No se pudieron sincronizar los pagos."
      );
    }

    const pagosActuales =
      pagosExistentes || [];

    if (
      claseTrabajo.modo_cobro ===
      "total"
    ) {
      const pagosTotales =
        pagosActuales.filter(
          (pago) =>
            pago.alumno_id === null
        );

      const existenteTotal =
        pagosTotales[0];

      for (const pago of pagosActuales) {
        if (
          pago.alumno_id !== null ||
          (
            existenteTotal &&
            pago.id !== existenteTotal.id
          )
        ) {
          const { error: errorBorrar } =
            await supabase
              .from("pagos")
              .delete()
              .eq("id", pago.id);

          if (errorBorrar) {
            throw new Error(
              "No se pudieron limpiar los pagos anteriores de la clase."
            );
          }
        }
      }

      const participantesNormales =
        claseTrabajo.clase_alumnos.filter(
          (participante) =>
            !participante.usa_bono
        );

      const pagado =
        participantesNormales.length > 0 &&
        participantesNormales.every(
          (participante) =>
            participante.pagado
        );

      const datosPago = {
        alumno_id: null,
        clase_id: claseTrabajo.id,
        importe: Number(
          claseTrabajo.importe_total || 0
        ),
        metodo:
          metodoCobro ||
          existenteTotal?.metodo ||
          "efectivo",
        estado: pagado
          ? "pagado"
          : "pendiente",
        fecha_pago:
          claseTrabajo.fecha,
        notas:
          estadoNuevo === "cancelada"
            ? "Clase completa cancelada facturable · actualizado desde Agenda"
            : "Clase completa · actualizado desde Agenda",
      };

      if (existenteTotal) {
        const { error: errorActualizar } =
          await supabase
            .from("pagos")
            .update(datosPago)
            .eq(
              "id",
              existenteTotal.id
            );

        if (errorActualizar) {
          throw new Error(
            "No se pudo actualizar el pago total de la clase."
          );
        }
      } else {
        const { error: errorInsertar } =
          await supabase
            .from("pagos")
            .insert(datosPago);

        if (errorInsertar) {
          throw new Error(
            "No se pudo crear el pago total de la clase."
          );
        }
      }

      return;
    }

    for (
      const pago of pagosActuales
    ) {
      if (pago.alumno_id === null) {
        const { error: errorBorrar } =
          await supabase
            .from("pagos")
            .delete()
            .eq("id", pago.id);

        if (errorBorrar) {
          throw new Error(
            "No se pudo limpiar el pago total anterior."
          );
        }
      }
    }

    for (
      const participante of
      claseTrabajo.clase_alumnos
    ) {
      if (participante.usa_bono) {
        await supabase
          .from("pagos")
          .delete()
          .eq(
            "clase_id",
            claseTrabajo.id
          )
          .eq(
            "alumno_id",
            participante.alumno_id
          );

        continue;
      }

      const existente =
        pagosActuales.find(
          (pago) =>
            pago.alumno_id ===
            participante.alumno_id
        );

      const datosPago = {
        alumno_id:
          participante.alumno_id,
        clase_id:
          claseTrabajo.id,
        importe: Number(
          participante.importe || 0
        ),
        metodo:
          metodoCobro ||
          existente?.metodo ||
          "efectivo",
        estado:
          participante.pagado
            ? "pagado"
            : "pendiente",
        fecha_pago:
          claseTrabajo.fecha,
        notas:
          estadoNuevo === "cancelada"
            ? "Clase cancelada facturable · actualizado desde Agenda"
            : "Actualizado desde Agenda",
      };

      if (existente) {
        const { error: errorActualizar } =
          await supabase
            .from("pagos")
            .update(datosPago)
            .eq(
              "id",
              existente.id
            );

        if (errorActualizar) {
          throw new Error(
            "No se pudo actualizar un pago."
          );
        }
      } else {
        const { error: errorInsertar } =
          await supabase
            .from("pagos")
            .insert(datosPago);

        if (errorInsertar) {
          throw new Error(
            "No se pudo crear un pago."
          );
        }
      }
    }
  }

  async function borrarClaseSeleccionada() {
    if (
      actualizando
    ) {
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

    const claseTrabajo =
      claseSeleccionada;

    setActualizando(
      true
    );
    setMensajeAccion(
      ""
    );

    try {
      let avisoGoogle =
        "";

      try {
        await borrarClaseDeGoogleCalendar(
          {
            id:
              claseTrabajo.id,
            google_calendar_event_id:
              claseTrabajo.google_calendar_event_id,
          }
        );
      } catch {
        avisoGoogle =
          "Clase borrada en Manager, pero no se pudo borrar su evento de Google Calendar.";
      }

      const {
        error:
          errorPagos,
      } =
        await supabase
          .from("pagos")
          .delete()
          .eq(
            "clase_id",
            claseTrabajo.id
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
          errorClase,
      } =
        await supabase
          .from("clases")
          .delete()
          .eq(
            "id",
            claseTrabajo.id
          );

      if (
        errorClase
      ) {
        throw new Error(
          "No se pudo borrar la clase."
        );
      }

      let avisoBono =
        "";

      if (
        claseTrabajo.estado ===
        "realizada"
      ) {
        try {
          await ajustarBonosDeParticipantes(
            claseTrabajo.clase_alumnos,
            1
          );
        } catch {
          avisoBono =
            "Clase borrada, pero hubo un problema al devolver el bono.";
        }
      }

      onCerrar();
      await onClaseActualizada();

      const avisos =
        [
          avisoBono,
          avisoGoogle,
        ]
          .filter(
            Boolean
          )
          .join(
            "\n"
          );

      if (
        avisos
      ) {
        window.alert(
          avisos
        );
      }
    } catch (
      error
    ) {
      setMensajeAccion(
        "❌ " +
          (
            error instanceof
            Error
              ? error.message
              : "No se pudo borrar la clase."
          )
      );
    } finally {
      setActualizando(
        false
      );
    }
  }

  async function cambiarEstadoClase(
    estado:
      | "programada"
      | "realizada"
      | "cancelada",
    opciones?: {
      facturable?: boolean;
      cobrar?: boolean;
      metodoCobro?: string;
      observaciones?:
        | string
        | null;
    }
  ) {
    const claseTrabajo =
      claseSeleccionada;

    const facturableNueva =
      opciones
        ?.facturable ??
      (
        estado ===
        "programada"
          ? true
          : claseTrabajo.facturable
      );

    const cobrarAhora =
      opciones
        ?.cobrar ===
      true;

    setActualizando(
      true
    );
    setMensajeAccion(
      ""
    );

    try {
      const consumiaBonoAntes =
        claseTrabajo.estado ===
          "realizada" ||
        (
          claseTrabajo.estado ===
            "cancelada" &&
          claseTrabajo.facturable
        );

      const consumiraBonoAhora =
        estado ===
          "realizada" ||
        (
          estado ===
            "cancelada" &&
          facturableNueva
        );

      if (
        consumiaBonoAntes !==
        consumiraBonoAhora
      ) {
        await ajustarBonosDeParticipantes(
          claseTrabajo.clase_alumnos,
          consumiraBonoAhora
            ? -1
            : 1
        );
      }

      let participantesActualizados =
        claseTrabajo.clase_alumnos;

      if (
        cobrarAhora &&
        claseTrabajo.tipo !==
          "club"
      ) {
        const idsPagoNormal =
          claseTrabajo.clase_alumnos
            .filter(
              (
                participante
              ) =>
                !participante.usa_bono
            )
            .map(
              (
                participante
              ) =>
                participante.id
            );

        if (
          idsPagoNormal.length >
          0
        ) {
          const {
            error:
              errorCobro,
          } =
            await supabase
              .from(
                "clase_alumnos"
              )
              .update({
                pagado:
                  true,
              })
              .in(
                "id",
                idsPagoNormal
              );

          if (
            errorCobro
          ) {
            throw new Error(
              "No se pudo marcar la clase como cobrada."
            );
          }
        }

        participantesActualizados =
          claseTrabajo.clase_alumnos.map(
            (
              participante
            ) =>
              participante.usa_bono
                ? participante
                : {
                    ...participante,
                    pagado:
                      true,
                  }
          );
      }

      if (
        (
          estado ===
            "programada" ||
          !facturableNueva
        ) &&
        claseTrabajo.tipo !==
          "club"
      ) {
        const idsPagoNormal =
          claseTrabajo.clase_alumnos
            .filter(
              (
                participante
              ) =>
                !participante.usa_bono
            )
            .map(
              (
                participante
              ) =>
                participante.id
            );

        if (
          idsPagoNormal.length >
          0
        ) {
          const {
            error:
              errorPendiente,
          } =
            await supabase
              .from(
                "clase_alumnos"
              )
              .update({
                pagado:
                  false,
              })
              .in(
                "id",
                idsPagoNormal
              );

          if (
            errorPendiente
          ) {
            throw new Error(
              "No se pudo actualizar el estado económico."
            );
          }
        }

        participantesActualizados =
          participantesActualizados.map(
            (
              participante
            ) =>
              participante.usa_bono
                ? participante
                : {
                    ...participante,
                    pagado:
                      false,
                  }
          );
      }

      let cobradaNueva =
        claseTrabajo.cobrada;

      if (
        claseTrabajo.tipo ===
        "club"
      ) {
        if (
          cobrarAhora
        ) {
          cobradaNueva =
            true;
        } else if (
          estado ===
            "programada" ||
          !facturableNueva
        ) {
          cobradaNueva =
            false;
        }
      }

      const observacionesNuevas =
        opciones
          ?.observaciones !==
        undefined
          ? opciones.observaciones
          : claseTrabajo.observaciones;

      const {
        error:
          errorClase,
      } =
        await supabase
          .from("clases")
          .update({
            estado,
            facturable:
              facturableNueva,
            cobrada:
              cobradaNueva,
            observaciones:
              observacionesNuevas,
          })
          .eq(
            "id",
            claseTrabajo.id
          );

      if (
        errorClase
      ) {
        throw new Error(
          "No se pudo actualizar la clase."
        );
      }

      const claseActualizada:
        ClaseAccionesRapidas =
        {
          ...claseTrabajo,
          estado,
          facturable:
            facturableNueva,
          cobrada:
            cobradaNueva,
          observaciones:
            observacionesNuevas,
          clase_alumnos:
            participantesActualizados,
        };

      await sincronizarPagosRapidos(
        claseActualizada,
        estado,
        facturableNueva,
        opciones
          ?.metodoCobro
      );

      let falloGoogle =
        false;

      try {
        await sincronizarClaseConGoogleCalendar(
          datosGoogleClase(
            claseTrabajo,
            {
              estado,
              observaciones:
                observacionesNuevas,
            }
          )
        );
      } catch {
        falloGoogle =
          true;
      }

      onCerrar();
      await onClaseActualizada();

      if (
        falloGoogle
      ) {
        window.alert(
          "La clase se actualizó en Manager, pero no se pudo sincronizar el cambio con Google Calendar."
        );
      }
    } catch (
      error
    ) {
      setMensajeAccion(
        "❌ " +
          (
            error instanceof
            Error
              ? error.message
              : "No se pudo actualizar la clase."
          )
      );
    } finally {
      setActualizando(
        false
      );
    }
  }

  async function cambiarCobroClub(
    cobrada: boolean
  ) {
    if (
      claseSeleccionada.tipo !==
      "club"
    ) {
      return;
    }

    setActualizando(
      true
    );
    setMensajeAccion(
      ""
    );

    try {
      const {
        error,
      } =
        await supabase
          .from("clases")
          .update({
            cobrada,
          })
          .eq(
            "id",
            claseSeleccionada.id
          );

      if (
        error
      ) {
        throw new Error(
          "No se pudo actualizar el cobro de la clase."
        );
      }

      setClaseSeleccionada(
        {
          ...claseSeleccionada,
          cobrada,
        }
      );

      await onClaseActualizada();
    } catch (
      error
    ) {
      setMensajeAccion(
        "❌ " +
          (
            error instanceof
            Error
              ? error.message
              : "No se pudo actualizar el cobro de la clase."
          )
      );
    } finally {
      setActualizando(
        false
      );
    }
  }

  async function cambiarCobroTotal(
    pagado: boolean,
    metodoCobro?: string
  ) {
    if (
      claseSeleccionada.tipo === "club" ||
      claseSeleccionada.modo_cobro !== "total"
    ) {
      return;
    }

    setActualizando(true);
    setMensajeAccion("");

    try {
      let claseTrabajo =
        claseSeleccionada;
      let cambioARealizada =
        false;

      if (
        pagado &&
        claseTrabajo.estado ===
          "programada"
      ) {
        await ajustarBonosDeParticipantes(
          claseTrabajo.clase_alumnos,
          -1
        );

        const { error: errorClase } =
          await supabase
            .from("clases")
            .update({
              estado: "realizada",
              facturable: true,
            })
            .eq(
              "id",
              claseTrabajo.id
            );

        if (errorClase) {
          throw new Error(
            "No se pudo marcar la clase como realizada."
          );
        }

        claseTrabajo = {
          ...claseTrabajo,
          estado: "realizada",
          facturable: true,
        };
        cambioARealizada = true;
      }

      const idsPagoNormal =
        claseTrabajo.clase_alumnos
          .filter(
            (participante) =>
              !participante.usa_bono
          )
          .map(
            (participante) =>
              participante.id
          );

      if (idsPagoNormal.length > 0) {
        const { error: errorParticipantes } =
          await supabase
            .from("clase_alumnos")
            .update({ pagado })
            .in(
              "id",
              idsPagoNormal
            );

        if (errorParticipantes) {
          throw new Error(
            "No se pudo actualizar el cobro de la clase."
          );
        }
      }

      const participantesActualizados =
        claseTrabajo.clase_alumnos.map(
          (participante) =>
            participante.usa_bono
              ? participante
              : {
                  ...participante,
                  pagado,
                }
        );

      claseTrabajo = {
        ...claseTrabajo,
        clase_alumnos:
          participantesActualizados,
      };

      await sincronizarPagosRapidos(
        claseTrabajo,
        claseTrabajo.estado,
        claseTrabajo.facturable,
        metodoCobro
      );

      let falloGoogle = false;

      if (cambioARealizada) {
        try {
          await sincronizarClaseConGoogleCalendar(
            datosGoogleClase(
              claseTrabajo,
              { estado: "realizada" }
            )
          );
        } catch {
          falloGoogle = true;
        }
      }

      setClaseSeleccionada(
        claseTrabajo
      );
      setParticipanteCobroId(null);
      await onClaseActualizada();

      if (falloGoogle) {
        window.alert(
          "La clase se actualizó en Manager, pero no se pudo sincronizar el cambio con Google Calendar."
        );
      }
    } catch (error) {
      setMensajeAccion(
        "❌ " +
          (
            error instanceof Error
              ? error.message
              : "No se pudo actualizar el cobro de la clase."
          )
      );
    } finally {
      setActualizando(false);
    }
  }

  async function cambiarCobro(
    participante:
      ClaseAccionesRapidas["clase_alumnos"][number],
    pagado: boolean,
    metodoCobro?: string
  ) {
    if (
      participante.usa_bono
    ) {
      return;
    }

    setActualizando(
      true
    );
    setMensajeAccion(
      ""
    );

    try {
      let claseTrabajo =
        claseSeleccionada;

      let cambioARealizada =
        false;

      if (
        pagado &&
        claseTrabajo.estado ===
          "programada"
      ) {
        await ajustarBonosDeParticipantes(
          claseTrabajo.clase_alumnos,
          -1
        );

        const {
          error:
            errorClase,
        } =
          await supabase
            .from(
              "clases"
            )
            .update({
              estado:
                "realizada",
              facturable:
                true,
            })
            .eq(
              "id",
              claseTrabajo.id
            );

        if (
          errorClase
        ) {
          throw new Error(
            "No se pudo marcar la clase como realizada."
          );
        }

        claseTrabajo =
          {
            ...claseTrabajo,
            estado:
              "realizada",
            facturable:
              true,
          };

        cambioARealizada =
          true;
      }

      const {
        error:
          errorParticipante,
      } =
        await supabase
          .from(
            "clase_alumnos"
          )
          .update({
            pagado,
          })
          .eq(
            "id",
            participante.id
          );

      if (
        errorParticipante
      ) {
        throw new Error(
          "No se pudo actualizar el cobro."
        );
      }

      const participantesActualizados =
        claseTrabajo.clase_alumnos.map(
          (
            item
          ) =>
            item.id ===
            participante.id
              ? {
                  ...item,
                  pagado,
                }
              : item
        );

      claseTrabajo =
        {
          ...claseTrabajo,
          clase_alumnos:
            participantesActualizados,
        };

      await sincronizarPagosRapidos(
        claseTrabajo,
        claseTrabajo.estado,
        claseTrabajo.facturable
      );

      if (
        metodoCobro
      ) {
        const {
          error:
            errorMetodo,
        } =
          await supabase
            .from(
              "pagos"
            )
            .update({
              metodo:
                metodoCobro,
              estado:
                pagado
                  ? "pagado"
                  : "pendiente",
            })
            .eq(
              "clase_id",
              claseTrabajo.id
            )
            .eq(
              "alumno_id",
              participante.alumno_id
            );

        if (
          errorMetodo
        ) {
          throw new Error(
            "El cobro se guardó, pero no se pudo guardar la forma de pago."
          );
        }
      }

      let falloGoogle =
        false;

      if (
        cambioARealizada
      ) {
        try {
          await sincronizarClaseConGoogleCalendar(
            datosGoogleClase(
              claseTrabajo,
              {
                estado:
                  "realizada",
              }
            )
          );
        } catch {
          falloGoogle =
            true;
        }
      }

      setClaseSeleccionada(
        claseTrabajo
      );

      setParticipanteCobroId(
        null
      );

      await onClaseActualizada();

      if (
        falloGoogle
      ) {
        window.alert(
          "La clase se actualizó en Manager, pero no se pudo sincronizar el cambio con Google Calendar."
        );
      }
    } catch (
      error
    ) {
      setMensajeAccion(
        "❌ " +
          (
            error instanceof
            Error
              ? error.message
              : "No se pudo actualizar el cobro."
          )
      );
    } finally {
      setActualizando(
        false
      );
    }
  }

  async function cambiarAsistencia(
    participante:
      ClaseAccionesRapidas["clase_alumnos"][number],
    asistio: boolean
  ) {
    setActualizando(
      true
    );
    setMensajeAccion(
      ""
    );

    try {
      const {
        error,
      } =
        await supabase
          .from(
            "clase_alumnos"
          )
          .update({
            asistio,
          })
          .eq(
            "id",
            participante.id
          );

      if (
        error
      ) {
        throw new Error(
          "No se pudo actualizar la asistencia."
        );
      }

      setClaseSeleccionada(
        {
          ...claseSeleccionada,
          clase_alumnos:
            claseSeleccionada
              .clase_alumnos
              .map(
                (
                  item
                ) =>
                  item.id ===
                  participante.id
                    ? {
                        ...item,
                        asistio,
                      }
                    : item
              ),
        }
      );

      await onClaseActualizada();
    } catch (
      error
    ) {
      setMensajeAccion(
        "❌ " +
          (
            error instanceof
            Error
              ? error.message
              : "No se pudo actualizar la asistencia."
          )
      );
    } finally {
      setActualizando(
        false
      );
    }
  }

  const horaInicio =
    claseSeleccionada
      .hora_inicio
      .slice(
        0,
        5
      );

  const horaFin =
    calcularHoraFin(
      claseSeleccionada
        .hora_inicio,
      claseSeleccionada
        .duracion_minutos
    );

  const pagosNormales =
    claseSeleccionada
      .clase_alumnos
      .filter(
        (
          participante
        ) =>
          !participante.usa_bono
      );

  const esCobroTotal =
    claseSeleccionada.tipo !==
      "club" &&
    claseSeleccionada.modo_cobro ===
      "total";

  const cobroTotalPagado =
    esCobroTotal &&
    pagosNormales.length > 0 &&
    pagosNormales.every(
      (participante) =>
        participante.pagado
    );

  const importeCobroTotal =
    Number(
      claseSeleccionada.importe_total ||
        0
    ).toFixed(2);

  const pagoNormalUnico =
    !esCobroTotal &&
    pagosNormales.length ===
    1
      ? pagosNormales[0]
      : null;

  const esClub =
    claseSeleccionada.tipo ===
    "club";

  const estadoTexto =
    claseSeleccionada.estado ===
    "realizada"
      ? "Realizada"
      : claseSeleccionada.estado ===
          "cancelada"
        ? claseSeleccionada.facturable
          ? "Cancelada facturable"
          : "Cancelada no facturable"
        : "Programada";

  const metodosCobro = [
    {
      valor: "efectivo",
      texto: "Efectivo",
      icono:
        <IconoEfectivo />,
    },
    {
      valor: "bizum",
      texto: "Bizum",
      icono:
        <IconoBizumPago />,
    },
    {
      valor:
        "transferencia",
      texto:
        "Transferencia",
      icono:
        <IconoTransferencia />,
    },
    {
      valor: "tarjeta",
      texto: "Tarjeta",
      icono:
        <IconoTarjeta />,
    },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0F172A]/58 p-2.5 backdrop-blur-[3px] sm:p-4">
      <div className="max-h-[calc(100vh-20px)] w-full max-w-[1180px] overflow-y-auto rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-[0_28px_90px_rgba(15,23,42,0.30)] sm:max-h-[calc(100vh-32px)] sm:px-5 sm:py-5 lg:px-6 lg:py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#00A79C] sm:text-[12px]">
              Acciones rápidas
            </p>

            <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0">
              <h3 className="text-[25px] font-extrabold leading-tight tracking-tight text-[#17324D] sm:text-[30px] lg:text-[32px]">
                {horaInicio} h - {horaFin} h
              </h3>

              <p className="whitespace-nowrap text-[13px] font-semibold leading-tight text-slate-400 sm:text-sm">
                · {claseSeleccionada.duracion_minutos} min
              </p>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-slate-500 sm:text-[15px]">
                {claseSeleccionada.ubicaciones?.nombre || "Sin ubicación"}
              </p>

              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                {estadoTexto}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={
              onCerrar
            }
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-[0_6px_20px_rgba(15,23,42,0.08)] transition hover:bg-slate-50 hover:text-[#17324D]"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <IconoCerrar />
          </button>
        </div>

        <div
          className={
            esClub
              ? "mt-4"
              : "mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(410px,0.92fr)] lg:items-start"
          }
        >
          <div className={esClub ? "hidden" : "min-w-0"}>
        {!esClub &&
          claseSeleccionada
            .clase_alumnos
            .length >
            0 && (
            <section className="rounded-[20px] border border-slate-200 bg-[#FBFCFD] p-3 sm:p-4">
              <div className="flex items-center gap-3 text-[#0DAA9B]">
                <IconoAlumno />
                <p className="text-[13px] font-extrabold uppercase tracking-[0.08em]">
                  Alumnos
                </p>
              </div>

              <div className="mt-3 space-y-2.5">
                {esCobroTotal && (
                  <div className="flex flex-col gap-2 rounded-[16px] border border-[#BDE7DA] bg-[#F6FCFB] px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#148C86]">
                        Precio total de la clase
                      </p>
                      <p className="mt-0.5 text-[20px] font-extrabold text-[#17324D]">
                        {importeCobroTotal} €
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-slate-500">
                        {cobroTotalPagado
                          ? "Cobrado"
                          : "Pendiente de cobro"}
                      </p>
                    </div>

                    {cobroTotalPagado && (
                      <button
                        type="button"
                        disabled={actualizando}
                        onClick={() =>
                          cambiarCobroTotal(false)
                        }
                        className="inline-flex h-11 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-5 text-[14px] font-bold text-emerald-700 disabled:opacity-50"
                      >
                        Cobrado
                      </button>
                    )}
                  </div>
                )}

                {claseSeleccionada.clase_alumnos.map(
                  (
                    participante
                  ) => {
                    const nombre =
                      participante.alumnos
                        ? `${participante.alumnos.nombre} ${participante.alumnos.apellidos || ""}`.trim()
                        : "Alumno";

                    const importe =
                      Number(
                        participante.importe ||
                          0
                      ).toFixed(
                        2
                      );

                    return (
                      <div
                        key={
                          participante.id
                        }
                        className="rounded-[16px] border border-slate-200 bg-white px-3.5 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-[15px] font-extrabold text-[#17324D] sm:text-[16px]">
                              {nombre}
                            </p>

                            {participante.usa_bono ? (
                              <p className="mt-0.5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-violet-700 sm:text-[13px]">
                                <IconoBono />
                                Bono asignado
                              </p>
                            ) : esCobroTotal ? (
                              <p className="mt-0.5 text-[12px] font-medium text-slate-500 sm:text-[13px]">
                                Incluido en precio total · {participante.pagado
                                  ? "Cobrado"
                                  : "Pendiente de cobro"}
                              </p>
                            ) : (
                              <p className="mt-0.5 text-[12px] font-medium text-slate-500 sm:text-[13px]">
                                {importe} € · {participante.pagado
                                  ? "Cobrado"
                                  : "Pendiente de cobro"}
                              </p>
                            )}
                          </div>

                          <div className="grid w-full grid-cols-2 gap-2 lg:w-auto lg:grid-cols-[118px_118px]">
                            <button
                              type="button"
                              disabled={
                                actualizando
                              }
                              onClick={() =>
                                cambiarAsistencia(
                                  participante,
                                  !participante.asistio
                                )
                              }
                              className={
                                participante.asistio
                                  ? "inline-flex h-10 w-full items-center justify-center rounded-full border border-[#8FD7DA] bg-[#EFFBFA] px-2.5 text-[12px] font-bold text-[#2A77FF] sm:text-[13px]"
                                  : "inline-flex h-10 w-full items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-2.5 text-[12px] font-bold text-slate-600 sm:text-[13px]"
                              }
                            >
                              {participante.asistio
                                ? "✓ Asistió"
                                : "Asistencia"}
                            </button>

                            {participante.usa_bono ? (
                              <span className="inline-flex h-10 w-full items-center justify-center rounded-full border border-violet-200 bg-violet-50 px-2.5 text-[12px] font-bold text-violet-700 sm:text-[13px]">
                                Bono
                              </span>
                            ) : esCobroTotal ? (
                              <span className="inline-flex h-10 w-full items-center justify-center rounded-full border border-[#BDE7DA] bg-[#F6FCFB] px-2.5 text-[12px] font-bold text-[#148C86] sm:text-[13px]">
                                Precio total
                              </span>
                            ) : participante.pagado ? (
                              <button
                                type="button"
                                disabled={
                                  actualizando
                                }
                                onClick={() =>
                                  cambiarCobro(
                                    participante,
                                    false
                                  )
                                }
                                className="inline-flex h-10 w-full items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 text-[12px] font-bold text-emerald-700 sm:text-[13px]"
                              >
                                Cobrado
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={
                                  actualizando
                                }
                                onClick={() =>
                                  setParticipanteCobroId(
                                    participanteCobroId ===
                                      participante.id
                                      ? null
                                      : participante.id
                                  )
                                }
                                className="inline-flex h-10 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#0EA6A0] to-[#159A8A] px-2.5 text-[12px] font-bold text-white shadow-sm transition hover:opacity-95 sm:text-[13px]"
                              >
                                Cobrar
                              </button>
                            )}
                          </div>
                        </div>

                        {!esCobroTotal &&
                          !participante.usa_bono &&
                          !participante.pagado &&
                          (claseSeleccionada.estado !==
                            "cancelada" ||
                            claseSeleccionada.facturable) &&
                          participanteCobroId ===
                            participante.id && (
                            <div className="mt-2.5 grid grid-cols-2 gap-2 md:grid-cols-4">
                              {metodosCobro.map(
                                (
                                  metodo
                                ) => (
                                  <button
                                    key={
                                      metodo.valor
                                    }
                                    type="button"
                                    disabled={
                                      actualizando
                                    }
                                    onClick={() =>
                                      cambiarCobro(
                                        participante,
                                        true,
                                        metodo.valor
                                      )
                                    }
                                    className="rounded-xl border border-[#C9E8E4] bg-[#F7FFFE] px-2 py-2 text-center text-[11px] font-bold text-[#0F8E83] transition hover:bg-[#ECFBF8] disabled:opacity-50 sm:text-[12px]"
                                  >
                                    <div className="mb-0.5 flex justify-center text-[#10A99D]">
                                      {metodo.icono}
                                    </div>
                                    {metodo.texto}
                                  </button>
                                )
                              )}
                            </div>
                          )}
                      </div>
                    );
                  }
                )}
              </div>
            </section>
          )}
          </div>

          <div className="min-w-0 space-y-4">
        <section className="rounded-[20px] border border-[#BDE7DA] bg-[#F6FCFB] p-3 sm:p-4">
          <div className="flex items-center gap-3 text-[#10A99D]">
            <IconoCheckCircle />
            <div>
              <p className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#148C86]">
                Finalizar clase
              </p>
              {!esClub &&
              (
                (
                  esCobroTotal &&
                  !cobroTotalPagado &&
                  (
                    claseSeleccionada.estado !== "cancelada" ||
                    claseSeleccionada.facturable
                  )
                ) ||
                (
                  pagoNormalUnico &&
                  !pagoNormalUnico.pagado &&
                  claseSeleccionada.estado !== "cancelada"
                )
              ) ? (
                <p className="mt-0.5 text-[12px] font-medium text-slate-500">
                  Elige forma de cobro
                </p>
              ) : (
                <p className="mt-0.5 text-[12px] font-medium text-slate-500">
                  Marca la clase como realizada
                </p>
              )}
            </div>
          </div>

          {!esClub &&
          (
            (
              esCobroTotal &&
              !cobroTotalPagado &&
              (
                claseSeleccionada.estado !== "cancelada" ||
                claseSeleccionada.facturable
              )
            ) ||
            (
              pagoNormalUnico &&
              !pagoNormalUnico.pagado &&
              claseSeleccionada.estado !== "cancelada"
            )
          ) ? (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {metodosCobro.map(
                (
                  metodo
                ) => (
                  <button
                    key={
                      metodo.valor
                    }
                    type="button"
                    disabled={
                      actualizando
                    }
                    onClick={() => {
                      if (esCobroTotal) {
                        if (
                          claseSeleccionada.estado ===
                          "programada"
                        ) {
                          cambiarEstadoClase(
                            "realizada",
                            {
                              facturable: true,
                              cobrar: true,
                              metodoCobro:
                                metodo.valor,
                            }
                          );
                        } else {
                          cambiarCobroTotal(
                            true,
                            metodo.valor
                          );
                        }
                        return;
                      }

                      cambiarEstadoClase(
                        "realizada",
                        {
                          facturable: true,
                          cobrar: true,
                          metodoCobro:
                            metodo.valor,
                        }
                      );
                    }}
                    className="rounded-[14px] border border-slate-200 bg-white px-2 py-2.5 text-center text-[#17324D] shadow-[0_6px_16px_rgba(15,23,42,0.04)] transition hover:border-[#A8E1DC] hover:bg-[#F9FFFE] disabled:opacity-50"
                  >
                    <div className="mb-1 flex justify-center text-[#10A99D]">
                      {metodo.icono}
                    </div>
                    <div className="text-[10px] font-bold sm:text-[11px]">
                      {metodo.texto}
                    </div>
                  </button>
                )
              )}
            </div>
          ) : null}

          {!esCobroTotal &&
            pagosNormales.length >
              1 &&
            claseSeleccionada.tipo !==
              "club" && (
              <p className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-600">
                Para clases con varios alumnos, usa “Cobrar” dentro de cada tarjeta para indicar la forma de pago de cada uno.
              </p>
            )}

          <div className="mt-3">
            {claseSeleccionada.estado ===
            "realizada" ? (
              <div className="flex min-h-[44px] items-center justify-center rounded-[14px] border border-[#8FD7DA] bg-white px-3 py-2 text-[14px] font-bold text-[#129F8E]">
                ✓ Clase realizada
              </div>
            ) : (
              <button
                type="button"
                disabled={
                  actualizando
                }
                onClick={() =>
                  cambiarEstadoClase(
                    "realizada",
                    {
                      facturable:
                        true,
                    }
                  )
                }
                className="w-full rounded-[14px] border border-[#22B0A3] bg-white px-3 py-2.5 text-[14px] font-bold text-[#129F8E] transition hover:bg-[#F0FBF9] disabled:opacity-50"
              >
                ✓ Marcar solo como realizada
              </button>
            )}
          </div>
        </section>

        <section className="rounded-[20px] border border-[#F5D5D7] bg-[#FFF7F7] p-3 sm:p-4">
          <div className="flex items-center gap-3 text-[#FF3B3B]">
            <IconoCancelarCircle />
            <p className="text-[13px] font-extrabold uppercase tracking-[0.08em]">
              Cancelar clase
            </p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={
                actualizando
              }
              onClick={() => {
                setCancelacionFacturablePendiente(
                  true
                );
                setMotivoCancelacion(
                  claseSeleccionada.observaciones ||
                    ""
                );
              }}
              className={`rounded-[14px] px-3 py-2.5 text-[14px] font-bold transition disabled:opacity-50 ${
                cancelacionFacturablePendiente ===
                true
                  ? "bg-red-600 text-white"
                  : "border border-red-300 bg-white text-red-600 hover:bg-red-50"
              }`}
            >
              Se cobra
            </button>

            <button
              type="button"
              disabled={
                actualizando
              }
              onClick={() => {
                setCancelacionFacturablePendiente(
                  false
                );
                setMotivoCancelacion(
                  claseSeleccionada.observaciones ||
                    ""
                );
              }}
              className={`rounded-[14px] px-3 py-2.5 text-[14px] font-bold transition disabled:opacity-50 ${
                cancelacionFacturablePendiente ===
                false
                  ? "bg-red-600 text-white"
                  : "border border-red-300 bg-white text-red-600 hover:bg-red-50"
              }`}
            >
              No se cobra
            </button>
          </div>

          {cancelacionFacturablePendiente !==
            null && (
            <div className="mt-3 rounded-[14px] border border-red-200 bg-white p-3">
              <label className="block text-[12px] font-extrabold uppercase tracking-[0.08em] text-red-600">
                Motivo de cancelación
              </label>

              <textarea
                value={
                  motivoCancelacion
                }
                onChange={(
                  e
                ) =>
                  setMotivoCancelacion(
                    e.target
                      .value
                  )
                }
                placeholder="Ej.: Cancela porque se encuentra mal."
                rows={2}
                className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-red-400"
              />

              <button
                type="button"
                disabled={
                  actualizando ||
                  motivoCancelacion
                    .trim()
                    .length ===
                    0
                }
                onClick={() =>
                  cambiarEstadoClase(
                    "cancelada",
                    {
                      facturable:
                        cancelacionFacturablePendiente,
                      observaciones:
                        motivoCancelacion.trim(),
                    }
                  )
                }
                className="mt-2 w-full rounded-[12px] bg-red-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-40"
              >
                Confirmar cancelación
              </button>
            </div>
          )}

          {claseSeleccionada.estado ===
            "cancelada" &&
            claseSeleccionada.observaciones &&
            cancelacionFacturablePendiente ===
              null && (
              <p className="mt-3 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs leading-5 text-slate-600">
                <span className="font-bold text-slate-700">
                  Motivo:
                </span>{" "}
                {
                  claseSeleccionada.observaciones
                }
              </p>
            )}
        </section>

        <section className="rounded-[20px] border border-slate-200 bg-slate-50/65 p-3 sm:p-4">
          <div className="flex items-center gap-3 text-slate-500">
            <IconoConfiguracion />
            <p className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-slate-600">
              Otras acciones
            </p>
          </div>

          {claseSeleccionada.tipo ===
            "club" &&
            claseSeleccionada.facturable &&
            claseSeleccionada.estado !==
              "programada" && (
              <button
                type="button"
                disabled={
                  actualizando
                }
                onClick={() =>
                  cambiarCobroClub(
                    !claseSeleccionada.cobrada
                  )
                }
                className={
                  claseSeleccionada.cobrada
                    ? "mt-3 w-full rounded-[14px] border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"
                    : "mt-3 w-full rounded-[14px] border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
                }
              >
                {claseSeleccionada.cobrada
                  ? "€ Marcar cobro como pendiente"
                  : "€ Marcar como cobrada"}
              </button>
            )}

          {claseSeleccionada.estado !==
            "programada" && (
            <button
              type="button"
              disabled={
                actualizando
              }
              onClick={() =>
                cambiarEstadoClase(
                  "programada",
                  {
                    facturable:
                      true,
                  }
                )
              }
              className="mt-3 w-full rounded-[14px] border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Volver a programada
            </button>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                editarClase(
                  claseSeleccionada.id
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#17324D] px-3 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#0F2538]"
            >
              <IconoEditar />
              Editar clase completa
            </button>

            <button
              type="button"
              disabled={
                actualizando
              }
              onClick={
                borrarClaseSeleccionada
              }
              className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-red-200 bg-white px-3 py-2.5 text-[13px] font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              <IconoPapelera />
              Borrar clase
            </button>
          </div>
        </section>
          </div>
        </div>

        <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">
          Los bonos se descuentan cuando la clase se realiza o cuando una cancelación es facturable. Se devuelven si vuelve a programada o pasa a no facturable.
        </p>

        {mensajeAccion && (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {
              mensajeAccion
            }
          </p>
        )}
      </div>
    </div>
  );
}
