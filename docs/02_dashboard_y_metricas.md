# Manual de Usuario: Dashboard General y Métricas Diarias

## 1. Propósito del Módulo
El **Dashboard** (Panel de Control Principal) es la vista panorámica del negocio al ingresar al sistema. Proporciona a gerentes, encargados y operadores una visión consolidada en tiempo real de los pedidos procesados en la jornada, la disponibilidad del menú de helados y cafetería, las alertas de inventario crítico y el estado operativo del turno de caja y periféricos de impresión.

* **Ruta de acceso en el sistema**: Menú Lateral > **Dashboard** (`/dashboard`).
* **Permisos requeridos**: Acceso general según el perfil asignado; los bloques y accesos rápidos se adaptan dinámicamente a los permisos de cada usuario.

---

## 2. Elementos del Dashboard

Al ingresar a la pantalla principal encontrarás los siguientes componentes visuales:

### A. Banner de Bienvenida y Acción Rápida
* **Saludo personalizado**: Muestra el nombre del usuario conectado en la sesión actual (ej. *"¡Hola, admin!"* o *"¡Hola, cajero1!"*).
* **Botón "Nueva Venta (POS)"**: Acceso directo con ícono de carrito de compras que te traslada de inmediato a la terminal de facturación y toma de pedidos.

### B. Tarjetas de Indicadores Clave (KPI Grid)
Estas tarjetas resumen los valores numéricos más relevantes del día:

1. **Pedidos del Día** (Ícono de comanda):
   * Muestra la cantidad total de pedidos registrados durante la fecha de hoy (incluye pedidos en preparación, listos, entregados y cobrados).
2. **Sabores Disponibles** (Ícono de helado):
   * Muestra la relación entre los sabores aptos para despacho contra el total del catálogo (ejemplo: `18 / 24`). Permite detectar de inmediato si hay sabores agotados antes del pico de ventas.
3. **Envases / Presentaciones** (Ícono de vaso/pote):
   * Conteo de presentaciones térmicas, conos y potes activos configurados en el catálogo.
4. **Alertas de Stock** (Ícono de almacén):
   * Se ilumina con un marco de advertencia en color ámbar/rojo si existen bachas de helado por debajo del stock mínimo (kg) o envases/conos en nivel de reposición urgente.
5. **Impresoras Térmicas** (Ícono de ticketera):
   * Cantidad de impresoras ESC/POS registradas y vinculadas (mostrador, caja o cocina).

### C. Cuadrícula de Accesos Rápidos
Botones de navegación directa a los módulos más frecuentados del sistema (visibles según los permisos de tu rol):
* **Punto de Venta**: Armado táctil de helados, selección de cucuruchos/potes y cobro inmediato.
* **Control de Caja**: Consulta y apertura/arqueo del turno de caja vigente.
* **Monitor de Cocina**: Tablero Kanban para el despacho y entrega de pedidos en mostrador.
* **Clientes**: Directorio telefónico y consulta de RUC con Dígito Verificador.
* **Reportes y Analítica**: Resumen de ventas, libro IVA y estadísticas comerciales.
* **Control de Stock**: Consulta de existencias en kg y unidades, movimientos y Kardex.
* **Impresoras Térmicas**: Administración de puertos TCP Raw, USB y colas de impresión.
* **Datos de Marca**: Configuración de membretes, Timbrado legal y RUC institucional.
* **Usuarios y Personal**: Alta de operadores y reseteo de claves.
* **Roles y Permisos**: Configuración de accesos por página.
* **Licenciamiento**: Verificación de vigencia y módulos contratados.

### D. Panel de Estado del Turno y Conectividad
Ubicado en el lateral derecho, brinda una verificación técnica inmediata de la estación de trabajo:
* **Usuario Conectado**: Nombre de usuario y perfil de seguridad actual (ej. `marta (CAJERO)`).
* **Estado de Caja**:
  * Badge verde `Abierta (Sesión #XX)`: Indica que hay un turno activo y se pueden emitir ventas en efectivo y tarjeta.
  * Badge rojo `Cerrada`: Indica que el cajero aún no ha realizado la apertura con su fondo inicial.
* **Punto de Venta**: Indicador de estado operativo del motor de ventas.
* **Ticketeras conectadas**: Número de impresoras listas para emitir tickets o comandas.

---

## 3. Procedimientos Paso a Paso

### Procedimiento A: Cómo Iniciar la Jornada Diaria desde el Dashboard

1. Inicia sesión con tus credenciales.
2. Si el sistema te dirige al Dashboard, observa el panel derecho **"Estado del Turno"**:
   * Si la caja figura como **Cerrada**: Haz clic en el acceso rápido **"Control de Caja"** para realizar la apertura con el efectivo inicial disponible en gaveta.
   * Si la caja figura como **Abierta**: Puedes pasar directamente al Punto de Venta.
3. Observa la tarjeta **"Alertas de Stock"**:
   * Si el número es mayor a cero (`> 0`), haz clic en el acceso rápido **"Control de Stock"** para verificar qué sabores o envases requieren reposición desde la cámara de frío o depósito antes de abrir las puertas al público.
4. Presiona el botón verde/azul **"Nueva Venta (POS)"** en el banner superior para comenzar a atender clientes.

---

### Procedimiento B: Monitoreo Periódico durante el Día (Supervisores y Encargados)

1. En cualquier momento del día, haz clic en **Dashboard** en el menú de la izquierda.
2. Comprueba el total de **Pedidos del Día** para evaluar el ritmo de atención.
3. Monitorea el indicador de **Sabores Disponibles**:
   * Si un sabor se agotó en la vitrina de helados, los cajeros o personal de mostrador lo desactivarán en Catálogo de Sabores y el número reflejará la disponibilidad real.

---

## 4. Preguntas Frecuentes

### "¿Por qué no veo algunos accesos rápidos en mi pantalla?"
* El Dashboard se personaliza según el rol asignado a tu usuario. Si tu rol es `CAJERO`, verás únicamente accesos a POS, Caja y Clientes, ocultando herramientas administrativas como Roles, Usuarios o Licencia.

### "¿El contador de 'Pedidos del Día' incluye los pedidos cancelados?"
* La métrica contabiliza los pedidos ingresados en la fecha calendario actual. En el módulo de **Monitor de Pedidos** o **Reportes** puedes filtrar con exactitud cuántos fueron completados y cuántos fueron anulados por causas operativas.
