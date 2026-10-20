# Manual de Usuario: Control Integral de Inventario y Kardex Físico

## 1. Propósito del Módulo
El módulo de **Control de Inventario & Stock** permite gestionar en tiempo real las existencias de todos los artículos del negocio. Supervisa los niveles críticos de mercadería para evitar desabastecimientos en mostrador, administra el inventario fraccionado en kilogramos (`kg`) para helados y en unidades (`u`) para envases y productos, registra mermas por rotura, vencimiento o producción interna, y calcula la valorización monetaria total del stock en **Guaraníes (Gs.)**.

* **Ruta de acceso en el sistema**: Menú Lateral > **Inventario & Stock** (`/stock`).
* **Permisos requeridos**: Rol `ADMIN`, `OWNER` o permiso explícito `stock`.

> [!NOTE]
> **Canal Oficial para Ingreso de Mercadería Comprada**:
> Todas las entradas de stock por compras a distribuidores deben canalizarse a través del módulo oficial de **Facturas de Compra (`/compras`)**. Esto garantiza la vinculación automática con el Timbrado, RUC del proveedor, liquidación de Crédito Fiscal IVA y registro inmutable en la Bitácora de Auditoría. El botón de movimiento manual se reserva exclusivamente para regularizaciones internas (producción, mermas, degustaciones o ajustes).

---

## 2. Pestañas y Vistas del Módulo

El módulo cuenta con pestañas organizadas para una rápida consulta:

1. 🔔 **Alertas Críticas**: Lista todos los artículos cuyo stock actual está en o por debajo del umbral mínimo configurado (o marcados como inactivos/agotados).
2. 🍦 **Sabores en Bacha**: Muestra las existencias de cada sabor de helado en kilogramos (`kg`).
3. 🥤 **Envases y Cucuruchos**: Potes térmicos (1/4 kg, 1/2 kg, 1 kg), vasitos plásticos y conos en unidades (`u`).
4. ☕ **Bebidas y Cafetería**: Productos empaquetados simples con código de barras en unidades (`u`).
5. 📋 **Movimientos & Kardex**: Historial auditable de cada entrada por compras, salida automática por venta del POS, merma o ajuste físico.
6. 🏢 **Valorización en Gs.**: Reporte valorizado que multiplica la existencia física por el costo unitario para calcular el capital total inmovilizado en almacén.
7. 📋 **Auditoría & Conteo Físico**: Planilla de relevamiento físico a ciegas y reportes comparativos (ver manual específico `08_auditoria_y_conteo_fisico.md`).

---

## 3. Procedimientos Paso a Paso

### Procedimiento A: Cómo Registrar un Movimiento Manual de Stock (Merma, Rotura o Ajuste)

Cuando se derrama una bacha de helado, se rompe un envase o se realiza una degustación interna:

1. En el encabezado superior haz clic en el botón azul **"Registrar Movimiento"**.
2. En la ventana emergente completa:
   * **Tipo de Artículo \***: Selecciona `SABOR` (helados), `ENVASE` (potes y conos) o `PRODUCTO` (bebidas y minimarket).
   * **Seleccionar Artículo \***: Elige el ítem específico de la lista desplegable.
   * **Tipo de Movimiento \***:
     * `SALIDA_MERMA`: Para dar de baja mercadería rota, vencida o derretida por corte de cadena de frío.
     * `AJUSTE_POSITIVO` / `PRODUCCION_INTERNA`: Para asentar bachas elaboradas en el propio obrador o taller.
     * `AJUSTE_NEGATIVO`: Correcciones administrativas directas con justificación obligatoria.
   * **Cantidad \***:
     * Si es sabor de helado, ingresa los kilogramos con hasta 3 decimales (ej. `12.500` kg).
     * Si es envase o producto, ingresa la cantidad entera (ej. `250` u).
   * **Costo Unitario (Gs.)**: Costo neto de referencia por kg o por unidad.
   * **Motivo / Justificación \***: Escribe el concepto (ej. *"Bacha caída accidentalmente en mostrador durante servicio"*).
3. Haz clic en **"Guardar Movimiento"**.
4. El stock actual del artículo se actualizará de inmediato y el movimiento quedará asentado tanto en el Kardex como en la **Bitácora de Auditoría (`/bitacora`)**.

---

### Procedimiento B: Consultar y Filtrar el Kardex Físico
1. Haz clic en la pestaña **Movimientos & Kardex**.
2. Aplica filtros de búsqueda:
   * **Rango de Fechas**: Desde (Fecha Inicio) y Hasta (Fecha Fin).
   * **Tipo de Artículo**: Filtrar por *Todos*, *Sabores*, *Envases* o *Productos*.
   * **Tipo de Movimiento**: Ver solo *Ventas POS*, solo *Compras*, solo *Mermas* o solo *Ajustes de Auditoría*.
3. Haz clic en **"Filtrar"**.
4. La tabla detalla: Fecha/hora, artículo, tipo de movimiento, cantidad, saldo resultante en almacén y usuario responsable.

---

### Procedimiento C: Supervisar Alertas de Stock Bajo y Reposición
1. Ingresa a la pestaña **Alertas Críticas**.
2. Si hay artículos cuyo stock cayó por debajo de su umbral mínimo de seguridad, aparecerán destacados en rojo o amarillo.
3. Si el stock llega a `0`:
   * En helados, el sabor se marca como **Agotado** y se deshabilita automáticamente en el POS para evitar ventas de bachas vacías.
   * Al recibir nueva mercadería desde el módulo de **Compras** o registrar elaboración interna, el producto se reactiva automáticamente para la venta.

---

### Procedimiento D: Consultar la Valorización Monetaria del Stock (Gs.)
1. Haz clic en la pestaña **Valorización en Gs.**.
2. Consulta el **Capital Total Invertido en Stock** en Guaraníes y el desglose monetario por categoría (*Sabores*, *Envases*, *Productos*).

---

## 4. Preguntas Frecuentes

### ¿Para qué sirve el botón "Reponer Stock" en Alertas y cuál es la diferencia con Compras a Proveedores?

* **Botón "Reponer Stock" (Ajuste Rápido Operativo):**
  - **Función:** Permite sumar mercadería o corregir de forma inmediata la cantidad en almacén desde la tabla de Alertas Críticas.
  - **Uso exclusivo interno:** Diseñado para **producción propia de helado artesanal en el local** (bachas elaboradas por el maestro heladero) o para **regularizaciones directas por recuento físico**.
  - **Sin impacto fiscal ni contable:** No genera factura, no solicita timbrado ni RUC, y **no mueve dinero de la caja registradora**.

* **Módulo "Compras a Proveedores" (`/compras`):**
  - **Función:** Canal oficial para registrar la entrada de mercadería comprada a distribuidores externos (potes, conos, bebidas, lácteos, materias primas).
  - **Fiscalidad e impuestos:** Exige factura legal con timbrado vigente y liquida el **Crédito Fiscal IVA (10%, 5% y Exentas)** para el informe contable.
  - **Impacto financiero:** Si la compra es al contado, genera automáticamente un **egreso de dinero en la sesión de caja activa** (`EGRESO_COMPRA`). Además, actualiza el costo de adquisición promedio y márgenes de ganancia.

#### Cuadro Comparativo Rápido:

| Criterio | ⚡ Reponer Stock (Alertas) | 📑 Compras a Proveedores (`/compras`) |
| :--- | :--- | :--- |
| **Naturaleza** | Ajuste operativo interno. | Operación comercial y fiscal con proveedor. |
| **Comprobante** | Sin comprobante (interno). | Factura legal obligatoria con Timbrado. |
| **Crédito Fiscal IVA** | No genera. | Genera Crédito Fiscal para Libro Compras. |
| **Caja Registradora** | No mueve fondos de caja. | Genera egreso de dinero (si es contado). |
| **Costos Unitarios** | Mantiene el costo existente. | Actualiza costo de compra y márgenes. |
| **Cuándo usarlo** | Producción propia de helado / Conteo físico. | Mercadería recibida de distribuidores. |

