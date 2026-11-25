"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  nota: string;
  className: string;
};

export default function NotaClaseRapida({
  nota,
  className,
}: Props) {
  const [abierta, setAbierta] = useState(false);

  useEffect(() => {
    if (!abierta) {
      return;
    }

    function cerrarConEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        evento.stopPropagation();
        setAbierta(false);
      }
    }

    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [abierta]);

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        title="Ver nota de la clase"
        aria-label="Ver nota de la clase"
        className={`pointer-events-auto ${className}`}
        onPointerDown={(evento) => evento.stopPropagation()}
        onKeyDown={(evento) => {
          evento.stopPropagation();
          if (evento.key === "Enter" || evento.key === " ") {
            evento.preventDefault();
            setAbierta(true);
          }
        }}
        onClick={(evento) => {
          evento.stopPropagation();
          setAbierta(true);
        }}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 3.75h8.5L19 8.25V20.25H6Z" />
          <path d="M14.5 3.75v4.5H19" />
          <path d="M9 12h6M9 15.5h4.5" />
        </svg>
      </span>

      {abierta && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4"
            role="presentation"
            onClick={(evento) => {
              evento.stopPropagation();
              setAbierta(false);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="nota-clase-titulo"
              className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
              onClick={(evento) => evento.stopPropagation()}
            >
              <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
                <h2
                  id="nota-clase-titulo"
                  className="text-base font-extrabold text-[#17324D]"
                >
                  Nota de la clase
                </h2>
                <button
                  type="button"
                  autoFocus
                  aria-label="Cerrar nota"
                  onClick={(evento) => {
                    evento.stopPropagation();
                    setAbierta(false);
                  }}
                  className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00A79C]"
                >
                  Cerrar
                </button>
              </header>
              <div className="max-h-[65vh] overflow-y-auto px-5 py-4">
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                  {nota}
                </p>
              </div>
            </section>
          </div>,
          document.body
        )}
    </>
  );
}
