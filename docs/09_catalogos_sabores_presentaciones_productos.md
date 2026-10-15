# Manual de Usuario: Catálogos de Artículos (Sabores, Envases, Toppings y Productos)

## 1. Propósito del Módulo
El módulo de **Catálogos** es el corazón de la oferta comercial del negocio. Permite administrar la carta completa de sabores de helado artesanal, los diferentes formatos de envases y cucuruchos con sus límites de sabores permitidos, la lista de adicionales/toppings y los productos simples de cafetería, bebidas o minimarket con código de barras y tasa de IVA correspondiente (10%, 5% o Exenta).

* **Ruta de acceso en el sistema**: Menú Lateral > **Catálogos** (`/catalogos`).
* **Permisos requeridos**: Rol `ADMIN` o `OWNER`, o permiso explícito `sabores`, `presentaciones`, `toppings` o `productos`.

---

## 2. Pestañas del Módulo de Catálogos

La pantalla se organiza en cuatro pestañas especializadas:

1. **Pestaña "Sabores"**:
   * Catálogo de gustos de helado en bacha (ej. *Dulce de Leche Granizado*, *Chocolate Suizo*, *Frutilla al Agua*, *Sambayón*).
   * Permite marcar rápidamente si un sabor está **Disponible** o **Agotado** para que el Punto de Venta (POS) lo refleje en el acto.
2. **Pestaña "Envases / Presentaciones"**:
   * Formatos térmicos y galletitas en los que se despacha el helado (ej. *Cucurucho Simple*, *Cucurucho Doble*, *Pote 1/4 Kg*, *Pote 1/2 Kg*, *Pote 1 Kg*).
   * Define el precio de venta y la **capacidad máxima de sabores** que el cliente puede elegir.
3. **Pestaña "Toppings"**:
   * Agregados y salsas opcionales que enriquecen los helados (ej. *Salsa de Dulce de Leche*, *Lluvia de Almendras*, *Chispas de Chocolate*, *Oreo Molida*).
4. **Pestaña "Productos Simples"**:
   * Artículos empaquetados o de cafetería que no requieren combinación de sabores (ej. *Agua Mineral 500ml*, *Gaseosa Coca-Cola 350ml*, *Café Cortado*, *Alfajores*). Admite escaneo por lector de código de barras.

---

## 3. Procedimientos Paso a Paso

### Procedimiento A: Cómo Dar de Alta un Nuevo Sabor de Helado

1. En el módulo de Catálogos, haz clic en la pestaña **"Sabores"**.
2. Presiona el botón azul **"+ Nuevo Sabor"** en la esquina superior derecha.
3. En la ventana modal emergente, completa:
   * **Nombre del Sabor \***: Escribe el nombre descriptivo (ej. *Maracuyá Cremoso*).
   * **Descripción**: Breve reseña del sabor o ingredientes destacados (opcional).
   * **Color Identificador (Color Hex)**: Selecciona o ingresa un color distintivo (ej. `#FBBF24` para amarillo/maracuyá) para que los cajeros lo reconozcan rápidamente en la botonera del POS.
   * **Disponible**: Marca la casilla si el sabor ya se encuentra en la conservadora de mostrador listo para la venta.
4. Haz clic en **"Guardar Sabor"**.
5. El nuevo sabor aparecerá inmediatamente en la grilla y estará disponible en el Punto de Venta.

---

### Procedimiento B: Qué Hacer Cuando se Termina una Bacha (Marcar Sabor Agotado)

Cuando un heladero nota que una bacha de helado se vació y no hay reposición inmediata en la cámara:

1. Ve a **Catálogos > Sabores**.
2. Localiza el sabor en la lista (puedes buscarlo escribiendo su nombre).
3. Haz clic en el botón de estado o edita el sabor y desmarca la casilla **"Disponible"**.
4. **Efecto Inmediato**:
   * En el Punto de Venta (POS), el botón de ese sabor se mostrará en color gris opaco con la etiqueta **"Agotado"** y quedará deshabilitado.
   * Esto previene que los cajeros cobren sabores inexistentes a los clientes en fila.
5. Tan pronto se elabore una nueva bacha o se reponga en vitrina, vuelve a activar la casilla para habilitarlo nuevamente.

---

### Procedimiento C: Cómo Crear una Presentación / Envase de Helado

1. Haz clic en la pestaña **"Envases"**.
2. Presiona el botón **"+ Nuevo Envase"**.
3. Completa los datos requeridos:
   * **Nombre de la Presentación \***: Ej. *Pote Térmico 1 Kg*.
   * **Precio de Venta (Gs.) \***: Valor monetario en Guaraníes (ej. `65000`).
   * **Capacidad Máxima de Sabores \***:
     * Cantidad de gustos que el cajero puede seleccionar como máximo en el POS (ejemplo: `1` para cono simple, `2` para 1/4 kg, `3` para 1/2 kg, `4` para 1 kg).
     * El POS validará estrictamente este límite para evitar sobrepasar la capacidad física del envase.
   * **Tasa de IVA \***: Selecciona `IVA 10%` (régimen general para gastronomía en Paraguay).
   * **Estado Activo**: Casilla marcada para que figure en la botonera de ventas.
4. Presiona **"Guardar Presentación"**.

---

### Procedimiento D: Cómo Dar de Alta un Topping o Salsa

1. Haz clic en la pestaña **"Toppings"**.
2. Presiona el botón **"+ Nuevo Topping"**.
3. Rellena los datos:
   * **Nombre del Topping \***: Ej. *Bañado de Chocolate Caliente*.
   * **Precio Adicional (Gs.) \***: Costo que se sumará al helado (ej. `3000`). Si el topping es de cortesía sin costo, ingresa `0`.
   * **Tasa de IVA \***: Selecciona `IVA 10%`.
   * **Disponible**: Marca la casilla si hay existencia en mostrador.
4. Haz clic en **"Guardar Topping"**.

---

### Procedimiento E: Cómo Registrar un Producto Simple (Bebidas, Cafetería o Snacks)

1. Haz clic en la pestaña **"Productos Simples"**.
2. Presiona el botón **"+ Nuevo Producto"**.
3. Completa los campos:
   * **Nombre del Producto \***: Ej. *Agua Mineral sin Gas 500 ml*.
   * **Código de Barras**:
     * Haz clic en el campo y pasa el artículo por el escáner láser USB para capturar el código EAN-13 automáticamente, o escríbelo a mano.
   * **Precio de Venta (Gs.) \***: Precio unitario al público (ej. `5000`).
   * **Tasa de IVA \***:
     * `IVA 10%`: Bebidas gaseosas, golosinas, cafetería.
     * `IVA 5%`: Productos de canasta básica si aplicase por normativa tributaria.
     * `Exenta`: Productos legalmente exentos según el Libro IVA de la DNIT.
   * **Activo**: Marca la casilla para habilitar su venta.
4. Haz clic en **"Guardar Producto"**.

---

## 4. Reglas Comerciales y Validaciones

* **Precios en Guaraníes sin Decimales**: De acuerdo con las disposiciones monetarias paraguayas, todos los precios se gestionan como números enteros en `Gs.`.
* **Protección de Artículos con Historial de Ventas**: No se permite eliminar definitivamente un envase o producto que ya haya sido facturado en órdenes previas para salvaguardar la integridad fiscal del Libro de Ventas IVA. En su lugar, el sistema permite desactivarlo (*Estado Inactivo*) para que deje de aparecer en la pantalla de ventas sin romper los registros históricos.
