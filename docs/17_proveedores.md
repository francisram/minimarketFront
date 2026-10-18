# Manual de Usuario: Padrón de Proveedores y Artículos Suministrados

## 1. Propósito del Módulo
El módulo de **Proveedores** centraliza la gestión de todas las empresas distribuidoras, fabricantes y mayoristas que abastecen al negocio (tanto productos de reventa como envases térmicos, materias primas e insumos para heladería). 

Permite mantener una base de datos comercial y fiscal organizada con RUC, datos bancarios de transferencia y, fundamentalmente, la **trazabilidad multi-proveedor (N:M)** que asocia qué artículos suministra cada empresa, a qué costo pactado individual y si opera como proveedor principal o alternativo.

* **Ruta de acceso en el sistema**: Menú Lateral > **Proveedores** (`/proveedores`).
* **Permisos requeridos**: Rol `ADMIN`, `OWNER` o permiso explícito `proveedores`.

---

## 2. Elementos Principales de la Pantalla

1. **Barra de Métricas y Búsqueda en Tiempo Real**:
   * Contador de proveedores activos y registrados.
   * Campo de búsqueda rápida que filtra al instante por Razón Social, RUC o Nombre del Vendedor/Contacto.
2. **Grilla de Proveedores**:
   * **RUC**: Con validación del Dígito Verificador (DV) legal paraguayo.
   * **Razón Social / Nombre Comercial**: Denominación jurídica del proveedor.
   * **Contacto y Teléfono**: Vendedor asignado y línea directa (llamada / WhatsApp).
   * **Email y Dirección**: Correo de órdenes de compra y depósito comercial.
   * **Artículos Suministrados**: Badge interactivo que indica la cantidad de productos vinculados en el catálogo maestro. Al hacer clic, abre el modal de consulta de artículos.
   * **Estado**: Indicador visual `Activo` (verde) o `Inactivo` (gris).
3. **Modal de Artículos Suministrados**:
   * Despliega la lista completa de artículos provistos por la empresa:
     - Nombre del artículo y Tipo (`VENTA_DIRECTA`, `ENVASE`, `SABOR`, `TOPPING`, `INSUMO`).
     - Código de Barra / SKU.
     - **Costo de Compra Pactado (Gs.)**: Precio acordado con este proveedor.
     - **Precio de Venta al Público (Gs.)**.
     - **Relación**: `⭐ Principal` (abastecedor prioritario) o `Alternativo`.
     - **Stock Actual** disponible en inventario.
     - Acceso directo para filtrar el Catálogo Maestro por este proveedor.

---

## 3. Procedimientos Paso a Paso

### Procedimiento A: Cómo Registrar un Nuevo Proveedor

1. En el módulo de Proveedores, haz clic en el botón azul **"+ Nuevo Proveedor"**.
2. Completa los campos en el formulario:
   * **RUC / Identificación Fiscal \***: Número de RUC de la empresa (ej. `80012345-6`).
   * **Razón Social \***: Denominación legal o comercial (ej. *Lácteos del Valle S.A.*).
   * **Nombre de Contacto**: Nombre del vendedor o preventista (ej. *Carlos Benítez*).
   * **Teléfono**: Línea fija o celular de pedidos (ej. `0981-123456`).
   * **Correo Electrónico**: Email para envío de órdenes de compra o facturas.
   * **Dirección**: Ubicación del depósito o planta distribuidora.
   * **Banco y Cuenta Bancaria**: Datos para pagos vía transferencia bancaria (opcional).
   * **Casilla "Activo"**: Mantener marcada para permitir compras inmediatas.
3. Haz clic en **"Guardar Proveedor"**.
4. El proveedor se listará de inmediato y estará disponible tanto en el Catálogo Maestro como en la pantalla de Facturas de Compra.

---

### Procedimiento B: Consultar los Artículos Provistos por una Empresa

1. En la lista de proveedores, localiza la empresa deseada.
2. Haz clic sobre el botón de artículos provistos (ej. **`Ver 5 artículos`**) o en el botón de acciones **"Artículos Suministrados"**.
3. Se abrirá la ventana modal con la grilla detallada:
   * Revisa qué productos comercializa este distribuidor.
   * Consulta el **Costo Pactado** para evaluar rentabilidad antes de emitir una orden de compra.
   * Verifica la estrella `⭐ Principal` para constatar si es el proveedor predeterminado del artículo.
4. Si deseas comprar mercadería de este proveedor, puedes presionar **"+ Registrar Compra"** para ir directo a la carga de factura con este proveedor preseleccionado.

---

### Procedimiento C: Vincular o Modificar Artículos Provistos

Los artículos no se cargan de forma aislada, sino integrados en el **Catálogo Maestro ERP**:
1. Dirígete a **Catálogos > Maestro ERP** (`/catalogos/maestro`).
2. Edita el artículo que deseas abastecer con este proveedor.
3. En la sección **"Proveedores que suministran este artículo"**, haz clic en **"+ Vincular Proveedor"**.
4. Selecciona el proveedor del listado, ingresa el **Costo de Compra (Gs.)**, el **Código de Referencia del Proveedor** (si emite con un código de catálogo propio) y tilda si es el **Proveedor Principal**.
5. Guarda el artículo. El contador de artículos del proveedor se actualizará automáticamente.

---

### Procedimiento D: Desactivar o Reactivar un Proveedor

Si una empresa discontinúa sus actividades o se suspende temporalmente la relación comercial:
1. En la grilla de proveedores, haz clic en el botón de alternar estado (o en el botón editar).
2. Desmarca la casilla **"Activo"** y confirma.
3. **Efecto en el sistema:**
   * El proveedor ya no aparecerá como opción disponible para nuevas facturas de compra.
   * Los registros históricos de compras anteriores y los artículos previamente vinculados se mantendrán intactos para preservar la auditoría fiscal y el kardex.
