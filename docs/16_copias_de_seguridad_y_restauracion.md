# Manual de Usuario: Copias de Seguridad y Restauración Integral (Backups)

## 1. Propósito del Módulo
El módulo de **Copias de Seguridad (Backup)** brinda protección ante fallas de hardware, caídas de tensión eléctrica, formateos accidentales o reemplazo de equipos informáticos. Permite generar respaldos integrales de la base de datos PostgreSQL de la heladería en formato binario comprimido (`.dump`), descargarlos a un medio externo seguro y restaurarlos íntegramente ante cualquier contingencia.

* **Ruta de acceso en el sistema**: Menú Lateral > **Copias de Seguridad** (`/backup`).
* **Permisos requeridos**: Acceso exclusivo a roles `ADMIN` y `OWNER`, o permiso explícito `backup`.

---

## 2. Elementos de la Pantalla de Backups

1. **Encabezado y Estado del Motor**:
   * Indica la versión del motor (`PostgreSQL 16 Alpine`), base de datos activa (`heladeriadb`) y la cantidad de respaldos resguardados en el servidor.
2. **Tarjeta 1: "Generar Respaldo Integral"**:
   * Crea un volcado binario completo mediante el comando nativo `pg_dump -Fc` con compresión gzip.
   * Preserva al 100% las 28 tablas del sistema, claves primarias, foráneas, secuencias numéricas de comprobantes, compras a proveedores y asientos fiscales.
   * Dispara automáticamente la descarga del archivo `.dump` a la computadora del usuario al terminar.
3. **Tarjeta 2: "Restaurar Base de Datos" (Zona de Subida / Dropzone)**:
   * Permite arrastrar o examinar un archivo `.dump` previamente descargado para restaurarlo.
4. **Historial de Respaldos Almacenados en el Servidor**:
   * Lista de copias resguardadas con nombre (`backup_heladeria_YYYYMMDD_HHmmss.dump`), tamaño exacto (KB/MB), fecha y botones para:
     - **Descargar** (flecha 📥).
     - **Restaurar desde Servidor** (ícono de recarga 🔄 con modal de confirmación).
     - **Eliminar** (ícono basurero 🗑️).

---

## 3. Procedimientos Paso a Paso

### Procedimiento A: Cómo Generar y Descargar un Respaldo Manual

1. Ingresa a **Copias de Seguridad** (`/backup`).
2. Haz clic en el botón azul **"Generar y Descargar Respaldo Ahora"**.
3. El sistema ejecutará el volcado en segundo plano de manera atómica (sin interrumpir las ventas en el POS).
4. Al finalizar (habitualmente en 1 a 3 segundos):
   * Tu navegador web descargará automáticamente el archivo `.dump` (ej. `backup_heladeria_20261018_181323.dump`).
   * El archivo quedará además registrado en la tabla inferior del servidor.
5. **Recomendación de Seguridad**: Copia este archivo `.dump` a una memoria USB (pendrive) o súbelo a una carpeta en la nube fuera del local.

---

### Procedimiento B: Cómo Restaurar desde un Archivo Local (.dump)

Si deseas restablecer el sistema utilizando un archivo de respaldo que tienes guardado en tu computadora:

1. Ve a `/backup` > Tarjeta **"Restaurar Base de Datos"**.
2. Arrastra el archivo `.dump` a la caja punteada (*dropzone*) o haz clic en *"Haz clic para examinar"* y selecciónalo.
3. Verifica que se visualice el nombre del archivo y su tamaño.
4. Haz clic en el botón rojo **"Restaurar Base de Datos con este Archivo"**.
5. Se abrirá una ventana de advertencia de seguridad solicitando confirmación explícita.
6. Pulsa **"Sí, Restaurar Ahora"**.
7. El sistema ejecutará la restauración. Al completarse, emitirá una notificación de éxito y refrescará los datos del sistema.

---

### Procedimiento C: Procedimiento de Recuperación ante Desastres (Disaster Recovery desde Cero)

#### ¿Qué ocurre si se borra todo (incluyendo los volúmenes de Docker) y se vuelve a levantar el sistema?
**El sistema se recupera al 100% sin pérdida de información siguiendo estos pasos:**

1. **Levantamiento inicial:** Al ejecutar `docker compose up -d` en un servidor nuevo o tras borrar los volúmenes, PostgreSQL inicializa una base limpia y el backend carga las semillas de fábrica con el usuario administrador por defecto:
   - **Usuario:** `admin`
   - **Contraseña:** `admin123`
2. **Acceso al módulo de respaldo:**
   - Inicia sesión en el sistema web con `admin` / `admin123`.
   - Ingresa a **Copias de Seguridad** (`/backup`).
3. **Carga del Respaldo:**
   - Arrastra tu archivo `.dump` guardado previamente y confirma la restauración.
4. **Acción interna de PostgreSQL:**
   - El motor ejecuta:
     ```bash
     pg_restore -h db -p 5432 -U postgres -d heladeriadb --clean --if-exists --no-owner archivo.dump
     ```
   - Gracias al modificador `--clean --if-exists`, PostgreSQL **elimina de inmediato las tablas semilla vacías** y restablece todas las 28 tablas, ventas, compras, catálogo maestro multi-proveedor y los usuarios con sus contraseñas originales.
5. **Finalización:**
   - Una vez terminada la restauración, inicias sesión normalmente con los usuarios y contraseñas reales que tenías guardados en tu copia de seguridad.

---

## 4. Requisitos Técnicos del Sistema

Para el correcto funcionamiento de los respaldos y restauraciones, el entorno cumple con los siguientes requisitos preconfigurados:
* **Cliente PostgreSQL**: Herramientas `pg_dump` y `pg_restore` (versión 16) instaladas dentro de la imagen Docker del backend.
* **Límite de Carga de Archivos de Respaldo**: Soporta archivos de hasta **100 MB** tanto en el proxy Nginx (`client_max_body_size 100M`) como en el servidor de aplicaciones Spring Boot (`spring.servlet.multipart.max-file-size=100MB`).
* **Seguridad y Permisos**: Requiere token JWT autenticado con rol `ADMIN` o `OWNER`.
