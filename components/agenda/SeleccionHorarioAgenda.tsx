"use client";

import { useEffect, useRef, useState, type HTMLAttributes } from "react";

type Tramo = { inicio: number; duracion: number };
type Props = HTMLAttributes<HTMLDivElement> & {
  onSeleccion: (inicio: number, duracion: number) => void;
  estaBloqueado: (inicio: number, duracion: number) => boolean;
};

const hora = (minutos: number) => `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;

// Los botones siguen gestionando clic, teclado y tacto. Solo el ratón o lápiz
// seleccionan un tramo; los eventos de arrastre de clases permanecen intactos.
export default function SeleccionHorarioAgenda({ children, onSeleccion, estaBloqueado, ...props }: Props) {
  const gesto = useRef<{ pointerId: number; inicio: number; y: number; activo: boolean } | null>(null);
  const suprimirClic = useRef(false);
  const [tramo, setTramo] = useState<Tramo | null>(null);

  useEffect(() => {
    const cancelar = (event: KeyboardEvent) => {
      if (event.key === "Escape" && gesto.current) {
        suprimirClic.current = gesto.current.activo;
        gesto.current = null;
        setTramo(null);
      }
    };
    window.addEventListener("keydown", cancelar);
    return () => window.removeEventListener("keydown", cancelar);
  }, []);

  function calcular(y: number, elemento: HTMLDivElement, inicio: number): Tramo {
    const rect = elemento.getBoundingClientRect();
    const fin = Math.max(7 * 60, Math.min(23 * 60, 7 * 60 + Math.round((y - rect.top) / rect.height * 32) * 30));
    return { inicio: Math.min(inicio, fin), duracion: Math.max(30, Math.abs(fin - inicio)) };
  }

  const bloqueado = tramo ? estaBloqueado(tramo.inicio, tramo.duracion) : false;
  return <div {...props}
    onPointerDown={event => {
      suprimirClic.current = false;
      if (event.button !== 0 || event.pointerType === "touch") return;
      const boton = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-minuto-agenda]");
      if (!boton || boton.disabled) return;
      gesto.current = { pointerId: event.pointerId, inicio: Number(boton.dataset.minutoAgenda), y: event.clientY, activo: false };
      boton.setPointerCapture(event.pointerId);
    }}
    onPointerMove={event => {
      const actual = gesto.current;
      if (!actual || actual.pointerId !== event.pointerId) return;
      if (Math.abs(event.clientY - actual.y) < 6 && !actual.activo) return;
      actual.activo = true;
      event.preventDefault();
      setTramo(calcular(event.clientY, event.currentTarget, actual.inicio));
    }}
    onPointerUp={event => {
      const actual = gesto.current;
      if (!actual || actual.pointerId !== event.pointerId) return;
      gesto.current = null;
      setTramo(null);
      if (!actual.activo) return;
      suprimirClic.current = true;
      event.preventDefault();
      const seleccionado = calcular(event.clientY, event.currentTarget, actual.inicio);
      if (estaBloqueado(seleccionado.inicio, seleccionado.duracion)) {
        window.alert("El tramo seleccionado coincide con una no disponibilidad.");
        return;
      }
      onSeleccion(seleccionado.inicio, seleccionado.duracion);
    }}
    onPointerCancel={() => { gesto.current = null; setTramo(null); }}
    onLostPointerCapture={() => { gesto.current = null; setTramo(null); }}
    onClickCapture={event => {
      if (suprimirClic.current) {
        event.preventDefault();
        event.stopPropagation();
        suprimirClic.current = false;
      }
    }}
  >
    {children}
    {tramo && <div aria-live="polite"
      className={`pointer-events-none absolute inset-x-0 z-50 overflow-hidden rounded border-2 px-1 py-1 text-xs font-bold ${bloqueado ? "border-red-500 bg-red-100/90 text-red-800" : "border-[#00A79C] bg-teal-100/90 text-[#17324D]"}`}
      style={{ top: `${(tramo.inicio - 420) / 960 * 100}%`, height: `${tramo.duracion / 960 * 100}%` }}>
      {hora(tramo.inicio)}–{hora(tramo.inicio + tramo.duracion)} · {tramo.duracion} min{bloqueado ? " · No disponible" : ""}
    </div>}
  </div>;
}
