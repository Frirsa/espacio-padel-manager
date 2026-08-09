"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

type Clase = {
  id: string;
  fecha: string;
  hora_inicio: string;
  duracion_minutos: number;
  tipo: string;
  estado: string;
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
    } | null;
  }[];
};

type NoDisponibilidad = {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string | null;
};

type Props = {
  clases: Clase[];
  fechaSeleccionada: string;
  noDisponibilidades: NoDisponibilidad[];
  onClaseActualizada: () => Promise<void>;
};

function fechaLocalISO(fecha: Date) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function crearFecha(fecha: string) {
  const [y,m,d] = fecha.split("-").map(Number);
  return new Date(y,m-1,d);
}

function inicioSemana(fecha: string) {
  const d = crearFecha(fecha);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d;
}

function colorClase(clase: Clase) {
  if (
    clase.estado === "cancelada"
  ) {
    return "border-red-300 bg-red-50 text-red-800";
  }

  if (
    clase.tipo === "club"
  ) {
    return "border-orange-300 bg-orange-50 text-orange-800";
  }

  if (
    clase.tipo === "privada"
  ) {
    return "border-violet-300 bg-violet-100 text-violet-800";
  }

  return "border-[#09a9a3]/60 bg-[#09a9a3]/10 text-[#078b86]";
}

export default function VistaHorarioAgenda({
  clases,
  fechaSeleccionada,
  noDisponibilidades,
  onClaseActualizada,
}: Props) {
  const [
    claseSeleccionada,
    setClaseSeleccionada,
  ] = useState<Clase | null>(null);

  const [
    actualizando,
    setActualizando,
  ] = useState(false);

  const [
    mensajeAccion,
    setMensajeAccion,
  ] = useState("");

  const [
    claseArrastrandoId,
    setClaseArrastrandoId,
  ] = useState<string | null>(null);

  const [
    mensajeMovimiento,
    setMensajeMovimiento,
  ] = useState("");

  const [
    desplazamientoArrastreY,
    setDesplazamientoArrastreY,
  ] = useState(0);
  const inicio = inicioSemana(fechaSeleccionada);
  const dias = Array.from({length:7},(_,i)=>{
    const d=new Date(inicio);
    d.setDate(inicio.getDate()+i);
    return d;
  });

  const horaInicio = 7;
  const horaFin = 23;
  const altoHora = 72;
  const altoTotal = (horaFin-horaInicio)*altoHora;

  function noDisponible(fecha:string) {
    return noDisponibilidades.find(
      n => fecha >= n.fecha_inicio && fecha <= n.fecha_fin
    );
  }

  function editarClase(
    id: string
  ) {
    const volver =
      `/agenda?vista=horario&fecha=${fechaSeleccionada}`;

    window.location.href =
      `/clases?editar=${id}&volver=${encodeURIComponent(
        volver
      )}`;
  }

  async function borrarClaseSeleccionada() {
    if (
      !claseSeleccionada ||
      actualizando
    ) {
      return;
    }

    const confirmar =
      window.confirm(
        "¿Seguro que quieres borrar esta clase?"
      );

    if (!confirmar) {
      return;
    }

    const clase =
      claseSeleccionada;

    setActualizando(true);
    setMensajeAccion("");

    try {
      const {
        error: errorPagos,
      } =
        await supabase
          .from("pagos")
          .delete()
          .eq(
            "clase_id",
            clase.id
          );

      if (errorPagos) {
        throw new Error(
          "No se pudieron eliminar los pagos asociados."
        );
      }

      const {
        error: errorClase,
      } =
        await supabase
          .from("clases")
          .delete()
          .eq(
            "id",
            clase.id
          );

      if (errorClase) {
        throw new Error(
          "No se pudo borrar la clase."
        );
      }

      let avisoBono = "";

      if (
        clase.estado ===
        "realizada"
      ) {
        try {
          for (
            const participante of
            clase.clase_alumnos
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

      setClaseSeleccionada(
        null
      );

      await onClaseActualizada();

      if (avisoBono) {
        window.alert(
          avisoBono
        );
      }
    } catch (error) {
      setMensajeAccion(
        "❌ " +
          (
            error instanceof Error
              ? error.message
              : "No se pudo borrar la clase."
          )
      );
    } finally {
      setActualizando(false);
    }
  }

  async function ajustarBono(
    bonoId: string,
    diferencia: number
  ) {
    const {
      data: bono,
      error,
    } = await supabase
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
            restantes > 0,
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
    clase: Clase,
    estadoNuevo: string
  ) {
    if (
      estadoNuevo !==
        "realizada" ||
      clase.tipo ===
        "club"
    ) {
      await supabase
        .from("pagos")
        .delete()
        .eq(
          "clase_id",
          clase.id
        );

      return;
    }

    const {
      data:
        pagosExistentes,
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
          clase.id
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
      clase.clase_alumnos
    ) {
      if (
        participante.usa_bono
      ) {
        await supabase
          .from("pagos")
          .delete()
          .eq(
            "clase_id",
            clase.id
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
          (pago) =>
            pago.alumno_id ===
            participante.alumno_id
        );

      const datosPago = {
        alumno_id:
          participante.alumno_id,
        clase_id:
          clase.id,
        importe:
          Number(
            participante.importe ||
              0
          ),
        metodo:
          existente?.metodo ||
          "efectivo",
        estado:
          participante.pagado
            ? "pagado"
            : "pendiente",
        fecha_pago:
          clase.fecha,
        notas:
          "Actualizado desde Agenda",
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

  async function cambiarEstadoClase(
    estado:
      | "programada"
      | "realizada"
      | "cancelada"
  ) {
    if (
      !claseSeleccionada
    ) {
      return;
    }

    const clase =
      claseSeleccionada;

    setActualizando(
      true
    );

    setMensajeAccion(
      ""
    );

    try {
      const eraRealizada =
        clase.estado ===
        "realizada";

      const seraRealizada =
        estado ===
        "realizada";

      if (
        eraRealizada !==
        seraRealizada
      ) {
        for (
          const participante of
          clase.clase_alumnos
        ) {
          if (
            participante.usa_bono &&
            participante.bono_id
          ) {
            await ajustarBono(
              participante.bono_id,
              seraRealizada
                ? -1
                : 1
            );
          }
        }
      }

      const {
        error:
          errorClase,
      } =
        await supabase
          .from("clases")
          .update({
            estado,
          })
          .eq(
            "id",
            clase.id
          );

      if (
        errorClase
      ) {
        throw new Error(
          "No se pudo actualizar la clase."
        );
      }

      await sincronizarPagosRapidos(
        clase,
        estado
      );

      setClaseSeleccionada(
        null
      );

      await onClaseActualizada();
    } catch (
      error
    ) {
      setMensajeAccion(
        "❌ " +
          (
            error instanceof Error
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

  async function cambiarCobro(
    participante:
      Clase["clase_alumnos"][number],
    pagado: boolean
  ) {
    if (
      !claseSeleccionada ||
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

      if (
        claseSeleccionada.estado ===
          "realizada" &&
        claseSeleccionada.tipo !==
          "club"
      ) {
        const {
          data:
            pagoExistente,
        } =
          await supabase
            .from("pagos")
            .select(
              "id,metodo"
            )
            .eq(
              "clase_id",
              claseSeleccionada.id
            )
            .eq(
              "alumno_id",
              participante.alumno_id
            )
            .maybeSingle();

        const datosPago = {
          alumno_id:
            participante.alumno_id,
          clase_id:
            claseSeleccionada.id,
          importe:
            Number(
              participante.importe ||
                0
            ),
          metodo:
            pagoExistente?.metodo ||
            "efectivo",
          estado:
            pagado
              ? "pagado"
              : "pendiente",
          fecha_pago:
            claseSeleccionada.fecha,
          notas:
            "Actualizado desde Agenda",
        };

        if (
          pagoExistente
        ) {
          await supabase
            .from("pagos")
            .update(
              datosPago
            )
            .eq(
              "id",
              pagoExistente.id
            );
        } else {
          await supabase
            .from("pagos")
            .insert(
              datosPago
            );
        }
      }

      const claseActualizada = {
        ...claseSeleccionada,

        clase_alumnos:
          claseSeleccionada
            .clase_alumnos
            .map(
              (item) =>
                item.id ===
                participante.id
                  ? {
                      ...item,
                      pagado,
                    }
                  : item
            ),
      };

      setClaseSeleccionada(
        claseActualizada
      );

      await onClaseActualizada();
    } catch (
      error
    ) {
      setMensajeAccion(
        "❌ " +
          (
            error instanceof Error
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
      Clase["clase_alumnos"][number],
    asistio: boolean
  ) {
    if (
      !claseSeleccionada
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

      if (error) {
        throw new Error(
          "No se pudo actualizar la asistencia."
        );
      }

      setClaseSeleccionada({
        ...claseSeleccionada,

        clase_alumnos:
          claseSeleccionada
            .clase_alumnos
            .map(
              (item) =>
                item.id ===
                participante.id
                  ? {
                      ...item,
                      asistio,
                    }
                  : item
            ),
      });

      await onClaseActualizada();
    } catch (
      error
    ) {
      setMensajeAccion(
        "❌ " +
          (
            error instanceof Error
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

  function minutosDesdeMedianoche(
    horaTexto: string
  ) {
    const [
      hora,
      minuto,
    ] =
      horaTexto
        .slice(
          0,
          5
        )
        .split(":")
        .map(Number);

    return (
      hora * 60 +
      minuto
    );
  }

  function haySolapamiento(
    claseId: string,
    fechaNueva: string,
    horaNueva: string,
    duracion: number
  ) {
    const inicioNuevo =
      minutosDesdeMedianoche(
        horaNueva
      );

    const finNuevo =
      inicioNuevo +
      duracion;

    return clases.some(
      (otraClase) => {
        if (
          otraClase.id ===
            claseId ||
          otraClase.fecha !==
            fechaNueva ||
          otraClase.estado ===
            "cancelada"
        ) {
          return false;
        }

        const inicioOtra =
          minutosDesdeMedianoche(
            otraClase.hora_inicio
          );

        const finOtra =
          inicioOtra +
          otraClase.duracion_minutos;

        return (
          inicioNuevo <
            finOtra &&
          finNuevo >
            inicioOtra
        );
      }
    );
  }

  async function moverClase(
    claseId: string,
    fechaNueva: string,
    hora: number,
    minuto = 0
  ) {
    const clase =
      clases.find(
        (item) =>
          item.id ===
          claseId
      );

    if (!clase) {
      return;
    }

    if (
      noDisponible(
        fechaNueva
      )
    ) {
      setMensajeMovimiento(
        "❌ No puedes mover una clase a un día no disponible."
      );

      setTimeout(
        () =>
          setMensajeMovimiento(
            ""
          ),
        3500
      );

      return;
    }

    const horaNueva =
      `${String(
        hora
      ).padStart(
        2,
        "0"
      )}:${String(
        minuto
      ).padStart(
        2,
        "0"
      )}`;

    const inicioMinutos =
      hora * 60 +
      minuto;

    const finMinutos =
      inicioMinutos +
      clase.duracion_minutos;

    if (
      finMinutos >
      horaFin * 60
    ) {
      setMensajeMovimiento(
        "❌ La clase terminaría fuera del horario visible."
      );

      setTimeout(
        () =>
          setMensajeMovimiento(
            ""
          ),
        3500
      );

      return;
    }

    if (
      haySolapamiento(
        clase.id,
        fechaNueva,
        horaNueva,
        clase.duracion_minutos
      )
    ) {
      setMensajeMovimiento(
        "❌ Ese horario se solapa con otra clase."
      );

      setTimeout(
        () =>
          setMensajeMovimiento(
            ""
          ),
        3500
      );

      return;
    }

    setActualizando(
      true
    );

    const {
      error,
    } =
      await supabase
        .from("clases")
        .update({
          fecha:
            fechaNueva,
          hora_inicio:
            horaNueva,
        })
        .eq(
          "id",
          clase.id
        );

    setActualizando(
      false
    );

    if (error) {
      setMensajeMovimiento(
        "❌ No se pudo mover la clase."
      );

      setTimeout(
        () =>
          setMensajeMovimiento(
            ""
          ),
        3500
      );

      return;
    }

    setMensajeMovimiento(
      `✅ Clase movida al ${fechaNueva
        .split("-")
        .reverse()
        .join("/")} a las ${horaNueva}`
    );

    setTimeout(
      () =>
        setMensajeMovimiento(
          ""
        ),
      3500
    );

    await onClaseActualizada();
  }

  function soltarClaseEnDia(
    evento:
      React.DragEvent<HTMLDivElement>,
    fecha: string
  ) {
    evento.preventDefault();

    if (
      noDisponible(
        fecha
      )
    ) {
      return;
    }

    const claseId =
      evento.dataTransfer.getData(
        "text/plain"
      ) ||
      claseArrastrandoId;

    if (!claseId) {
      return;
    }

    const rect =
      evento.currentTarget.getBoundingClientRect();

    const posicionSuperiorTarjeta =
      evento.clientY -
      rect.top -
      desplazamientoArrastreY;

    const altoMediaHora =
      altoHora / 2;

    let indiceMediaHora =
      Math.floor(
        posicionSuperiorTarjeta /
          altoMediaHora
      );

    const totalHuecos =
      (horaFin -
        horaInicio) *
      2;

    indiceMediaHora =
      Math.max(
        0,
        Math.min(
          totalHuecos - 1,
          indiceMediaHora
        )
      );

    const minutosTotales =
      horaInicio * 60 +
      indiceMediaHora *
        30;

    const horaNueva =
      Math.floor(
        minutosTotales / 60
      );

    const minutoNuevo =
      minutosTotales % 60;

    moverClase(
      claseId,
      fecha,
      horaNueva,
      minutoNuevo
    );

    setClaseArrastrandoId(
      null
    );
  }


  function crearClase(
    fecha: string,
    hora: number,
    minuto = 0
  ) {
    if (
      noDisponible(
        fecha
      )
    ) {
      return;
    }

    const horaTexto =
      `${String(
        hora
      ).padStart(
        2,
        "0"
      )}:${String(
        minuto
      ).padStart(
        2,
        "0"
      )}`;

    const volver =
      `/agenda?vista=horario&fecha=${fechaSeleccionada}`;

    window.location.href =
      `/clases?fecha=${fecha}&hora=${encodeURIComponent(
        horaTexto
      )}&volver=${encodeURIComponent(
        volver
      )}`;
  }

  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-xl font-bold text-slate-900">Horario semanal</h2>
        <p className="mt-1 text-sm text-slate-500">
          Pulsa en un hueco para crear una clase. Pulsa una clase para abrir sus acciones rápidas. También puedes arrastrar una clase programada para moverla en tramos de 30 minutos.
        </p>

        {mensajeMovimiento && (
          <p className="mt-3 text-sm font-semibold text-slate-700">
            {mensajeMovimiento}
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1100px]">
          <div className="grid grid-cols-[70px_repeat(7,minmax(140px,1fr))] border-b border-slate-200 bg-slate-50">
            <div />
            {dias.map(d=>{
              const iso=fechaLocalISO(d);
              const nd=noDisponible(iso);
              return (
                <div key={iso} className="border-l border-slate-200 px-2 py-3 text-center">
                  <div className="text-xs font-bold uppercase text-slate-500">
                    {d.toLocaleDateString("es-ES",{weekday:"short"})}
                  </div>
                  <div className="text-lg font-bold text-slate-900">{d.getDate()}</div>
                  {nd && (
                    <div className="mt-1 rounded-md bg-red-100 px-1 py-1 text-[10px] font-bold text-red-700">
                      NO DISPONIBLE{nd.motivo ? ` · ${nd.motivo}` : ""}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-[70px_repeat(7,minmax(140px,1fr))]">
            <div className="relative border-r border-slate-200 bg-slate-50" style={{height:altoTotal}}>
              {Array.from({length:horaFin-horaInicio+1},(_,i)=>horaInicio+i).map(h=>(
                <div
                  key={h}
                  className="absolute right-2 -translate-y-1/2 text-[11px] font-medium text-slate-500"
                  style={{top:(h-horaInicio)*altoHora}}
                >
                  {String(h).padStart(2,"0")}:00
                </div>
              ))}
            </div>

            {dias.map(d=>{
              const fecha=fechaLocalISO(d);
              const nd=noDisponible(fecha);
              const clasesDia=clases.filter(c=>c.fecha===fecha);
              return (
                <div
                  key={fecha}
                  onDragOver={(evento) => {
                    if (!nd) {
                      evento.preventDefault();
                      evento.dataTransfer.dropEffect =
                        "move";
                    }
                  }}
                  onDrop={(evento) =>
                    soltarClaseEnDia(
                      evento,
                      fecha
                    )
                  }
                  className={nd ? "relative border-r border-slate-200 bg-red-50/40" : "relative border-r border-slate-200 bg-white"}
                  style={{height:altoTotal}}
                >
                  {Array.from({length:horaFin-horaInicio},(_,i)=>horaInicio+i).map(h=>(
                    <div key={h}>
                      <button
                        type="button"
                        disabled={!!nd}
                        onClick={()=>crearClase(fecha,h)}
                        className="absolute left-0 right-0 border-t border-slate-200 hover:bg-teal-50/70 disabled:cursor-not-allowed"
                        style={{top:(h-horaInicio)*altoHora,height:altoHora/2}}
                        title={nd ? "Día no disponible" : `Crear o mover clase a las ${String(h).padStart(2,"0")}:00`}
                      />
                      <button
                        type="button"
                        disabled={!!nd}
                        onClick={()=>crearClase(fecha,h,30)}
                        className="absolute left-0 right-0 border-t border-dashed border-slate-100 hover:bg-teal-50/70 disabled:cursor-not-allowed"
                        style={{top:(h-horaInicio)*altoHora+altoHora/2,height:altoHora/2}}
                        title={nd ? "Día no disponible" : `Crear o mover clase a las ${String(h).padStart(2,"0")}:30`}
                      />
                    </div>
                  ))}

                  {clasesDia.map(clase=>{
                    const [h,m]=clase.hora_inicio.split(":").map(Number);
                    const top=((h-horaInicio)+(m/60))*altoHora;
                    const height=Math.max(30,(clase.duracion_minutos/60)*altoHora);
                    const alumnos=clase.clase_alumnos
                      .map(x=>x.alumnos)
                      .filter(Boolean)
                      .map(a=>`${a?.nombre||""} ${a?.apellidos||""}`.trim())
                      .join(", ");
                    return (
                      <button
                        key={clase.id}
                        type="button"
                        draggable={
                          clase.estado ===
                          "programada"
                        }
                        onDragStart={(evento) => {
                          if (
                            clase.estado !==
                            "programada"
                          ) {
                            evento.preventDefault();
                            return;
                          }

                          const rect =
                            evento.currentTarget.getBoundingClientRect();

                          setDesplazamientoArrastreY(
                            evento.clientY -
                              rect.top
                          );

                          setClaseArrastrandoId(
                            clase.id
                          );

                          evento.dataTransfer.setData(
                            "text/plain",
                            clase.id
                          );

                          evento.dataTransfer.effectAllowed =
                            "move";
                        }}
                        onDragEnd={() =>
                          setClaseArrastrandoId(
                            null
                          )
                        }
                        onClick={() => {
                          if (
                            claseArrastrandoId
                          ) {
                            return;
                          }

                          setMensajeAccion("");
                          setClaseSeleccionada(
                            clase
                          );
                        }}
                        className={`absolute left-1 right-1 z-10 overflow-hidden rounded-lg border p-2 text-left text-[11px] leading-tight shadow-sm transition hover:z-20 hover:shadow-md ${
                          clase.estado === "programada"
                            ? "cursor-grab active:cursor-grabbing"
                            : "cursor-pointer"
                        } ${colorClase(clase)}`}
                        style={{
                          top,
                          height,
                          opacity:
                            claseArrastrandoId ===
                            clase.id
                              ? 0.55
                              : 1,
                        }}
                        title={
                          clase.estado === "programada"
                            ? "Pulsa para acciones rápidas o arrastra para mover"
                            : "Abrir acciones rápidas"
                        }
                      >
                        <div className="font-bold">
                          {clase.hora_inicio.slice(0,5)} · {clase.duracion_minutos} min
                        </div>
                        <div className="mt-1 font-semibold">{alumnos || "Sin alumnos"}</div>
                        {clase.ubicaciones?.nombre && (
                          <div className="mt-1 truncate opacity-80">{clase.ubicaciones.nombre}</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {claseSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">

          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">

            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#09a9a3]">
                  Acciones rápidas
                </p>

                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  {claseSeleccionada.hora_inicio.slice(0, 5)} ·{" "}
                  {claseSeleccionada.duracion_minutos} min
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {claseSeleccionada.ubicaciones?.nombre ||
                    "Sin ubicación"}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setClaseSeleccionada(
                    null
                  )
                }
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200"
              >
                Cerrar
              </button>

            </div>

            {claseSeleccionada.tipo !== "club" &&
              claseSeleccionada.clase_alumnos.length > 0 && (
              <div className="mt-6 rounded-2xl bg-slate-50 p-4">

                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Asistencia · cobro · bono
                </p>

                <div className="mt-3 space-y-2">

                  {claseSeleccionada.clase_alumnos.map(
                    (participante) => {
                      const nombre =
                        participante.alumnos
                          ? `${participante.alumnos.nombre} ${participante.alumnos.apellidos || ""}`.trim()
                          : "Alumno";

                      return (
                        <div
                          key={participante.id}
                          className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-3"
                        >

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {nombre}
                            </p>

                            {participante.usa_bono ? (
                              <p className="mt-1 text-xs font-bold text-violet-600">
                                🎟 Bono asignado
                              </p>
                            ) : (
                              <p className="mt-1 text-xs text-slate-500">
                                {Number(
                                  participante.importe || 0
                                ).toFixed(2)} €
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap justify-end gap-2">

                            <button
                              type="button"
                              disabled={actualizando}
                              onClick={() =>
                                cambiarAsistencia(
                                  participante,
                                  !participante.asistio
                                )
                              }
                              className={
                                participante.asistio
                                  ? "rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700"
                                  : "rounded-full bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600"
                              }
                            >
                              {participante.asistio
                                ? "Asistió ✓"
                                : "No asistió"}
                            </button>

                            {participante.usa_bono ? (
                              <span className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-700">
                                Bono
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={actualizando}
                                onClick={() =>
                                  cambiarCobro(
                                    participante,
                                    !participante.pagado
                                  )
                                }
                                className={
                                  participante.pagado
                                    ? "rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700"
                                    : "rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700"
                                }
                              >
                                {participante.pagado
                                  ? "Cobrado ✓"
                                  : "Pendiente"}
                              </button>
                            )}

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

                <p className="mt-3 text-[11px] leading-5 text-slate-500">
                  Los bonos se descuentan al marcar la clase como realizada y se devuelven si vuelve a programada o se cancela.
                </p>

              </div>
            )}

            <div className="mt-6 grid gap-3">

              <button
                type="button"
                disabled={actualizando}
                onClick={() =>
                  cambiarEstadoClase(
                    "realizada"
                  )
                }
                className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
              >
                ✓ Marcar como realizada
              </button>

              <button
                type="button"
                disabled={actualizando}
                onClick={() =>
                  cambiarEstadoClase(
                    "cancelada"
                  )
                }
                className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                ✕ Marcar como cancelada
              </button>

              {claseSeleccionada.estado !== "programada" && (
                <button
                  type="button"
                  disabled={actualizando}
                  onClick={() =>
                    cambiarEstadoClase(
                      "programada"
                    )
                  }
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Volver a programada
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  editarClase(
                    claseSeleccionada.id
                  )
                }
                className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700"
              >
                Editar clase completa
              </button>

              <button
                type="button"
                disabled={actualizando}
                onClick={
                  borrarClaseSeleccionada
                }
                className="rounded-xl border border-red-300 bg-white px-5 py-3 font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                🗑 Borrar clase
              </button>

            </div>

            {mensajeAccion && (
              <p className="mt-4 text-sm font-medium text-red-600">
                {mensajeAccion}
              </p>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
