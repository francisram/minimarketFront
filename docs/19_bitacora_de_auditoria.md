# Manual de Usuario: Bitácora Centralizada de Auditoría (Audit Trail)

## 1. Propósito del Módulo
La **Bitácora Centralizada de Auditoría (*Audit Trail*)** es el registro oficial, inmutable y cronológico de todas las operaciones y modificaciones críticas realizadas por los usuarios en el sistema.

Garantiza la máxima transparencia y seguridad del negocio, permitiendo a los propietarios y administradores saber en todo momento **quién**, **cuándo**, **desde qué terminal (IP)** y **qué valores modificó con exactitud** (mostrando el valor anterior y el nuevo valor con flechas `➔`).

* **Ruta de acceso en el sistema**: Menú Lateral > **Bitácora de Auditoría** (`/bitacora`).
* **Permisos requeridos**: Rol `ADMIN` o `OWNER`.
* **Disponibilidad**: Módulo de alta seguridad disponible para perfiles de administración y control patrimonial.

---

## 2. Diferenciación de Vistas de Auditoría

Para evitar confusiones operativas, el sistema clasifica las tareas de auditoría en 3 ámbitos bien diferenciados:

| Módulo / Vista | Ruta | Ícono | Propósito y Alcance |
|---|---|---|---|
| **Bitácora de Auditoría** | `/bitacora` | 🕒 `history` | **Trazabilidad de cambios de usuarios**: quién cambió un precio, anuló una factura de compra, ajustó stock, abrió/cerró caja o editó catálogos. |
| **Auditoría & Conteo Físico** | `/auditoria` o `/stock` | 📋 `clipboard-check` | **Inventario físico en almacén**: conteo ciego de bachas, envases y productos, cálculo de mermas y actas de sobrantes/faltantes. |
| **Auditoría de Cajas** | `/reportes` (Selector) | 💵 `banknote` | **Control de recaudación**: verificación de cierres de turno, arqueo declarado por cajeros vs. sistema y diferencias por medio de pago. |

---

## 3. ¿Qué Eventos se Registran Automáticamente en la Bitácora?

La bitácora captura eventos en tiempo real sin requerir acción manual de los operadores:

1. **Precios y Catálogo de Artículos**:
   * Cambios de precios de venta y costos unitarios.
   * Modificación de nombres, stock mínimo, códigos de barra y códigos internos.
   * Altas y bajas de artículos simples, productos del catálogo maestro ERP, sabores en bacha, envases y toppings.
2. **Facturas de Compra a Proveedores**:
   * Registro de nuevas facturas de compra (con timbrado, proveedor, condición contado/crédito e impacto en stock).
   * Anulaciones de facturas de compra con **motivo obligatorio registrado** y reversión automática de existencias.
3. **Turnos y Movimientos de Caja**:
   * Apertura de turno con monto del fondo inicial en Guaraníes.
   * Cierre y arqueo ciego de turno, registrando los importes físicos declarados, importes del sistema y las diferencias (sobrante o faltante).
4. **Almacén y Regularizaciones de Stock**:
   * Movimientos manuales de inventario (mermas, roturas, consumo interno y producción).
   * Confirmación y cierre de actas de tomas de inventario físico.
5. **Clientes y Proveedores**:
   * Creación y modificación de datos de clientes corporativos y proveedores.

---

## 4. Elementos de la Pantalla de Bitácora

La interfaz se divide en 4 bloques principales:

### A. Tarjetas KPI de Actividad
En la cabecera se presentan 4 indicadores resumidos:
* 📊 **Total de Eventos**: Cantidad total de operaciones registradas bajo el filtro seleccionado.
* 👥 **Usuarios Activos**: Número de operadores distintos que han realizado transacciones.
* ✏️ **Modificaciones**: Cantidad de ediciones (precios, costos, artículos o ajustes).
* 🚫 **Bajas y Anulaciones**: Conteo de operaciones destructivas o de anulación (facturas anuladas, productos eliminados, etc.).

### B. Barra de Filtros Avanzada
Permite localizar cualquier evento histórico en segundos:
1. **Presets Rápidos de Fecha**:
   * `Hoy`: Eventos ocurridos en el día en curso.
   * `Esta Semana`: Últimos 7 días móviles.
   * `Este Mes`: Desde el día 1 del mes actual hasta hoy.
   * `Todo el Historial`: Consulta integral sin límite de fechas.
2. **Selectores Dinámicos**:
   * **Por Usuario**: Filtra los registros por el operador responsable (`admin`, cajeros, etc.).
   * **Por Módulo**: Selecciona un área (`PRODUCTOS_CAFETERIA`, `COMPRAS`, `CAJA`, `STOCK`, `CATALOGO_MAESTRO`, `SABORES`, etc.).
   * **Por Acción**: Filtra por tipo de evento (`CREACION`, `MODIFICACION`, `ELIMINACION`, `ANULACION`, `AJUSTE_INVENTARIO`, `APERTURA_CAJA`, `CIERRE_CAJA`).
3. **Buscador en Tiempo Real**:
   * Escribe cualquier texto para buscar por nombre del producto, número de comprobante, timbrado, proveedor o detalle específico.

### C. Grilla Interactiva de Auditoría
Tabla responsiva con las siguientes columnas:
* **Fecha y Hora**: Timestamp exacto del evento (formato `dd/MM/yyyy HH:mm:ss`).
* **Usuario**: Operador autenticado que ejecutó la acción.
* **Módulo**: Etiqueta identificadora del sector afectado.
* **Acción**: Badge con color semántico según el tipo de operación:
  * 🟢 **Verde (`CREACION`, `APERTURA_CAJA`)**: Nuevos registros.
  * 🔵 **Azul (`MODIFICACION`, `CIERRE_CAJA`)**: Actualizaciones.
  * 🔴 **Rojo (`ELIMINACION`, `ANULACION`)**: Cancelaciones o eliminaciones.
  * 🟣 **Violeta / Ámbar (`AJUSTE_INVENTARIO`)**: Ajustes de stock.
* **Elemento Afectado**: Nombre del producto, N° de factura, caja o entidad.
* **Detalle del Cambio**: Explicación clara con flechas de transición `➔` que contrastan el valor anterior con el nuevo valor (ej. `Precio venta: Gs. 12.000 ➔ Gs. 15.000`).
* **IP Origen**: Dirección IP del equipo o terminal desde donde se ejecutó la acción.

### D. Botones de Exportación
* 📥 **Descargar CSV (Excel)**: Genera un archivo `.csv` con codificación UTF-8 con BOM y separador `;`, compatible directamente con Microsoft Excel y Google Sheets.
* 📄 **Exportar PDF (A4 Apaisado)**: Genera un documento PDF formal en orientación horizontal con membrete institucional, RUC del negocio, bloque de KPIs y tabla paginada.

---

## 5. Procedimientos Paso a Paso

### Procedimiento A: Investigar Quién Modificó el Precio de un Producto
1. Ingresa a **Bitácora de Auditoría** en el menú lateral.
2. En el selector de **Módulo**, elige `PRODUCTOS_CAFETERIA` o `CATALOGO_MAESTRO`.
3. En el selector de **Acción**, elige `MODIFICACION`.
4. En el buscador de texto, escribe el nombre del producto (ej. *"Copa Especial"*).
5. La grilla mostrará inmediatamente el historial:
   * Quién realizó el cambio.
   * La fecha y hora exacta.
   * El detalle exacto: `Precio venta: Gs. 20.000 ➔ Gs. 25.000`.

---

### Procedimiento B: Auditar una Factura de Compra Anulada
1. En la barra de filtros, selecciona el preset de fecha deseado (ej. *Este Mes*).
2. En el filtro de **Módulo**, selecciona `COMPRAS`.
3. En el filtro de **Acción**, selecciona `ANULACION`.
4. En la grilla verás el número de factura anulada, el operador responsable y el **motivo de la anulación** ingresado obligatoriamente por el usuario.

---

### Procedimiento C: Descargar el Informe de Auditoría para Gerencia
1. Aplica los filtros deseados en la barra superior.
2. Haz clic en el botón superior **"Exportar PDF (A4)"**.
3. El sistema descargará un archivo nombrado automáticamente como `auditoria_dd_MM_yyyy_HHmm.pdf` listo para imprimir, archivar o adjuntar a auditorías externas.
