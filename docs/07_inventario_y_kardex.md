# Manual de Usuario: Control Integral de Inventario y Kardex Físico

## 1. Propósito del Módulo
El módulo de **Control de Inventario & Stock** permite gestionar en tiempo real las existencias de todos los artículos del negocio. Supervisa los niveles críticos de mercadería para evitar desabastecimientos en mostrador, administra el inventario fraccionado en kilogramos (`kg`) para helados y en unidades (`u`) para envases y productos, registra entradas por compras o mermas por rotura, y calcula la valorización monetaria total del stock en **Guaraníes (Gs.)**.

* **Ruta de acceso en el sistema**: Menú Lateral > **Inventario & Stock** (`/stock`).
* **Permisos requeridos**: Rol `ADMIN`, `OWNER` o permiso explícito `stock`.

---

## 2. Pestañas y Vistas del Módulo

El módulo cuenta con 7 pestañas organizadas para una rápida consulta:

1. 🔔 **Alertas Críticas**: Lista todos los artículos cuyo stock actual está en o por debajo del umbral mínimo configurado (o marcados como inactivos).
2. 🍦 **Sabores en Bacha**: Muestra las existencias de cada sabor de helado en kilogramos (`kg`).
3. 🥤 **Envases y Cucuruchos**: Potes térmicos (1/4 kg, 1/2 kg, 1 kg), vasitos plásticos y conos en unidades (`u`).
4. ☕ **Bebidas y Cafetería**: Productos empaquetados simples con código de barras en unidades (`u`).
5. 📋 **Movimientos & Kardex**: Historial auditable de cada entrada, salida automática por venta del POS, merma o ajuste físico.
6. 🏢 **Valorización en Gs.**: Reporte valorizado que multiplica la existencia física por el costo unitario para calcular el capital total inmovilizado en almacén.
7. 📋 **Auditoría & Conteo Físico**: Planilla de relevamiento físico a ciegas y reportes comparativos (ver manual específico `08_auditoria_y_conteo_fisico.md`).

---

## 3. Procedimientos Paso a Paso

### Procedimiento A: Cómo Registrar un Movimiento Manual de Stock (Entrada por Compra o Salida por Merma)

Cuando recibes un pedido de mercadería de un proveedor o cuando se derrama/rompe un artículo:

1. En el encabezado superior haz clic en el botón azul **"Registrar Movimiento"**.
2. En la ventana emergente completa:
   * **Tipo de Artículo \***: Selecciona `SABOR` (helados), `ENVASE` (potes y conos) o `PRODUCTO` (bebidas y minimarket).
   * **Seleccionar Artículo \***: Elige el ítem específico de la lista desplegable.
   * **Tipo de Movimiento \***:
     * `ENTRADA_COMPRA`: Para sumar mercadería recibida por factura de compra.
     * `SALIDA_MERMA`: Para dar de baja mercadería rota, vencida o derretida por corte de cadena de frío.
     * `AJUSTE_POSITIVO` / `AJUSTE_NEGATIVO`: Correcciones administrativas directas.
   * **Cantidad \***:
     * Si es sabor de helado, ingresa los kilogramos con hasta 3 decimales (ej. `12.500` kg).
     * Si es envase o producto, ingresa la cantidad entera (ej. `250` u).
   * **Costo Unitario (Gs.)**: Costo neto de compra por kg o por unidad (ej. `25.000 Gs.` por kg).
   * **Motivo / Justificación \***: Escribe el concepto (ej. *"Recepción Factura N° 1024 Proveedor Lácteos"* o *"Bacha caída accidentalmente en mostrador"*).
3. Haz clic en **"Guardar Movimiento"**.
4. El stock actual del artículo se actualizará de inmediato y el movimiento quedará asentado en el Kardex.

---

### Procedimiento B: Consultar y Filtrar el Kardex Físico

El Kardex es el libro mayor de existencias que registra cronológicamente cada cambio en el stock:

1. Haz clic en la pestaña **Movimientos & Kardex**.
2. Puedes aplicar filtros de búsqueda:
   * **Rango de Fechas**: Desde (Fecha Inicio) y Hasta (Fecha Fin).
   * **Tipo de Artículo**: Filtrar por *Todos*, *Sabores*, *Envases* o *Productos*.
   * **Tipo de Movimiento**: Ver solo *Ventas POS*, solo *Entradas por Compra*, solo *Mermas* o solo *Ajustes de Auditoría*.
3. Haz clic en **"Filtrar"**.
4. La tabla detalla:
   * Fecha y hora exacta.
   * Tipo y nombre del artículo.
   * Concepto de movimiento.
   * Cantidad que entró o salió.
   * **Saldo Resultante**: Existencia en almacén tras esa operación.
   * Usuario responsable que ejecutó la acción.

---

### Procedimiento C: Supervisar Alertas de Stock Bajo y Reposición

1. Ingresa a la primera pestaña **Alertas Críticas**.
2. Si hay productos cuyo stock cayó por debajo de su umbral mínimo de seguridad:
   * Aparecerán destacados con tarjeta roja o amarilla.
   * Muestra: Stock Actual vs Stock Mínimo establecido.
3. Si el stock llega a `0`:
   * En helados, el sabor se marca como **Agotado** y se deshabilita automáticamente en el POS para evitar que los cajeros vendan sabores inexistentes.
   * Al recibir nueva mercadería y registrar la `ENTRADA_COMPRA`, el producto se reactiva automáticamente para la venta.

---

### Procedimiento D: Consultar la Valorización Monetaria del Stock (Gs.)

1. Haz clic en la pestaña **Valorización en Gs.**.
2. La pantalla presenta:
   * **Capital Total Invertido en Stock**: Suma total monetaria en Guaraníes.
   * **Total Ítems en Almacén**: Cantidad de referencias registradas.
   * **Tabla Detallada por Producto**:
     * Rubro, nombre, unidad de medida.
     * Stock Físico actual.
     * Costo unitario promedio en Gs.
     * Subtotal valorizado (`Stock Actual * Costo Unitario`).
3. Puedes filtrar por rubro (*Sabores*, *Envases*, *Productos*) o buscar por nombre para consultar el costo total de un sector en particular.
