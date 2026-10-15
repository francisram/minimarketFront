# Manual de Usuario: Monitor de Pedidos y Despacho en Mostrador

## 1. Propósito del Módulo
El **Monitor de Pedidos** (KDS - *Kitchen Display System* / Pantalla de Despacho) organiza la preparación física y entrega de productos en mostrador o cocina en tiempo real. Permite que el equipo de servicio prepare los potes de helado, cucuruchos, toppings y productos de cafetería en el orden exacto en que ingresan al sistema, evitando demoras o confusiones con los clientes.

* **Ruta de acceso en el sistema**: Menú Lateral > **Pedidos** (`/pedidos`).
* **Permisos requeridos**: Rol `CAJERO`, `ADMIN`, `SUPERVISOR`, `DESPACHADOR` o permiso explícito `pedidos`.

---

## 2. Elementos del Tablero Kanban de Pedidos

La vista está diseñada en formato de tablero visual de columnas (Kanban), ideal para monitores táctiles o pantallas suspendidas sobre el mostrador de despacho:

### A. Barra Superior y Filtros
1. **Filtro de Fecha**:
   * Selector de calendario. Por defecto muestra la fecha actual de operaciones, pero permite revisar órdenes de fechas anteriores.
2. **Filtro de Estado**:
   * Desplegable con las opciones: `Todos los estados`, `Pendientes`, `En Preparación`, `Listos para Entrega`, `Entregados` y `Cancelados`.
3. **Botón "Actualizar"**:
   * Recarga inmediatamente las órdenes para reflejar ventas recién cobradas en las cajas.

### B. Columnas del Tablero de Despacho
Cada columna agrupa las órdenes según su fase en el flujo de atención:

1. **Columna "Pendientes"** (Borde Amarillo):
   * Pedidos recién confirmados en el Punto de Venta (POS) en espera de que un heladero o despachador inicie su armado.
2. **Columna "En Preparación"** (Borde Azul):
   * Órdenes que ya están siendo servidas (seleccionando los sabores en la bacha, agregando toppings o preparando café).
3. **Columna "Listos para Entrega"** (Borde Verde):
   * Productos empaquetados o servidos sobre la bandeja de mostrador, listos para llamar al cliente por su número o nombre.
4. **Columna "Entregados"** (Borde Gris / Finalizado):
   * Pedidos que el cliente ya retiró exitosamente.

### C. Estructura de cada Tarjeta de Pedido (Order Card)
Cada tarjeta contiene la información completa para armar el pedido sin necesidad de imprimir papel:
* **Número de Pedido (#ID)**: Número secuencial visible en grande para llamar al cliente (ej. `#104`).
* **Insignia de Comprobante**: Indica si el cliente solicitó `FACTURA` (con su número timbrado legal) o ticket fiscal simple.
* **Modalidad de Entrega**: `Mostrador`, `Llevar`, `Delivery`, etc.
* **Cliente**: Nombre de la persona o `Consumidor Final`.
* **Notas de Preparación**: Instrucciones especiales en recuadro destacado (ejemplo: *"Separar topping de chocolate"*, *"Sin servilletas"*, *"Para regalo"*).
* **Detalle de Artículos (Items Preview)**:
  * Lista de etiquetas con la cantidad y nombre del artículo (ej. `1x Pote 1/2 Kg`, `2x Cucurucho Doble`, `1x Café Espresso`).
* **Total de la Venta**: Monto total en Guaraníes (`Gs.`).
* **Botones de Acción**:
  * **Ver / Reimprimir Comprobante** (Ícono de hoja): Abre la ventana del ticket legal para consulta o reimpresión en impresora térmica.
  * **Avanzar Estado**: Botón azul/verde con flecha que promueve la orden al siguiente paso (*Preparar* -> *Listo* -> *Entregar*).
  * **Cancelar Pedido** (Ícono de basurero rojo): Permite anular el pedido previa confirmación en caso de contingencia.

---

## 3. Procedimientos Paso a Paso

### Procedimiento A: Flujo Estándar de Despacho de Helados

1. **Recepción del Pedido**:
   * Tan pronto el cajero cobra en el POS, la tarjeta aparece automáticamente en la columna **Pendientes** con su número (ej. `#105`).
2. **Inicio de Preparación**:
   * El heladero se acerca al monitor, lee los sabores solicitados en la tarjeta y hace clic en el botón azul **"Preparar"**.
   * La tarjeta pasa a la columna **En Preparación**. Esto le indica a los demás compañeros que esa orden ya está en proceso de servido.
3. **Marcar como Listo**:
   * Una vez que los potes están tapados y embolsados o los cucuruchos colocados en el portaconos con sus servilletas, el despachador presiona **"Listo"**.
   * La tarjeta avanza a **Listos para Entrega**.
4. **Llamado y Entrega al Cliente**:
   * El personal llama al cliente: *"¡Pedido número 105 para [Nombre]!"*.
   * Al entregar la bolsa o bandeja al cliente, hace clic en el botón verde **"Entregar"**.
   * La tarjeta pasa al historial de **Entregados**, completando el ciclo de atención.

---

### Procedimiento B: Reimprimir el Ticket de un Pedido desde el Monitor

Si un cliente extravía su ticket de caja o solicita una copia adicional mientras espera su helado:

1. Localiza la tarjeta del pedido en el monitor.
2. Haz clic en el botón con ícono de documento **"Ver / Imprimir Comprobante"**.
3. Se abrirá una ventana emergente con la previsualización del ticket térmico oficial (incluyendo datos del negocio, Timbrado, detalle de sabores e IVA).
4. Presiona el botón **"Imprimir"** para enviarlo a la ticketera de mostrador, o **"Cerrar"** si solo deseabas verificar el detalle.

---

### Procedimiento C: Cancelación de un Pedido en Pantalla

Si por alguna razón justificada el cliente cancela la compra o hubo un error antes de que el helado sea servido:

1. Ubica el pedido en la columna de **Pendientes** o **En Preparación**.
2. Haz clic en el botón rojo con ícono de papelera.
3. El sistema solicitará confirmación: *"¿Estás seguro de cancelar este pedido?"*.
4. Confirma la acción. El pedido cambiará su estado a `CANCELADO` y no generará entregas pendientes.
   * *Nota*: Si la venta fue cobrada en caja, el cajero deberá gestionar la anulación o ajuste correspondiente según las políticas del local.

---

## 4. Consejos para la Pantalla de Cocina / Mostrador

* **Pantalla Táctil**: La interfaz está optimizada para botones grandes, permitiendo avanzar órdenes con un solo toque de dedo sin necesidad de teclado ni ratón.
* **Uso de Notas**: Recomienda a los cajeros cargar en el campo *"Notas"* cualquier requerimiento alérgico (ej. *"Sin maní ni nueces"*), el cual se destacará con un ícono de advertencia para máxima visibilidad del heladero.
