# Manual de Usuario: Reportes Fiscales SET, Libro de Ventas, Compras a Proveedores y Reimpresiones

## 1. Propósito del Módulo
El módulo de **Reportes y Analítica SET** centraliza la información impositiva, contable y operativa del negocio. Permite cumplir con las exigencias de la **Dirección Nacional de Ingresos Tributarios (DNIT / SET)** de Paraguay tanto en el débito fiscal (**Libro de Ventas IVA**) como en el crédito fiscal (**Compras a Proveedores**), además de supervisar talonarios de facturación, rankings de productos, arqueos históricos y reimpresiones térmicas.

* **Ruta de acceso en el sistema**: Menú Lateral > **Reportes** (`/reportes`).
* **Permisos requeridos**: Rol `ADMIN`, `OWNER` o permiso explícito `reportes`.

---

## 2. Pestañas del Módulo de Reportes

1. 🚚 **Compras a Proveedores (Nuevo)**:
   * Consolidado de facturas de compra recibidas con cálculo del **Crédito Fiscal IVA** (IVA 10%, IVA 5% y Exentas).
   * Filtros combinados por rango de fechas, proveedor, condición de compra (Contado / Crédito) y estado.
   * Exportación oficial en formato **CSV (Excel)** y **PDF A4 Apaisado (Landscape)**.
2. 📊 **Libro de Ventas IVA**:
   * Libro fiscal mensual obligatorio con desglose oficial de comprobantes emitidos para la SET/DNIT.
3. 💼 **Cajas y Turnos**:
   * Historial de aperturas, cierres ciegos, arqueos por medio de pago y control de sobrantes/faltantes.
4. 🏆 **Rankings y Productos**:
   * Estadísticas de artículos más vendidos, sabores con mayor rotación y rentabilidad.
5. 🧾 **Talonarios y Timbrados**:
   * Control del consumo de comprobantes autorizados y advertencias de caducidad legal.
6. 🖨️ **Reimpresión de Comprobantes**:
   * Consulta y reimpresión de comprobantes fiscales térmicos ante extravío o rotura.
7. 📦 **Inventario Valorizado**:
   * Reportes de existencias y valor monetario del stock.

---

## 3. Procedimientos Paso a Paso

### Procedimiento A: Consultar y Descargar el Reporte de Compras a Proveedores

1. En el módulo de Reportes, haz clic en la pestaña **"Compras a Proveedores"** (ícono de camión 🚚).
2. **Definir los Filtros de Consulta**:
   * **Período**: Utiliza los accesos rápidos (*Hoy*, *Esta semana*, *Este mes*, *Últimos 30 días*, *Todo el año*) o selecciona fechas personalizadas de inicio y fin.
   * **Proveedor**: Elige *Todos los Proveedores* o filtra por una empresa en particular.
   * **Condición de Compra**: Filtra por *Todas*, *CONTADO* o *CRÉDITO*.
   * **Estado**: Filtra por *CONFIRMADA* o *ANULADA*.
   * **Buscador en tiempo real**: Escribe para filtrar al instante por N° de Factura, Timbrado, RUC o Nombre del Proveedor.
3. **Lectura de Tarjetas KPI Dinámicas**:
   * **Total Compras Facturadas**: Monto global en Guaraníes y cantidad de facturas activas.
   * **Crédito Fiscal IVA Total**: Total de IVA a favor del contribuyente, desglosado en IVA 10% e IVA 5%.
   * **Compras a Crédito**: Volumen de facturas pendientes o financiadas.
4. **Inspección de Renglones**: Haz clic en el botón de ojo / detalle de cualquier fila para abrir el modal interactivo y consultar los artículos adquiridos, cantidades y costos unitarios.
5. **Descarga y Exportación**:
   * **Botón "Exportar CSV"**: Descarga una planilla compatible con Excel (codificación UTF-8 con BOM y delimitador `;`), con membrete institucional, RUC, detalle fiscal y fila de sumatorias totales.
   * **Botón "Descargar PDF (A4)"**: Genera un documento vectorial en orientación apaisada (*landscape*) con membrete de la empresa, bloques KPI de resumen y grilla formateada lista para imprimir o archivar.

---

### Procedimiento B: Generar y Exportar el Libro de Ventas IVA Mensual

1. En la pestaña **Libro de Ventas IVA**:
2. Selecciona el **Mes** y **Año** a liquidar y haz clic en **"Generar Libro de Ventas"**.
3. La grilla desplegará cada factura con fecha, timbrado, N° de comprobante (13 dígitos), RUC del comprador con DV, importes Exentos, Gravados 5%, Gravados 10% y liquidación del IVA.
4. Exporta el archivo según requerimiento contable:
   * **"Exportar Formato Hechauka (CSV)"**: Archivo estructurado listo para importar en el software impositivo o en la plataforma Marangatu de la SET.
   * **"Exportar PDF Oficial"**: Documento para firma y archivo físico.

---

### Procedimiento C: Control de Vencimiento de Timbrados

1. En la pestaña **Talonarios y Timbrados**, consulta:
   * Timbrado vigente, fecha de caducidad, comprobantes emitidos y saldo restante disponible.
   > [!WARNING]
   > Si restan menos de 200 comprobantes o menos de 30 días para el vencimiento legal, el sistema emitirá una alerta visual para gestionar la renovación ante la SET con anticipación.

---

### Procedimiento D: Reimpresión de Comprobantes Térmicos

1. En la pestaña **Reimpresión de Comprobantes**, busca la transacción por N° de comprobante o fecha.
2. Haz clic en **"Reimprimir"** para reenviar el ticket a la impresora térmica con la leyenda *"Copia / Reimpresión"*.
