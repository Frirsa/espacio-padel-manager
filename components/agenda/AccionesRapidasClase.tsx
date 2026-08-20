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

  async function sincronizarPagosRapidos(
    claseTrabajo: ClaseAccionesRapidas,
    estadoNuevo: string,
    facturableNueva: boolean,
    metodoCobro?: string
  ) {
    const generaCobro =
      estadoNuevo ===
        "realizada" ||
      (estadoNuevo ===
        "cancelada" &&
        facturableNueva);

    if (
      !generaCobro ||
      claseTrabajo.tipo ===
        "club"
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
      error:
        errorPagos,
    } =
      await supabase
        .from("pagos")
        .select(
          "id,alumno_id,metodo"
        )
        .eq(
          "clase_id",
          claseTrabajo.id
        );

    if (
      errorPagos
    ) {
      throw new Error(
        "No se pudieron sincronizar los pagos."
      );
    }

    for (
      const participante of
      claseTrabajo.clase_alumnos
    ) {
      if (
        participante.usa_bono
      ) {
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
        (
          pagosExistentes ||
          []
        ).find(
          (
            pago
          ) =>
            pago.alumno_id ===
            participante.alumno_id
        );

      const datosPago =
        {
          alumno_id:
            participante.alumno_id,
          clase_id:
            claseTrabajo.id,
          importe:
            Number(
              participante.importe ||
                0
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
            estadoNuevo ===
            "cancelada"
              ? "Clase cancelada facturable · actualizado desde Agenda"
              : "Actualizado desde Agenda",
        };

      if (
        existente
      ) {
        const {
          error:
            errorActualizar,
        } =
          await supabase
            .from("pagos")
            .update(
              datosPago
            )
            .eq(
              "id",
              existente.id
            );

        if (
          errorActualizar
        ) {
          throw new Error(
            "No se pudo actualizar un pago."
          );
        }
      } else {
        const {
          error:
            errorInsertar,
        } =
          await supabase
            .from("pagos")
            .insert(
              datosPago
            );

        if (
          errorInsertar
        ) {
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
          for (
            const participante of
            claseTrabajo.clase_alumnos
          ) {
            if (
              participante.usa_bono &&
              participante.bono_id
            ) {
              await ajustarBono(
                participante.bono_id,
                1
              );
            }
          }
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
        for (
          const participante of
          claseTrabajo.clase_alumnos
        ) {
          if (
            participante.usa_bono &&
            participante.bono_id
          ) {
            await ajustarBono(
              participante.bono_id,
              consumiraBonoAhora
                ? -1
                : 1
            );
          }
        }
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
        for (
          const item of
          claseTrabajo.clase_alumnos
        ) {
          if (
            item.usa_bono &&
            item.bono_id
          ) {
            await ajustarBono(
              item.bono_id,
              -1
            );
          }
        }

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

  const pagoNormalUnico =
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0F172A]/58 p-3 backdrop-blur-[3px] sm:p-5">
      <div className="max-h-[94vh] w-full max-w-[1120px] overflow-y-auto rounded-[28px] border border-slate-200 bg-white px-4 py-5 shadow-[0_28px_90px_rgba(15,23,42,0.30)] sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#00A79C] sm:text-[12px]">
              Acciones rápidas
            </p>

            <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
              <h3 className="text-[32px] font-extrabold tracking-tight text-[#17324D] sm:text-[38px] lg:text-[42px]">
                {horaInicio} h - {horaFin} h
              </h3>

              <p className="pb-1 text-lg font-semibold text-slate-400 sm:text-xl">
                · {claseSeleccionada.duracion_minutos} min
              </p>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-lg font-medium text-slate-500">
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
            className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-[0_6px_20px_rgba(15,23,42,0.08)] transition hover:bg-slate-50 hover:text-[#17324D]"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <IconoCerrar />
          </button>
        </div>

        {!esClub &&
          claseSeleccionada
            .clase_alumnos
            .length >
            0 && (
            <section className="mt-6 rounded-[24px] border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex items-center gap-3 text-[#0DAA9B]">
                <IconoAlumno />
                <p className="text-[15px] font-extrabold uppercase tracking-[0.08em]">
                  Alumnos
                </p>
              </div>

              <div className="mt-4 space-y-3">
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
                        className="rounded-[20px] border border-slate-200 bg-white px-4 py-4 shadow-[0_10px_26px_rgba(15,23,42,0.05)]"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-[17px] font-extrabold text-[#17324D]">
                              {nombre}
                            </p>

                            {participante.usa_bono ? (
                              <p className="mt-1 inline-flex items-center gap-1.5 text-[14px] font-semibold text-violet-700">
                                <IconoBono />
                                Bono asignado
                              </p>
                            ) : (
                              <p className="mt-1 text-[14px] font-medium text-slate-500">
                                {importe} € · {participante.pagado
                                  ? "Cobrado"
                                  : "Pendiente de cobro"}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-3">
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
                                  ? "inline-flex min-w-[138px] items-center justify-center rounded-full border border-[#8FD7DA] bg-[#EFFBFA] px-4 py-2.5 text-[14px] font-bold text-[#2A77FF]"
                                  : "inline-flex min-w-[138px] items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-[14px] font-bold text-slate-600"
                              }
                            >
                              {participante.asistio
                                ? "✓ Asistió"
                                : "Asistencia"}
                            </button>

                            {participante.usa_bono ? (
                              <span className="inline-flex min-w-[120px] items-center justify-center rounded-full border border-violet-200 bg-violet-50 px-4 py-2.5 text-[14px] font-bold text-violet-700">
                                Bono
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
                                className="inline-flex min-w-[120px] items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[14px] font-bold text-emerald-700"
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
                                className="inline-flex min-w-[120px] items-center justify-center rounded-full bg-gradient-to-r from-[#0EA6A0] to-[#159A8A] px-4 py-2.5 text-[14px] font-bold text-white shadow-sm transition hover:opacity-95"
                              >
                                Cobrar
                              </button>
                            )}
                          </div>
                        </div>

                        {!participante.usa_bono &&
                          !participante.pagado &&
                          (claseSeleccionada.estado !==
                            "cancelada" ||
                            claseSeleccionada.facturable) &&
                          participanteCobroId ===
                            participante.id && (
                            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
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
                                    className="rounded-2xl border border-[#C9E8E4] bg-[#F7FFFE] px-3 py-3 text-center text-[13px] font-bold text-[#0F8E83] transition hover:bg-[#ECFBF8] disabled:opacity-50"
                                  >
                                    <div className="mb-1 flex justify-center text-[#10A99D]">
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

        <section className="mt-5 rounded-[24px] border border-[#BDE7DA] bg-[#F6FCFB] p-4 sm:p-5">
          <div className="flex items-center gap-3 text-[#10A99D]">
            <IconoCheckCircle />
            <div>
              <p className="text-[15px] font-extrabold uppercase tracking-[0.08em] text-[#148C86]">
                Finalizar clase
              </p>
              {!esClub && pagoNormalUnico && !pagoNormalUnico.pagado && claseSeleccionada.estado !== "cancelada" ? (
                <p className="mt-1 text-[15px] font-medium text-slate-500">
                  Elige forma de cobro
                </p>
              ) : (
                <p className="mt-1 text-[15px] font-medium text-slate-500">
                  Marca la clase como realizada
                </p>
              )}
            </div>
          </div>

          {!esClub &&
          pagoNormalUnico &&
          !pagoNormalUnico.pagado &&
          claseSeleccionada.estado !==
            "cancelada" ? (
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
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
                      cambiarEstadoClase(
                        "realizada",
                        {
                          facturable:
                            true,
                          cobrar:
                            true,
                          metodoCobro:
                            metodo.valor,
                        }
                      )
                    }
                    className="rounded-[18px] border border-slate-200 bg-white px-3 py-4 text-center text-[#17324D] shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition hover:border-[#A8E1DC] hover:bg-[#F9FFFE] disabled:opacity-50"
                  >
                    <div className="mb-2 flex justify-center text-[#10A99D]">
                      {metodo.icono}
                    </div>
                    <div className="text-[13px] font-bold sm:text-[15px]">
                      {metodo.texto}
                    </div>
                  </button>
                )
              )}
            </div>
          ) : null}

          {pagosNormales.length >
            1 &&
            claseSeleccionada.tipo !==
              "club" && (
              <p className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
                Para clases con varios alumnos, usa “Cobrar” dentro de cada tarjeta para indicar la forma de pago de cada uno.
              </p>
            )}

          <div className="mt-4">
            {claseSeleccionada.estado ===
            "realizada" ? (
              <div className="flex min-h-[58px] items-center justify-center rounded-[18px] border border-[#8FD7DA] bg-white px-4 py-3 text-[18px] font-bold text-[#129F8E]">
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
                className="w-full rounded-[18px] border border-[#22B0A3] bg-white px-4 py-3 text-[18px] font-bold text-[#129F8E] transition hover:bg-[#F0FBF9] disabled:opacity-50"
              >
                ✓ Marcar solo como realizada
              </button>
            )}
          </div>
        </section>

        <section className="mt-5 rounded-[24px] border border-[#F5D5D7] bg-[#FFF7F7] p-4 sm:p-5">
          <div className="flex items-center gap-3 text-[#FF3B3B]">
            <IconoCancelarCircle />
            <p className="text-[15px] font-extrabold uppercase tracking-[0.08em]">
              Cancelar clase
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
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
              className={`rounded-[18px] px-4 py-3 text-[18px] font-bold transition disabled:opacity-50 ${
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
              className={`rounded-[18px] px-4 py-3 text-[18px] font-bold transition disabled:opacity-50 ${
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
            <div className="mt-4 rounded-[18px] border border-red-200 bg-white p-4">
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
                rows={3}
                className="mt-3 w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-red-400"
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
                className="mt-3 w-full rounded-[16px] bg-red-600 px-4 py-3 text-base font-bold text-white transition hover:bg-red-700 disabled:opacity-40"
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
              <p className="mt-4 rounded-2xl border border-red-100 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
                <span className="font-bold text-slate-700">
                  Motivo:
                </span>{" "}
                {
                  claseSeleccionada.observaciones
                }
              </p>
            )}
        </section>

        <section className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50/65 p-4 sm:p-5">
          <div className="flex items-center gap-3 text-slate-500">
            <IconoConfiguracion />
            <p className="text-[15px] font-extrabold uppercase tracking-[0.08em] text-slate-600">
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
                    ? "mt-4 w-full rounded-[18px] border border-amber-300 bg-amber-50 px-5 py-3 text-base font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"
                    : "mt-4 w-full rounded-[18px] border border-emerald-300 bg-emerald-50 px-5 py-3 text-base font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
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
              className="mt-4 w-full rounded-[18px] border border-slate-300 bg-white px-5 py-3 text-[18px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Volver a programada
            </button>
          )}

          <div className="mt-4 grid gap-3">
            <button
              type="button"
              onClick={() =>
                editarClase(
                  claseSeleccionada.id
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-[#17324D] px-5 py-4 text-[18px] font-bold text-white transition hover:bg-[#0F2538]"
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
              className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-red-200 bg-white px-5 py-4 text-[18px] font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              <IconoPapelera />
              Borrar clase
            </button>
          </div>
        </section>

        <p className="mt-6 text-center text-sm leading-7 text-slate-500">
          Los bonos se descuentan cuando la clase se realiza o cuando una cancelación es facturable. Se devuelven si vuelve a programada o pasa a no facturable.
        </p>

        {mensajeAccion && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {
              mensajeAccion
            }
          </p>
        )}
      </div>
    </div>
  );
}
