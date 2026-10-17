export default function EtiquetaMonitor({
  nombre,
  className = "mt-1 block truncate text-[10px] font-semibold",
}: {
  nombre?: string | null;
  className?: string;
}) {
  const monitor = nombre?.trim();
  if (!monitor || monitor.toLocaleLowerCase("es") === "fran") return null;

  return <span className={className} title={`Monitor: ${monitor}`}>Monitor: {monitor}</span>;
}
