# Manual de Usuario: Roles y Matriz de Permisos

## 1. Propósito del Módulo
El módulo de **Roles y Permisos** permite a la administración definir los perfiles de seguridad del negocio, decidiendo con exactitud qué módulos, pantallas y herramientas puede ver y utilizar cada tipo de empleado.

* **Ruta de acceso en el sistema**: Menú Lateral > **Roles y Permisos** (`/roles`).
* **Permisos requeridos**: Rol `ADMIN` o `OWNER`, o permiso explícito `roles`.

---

## 2. Elementos de la Pantalla de Roles

1. **Encabezado y Acciones**:
   * **Botón "Refrescar"**: Actualiza los perfiles desde el servidor.
   * **Botón "+ Nuevo Rol"**: Permite dar de alta un nuevo perfil de puesto de trabajo.
2. **Cuadrícula de Tarjetas de Roles**:
   * Cada tarjeta representa un perfil configurado en el sistema (ej. `ADMIN`, `OWNER`, `CAJERO`, `AUDITOR`, `SUPERVISOR`).
   * **Encabezado de la Tarjeta**: Nombre del rol, badge `Sistema` si es un rol protegido, e ID interno.
   * **Botones de Acción**:
     * Botón **Editar** (ícono lápiz): Para modificar los módulos autorizados.
     * Botón **Eliminar** (ícono basurero): Disponible solo en roles personalizados (los roles base del sistema están bloqueados contra eliminación).
   * **Módulos Autorizados**: Muestra las etiquetas (*chips*) con cada permiso que ese rol tiene permitido operar.

---

## 3. Catálogo de Permisos y Módulos Disponibles

Al editar o crear un rol, podrás marcar o desmarcar cualquiera de los siguientes módulos:

| Módulo | Clave Interna | Descripción del Acceso Otorgado |
| :--- | :--- | :--- |
| **Dashboard General** | `dashboard` | Visualización de métricas de facturación, ventas del día y KPIs. |
| **Punto de Venta / POS** | `pedidos` | Venta de helados, potes, cucuruchos, minimarket, cobro y emisión de tickets. |
| **Control de Caja** | `caja` | Apertura de turno, fondo inicial, control de egresos y arqueo ciego. |
| **Directorio de Clientes** | `clientes` | Consulta de clientes, alta de RUC con Dígito Verificador y edición. |
| **Reportes y Analítica SET** | `reportes` | Libro de Ventas IVA oficial, reimpresión de comprobantes y talonarios. |
| **Control de Stock** | `stock` | Control global de existencias, kardex, valorización y alertas bajo mínimo. |
| **Auditoría & Conteo Físico** | `auditoria` | Acceso a la planilla de conteo físico a ciegas, actas y comparativo de inventario. |
| **Catálogo de Sabores** | `sabores` | Gestión de sabores en bacha, precios y disponibilidad en mostrador. |
| **Envases y Cucuruchos** | `presentaciones` | Potes térmicos, cucuruchos, vasitos y capacidad máxima de sabores. |
| **Toppings y Agregados** | `toppings` | Salsas, coberturas, chips y adicionales por porción. |
| **Productos Simples** | `productos` | Bebidas, cafetería, golosinas y artículos con código de barras. |
| **Impresoras ESC/POS** | `impresoras` | Configuración de impresoras térmicas de tickets y cajón de dinero. |
| **Datos del Negocio** | `institucion` | Razón social, RUC emisor, Timbrado fiscal de la SET / DNIT y logo. |
| **Gestión de Usuarios** | `usuarios` | Cuentas de operadores, activación/inactivación y blanqueo de claves. |
| **Roles y Permisos** | `roles` | Configuración de esta misma matriz de perfiles y autorizaciones. |
| **Licenciamiento** | `licencia` | Consulta de planes y vigencia de la suscripción del software. |
| **Copias de Seguridad** | `backup` | Respaldo y restauración integral de la base de datos PostgreSQL. |

---

## 4. Procedimientos Paso a Paso

### Procedimiento A: Cómo Crear un Nuevo Rol (Ejemplo: Rol Especializado "AUDITOR")

1. En la pantalla de Roles haz clic en el botón **"+ Nuevo Rol"**.
2. En la ventana emergente completa:
   * **Nombre del Rol \***: Escribe el nombre del puesto en letras mayúsculas (ej. `AUDITOR` o `SUPERVISOR_DE_STOCK`).
3. En la sección **Permisos y Módulos Permitidos**:
   * Haz clic sobre las tarjetas de los módulos que deseas autorizar para este perfil.
   * *Para un Auditor*: Marca únicamente **"Dashboard General"** y **"Auditoría & Conteo Físico"**.
   * Las tarjetas seleccionadas se resaltarán en color azul con un check de confirmación.
4. (Opcional) Puedes utilizar los botones de ayuda:
   * **"Marcar Todos"**: Selecciona todos los módulos disponibles en el plan.
   * **"Limpiar"**: Desmarca todas las casillas para empezar desde cero.
5. Haz clic en **"Crear Rol"**.
6. El nuevo perfil aparecerá en la cuadrícula de roles y ya estará listo para ser asignado a cualquier empleado en el módulo de *Usuarios*.

---

### Procedimiento B: Cómo Modificar los Permisos de un Rol Existente

Si deseas agregarle o quitarle permisos a un rol que ya está en uso:

1. Localiza la tarjeta del rol en la pantalla.
2. Haz clic en el botón **Editar** (ícono de lápiz ✏️).
3. Modifica los módulos marcando o desmarcando las casillas según corresponda.
   > [!NOTE]
   > Si editas los roles base del sistema (`ADMIN` o `OWNER`), el nombre del rol no se puede cambiar por seguridad, pero sí puedes personalizar qué módulos tienen autorizados.
4. Haz clic en el botón **"Actualizar Rol"**.
5. Los cambios se aplican de forma inmediata: la próxima vez que los usuarios con ese rol naveguen por el sistema, verán sus nuevos accesos reflejados en el menú lateral.

---

### Procedimiento C: Cómo Eliminar un Rol en Desuso

1. Localiza el rol que deseas eliminar.
   > [!WARNING]
   > **Restricciones de Eliminación**:
   > 1. Los roles protegidos del sistema (`ADMIN` y `OWNER`) no pueden eliminarse bajo ninguna circunstancia.
   > 2. Si un rol tiene empleados asignados actualmente, el sistema no permitirá borrarlo. Primero debes ingresar a *Gestión de Usuarios* y reasignar a esos usuarios a otro rol.
2. Haz clic en el botón **Eliminar** (ícono de basurero rojo 🗑️).
3. El sistema solicitará confirmación: *¿Estás seguro de que deseas eliminar este rol?*.
4. Confirma la acción. El rol se removerá del sistema.
