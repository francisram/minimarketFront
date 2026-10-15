# Manual de Usuario: Auditoría y Conteo Físico de Inventario a Ciegas (Blind Stocktaking)

## 1. Propósito del Módulo
El módulo de **Auditoría & Conteo Físico** permite llevar a cabo inventarios físicos periódicos en freezers, bachas, estanterías y almacén. Implementa la modalidad de **Conteo a Ciegas (*Blind Stocktaking*)**, asegurando que el auditor no conozca las existencias teóricas del sistema mientras cuenta, impidiendo cualquier manipulación artificial de números para forzar el cuadre de stock.

* **Rutas de acceso en el sistema**:
  * Menú Lateral directo: **Auditoría & Conteo Físico** (`/auditoria`).
  * O desde **Inventario & Stock** (`/stock`), pestaña **"Auditoría & Conteo Físico"**.
* **Permisos requeridos**: Rol `AUDITOR`, `ADMIN`, `OWNER` o permiso `auditoria` / `stock`.

---

## 2. Concepto Clave: ¿Qué es el Conteo a Ciegas?

En muchas empresas, cuando se entrega una planilla con el stock que el sistema "dice que hay", el personal suele limitarse a copiar los mismos números o redondear para evitar explicaciones sobre faltantes. 

El **Conteo a Ciegas**:
1. **Oculta el Stock Sistema**: El auditor no sabe si el sistema espera 5 kg, 20 kg o 0 kg de un sabor.
2. **Campos en Blanco**: Todos los artículos arrancan vacíos (`null`) requiriendo el ingreso explícito de lo observado en la realidad.
3. **Sin Discrepancias en Vivo**: No se calculan diferencias ni impactos en dinero mientras se tipea.
4. **Revelación Post-Aplicación**: Una vez que el auditor guarda y confirma definitivamente su conteo, el sistema contrasta los datos y despliega el **Reporte Comparativo Completo**.

---

## 3. Procedimiento de Auditoría Paso a Paso

### Paso 1: Iniciar una Nueva Auditoría Física

1. Dirígete a **Auditoría & Conteo Físico** (`/auditoria` o pestaña Auditoría en `/stock`).
2. En la vista verás el historial de tomas anteriores. Haz clic en el botón principal **"Iniciar Nuevo Conteo Físico"**.
3. El sistema cargará la **Planilla de Conteo Físico a Ciegas**:
   * En la cabecera, ingresa el **Motivo u Observación** de la auditoría (ejemplo: *"Auditoría de cierre mensual - Verificación Freezers 1, 2 y Depósito"*).
   * La barra de progreso superior indicará:
     * **Total a Contar**: Cantidad total de artículos activos en el catálogo.
     * **Artículos Contados**: Contador reactivo (`0 / Total`).
     * **Pendientes por Contar**: Cantidad de artículos que aún faltan auditar.
     * **Avance del Conteo**: Porcentaje de avance (`%`).

---

### Paso 2: Conteo Físico en Freezers y Estanterías

1. Recorre las instalaciones con tu terminal (tablet, laptop o anotaciones físicas).
2. Para cada producto, escribe la cantidad real observada en la columna **"Stock Físico (Contado)"**:
   * **Sabores de Helado**: Pesa la bacha en la báscula y descuenta el peso de la lata o bacha vacía (tara). Escribe los kilogramos netos con decimales (ejemplo: `3.450` kg).
   * **Envases y Cucuruchos**: Cuenta las cajas o unidades de potes térmicos y cucuruchos. Ingresa el número entero (ejemplo: `145` u).
   * **Productos de Minimarket**: Cuenta las botellas o paquetes en las heladeras y góndolas. Ingresa el número entero (ejemplo: `24` u).
3. **Indicador de Estado de Fila**:
   * Mientras no ingreses un valor, la fila muestra el badge amarillo `Pendiente`.
   * En cuanto escribes una cantidad, el badge cambia inmediatamente a verde `Contado` con un ícono de verificación.
4. **Herramientas de Agilidad**:
   * **Buscador en Tiempo Real**: Si buscas un sabor específico (ej. *"Sambayón"*), escribe su nombre para filtrar la tabla al instante.
   * **Filtros por Rubro**: Puedes alternar entre las pestañas *Todos*, *Sabores (kg)*, *Envases (u)* y *Bebidas / Otros* para contar ordenadamente por sector.

---

### Paso 3: Aplicación del Conteo y Ajuste Atómico en Base de Datos

Una vez completado el relevamiento físico:
1. Haz clic en el botón verde **"Aplicar Conteo y Ajustar Stock"**.
   > [!WARNING]
   > Si no ingresaste el conteo de ningún artículo, el sistema te alertará que debes contar al menos un ítem antes de procesar.
2. Se desplegará el **Modal de Confirmación de Seguridad**:
   * Muestra el resumen del conteo: *Total de artículos*, *Artículos con conteo físico* y *Porcentaje auditado*.
   * Si dejaste artículos con el badge `Pendiente`, el sistema mostrará una advertencia clara:
     > *"Atención: Hay X artículo(s) sin conteo ingresado. Al confirmar, los artículos pendientes se asentarán con existencia física en 0."*
3. Haz clic en **"Confirmar y Aplicar Inventario"**.
4. **Acciones que ejecuta el sistema en milisegundos**:
   * Crea un registro de **Acta de Auditoría** inmutable con fecha, hora y usuario auditor.
   * Actualiza el stock real de la base de datos de cada sabor, envase o producto para que coincida con lo contado.
   * Si un sabor de helado estaba marcado como agotado y el conteo arrojó existencia física positiva, el sistema **lo reactiva automáticamente para la venta en el POS**.
   * Asienta en el **Kardex** los movimientos oficiales de regularización bajo el concepto `AJUSTE_INVENTARIO`.

---

### Paso 4: Análisis del Reporte Comparativo y Descargas

Inmediatamente tras guardar, se abre la ventana del **Reporte Comparativo de Auditoría**:

1. **Cabecera Resumen**:
   * Fecha, hora, auditor responsable y el **Impacto Económico Neto en Guaraníes (Gs.)** (en rojo si hubo pérdida neta o verde si hubo ganancia neta).
2. **Tabla Comparativa Detallada**:
   * **Stock Sistema (Antes)**: La existencia que el sistema tenía registrada antes del conteo.
   * **Stock Físico (Contado)**: Lo que el auditor ingresó.
   * **Diferencia**:
     * `0`: Coincidencia exacta.
     * `-X`: Faltante de mercadería.
     * `+X`: Sobrante de mercadería.
   * **Costo Unitario (Gs.)**: Costo del artículo.
   * **Impacto en Gs.**: Valor monetario de la diferencia (`Diferencia * Costo Unitario`).
   * **Resultado**: Badge con la clasificación oficial (*Coincide*, *Faltante*, *Sobrante*).
3. **Filtros de Análisis**:
   * Botón *"Solo Discrepancias"*: Filtra la tabla para ver únicamente los productos que tuvieron faltantes o sobrantes.
   * Botón *"Solo Coincidentes"*: Muestra los que estuvieron 100% exactos.
4. **Exportar Acta Oficial en PDF A4**:
   * Genera el informe institucional formal en orientación apaisada (Landscape) con membrete legal de la empresa (RUC, Timbrado, Dirección), tarjetas de métricas, tabla comparativa a colores y **líneas de firma manuscrita para el Auditor y el Gerente de Sucursal**.
5. **Exportar CSV**:
   * Descarga una planilla electrónica con separador de punto y coma (`;`) y codificación compatible con Microsoft Excel para auditorías contables.
