import { useId } from "react";

export type PistaCancelacion = { sePaga: boolean | null; importe: string };

export const pistaCancelacionSinElegir: PistaCancelacion = { sePaga: null, importe: "" };

export function pistaCancelacionGuardada(importe: number | null | undefined): PistaCancelacion {
  return importe ? { sePaga: true, importe: String(importe) } : { sePaga: false, importe: "" };
}

export function importePistaCancelacion({ sePaga, importe }: PistaCancelacion): number | null {
  if (sePaga === false) return 0;
  if (sePaga !== true) return null;
  const texto = importe.trim().replace(",", ".");
  if (!/^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(texto)) return null;
  const valor = Number(texto);
  return Number.isFinite(valor) && valor > 0 ? valor : null;
}

export default function CamposPistaCancelacion({ valor, costeHabitual, onChange }: {
  valor: PistaCancelacion;
  costeHabitual: string;
  onChange: (valor: PistaCancelacion) => void;
}) {
  const id = useId();

  return (
    <fieldset className="mt-4 max-w-md">
      <legend className="text-xs font-bold uppercase tracking-wide text-red-700">
        ¿Pagas el alquiler de la pista?
      </legend>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {[true, false].map((sePaga) => (
          <button
            key={String(sePaga)}
            type="button"
            aria-pressed={valor.sePaga === sePaga}
            onClick={() => onChange({ sePaga, importe: valor.importe || costeHabitual })}
            className={`rounded-xl border px-4 py-2.5 text-sm font-bold ${
              valor.sePaga === sePaga
                ? "border-slate-700 bg-slate-700 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {sePaga ? "Sí" : "No"}
          </button>
        ))}
      </div>
      {valor.sePaga === true && (
        <div className="mt-3">
          <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
            Importe de pista que pagas (€)
          </label>
          <input
            id={id}
            type="text"
            inputMode="decimal"
            value={valor.importe}
            onChange={(event) => onChange({ ...valor, importe: event.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
          />
          {importePistaCancelacion(valor) === null && (
            <p className="mt-1 text-xs text-red-700">Introduce un importe mayor que cero con hasta dos decimales.</p>
          )}
        </div>
      )}
    </fieldset>
  );
}
