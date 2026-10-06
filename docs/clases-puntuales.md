# Clases puntuales y gastos de monitores

En Clases, «Clase puntual sin alumnos» permite registrar un nombre libre (por ejemplo, «Grupo belgas 1»), número de personas, monitor, fecha, hora, duración, ubicación y pista. También se puede elegir esta opción desde el formulario de nueva clase que se abre desde la agenda. No crea alumnos, grupos permanentes ni series.

Las observaciones admiten nombres y notas sin convertirlos en fichas de alumnos. El nombre del monitor se escribe directamente; se ofrecen los nombres ya utilizados como sugerencias. «Fran» es el monitor propio por defecto. Las clases existentes sin monitor se consideran propias al comprobar horarios.

El cobro es por el total de la clase. Se guarda con método, fecha y estado pendiente o cobrado en la tabla de pagos existente. El coste del monitor es independiente del coste de pista; su pago dispone de estado, fecha y método. El resultado de una clase realizada descuenta ambos gastos, aunque el monitor esté pendiente de pago. Las cancelaciones conservan el criterio existente: si son facturables, aportan el ingreso sin costes de una sesión impartida.

Los ingresos y gastos del Dashboard se incorporan cuando llega la fecha de la clase. El informe mensual incluye todo el mes y separa los costes de pista por ubicación y los de monitor por nombre. El saldo del club sólo descuenta pistas. El total del grupo y sus gastos aparecen en el resumen y el acumulado. Google Calendar recibe el nombre libre, monitor, pista y observaciones.

Las clases simultáneas pueden tener monitores y pistas distintos. No se permite ocupar al mismo monitor ni la misma pista y ubicación en horarios coincidentes. La no disponibilidad propia se aplica a Fran. Los grupos puntuales se editan desde su formulario para mantener el guardado de la clase y su cobro en una única transacción. La agenda abre ese formulario y vuelve a la vista de origen tras guardar. El movimiento por arrastre continúa disponible para las clases habituales; una puntual se mueve editando su fecha y hora.

## Preparación de producción

**La migración debe aplicarse antes de publicar el código.** Vercel no ejecuta migraciones de Supabase. Este cambio está preparado en una rama y no activa automáticamente la nueva función ni modifica los datos de producción.

1. Comprobar que la copia de seguridad de datos está actualizada.
2. En el SQL Editor del proyecto Supabase correspondiente a esta aplicación, ejecutar una vez el archivo `supabase/migrations/202610060800_clases_puntuales.sql` completo. La transacción añade columnas a `clases`, una nueva función de guardado y un disparador para mantener sincronizado el estado del cobro. Mantiene las tablas existentes, sus políticas RLS y las funciones de las clases habituales. Los valores iniciales de gasto de monitor son cero.
3. Confirmar la ejecución correcta antes de fusionar la propuesta. Si falla, la transacción no deja cambios parciales. No volver a ejecutarla si ya se aplicó correctamente.
4. Fusionar la propuesta y esperar la publicación de Vercel.
5. Crear una clase puntual de prueba, comprobarla en Agenda y Cobros, editar su coste de monitor y revisar Dashboard e informe mensual. Comprobar también una clase habitual.

## Validación preparada

- `node --test tests/economia-clases-puntuales.test.cjs`: ingresos sin alumnos, costes de monitores, dos pistas, gastos pendientes/pagados, saldo del club, cancelaciones y compatibilidad con precios de bonos.
- Compilación de producción y comprobación de TypeScript.
- Comprobaciones adicionales locales del formulario React (crear, editar, céntimos, observaciones, error de guardado, doble envío y sincronización de calendario), de la migración en PostgreSQL de pruebas (transacciones, permisos, cobros y horarios) y del PDF mensual con varias pistas y monitores.

Las pruebas locales del SQL utilizan una base de pruebas con el esquema de las tablas implicadas; la migración todavía debe comprobarse en el proyecto Supabase real antes de publicar.
