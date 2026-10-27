# Creación de clases

La pantalla permite combinar un concepto libre y alumnos registrados. Es obligatorio indicar al menos uno de los dos. La repetición se elige dentro del formulario y conserva los mismos campos para una sola fecha y para series semanales.

El concepto se guarda en `concepto_clase`, independientemente de los cobros y bonos. La selección de alumnos conserva los cobros por alumno, el precio total y los bonos habituales. Sin alumnos, la clase tiene un precio total y un número de participantes. Agenda, Dashboard, pagos e informes muestran el concepto si está indicado.

El ingreso extra se guarda por separado en `ingreso_extra`, con su descripción opcional en `ingreso_extra_concepto`. Tiene el mismo tratamiento económico que en las clases habituales: se suma al ingreso base, sin añadirlo de nuevo al pago del precio de la clase.

Las clases puntuales anteriores mantienen `nombre_grupo_libre`, sus identificadores y su modalidad de cobro para conservar el historial. Se editan desde la pantalla común y admiten ingresos extra. En esas clases históricas, los alumnos añadidos identifican participantes; el cobro sigue siendo único para toda la clase.

Las clases programadas sin cobrar no generan pagos pendientes. Las realizadas y canceladas facturables generan su cobro. Las clases sin alumnos permiten anticipos, también en series; elegir Pagado al crear una serie registra un anticipo por cada sesión. Cambiar el pago desde Pagos actualiza el estado que muestra la agenda.

La migración añade dos columnas y actualiza las funciones de guardado y sincronización de cobros sin modificar las clases existentes. Debe aplicarse antes del despliegue del cliente.

Validación: pruebas del formulario real con hooks controlados; pruebas SQL en PGlite con las RPC atómicas capturadas del despliegue; TypeScript y compilación de Next.js.
