# Manual de Usuario: Facturas de Compra de Proveedores e Ingreso a Stock

## 1. Propósito del Módulo
El módulo de **Facturas de Compra** (`/compras`) gestiona la adquisición formal de mercaderías e insumos de proveedores con respaldo fiscal. Al asentar un comprobante, el sistema cumple una triple función automática:
1. **Ingreso a Stock y Kardex**: Incrementa las existencias físicas en el almacén de forma atómica.
2. **Liquidación Fiscal del IVA Compra**: Registra el Crédito Fiscal (IVA 10%, IVA 5% y Exentas) computable para las liquidaciones tributarias de la SET / DNIT.
3. **Control Financiero y Pasivos**: Registra compras al Contado y compras a Crédito con fecha de vencimiento para seguimiento de pagos.

* **Ruta de acceso en el sistema**: Menú Lateral > **Facturas de Compra** (`/compras`).
* **Permisos requeridos**: Rol `ADMIN`, `OWNER` o permiso explícito `compras`.

---

## 2. Elementos Principales de la Pantalla

1. **Tarjetas de Métricas de Compras**:
   * **Total en Compras (Gs.)**: Volumen acumulado de compras activas.
   * **Facturas Registradas**: Cantidad total de comprobantes procesados.
   * **Facturas a Crédito**: Compras pendientes de cancelación o diferidas.
2. **Barra de Acciones y Filtros**:
   * **Buscador Reactivo**: Búsqueda instantánea por N° de Factura, Timbrado o Razón Social del Proveedor.
   * **Filtro por Proveedor**: Visualiza facturas de una empresa específica o de todos.
   * **Filtros por Condición y Estado**: Alterna entre Contado/Crédito y Confirmadas/Anuladas.
   * **Botones de Descarga Rápida**: Exportación directa a **CSV / Excel** y descarga de informe en **PDF A4**.
   * **Botón "+ Registrar Factura de Compra"**: Despliega la ventana de carga protegida.
3. **Grilla Histórica de Facturas**:
   * Fecha, N° Factura, Timbrado, Proveedor, Condición, Vencimiento, Desglose IVA, Total y Estado.
   * Botón **"Ver Detalle"**: Permite auditar cada renglón de la factura con costos unitarios.
   * Botón **"Anular"**: En caso de error de digitación o nota de crédito total, revierte el stock ingresado y marca la compra como ANULADA.

---

## 3. Procedimientos Paso a Paso

### Procedimiento A: Cómo Registrar una Factura de Compra Paso a Paso

1. Haz clic en **"+ Registrar Factura de Compra"**.
2. **Completar Datos del Comprobante (Campos Obligatorios \*)**:
   * **Proveedor \***: Selecciona la empresa distribuidora en el listado desplegable.
   * **N° de Factura \***: Número legal impreso en la factura física (ej. `001-002-0004521`).
   * **Timbrado**: Número de timbrado emitido por la SET en el comprobante del proveedor.
   * **Fecha de Emisión \***: Fecha en que fue expedida la factura.
   * **Condición de Compra \***: Elige **CONTADO** o **CRÉDITO**.
   * **Fecha de Vencimiento**: Obligatoria si la condición es **CRÉDITO**, para programar el pago.
   * **Observaciones**: Anotaciones opcionales (ej. *Entrega parcial de mercadería*).
3. **Cargar los Artículos a la Grilla**:
   * **Opción 1: Escaneo con Lector de Código de Barras**:
     - Haz clic en el campo *Código de Barra* y pasa la pistola láser por el producto.
     - El sistema lo reconoce al instante, completa el costo pactado y posiciona el cursor en *Cantidad*.
   * **Opción 2: Selector Predictivo**:
     - Despliega el combo de artículos. Notarás que primero aparecen agrupados los **`⭐ Suministrados por [Proveedor Seleccionado]`** con su costo habitual precargado.
     - Ingresa la **Cantidad** (ej. `24`), ajusta el **Costo Unitario (Gs.)** si hubo variación de precio y verifica la alícuota de **IVA (10%, 5% o Exenta)**.
     - Haz clic en **"Agregar a Factura"**.
4. Repite el proceso para cada producto de la factura.
5. Verifica los totales consolidados al pie (Exentas, IVA 5%, IVA 10%, Crédito Fiscal y Total General).
6. Haz clic en **"Confirmar e Ingresar a Stock"**.
7. El sistema guardará la compra, aumentará de inmediato las existencias en inventario y dejará el comprobante registrado.

---

### Procedimiento B: Carga Masiva en Bloque (Selección Múltiple)

Cuando un distribuidor entrega un pedido extenso con decenas de productos habituales:

1. Dentro de la ventana de nueva compra, haz clic en el botón azul **"Carga Múltiple en Bloque"**.
2. Se abrirá una grilla con todo el catálogo disponible.
3. Utiliza la píldora de filtro rápido **`⭐ Solo de este Proveedor (N)`**:
   * Ocultará los productos ajenos y te mostrará únicamente los artículos provistos habitualmente por este distribuidor.
4. Tilda las casillas de verificación de los artículos que llegaron en el pedido.
5. Modifica en la misma grilla las **cantidades recibidas** y los **costos unitarios** si hubo cambios.
6. Haz clic en el botón **"Agregar Seleccionados a la Factura (N)"**.
7. Todos los productos marcados se insertarán en la factura en una sola acción.

---

### Procedimiento C: Alta Rápida de Artículo en Caliente (`+ ¿Artículo nuevo?`)

Si estás cargando una factura y el proveedor te trae un producto nuevo que no existe en el catálogo maestro:

1. **No necesitas cancelar ni perder los datos cargados**.
2. **Dos formas inmediatas de activarlo**:
   * **Vía Escáner / Código de Barras**: Si pasas la pistola lectora o escribes el código de barras y presionas `Enter`, al detectar que no existe en el catálogo, el sistema **despliega automáticamente la ventana de Alta Rápida** con el código ya completado.
   * **Vía Clic Directo**: Haz clic en el enlace azul **"+ ¿Artículo nuevo? Créalo aquí"** (ubicado justo arriba del selector de artículos).
3. **Completar datos en la ventana emergente (sin cerrar la factura)**:
   * Ingresa: Nombre del producto, Tipo (`VENTA_DIRECTA`, `ENVASE`, `SABOR`, `TOPPING`, `INSUMO`), Código de Barra y Unidad de Medida.
   * En la **Calculadora de Margen Comercial**, ingresa el Costo de Compra y selecciona el margen deseado (**15%**, **20%**, **30%**, **50%**) para calcular automáticamente el Precio de Venta sugerido al público para el POS.
4. **Presiona "Guardar e Insertar en Factura"**:
   * El artículo se registra en el catálogo maestro de inmediato.
   * Se vincula automáticamente a este proveedor como su proveedor principal con el costo pactado.
   * Se inserta de inmediato en la factura actual con su costo y tipo de IVA.
   * El cursor se ubica en el campo **Cantidad** para que digites cuántas unidades llegaron y presiones `Enter`.

---

### Procedimiento D: Protección Total contra Cierre Accidental

Para resguardar al operador durante la carga de pedidos extensos:
* **Fondo bloqueado**: Clics accidentales fuera de la ventana modal no cerrarán la pantalla.
* **Guardián de Confirmación**: Si se pulsa el botón `[X]` o `Cancelar` y ya existen artículos o datos cargados, el sistema solicitará confirmación explícita mediante un cuadro de diálogo:
  > *"Tienes X artículo(s) cargado(s) en esta factura. ¿Estás seguro de que deseas cancelar y salir? Se descartarán todos los artículos y datos no guardados."*
* Si se cancela la advertencia, la ventana permanece abierta intacta con toda la información.

---

### Procedimiento E: Exportar Listado de Compras (CSV y PDF)

* Desde la barra superior de `/compras`, pulsa:
  - **`Exportar CSV`**: Descarga una planilla Excel (UTF-8 con BOM y delimitador `;`) con todas las facturas filtradas en pantalla.
  - **`Descargar PDF`**: Emite un informe ejecutivo con membrete, métricas y tabla consolidada de comprobantes.
