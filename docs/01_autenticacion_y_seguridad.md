# Manual de Usuario: Autenticación, Inicio de Sesión y Seguridad

## 1. Propósito del Módulo
El sistema de Autenticación y Seguridad es la puerta de entrada a la plataforma de Heladería y Minimarket. Garantiza que únicamente el personal autorizado ingrese al sistema, asociando cada venta, apertura/cierre de caja, conteo de stock o ajuste administrativo al usuario correspondiente.

* **Ruta de acceso en el sistema**: `/login` (pantalla principal al ingresar).
* **Ruta de cambio de contraseña**: `/cambiar-password`.
* **Roles aplicables**: Todos los usuarios del sistema (`ADMIN`, `CAJERO`, `AUDITOR`, `SUPERVISOR`, `DESPACHADOR`, etc.).

---

## 2. Elementos de la Pantalla de Login

La pantalla de inicio de sesión presenta una tarjeta central optimizada tanto para computadoras de escritorio como para pantallas táctiles de punto de venta:

1. **Logotipo e Identificador Institucional**:
   * Ícono de Heladería Artesanal y subtítulo *"Sistema de Punto de Venta y Administración"*.
2. **Campo "Usuario"**:
   * Entrada de texto con ícono de usuario. Permite ingresar el nombre de usuario (ej. `admin`, `cajero1`, `juan.perez`).
3. **Campo "Contraseña"**:
   * Entrada de texto con ícono de candado que enmascara los caracteres (`••••••••`).
   * **Botón Revelar Clave (Ícono de Ojo)**: Permite inspeccionar visualmente lo que se está escribiendo mientras se mantenga presionado el botón (mousedown o toque sostenido en pantallas táctiles), ocultándose automáticamente al soltarlo.
4. **Botón "Ingresar al Sistema"**:
   * Botón principal con spinner animado durante la validación contra el servidor backend.
5. **Notificaciones Flotantes (Toasts)**:
   * Mensajes emergentes en la esquina superior derecha indicando el éxito del ingreso o detallando el motivo de rechazo (usuario inactivo, clave incorrecta, etc.).

---

## 3. Procedimientos Paso a Paso

### Procedimiento A: Cómo Iniciar Sesión en el Sistema

1. Abre el navegador web (Google Chrome, Firefox o Edge recomendado) e ingresa a la dirección web del sistema (ej. `http://localhost:8086` o la IP de tu servidor local).
2. Si no has iniciado sesión previamente o tu sesión ha expirado, el sistema te redirigirá automáticamente a la pantalla `/login`.
3. En el campo **Usuario**, ingresa tu nombre de usuario asignado por la administración.
4. En el campo **Contraseña**, escribe tu clave secreta.
   * *Tip*: Si deseas verificar que no cometiste un error tipográfico, mantén presionado el ícono de ojo a la derecha del campo.
5. Presiona la tecla **Enter** o haz clic en el botón **"Ingresar al Sistema"**.
6. **Resultado**:
   * Si las credenciales son correctas, aparecerá una notificación verde: *"Bienvenido, [nombre de usuario] ([rol])"*.
   * El sistema te redirigirá inmediatamente a la vista correspondiente según tu rol (por defecto al Punto de Venta `/pos` para cajeros, o al `/dashboard` o la última página solicitada).

---

### Procedimiento B: Cambio Obligatorio de Contraseña (Primer Ingreso)

Si el administrador creó tu cuenta con la opción *"Debe cambiar contraseña al iniciar sesión"*, o si tu clave ha expirado por política de seguridad:

1. Al presionar **"Ingresar al Sistema"**, el sistema detectará el requerimiento de cambio forzado.
2. Serás redirigido automáticamente a la pantalla de **Cambio de Contraseña** (`/cambiar-password`).
3. Completa los tres campos requeridos:
   * **Contraseña Actual**: Escribe la contraseña temporal o actual con la que acabas de ingresar.
   * **Nueva Contraseña**: Ingresa tu nueva clave personal (debe tener un mínimo de 6 caracteres; se recomienda combinar letras y números).
   * **Confirmar Nueva Contraseña**: Vuelve a escribir con exactitud la nueva clave.
4. Si las claves no coinciden, verás una advertencia en rojo: *"Las nuevas contraseñas no coinciden"*.
5. Haz clic en **"Guardar Contraseña"**.
6. El sistema confirmará el cambio exitoso mediante una notificación verde y habilitará el ingreso regular a las funciones del sistema.

---

### Procedimiento C: Cambio Voluntario de Contraseña desde la Sesión Activa

Cualquier usuario puede cambiar su propia contraseña en cualquier momento para prevenir accesos no autorizados:

1. Desde cualquier módulo del sistema, localiza la barra superior (*Topbar*).
2. Haz clic sobre tu nombre de usuario o en el ícono de candado / perfil.
3. Selecciona la opción **"Cambiar Contraseña"** (te llevará a `/cambiar-password`).
4. Ingresa tu contraseña actual y la nueva clave dos veces.
5. Presiona **"Guardar Contraseña"**.
6. A partir de ese momento, deberás usar exclusivamente la nueva clave en tus próximos inicios de sesión.

---

### Procedimiento D: Cierre Seguro de Sesión (Logout)

Al finalizar tu jornada laboral o retirarte de la terminal de trabajo:

1. Dirígete a la esquina superior derecha o al menú lateral inferior.
2. Haz clic en el botón **"Cerrar Sesión"** (ícono de puerta / salida).
3. El sistema destruirá el token de autenticación (JWT) almacenado en el navegador y redirigirá de inmediato a la pantalla de `/login`.
4. Ninguna otra persona podrá realizar ventas o movimientos con tu usuario sin volver a ingresar la contraseña.

---

## 4. Reglas de Seguridad y Validaciones

* **Bloqueo de Cuentas Inactivas**: Si un usuario tiene el estado `Inactivo` (deshabilitado en Gestión de Usuarios), el login será denegado con el mensaje: *"El usuario se encuentra inactivo. Contacte al administrador"*.
* **Persistencia de Sesión Segura**: La sesión se mantiene mientras el token JWT sea válido. Si la conexión se pierde o el token expira, el sistema solicitará autenticarse nuevamente sin perder las configuraciones previas.
* **Control de Rutas Protegidas (Guards)**: Si un usuario intenta acceder por URL directa a una sección para la cual su rol no tiene permiso (por ejemplo, un cajero intentando entrar a `/roles` o `/backup`), el sistema bloqueará el acceso y lo redirigirá a su pantalla principal.

---

## 5. Preguntas Frecuentes y Solución de Problemas

### "¿Qué hago si olvidé mi contraseña?"
* No intentes adivinar reiteradamente. Acude al Administrador o Encargado del local.
* El administrador ingresará al módulo de **Usuarios** (`/usuarios`), seleccionará tu usuario y utilizará la acción **"Cambiar Contraseña"** para asignarte una clave temporal nueva con la opción de cambio obligatorio al ingresar.

### "El botón de ingresar permanece deshabilitado"
* Verifica que ambos campos (Usuario y Contraseña) tengan contenido escrito. Si alguno está vacío, el formulario no permitirá el envío.

### "Aparece el error 'Credenciales incorrectas'"
* Comprueba si la tecla **Bloq Mayús (Caps Lock)** está activada en tu teclado, ya que las contraseñas distinguen mayúsculas de minúsculas.
* Asegúrate de no haber colocado espacios en blanco al inicio o al final del nombre de usuario.
