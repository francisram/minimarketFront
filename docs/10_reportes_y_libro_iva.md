# Manual de Usuario: Reportes Fiscales SET, Libro de Ventas IVA y Reimpresiones

## 1. Propósito del Módulo
El módulo de **Reportes y Analítica SET** centraliza la información impositiva y contable del negocio. Permite cumplir con las exigencias de la **Dirección Nacional de Ingresos Tributarios (DNIT / SET)** de Paraguay mediante la emisión del **Libro de Ventas IVA**, la supervisión de talonarios y rangos de timbrado legal, y la reimpresión térmica de comprobantes emitidos.

* **Ruta de acceso en el sistema**: Menú Lateral > **Reportes** (`/reportes`).
* **Permisos requeridos**: Rol `ADMIN`, `OWNER` o permiso explícito `reportes`.

---

## 2. Submódulos y Pestañas Disponibles

El módulo está estructurado en 3 áreas principales:

1. 📊 **Libro de Ventas IVA**: Libro fiscal obligatorio mensual con desglose de tasas impositivas (Exentas, 5%, 10% y liquidación del IVA).
2. 🧾 **Talonarios y Timbrados**: Control del consumo de comprobantes autorizados y vencimiento legal del timbrado.
3. 🖨️ **Reimpresión de Comprobantes**: Consulta de tickets y facturas emitidas para reimpresión térmica en caso de rotura o extravío.

---

## 3. Procedimientos Paso a Paso

### Procedimiento A: Generar y Exportar el Libro de Ventas IVA Mensual

1. En la pestaña **Libro de Ventas IVA**:
2. Selecciona los filtros fiscales:
   * **Mes**: Elige el mes a liquidar (ej. *Octubre*).
   * **Año**: Selecciona el ejercicio fiscal (ej. *2026*).
3. Haz clic en **"Generar Libro de Ventas"**.
4. La tabla consolidará cada factura y ticket legal emitido en el mes con su desglose oficial:
   * **Fecha**: Día de expedición.
   * **N° de Timbrado**: Timbrado legal vigente al momento de la venta.
   * **N° de Comprobante**: Formato legal de 13 dígitos (`001-001-0000452`).
   * **RUC del Comprador**: Con su correspondiente Dígito Verificador (DV).
   * **Razón Social / Nombre**: Denominación del cliente.
   * **Ventas Exentas (Gs.)**: Importes no gravados.
   * **Gravadas 5% (Gs.)** y **Liquidación IVA 5% (Gs.)**.
   * **Gravadas 10% (Gs.)** y **Liquidación IVA 10% (Gs.)** (tasa estándar para heladerías y confiterías).
   * **Total Facturado (Gs.)**: Importe final de la operación.
5. **Opciones de Exportación**:
   * **"Exportar PDF Oficial"**: Genera el informe institucional para auditoría o archivo físico.
   * **"Exportar Formato Hechauka (CSV)"**: Archivo estructurado con delimitador punto y coma (`;`) listo para importar en el software impositivo del contador o en la plataforma Marangatu de la SET.

---

### Procedimiento B: Control y Alertas de Talonarios Fiscales

1. Haz clic en la subpestaña **Talonarios y Timbrados**.
2. Podrás verificar:
   * **Timbrado Vigente**: Número oficial emitido por la SET.
   * **Fecha de Caducidad**: Días restantes antes del vencimiento del timbrado.
   * **Rango Autorizado**: Número Inicial (ej. `0000001`) y Número Final (ej. `0005000`).
   * **Último Número Emitido**: Número actual alcanzado por la facturación.
   * **Hojas / Comprobantes Disponibles**: Saldo restante de facturas utilizables.
   > [!WARNING]
   > Si restan menos de 200 comprobantes o faltan menos de 30 días para la fecha de vencimiento del timbrado, el sistema emitirá una alerta visual para gestionar un nuevo timbrado ante la SET con la debida antelación.

---

### Procedimiento C: Reimpresión de Comprobantes Térmicos

Si un cliente solicita una copia de su ticket o si la impresora se quedó sin papel durante la venta:

1. Haz clic en la subpestaña **Reimpresión de Comprobantes**.
2. Busca la operación utilizando:
   * El número de ticket o factura (ej. `124`).
   * O filtrando por fecha y cajero.
3. En la fila del comprobante deseado, haz clic en el botón **"Reimprimir"** (ícono de impresora).
4. El sistema reenviará el comando de impresión a la ticketera térmica con el membrete institucional y la leyenda *"Copia / Reimpresión"*.
