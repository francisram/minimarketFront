# Manual de Usuario: Gestión de Usuarios y Personal

## 1. Propósito del Módulo
El módulo de **Gestión de Usuarios** permite a los administradores y propietarios del negocio dar de alta, configurar, supervisar y controlar el acceso de todos los colaboradores (cajeros, auditores, encargados, despachadores y personal administrativo) que operan en las distintas terminales del sistema.

* **Ruta de acceso en el sistema**: Menú Lateral > **Usuarios** (`/usuarios`).
* **Permisos requeridos**: Rol `ADMIN` o `OWNER`, o permiso explícito `usuarios`.

---

## 2. Elementos de la Pantalla de Usuarios

Al ingresar a la vista de Gestión de Usuarios encontrarás:

1. **Barra de Acciones Superior**:
   * **Buscador de Usuarios**: Permite filtrar la tabla en tiempo real escribiendo el nombre de usuario o rol.
   * **Botón "Refrescar"**: Actualiza la lista de operadores desde la base de datos.
   * **Botón "+ Nuevo Usuario"**: Despliega la ventana para registrar un nuevo integrante del equipo.
2. **Tabla de Usuarios**:
   * **Usuario (Username)**: Identificador único con el que inicia sesión.
   * **Rol Asignado**: Perfil de seguridad que define sus accesos (ej. `ADMIN`, `CAJERO`, `AUDITOR`).
   * **Estado**: Badge visual que indica si la cuenta está `Activa` (verde) o `Inactiva` (rojo).
   * **Expiración**: Indica si la contraseña nunca vence o la fecha programada de expiración.
   * **Cambio Pendiente**: Alerta si el usuario tiene la obligación de cambiar su clave en su próximo ingreso.
   * **Acciones**:
     * Botón **Editar Rol** (ícono lápiz).
     * Botón **Cambiar Contraseña / Blanquear Clave** (ícono llave).
     * Botón **Activar / Desactivar** (interruptor o ícono candado).

---

## 3. Procedimientos Paso a Paso

### Procedimiento A: Cómo Registrar un Nuevo Usuario

1. Haz clic en el botón azul **"+ Nuevo Usuario"** ubicado en la esquina superior derecha.
2. Se abrirá una ventana emergente (*modal*) con los siguientes campos a completar:
   * **Nombre de Usuario (Username) \***:
     * Escribe un identificador único, sin espacios ni caracteres especiales (ejemplos: `marta.gomez`, `cajero_tarde`, `auditor1`).
     * Este nombre será el que la persona deba escribir cada vez que inicie sesión.
   * **Rol del Usuario \***:
     * Despliega la lista y selecciona el rol acorde a las responsabilidades del empleado:
       * `CAJERO`: Para personal de mostrador que opera caja y POS.
       * `AUDITOR`: Para personal que realiza tomas y conteos físicos de stock.
       * `ADMIN`: Para encargados con acceso a catálogos, reportes y caja.
       * `SUPERVISOR`: O cualquier otro rol personalizado creado en el módulo de Roles.
   * **Contraseña Inicial \***:
     * Escribe una contraseña de al menos 6 caracteres.
   * **Confirmar Contraseña \***:
     * Vuelve a escribir exactamente la misma contraseña para verificar que no hubo errores tipográficos.
   * **Casilla "Debe cambiar contraseña al iniciar sesión"**:
     * **Recomendado marcarla**: De esta manera, el sistema obligará al usuario a ingresar su propia clave personal y confidencial la primera vez que entre, garantizando que nadie más conozca su contraseña.
   * **Casilla "La contraseña nunca expira"**:
     * Si la marcas, la clave no tendrá fecha límite de caducidad. Si la desmarcas, podrás fijar una fecha de vencimiento para forzar renovaciones periódicas de seguridad.
3. Haz clic en **"Crear Usuario"**.
4. El sistema mostrará una notificación verde de éxito (*"Usuario creado correctamente"*) y el nuevo colaborador aparecerá inmediatamente en la tabla.

---

### Procedimiento B: Cómo Habilitar o Deshabilitar un Usuario (Activar / Inactivar)

Si un colaborador sale de vacaciones, pide licencia o deja de trabajar en la empresa, no es necesario borrar su historial de ventas o auditorías; simplemente se debe desactivar su cuenta:

#### Para Desactivar a un Usuario:
1. Localiza al usuario en la tabla.
2. Haz clic en el botón de estado o en el botón de **Desactivar** (ícono de candado o interruptor).
3. Aparecerá un cuadro de confirmación: *¿Estás seguro de desactivar el acceso a este usuario?*.
4. Confirma la acción.
5. El estado cambiará a **Inactivo** (rojo). A partir de ese segundo, si esa persona intenta ingresar su contraseña en la pantalla de login, el sistema responderá: *"Cuenta inhabilitada. Contacte con la administración"*.

#### Para Habilitar / Reactivar a un Usuario:
1. Localiza al usuario inactivo en la tabla.
2. Haz clic en el botón **Activar** (ícono de check o interruptor).
3. Confirma la reactivación.
4. El estado volverá a **Activo** (verde) y el usuario podrá iniciar sesión con normalidad.

---

### Procedimiento C: Cómo Cambiar o Restablecer una Contraseña Olvidada (Blanqueo de Clave)

Si un empleado olvidó su contraseña o sospecha que alguien la vio:

1. Localiza al usuario en la tabla.
2. Haz clic en el botón **"Cambiar Contraseña"** (ícono de llave 🔑).
3. Se abrirá una ventana de reseteo:
   * Ingresa la **Nueva Contraseña Temporal** (mínimo 6 caracteres).
   * Vuelve a escribirla en **Confirmar Nueva Contraseña**.
   * Marca la casilla **"Exigir cambio de contraseña en el próximo inicio"** para que el empleado establezca su clave secreta definitiva al ingresar.
4. Haz clic en **"Guardar Contraseña"**.
5. Comunica al colaborador su clave temporal.

---

### Procedimiento D: Cómo Modificar el Rol o Perfil de un Usuario

Si un cajero es ascendido a encargado, o si se reasignan las funciones de un auditor:

1. Localiza al usuario en la tabla.
2. Haz clic en el botón **"Editar"** (ícono de lápiz ✏️).
3. En el selector de **Rol**, elige el nuevo perfil que le corresponde.
4. Haz clic en **"Guardar Cambios"**.
5. El usuario actualizará inmediatamente sus permisos y accesos en el sistema.

---

## 4. Reglas de Seguridad y Buenas Prácticas

> [!IMPORTANT]
> **Usuarios Intransferibles**: Cada cajero y auditor debe tener su propio usuario personal. Nunca permitas que dos personas compartan el mismo usuario `cajero1`, ya que esto anula la trazabilidad de los arqueos de caja, la responsabilidad sobre el dinero físico y el registro de ventas.

> [!WARNING]
> **Usuario Administrador Protegido**: No desactives ni cambies el rol del usuario principal del sistema sin antes haber creado otro usuario con rol `ADMIN` u `OWNER`, para evitar quedar bloqueado fuera de la configuración.
