# Monitores en la pantalla habitual de clases

El formulario de Clases permite asignar monitor y coste a clases de bono, clases sueltas y series. Fran aparece por defecto. Los conceptos libres siguen disponibles dentro de ese mismo formulario. Se retira el formulario separado de clases puntuales y su entrada especial en la agenda.

Las clases anteriores conservan sus identificadores, alumnos, fechas, importes y cobros. La inicialización del registro de monitores importa sus nombres sin reescribir las clases. Los nombres guardados en las clases constituyen el historial; desactivar un monitor no altera sus gastos anteriores. Los cobros puntuales históricos conservan su modalidad de cobro.

## Aplicar la actualización

1. Exportar una copia de los datos desde la aplicación.
2. Leer en Supabase las definiciones vigentes de `guardar_clase_atomica` y `crear_serie_atomica`. Confirmar que sus argumentos coinciden con los usados en las llamadas del código. Estas definiciones no están versionadas en este repositorio.
3. Aplicar `supabase/migrations/202610170800_monitores_clases.sql` en el proyecto correcto de Supabase. La migración comprueba las firmas, utiliza una transacción y conserva las funciones anteriores. Si falla, se revierte completa.
4. Publicar el cambio de código después de aplicar la migración. No publicar el formulario nuevo contra una base sin actualizar.
5. Verificar con una sesión autenticada: monitores históricos importados, edición de una clase de bono programada con sustituto durante una ausencia personal, coste y pago al monitor, y edición de una clase puntual anterior con su cobro intacto. Verificar también alta de otra clase y serie con sustituto.
6. Comprobar con datos de prueba que realizar una clase consume una sesión del bono, reeditarla conserva el saldo y no crea un cobro adicional, y deshacer la realización repone la sesión conforme a las reglas vigentes.

La migración añade `monitores`, con RLS por usuario, y dos envolturas de las operaciones atómicas existentes. El guardado de la clase, metadatos del monitor y participantes de conceptos libres se realiza dentro de la misma transacción. Los informes económicos existentes ya descuentan `coste_monitor` y no requieren una segunda contabilización del gasto.

El catálogo de monitores se incluye en las copias nuevas. Las copias antiguas siguen siendo válidas; al restaurarlas, el catálogo se reconstruye al abrir Clases o Monitores.

## Validación local

- `npm test`: pruebas del formulario real, agenda, economía y migraciones con PostgreSQL embebido (PGlite).
- `npm run build`: compilación y TypeScript, usando valores públicos ficticios de Supabase para la compilación local.
- ESLint de los nuevos componentes y del módulo de monitores.

Las pruebas de la nueva envoltura utilizan dobles de las dos RPC anteriores. Comprueban paso de argumentos y reversión de transacciones; no sustituyen la revisión de sus definiciones reales ni la comprobación con la base de datos desplegada.
