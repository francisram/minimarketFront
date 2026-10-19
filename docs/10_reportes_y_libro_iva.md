# Manual de Usuario: Reportes Fiscales SET, Libro de Ventas, Compras y Analítica

## 1. Propósito del Módulo
El módulo de **Reportes y Analítica** centraliza la información impositiva, contable y operativa del negocio. Permite cumplir con las exigencias de la **Dirección Nacional de Ingresos Tributarios (DNIT / SET)** de Paraguay tanto en el débito fiscal (**Libro de Ventas IVA**) como en el crédito fiscal (**Compras a Proveedores**), además de auditar turnos de caja, supervisar talonarios de facturación, rankings de demanda, inventario valorizado y reimpresiones térmicas.

* **Ruta de acceso en el sistema**: Menú Lateral > **Reportes** (`/reportes`).
* **Permisos requeridos**: Rol `ADMIN`, `OWNER` o permiso explícito `reportes`.

---

## 2. Nueva Interfaz: Selector de Reportes con Iconos

Para facilitar una navegación limpia y rápida, las antiguas pestañas horizontales con scroll han sido reemplazadas por un **Selector Desplegable Moderno con Iconos y Descripciones**:

* **Disparador del Selector**: Muestra el ícono con color distintivo del reporte activo, su nombre, una breve descripción funcional, la etiqueta *"Vista activa"* y la flecha de apertura.
* **Menú Desplegable**: Al hacer clic, se despliegan los **9 reportes disponibles** con su ícono temático y una marca de verificación (`check`) sobre la opción seleccionada.
* **Cierre Inteligente**: Se cierra automáticamente al elegir una opción, al hacer clic fuera del control o al pulsar la tecla `Escape`.
* **Vista Dinámica**: Al seleccionar cualquier reporte, la pantalla inferior se actualiza de inmediato manteniendo activos los filtros de fecha y botones de exportación correspondientes.

### Catálogo de los 9 Reportes Integrados:

1. 📊 **Dashboard Ejecutivo** (Ícono azul `layout-dashboard`):
   * Métricas clave, KPIs de facturación, gráficos de ventas diarias y resumen de rendimiento financiero.
2. 🛒 **Ventas Detalladas** (Ícono verde `shopping-cart`):
   * Registro exhaustivo de tickets y facturas emitidas, discriminación por medios de pago (Efectivo, Tarjeta, QR) y listado de comensales.
3. 🚚 **Compras a Proveedores** (Ícono ámbar `truck`):
   * Facturas de compra recibidas, liquidación de **Crédito Fiscal IVA** (IVA 10%, IVA 5% y Exentas), compras contado/crédito y proveedores habituales.
4. 📑 **Libro Ventas IVA (SET)** (Ícono esmeralda `file-spreadsheet`):
   * Libro impositivo fiscal mensual estructurado según los requerimientos de la SET / DNIT para declaraciones juradas y Hechauka.
5. 💵 **Auditoría de Cajas** (Ícono turquesa `banknote`):
   * Control de sesiones de caja, arqueos ciegos declarados por cajeros vs. sistema y reporte de diferencias (sobrantes/faltantes).
6. 🏆 **Ranking Productos & Sabores** (Ícono violeta `award`):
   * Estadísticas de artículos estrella más vendidos, sabores de helado preferidos y rotación de stock.
7. 🖨️ **Reimpresiones** (Ícono pizarra `printer`):
   * Búsqueda y reimpresión de comprobantes térmicos legales y duplicados ante extravíos o roturas.
8. 📄 **Talonarios & Timbrado SET** (Ícono carmesí `file-text`):
   * Gestión de timbrados vigentes, puntos de expedición, control de consumo de números y alertas preventivas de vencimiento.
9. 🏬 **Inventario & Kardex** (Ícono naranja `warehouse`):
   * Existencias físicas, valuación monetaria del almacén en Guaraníes (Gs.), mermas y auditoría valorizada.

---

## 3. Procedimientos Paso a Paso

### Procedimiento A: Usar el Selector para Cambiar de Reporte
1. Ingresa a **Reportes** (`/reportes`).
2. En la cabecera, haz clic sobre el botón del selector (que muestra el reporte actual, por ejemplo *"Dashboard Ejecutivo"*).
3. Se abrirá la lista desplegable con los 9 reportes y sus respectivos íconos de color.
4. Haz clic sobre el reporte deseado (por ejemplo, *"Compras a Proveedores"* o *"Auditoría de Cajas"*).
5. El selector mostrará la nueva opción activa y la vista inferior cargará automáticamente los datos del reporte seleccionado.

---

### Procedimiento B: Consultar y Descargar Compras a Proveedores
1. En el selector, elige **Compras a Proveedores**.
2. **Definir Filtros**:
   * **Período**: Utiliza los botones rápidos (*Hoy*, *Ayer*, *Últimos 7 días*, *Este Mes*, *Mes Anterior*) o define fechas manuales.
   * **Proveedor**: Filtra por un distribuidor específico o todos.
   * **Condición**: *Todas*, *CONTADO* o *CRÉDITO*.
   * **Buscador**: Escribe N° de Factura, Timbrado, RUC o Nombre del Proveedor.
3. **Descarga**:
   * Haz clic en **"Descargar CSV"** para obtener el archivo en Excel UTF-8.
   * Haz clic en **"Descargar PDF (A4)"** para generar el reporte formal en orientación horizontal.

---

### Procedimiento C: Generar el Libro de Ventas IVA (SET)
1. En el selector, elige **Libro Ventas IVA (SET)**.
2. Selecciona el rango o preset de fechas impositivas y haz clic en **"Filtrar"**.
3. La grilla desplegará cada comprobante con fecha, timbrado, N° de comprobante (13 dígitos), RUC del comprador con DV, importes Exentos, Gravados 5%, Gravados 10% y liquidación del Débito Fiscal.
4. Exporta el archivo:
   * **"Descargar CSV"**: Formato estructurado para Hechauka o software contable.
   * **"Descargar PDF (A4)"**: Documento impositivo para archivo físico y fiscalización.

---

### Procedimiento D: Auditoría de Cajas y Arqueos
1. En el selector, elige **Auditoría de Cajas**.
2. Consulta el resumen de turnos cerrados en el período:
   * Cajero responsable, fecha/hora de apertura y cierre.
   * Fondo inicial en efectivo.
   * Monto esperado por sistema vs. monto físico declarado en el arqueo ciego.
   * Diferencia en Guaraníes (badge verde si es exacto, rojo si hay faltante, azul si hay sobrante).
   * Desglose por medios de pago (Efectivo, Tarjetas con N° de voucher, transferencias QR).
