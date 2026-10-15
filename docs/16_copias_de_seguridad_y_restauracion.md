# Manual de Usuario: Copias de Seguridad y Restauración Integral (Backups)

## 1. Propósito del Módulo
El módulo de **Copias de Seguridad (Backup)** brinda protección ante fallas de hardware, caídas de tensión eléctrica, formateos accidentales o reemplazo de equipos informáticos. Permite generar respaldos integrales de la base de datos de la heladería en formato binario nativo de PostgreSQL (`.backup`), descargarlos a un medio externo seguro y restaurarlos íntegramente en caso de contingencia.

* **Ruta de acceso en el sistema**: Menú Lateral > **Copias de Seguridad** (`/backup`).
* **Permisos requeridos**: Acceso exclusivo a roles `ADMIN` y `OWNER`, o permiso explícito `backup`.

---

## 2. Elementos de la Pantalla de Backups

1. **Encabezado Informativo**:
   * Indica el motor de base de datos (`PostgreSQL 16`), la base activa (`heladeriadb`) y la cantidad de respaldos resguardados en el servidor.
2. **Botón Principal "Generar Respaldo Ahora"**:
   * Ejecuta la copia completa de todos los módulos del sistema de manera instantánea y sin interrumpir la operación del Punto de Venta.
3. **Tabla de Copias de Seguridad Disponibles**:
   * **Nombre del Archivo**: Formato con fecha y hora (`backup_heladeriadb_YYYY-MM-DD_HH-mm-ss.backup`).
   * **Fecha y Hora de Creación**: Momento exacto de captura de los datos.
   * **Tamaño del Archivo**: Peso en Megabytes (MB).
   * **Acciones**:
     * Botón **Descargar** (ícono nube / flecha abajo): Guarda el archivo en tu computadora local o pendrive.
     * Botón **Restaurar** (ícono reloj / restore): Recupera el estado de la base de datos a ese punto en el tiempo.
     * Botón **Eliminar** (ícono basurero): Borra respaldos obsoletos para liberar espacio en disco.

---

## 3. Procedimientos Paso a Paso

### Procedimiento A: Cómo Crear una Copia de Seguridad Manual

1. Ingresa a **Copias de Seguridad** (`/backup`).
2. Haz clic en el botón azul **"Generar Respaldo Ahora"**.
3. El sistema comenzará a procesar la instantánea:
   * El botón cambiará temporalmente a *"Generando respaldo..."*.
   * Se respaldan de forma atómica: Catálogos de helados, recetas, clientes, usuarios, ventas históricas, cierres de caja, timbrados e inventario físico.
4. Al finalizar (habitualmente en 2 a 5 segundos), aparecerá una notificación verde: *"Respaldo completado exitosamente"*.
5. El nuevo archivo aparecerá como el primer registro de la lista con su tamaño exacto.

---

### Procedimiento B: Cómo Descargar y Custodiar el Respaldo Fuera del Local

> [!IMPORTANT]
> **Regla de Oro de la Seguridad (Copia Externa)**: Mantener las copias únicamente dentro de la misma computadora de la heladería es riesgoso en caso de robo o daño del disco duro. Se debe descargar periódicamente el archivo a un almacenamiento externo.

1. En la tabla de respaldos, localiza la copia más reciente.
2. En la columna de acciones, haz clic en el botón **Descargar** (ícono flecha abajo 📥).
3. Tu navegador web descargará el archivo `.backup`.
4. **Almacenamiento Seguro**:
   * Copia el archivo a una memoria USB (pendrive) que guardes fuera del local.
   * O súbelo a un almacenamiento seguro en la nube (Google Drive, OneDrive, etc.).

---

### Procedimiento C: Cómo Restaurar el Sistema a una Copia Previa

Si cambiaste de computadora, sufriste una pérdida de datos o requieres volver a un estado anterior:

> [!CAUTION]
> **Advertencia de Sobreescritura**: La restauración reemplaza la totalidad de las tablas y registros actuales por los datos guardados en el archivo de respaldo. Todas las ventas o cambios cargados con posterioridad a la fecha de ese archivo se sustituirán. Se aconseja generar un respaldo previo antes de restaurar.

1. En la lista de respaldos disponibles, localiza la versión que deseas recuperar.
2. Haz clic en el botón **Restaurar** (ícono de restauración 🔄).
3. El sistema desplegará un **Modal de Advertencia de Alta Seguridad**:
   * Detallará el nombre del archivo y la fecha a la que se retrotraerán los datos.
   * Te solicitará confirmación explícita.
4. Haz clic en **"Confirmar y Restaurar Base de Datos"**.
5. El proceso tomará unos segundos mientras se aplican las tablas de forma íntegra.
6. Al finalizar, el sistema se reiniciará automáticamente y te solicitará iniciar sesión para continuar operando con la información recuperada.
