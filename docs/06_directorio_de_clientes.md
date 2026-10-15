# Manual de Usuario: Directorio y Gestión de Clientes

## 1. Propósito del Módulo
El módulo de **Clientes** centraliza el padrón de compradores habituales, empresas y consumidores del negocio. Su función principal es respaldar la facturación legal paraguaya, asegurando que los datos fiscales (RUC y Dígito Verificador) cumplan con los lineamientos de la **SET / DNIT** y facilitando la búsqueda ágil durante el cobro en mostrador.

* **Ruta de acceso en el sistema**: Menú Lateral > **Clientes** (`/clientes`).
* **Permisos requeridos**: Rol `CAJERO`, `ADMIN`, `OWNER` o permiso `clientes`.

---

## 2. Elementos de la Pantalla de Clientes

1. **Buscador y Filtros**:
   * Permite filtrar la tabla en tiempo real escribiendo el número de RUC, cédula o nombre/razón social.
2. **Botón "+ Nuevo Cliente"**:
   * Despliega el formulario de alta para nuevos contribuyentes o particulares.
3. **Tabla del Directorio**:
   * **Tipo y Documento**: Identificación del cliente con su Dígito Verificador (`RUC 80012345-6` o `CI 4567890`).
   * **Razón Social / Nombre**: Titular legal que saldrá impreso en las facturas.
   * **Teléfono / Celular**: Número de contacto o WhatsApp.
   * **Correo Electrónico**: Para envío digital de comprobantes.
   * **Dirección**: Localidad o dirección comercial.
   * **Acciones**:
     * Botón **Editar** (ícono lápiz ✏️).
     * Botón **Inactivar / Activar** cliente.

---

## 3. Procedimientos Paso a Paso

### Procedimiento A: Cómo Registrar un Cliente con RUC Paraguayo

1. Haz clic en el botón superior **"+ Nuevo Cliente"**.
2. En la ventana emergente completa:
   * **Tipo de Documento \***: Selecciona `RUC`.
   * **Número de RUC (sin guión ni DV) \***:
     * Escribe el número base (ejemplo: si el RUC es `80014520-4`, escribe únicamente `80014520`).
   * **Dígito Verificador (DV)**:
     * El sistema **calcula automáticamente el DV oficial** en tiempo real aplicando la fórmula de algoritmo Módulo 11 establecida por la SET de Paraguay.
   * **Razón Social \***:
     * Escribe la denominación social exacta registrada en el RUC (ejemplo: *"Distribuidora San Roque S.R.L."* o *"Ana María Bogado"*).
   * **Teléfono / WhatsApp**:
     * Escribe el número celular de contacto (ejemplo: `0981 123 456`).
   * **Correo Electrónico**:
     * Ingresa la casilla de e-mail (ejemplo: `compras@sanroque.com.py`).
   * **Dirección / Ciudad**:
     * Escribe la dirección fiscal (ejemplo: *"Avda. Eusebio Ayala 1250, Asunción"*).
3. Haz clic en **"Guardar Cliente"**.
4. El cliente quedará disponible de inmediato tanto en esta lista como en el buscador del Punto de Venta (POS).

---

### Procedimiento B: Cómo Registrar un Cliente Particular con Cédula de Identidad (CI)

1. Haz clic en **"+ Nuevo Cliente"**.
2. En **Tipo de Documento**, selecciona `CEDULA_IDENTIDAD`.
3. En **Número de Documento**, escribe el número de cédula (ejemplo: `3456789`).
   * Al seleccionar Cédula, el campo de Dígito Verificador se desactiva ya que las cédulas paraguayas no utilizan DV.
4. Escribe el **Nombre y Apellido Completo** (ejemplo: *"Marcos David Vera"*).
5. Completa teléfono y dirección si están disponibles.
6. Haz clic en **"Guardar Cliente"**.

---

### Procedimiento C: Modificar los Datos de un Cliente

Si un cliente cambió de número de teléfono, razón social o domicilio fiscal:

1. Localiza al cliente utilizando la barra de búsqueda (escribiendo su RUC o nombre).
2. Haz clic en el botón **Editar** (ícono de lápiz ✏️).
3. Corrige los campos necesarios.
4. Haz clic en **"Actualizar Cliente"**.

---

## 4. Validaciones Fiscales Importantes

> [!IMPORTANT]
> **RUC Único**: El sistema no permite registrar dos veces el mismo número de RUC para evitar duplicidad de cuentas corrientes o confusiones en el Libro de Ventas IVA. Si intentas guardar un RUC existente, el sistema te alertará indicando el nombre del cliente ya registrado.

> [!TIP]
> **Cliente Genérico Predeterminado**: El sistema incluye de fábrica el registro *"00000000 - Consumidor Final"*, el cual se utiliza automáticamente en el POS para todas aquellas ventas rápidas de mostrador donde el comprador no solicita factura con su número de RUC.
