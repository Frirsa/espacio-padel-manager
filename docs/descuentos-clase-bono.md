# Descuento en una sesión de bono

En Agenda, abre una clase realizada que utilice un bono y despliega **Descuento de esta clase en el bono**. También está disponible en la sección Economía del listado de Clases.

1. Mantén los alumnos vinculados al bono y registra quién ha asistido.
2. Introduce el descuento y su motivo (por ejemplo, «Solo asiste un alumno»).
3. Si recibiste el importe rebajado, selecciona el cobro al que se aplicó. Su importe registrado se corrige conservando el método, la fecha y la identidad del cobro. Si recibiste el importe completo, conserva los cobros: la diferencia aparece como saldo a favor en Bonos. Este paso no representa una devolución de dinero.
4. Guarda el descuento. Para retirarlo, guarda 0 €.

Ejemplo de un bono de 10 sesiones y 340 €: descuento de 3 € en una sesión → esa sesión vale 31 €, las otras 34 €, y el bono queda en 337 €. Con una pista de 6 €, el beneficio de esa sesión es 25 €, frente a los 28 € habituales. No se modifica el consumo: la clase realizada sigue consumiendo una sesión completa del bono compartido.

Los ajustes se guardan en `bonos.ajustes_clase`, con clase, motivo, fecha y cobro corregido si lo hubiera. `importe_pagado` conserva su uso anterior como precio final del bono. El precio original se recupera sumando sus descuentos; el reparto por sesión se calcula sobre ese precio y solo se resta el descuento de la sesión correspondiente. La RPC bloquea clase y bono, comprueba el descuento anterior y guarda el ajuste y la corrección de cobro en una transacción.

El detalle de participantes se recalcula en céntimos para coincidir con Agenda, Clases, Dashboard, informes e historial de alumnos. Las ediciones de clase conservan el ajuste. Para cancelar, borrar o retirar el bono de una clase con descuento hay que retirar primero el descuento. Las copias incluyen los ajustes y `bono_cobros`; el borrado de restauración elimina los bonos antes de las clases.

## Verificación

`npm test`, `npx tsc --noEmit` y `npm run build` (con variables de Supabase configuradas). Las pruebas SQL usan PostgreSQL de PGlite y cubren descuentos sucesivos, retirada, céntimos, corrección de cobros, reintentos, reversión de errores, reemplazo de participantes y restauración.

## Pago conjunto en bonos compartidos

Al crear el bono, la opción **Forma de cobro del bono compartido** permite elegir **Pago conjunto** (predeterminada) o **Cada alumno paga su parte**, tanto pagado como pendiente. Un pago conjunto genera un único movimiento para todo el bono.

En **Bonos → Cobros** y en el descuento de una clase se pueden unificar registros que correspondan a un mismo pago, siempre que tengan igual estado, fecha y método. La operación conserva el total recibido, remapea los descuentos al movimiento conjunto y guarda los movimientos originales en `bono_cobros.origen_cobros`. No aplica otro descuento ni modifica las clases consumidas.
