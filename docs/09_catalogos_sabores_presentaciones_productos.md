# Manual de Usuario: Catálogos de Artículos (Maestro ERP, Sabores, Envases, Toppings y Productos)

## 1. Propósito del Módulo
El módulo de **Catálogos** es el núcleo de la oferta comercial y operativa del negocio. Integra una arquitectura unificada **Retail ERP** que permite clasificar todos los artículos del establecimiento (venta directa, envases/potes térmicos, sabores en bacha, toppings e insumos de elaboración), asociando múltiples proveedores por producto con sus respectivos costos pactados y calculando márgenes comerciales sugeridos.

* **Ruta de acceso en el sistema**: Menú Lateral > **Artículos & Catálogo ERP** (`/catalogos/maestro`).
* **Permisos requeridos**: Rol `ADMIN` o `OWNER`, o permisos específicos de catálogos.

---

## 2. Pestañas del Módulo de Catálogos

La pantalla se organiza en 5 pestañas especializadas:

1. 📦 **Pestaña "Maestro ERP" (Recomendada)**:
   * Vista consolidada de todo el inventario clasificado en 5 categorías de negocio:
     - **Venta Directa**: Bebidas envasadas, alfajores, snacks, artículos de minimarket.
     - **Envases**: Potes térmicos (1/4 kg, 1/2 kg, 1 kg), cucuruchos, vasos plásticos.
     - **Sabores**: Gustos de helado en bacha con atributos dietarios (Apto celíacos/Sin TACC, Vegano, Sin Azúcar).
     - **Toppings**: Salsas, chocolates, granas y agregados dulces.
     - **Insumos**: Materia prima para elaboración (leche, crema, bases neutras, azúcar).
   * Soporta **relación multi-proveedor (N:M)**: asignación de múltiples distribuidores por artículo con costos de compra individuales, códigos de referencia y marca de **⭐ Proveedor Principal**.
   * Filtro por Tipo de Artículo y por Proveedor específico.
2. 🍦 **Pestaña "Sabores"**:
   * Control específico de la carta de gustos y conmutador rápido de **Disponible / Agotado** para el Punto de Venta.
3. 🍨 **Pestaña "Envases / Presentaciones"**:
   * Definición de precios de venta y **límite máximo de sabores** permitidos por formato para el POS.
4. 🍫 **Pestaña "Toppings"**:
   * Adicionales y salsas con precio extra opcional.
5. 🥤 **Pestaña "Productos Simples"**:
   * Artículos de venta directa con código de barras y tasa de IVA.

---

## 3. Calculadora Inteligente de Margen Comercial y Precio de Venta

Al crear o editar cualquier artículo en el Catálogo Maestro o en el alta rápida de compras, se dispone de la tarjeta integrada **Calculadora de Precio de Venta y Margen**:

* **Cálculo Automático en Tiempo Real**:
  Al ingresar el `Precio de Costo (Gs.)` y el porcentaje de margen deseado (`% Margen`), el sistema calcula de inmediato el `Precio de Venta (Gs.)` mediante la fórmula:
  $$\text{Precio Venta} = \text{Precio Costo} \times \left(1 + \frac{\text{Margen}}{100}\right)$$
* **Botones Rápidos de Margen Comercial**:
  Botones accesibles con un solo clic para aplicar márgenes comerciales habituales:
  - **`15%`**: Margen de rotación rápida.
  - **`20%`**: Margen estándar minorista (seleccionado por defecto).
  - **`30%`**: Margen medio.
  - **`50%`**: Margen para productos de alta rentabilidad o elaboración propia.
* **Cálculo Bidireccional**: Si el usuario prefiere tipear directamente un Precio de Venta manual, el sistema recalcula al instante el porcentaje de margen real resultante.
* **Badge Dinámico de Ganancia Neta**: Exhibe visualmente el beneficio monetario en Guaraníes y el porcentaje neto obtenido (ej. `+Gs. 4.000 (20%)`), cambiando a color verde si es positivo o alerta roja si el precio de venta es inferior al costo.

---

## 4. Procedimientos Paso a Paso

### Procedimiento A: Cómo Dar de Alta un Artículo en el Catálogo Maestro ERP

1. En **Catálogos**, asegúrate de estar en la pestaña **"Maestro ERP"**.
2. Haz clic en el botón azul **"+ Nuevo Artículo"**.
3. En la ventana modal:
   * **Nombre del Artículo \***: Denominación comercial (ej. *Café Expreso Premium*).
   * **Tipo de Artículo \***: Selecciona `Venta Directa`, `Envase`, `Sabor`, `Topping` o `Insumo`.
   * **Código de Barras / SKU**: Escanea con lectora óptica o escribe el código EAN.
   * **Unidad de Medida**: Unidad, Kilogramo, Litro o Gramo.
   * **Tasa de IVA**: Selecciona `IVA 10%`, `IVA 5%` o `Exenta`.
4. **Fijar Costo y Precio de Venta con la Calculadora**:
   * Ingresa el **Precio Costo** (ej. `10.000`).
   * Pulsa el botón de margen deseado (ej. **`30%`**). El sistema fijará automáticamente el Precio de Venta en `13.000` Gs.
5. **Vincular Proveedores y Costos Pactados**:
   * En la sección inferior, haz clic en **"+ Vincular Proveedor"**.
   * Elige la empresa distribuidora, ingresa su costo pactado individual y marca si es el `⭐ Proveedor Principal`.
6. Haz clic en **"Guardar Artículo"**.

---

### Procedimiento B: Qué Hacer Cuando se Termina una Bacha (Marcar Sabor Agotado)

1. Ve a **Catálogos > Sabores** (o búscalo en *Maestro ERP*).
2. Localiza el sabor en la grilla.
3. Desmarca la casilla **"Disponible"**.
4. **Efecto Inmediato**: En el Punto de Venta (POS), el botón de ese sabor se tornará gris con la etiqueta **"Agotado"** y no podrá seleccionarse, evitando errores de despacho. Al reponer stock, vuelve a tildar la casilla.

---

### Procedimiento C: Configurar una Presentación con Límite de Sabores

1. En la pestaña **"Envases"**, presiona **"+ Nuevo Envase"**.
2. Completa el Nombre (ej. *Pote Térmico 1/2 Kg*), Precio de Venta (ej. `45.000`) y la **Capacidad Máxima de Sabores** (ej. `3`).
3. Guarda los cambios. En el POS, el cajero solo podrá marcar hasta 3 gustos para esta presentación.
