# Manual de Usuario: Punto de Venta (POS) y Facturación de Mostrador

## 1. Propósito del Módulo
El **Punto de Venta (POS)** es el corazón operativo del mostrador de la heladería y minimarket. Permite registrar las ventas de forma ágil, seleccionar combinaciones de sabores de helado según la capacidad del pote, agregar adicionales/toppings, vender artículos de minimarket mediante código de barras, código interno o nombre, asociar clientes para comprobantes legales y cobrar mediante múltiples medios de pago.

* **Ruta de acceso en el sistema**: Menú Lateral > **Punto de Venta (POS)** (`/pos`).
* **Permisos requeridos**: Rol `CAJERO`, `ADMIN`, `OWNER` o permiso `pedidos`.
* **Requisito Operativo Indispensable**: Debe existir una **Caja Abierta** en la terminal actual.

---

## 2. Elementos de la Pantalla del POS

La pantalla está organizada en dos áreas principales:

### Zona Izquierda: Catálogo Táctil y Búsqueda Multimodal
1. **Buscador Rápido Multimodal (3 Opciones de Búsqueda)**:
   * 🏷️ **Búsqueda por Código de Barras**: Con pistola lectora USB/inalámbrica o tecleando el código de barras del producto (EAN-13, etc.). Al escanear o presionar `Enter`, el artículo se agrega **automáticamente al ticket sin pasos adicionales**.
   * 🔢 **Búsqueda por Código de Producto / ID**: Ingresa el código interno o ID numérico del artículo para localizarlo al instante.
   * 🔍 **Búsqueda por Nombre / Descripción**: Escribe parte del nombre del producto (ej. *"Coca"*, *"Alfajor"*, *"Agua"*).
2. **Pestañas de Categoría**:
   * **Potes y Envases**: Muestra los formatos de helado disponibles (1/4 kg, 1/2 kg, 1 kg, cucuruchos, vasitos) con su precio y capacidad de sabores.
   * **Sabores en Bacha**: Lista de sabores disponibles en el local con control de stock.
   * **Toppings y Adicionales**: Salsas, confites, chips y agregados.
   * **Bebidas / Minimarket**: Artículos unitarios empaquetados.
3. **Botón Rápido `+` en Artículos**: Cada tarjeta de producto cuenta con un botón directo `+` para añadir unidades a la orden con un solo toque.

### Zona Derecha: Comanda / Orden en Curso
1. **Selector de Cliente**: Permite buscar o asignar el cliente para la factura legal (por defecto: *"Consumidor Final"*).
2. **Lista de Ítems de la Orden**: Detalla cada producto agregado, cantidades, sabores elegidos, adicionales y subtotales en Gs.
3. **Resumen de Totales**:
   * Total a Pagar en **Guaraníes (Gs.)**.
   * Discriminación de IVA (Exento, IVA 5%, IVA 10%).
4. **Botonera de Acción**:
   * Botón **"Cancelar Orden"**: Vacía el carrito si el cliente desiste de la compra.
   * Botón grande verde **"Cobrar (F10)"**: Despliega la pasarela de cobro.

---

## 3. Procedimientos Paso a Paso

### Procedimiento A: Venta Rápida por Código de Barras o Código de Producto
1. Ubica el cursor en el buscador superior del POS (o simplemente apunta la pistola lectora de código de barras).
2. Escanea el código del producto (ejemplo: botella de gaseosa o snack).
3. **Comportamiento automático**: El sistema identifica el producto por su código de barras o código interno y lo añade directamente a la comanda de la derecha, incrementando la cantidad si ya existía.
4. Si ingresas el código de barras o ID manualmente con el teclado, presiona la tecla `Enter` para incorporarlo al ticket de inmediato.

---

### Procedimiento B: Venta de Helado por Sabores y Pote
1. Haz clic en la pestaña **Potes y Envases**.
2. Selecciona el tamaño solicitado por el cliente (ejemplo: *Pote Térmico 1 kg - 55.000 Gs.*).
3. Automáticamente se desplegará la ventana emergente **"Selección de Sabores"**:
   * En la parte superior verás la indicación: *"Selecciona hasta 4 sabores para este envase"*.
   * El contador mostrará cuántos sabores llevas elegidos (ej. `0 / 4`).
   * Haz clic sobre los sabores que el cliente elija (ej. *Dulce de Leche Granizado*, *Chocolate Amargo*, *Frutilla al Agua*, *Vainilla*).
   * **Control de Sabores Agotados**: Si una bacha de helado llegó a 0 kg en stock, aparecerá en gris con el rótulo *"Agotado"* y no te permitirá seleccionarla.
   * Si el cliente desea repetir un sabor (ej. "doble porción de dulce de leche"), haz clic nuevamente sobre ese sabor.
4. Haz clic en **"Confirmar Sabores"**. El pote con sus sabores elegidos se agregará a la orden en la columna derecha.

---

### Procedimiento C: Agregar Toppings o Coberturas
1. Si el cliente solicita adicionales para su helado (ej. salsa de chocolate o confites):
2. Haz clic en la pestaña **Toppings**.
3. Haz clic sobre el botón `+` del topping deseado (ej. *Salsa de Chocolate - 3.000 Gs.*).
4. El adicional se sumará a la orden con su importe correspondiente.

---

### Procedimiento D: Asignar un Cliente para Factura Legal (SET / DNIT)
1. En la parte superior de la orden, ubica el selector de cliente (por defecto muestra: *"00000000 - Consumidor Final"*).
2. Si el cliente solicita Factura Legal con su RUC o Cédula:
   * Escribe el número de documento o nombre en el buscador desplegable.
   * Si el cliente ya fue registrado anteriormente, selecciónalo de la lista.
   * Si es un **cliente nuevo**:
     1. Haz clic en el botón **"+ Nuevo"**.
     2. Ingresa su RUC (el sistema calculará el Dígito Verificador automáticamente) o Cédula de Identidad.
     3. Escribe la Razón Social o Nombre Completo.
     4. Haz clic en **"Guardar y Asignar"**.

---

### Procedimiento E: Cobro de la Venta y Emisión de Comprobante
1. Una vez cargados todos los artículos, haz clic en el botón verde **"Cobrar (F10)"** o presiona la tecla `F10` en tu teclado.
2. Se abrirá la **Ventana de Cobro Multimedio**:
   * En la parte superior verás el **Total a Cobrar en Gs.**.

3. **Selecciona el Medio de Pago**:
   * **Opción 1: EFECTIVO**
     * Escribe el monto en efectivo que te entrega el cliente en el campo *Monto Recibido* (ej. si la cuenta es 45.000 Gs. y te entrega un billete de 100.000 Gs., escribe `100000`).
     * El sistema calculará y mostrará en grande el **Vuelto en Gs.** (`55.000 Gs.`).
   * **Opción 2: TARJETA DE DÉBITO O CRÉDITO**
     > [!IMPORTANT]
     > **Ingreso Obligatorio del Voucher**: Al seleccionar Tarjeta, es mandatorio procesar primero el cobro en el POS físico de la entidad (Bancard, Dinelco, etc.) y luego **escribir el Número de Voucher / Cupón** en el campo requerido. Sin este número, el botón de confirmar cobro permanecerá inhabilitado.
   * **Opción 3: CÓDIGO QR / TRANSFERENCIA BANCARIA**
     * Selecciona *QR / Transferencia*.
     * Solicita al cliente que escanee el código QR de cobro de la tienda.
     * Registra el número de comprobante o referencia de la transacción bancaria.

4. Haz clic en **"Confirmar Cobro e Imprimir"**.
5. Se emitirá la factura fiscal legal o ticket a través de la impresora térmica configurada, se actualizará el stock y el turno de caja registrará la venta automáticamente.
