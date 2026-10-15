# Manual de Usuario: Datos del Negocio y Timbrado Fiscal Legal

## 1. Propósito del Módulo
El módulo de **Datos del Negocio y Facturación** centraliza los parámetros institucionales y tributarios de la empresa conforme a las regulaciones de la Dirección Nacional de Ingresos Tributarios (**DNIT**, anteriormente **SET - Subsecretaría de Estado de Tributación**) de la República del Paraguay. 

La información cargada en esta pantalla se imprime en el encabezado y pie de página de todos los comprobantes emitidos (tickets fiscales, facturas legales de contado/crédito y arqueos de caja), y alimenta los reportes impositivos del Libro de Ventas IVA.

* **Ruta de acceso en el sistema**: Menú Lateral > **Institución / Datos de Marca** (`/institucion`).
* **Permisos requeridos**: Rol `ADMIN` o `OWNER`, o permiso explícito `institucion`.

---

## 2. Estructura de la Pantalla de Configuración

La pantalla se distribuye en tres secciones principales:

### Sección 1: Datos Generales de la Heladería / Empresa
* **Nombre Comercial / Razón Social \***:
  * Denominación legal inscripta ante el RUC (ejemplo: *Don Nicola Helados S.R.L.* o *Heladería Artesanal Don Nicola*).
* **Dirección del Local**:
  * Domicilio comercial del establecimiento (ej. *Avda. Mariscal López N° 1234 c/ San Martín*).
* **Ciudad**:
  * Ciudad de ubicación física (ej. *Asunción*, *San Lorenzo*, *Ciudad del Este*, *Encarnación*).
* **Teléfono de Contacto**:
  * Línea fija y/o WhatsApp comercial para atención al cliente y pedidos por delivery (ej. `021-123456 / 0981-234567`).

### Sección 2: Datos Fiscales y Timbrado (Normativa DNIT / SET)
* **R.U.C. del Emisor \***:
  * Registro Único de Contribuyentes de la empresa, incluyendo su correspondiente Dígito Verificador (ej. `80012345-6`).
* **N° de Timbrado Vigente**:
  * Código numérico de 8 dígitos emitido por la DNIT que autoriza la emisión de facturas y comprobantes (ej. `17894561`).
* **Inicio de Vigencia del Timbrado**:
  * Fecha a partir de la cual la DNIT habilita el uso del timbrado fiscal.
* **Vigencia del Timbrado (Fecha de Vencimiento)**:
  * Fecha límite legal de validez del timbrado (generalmente 1 año desde su otorgamiento).
  * *Alerta del Sistema*: El sistema supervisa esta fecha para advertir oportunamente al administrador antes de que los comprobantes queden inhabilitados.
* **Establecimiento**:
  * Código de 3 dígitos asignado por la DNIT a la sucursal o casa matriz (ej. `001`).
* **Punto de Emisión**:
  * Código de 3 dígitos asignado al punto de expedición o caja (ej. `001` para Caja 1, `002` para Caja 2).

### Sección 3: Logotipo y Marca Institucional
* Configuración de imagen o enlace al isotipo de la marca para personalizar la cabecera gráfica en tickets térmicos de 80 mm y reportes en formato PDF.

---

## 3. Procedimientos Paso a Paso

### Procedimiento A: Cómo Configurar los Datos del Negocio por Primera Vez

1. Ingresa al sistema con credenciales de Administrador y ve a **Institución** (`/institucion`).
2. En **Datos Generales**:
   * Escribe la Razón Social y nombre de fantasía de la heladería.
   * Carga la dirección completa, ciudad y teléfono para que tus clientes puedan contactarte.
3. En **Datos Fiscales**:
   * Ingresa el RUC con guion y Dígito Verificador.
   * Coloca el número de Timbrado otorgado por la DNIT en tu constancia tributaria.
   * Selecciona las fechas de inicio y fin de vigencia en los selectores de calendario.
   * Coloca `001` en Establecimiento y `001` en Punto de Emisión si operas en un único local.
4. Presiona el botón verde **"Guardar Cambios"**.
5. Aparecerá una notificación verde: *"Datos institucionales guardados correctamente"*.

---

### Procedimiento B: Cómo Renovar el Timbrado Anual de la DNIT

Cuando venza el plazo de un año de tu timbrado fiscal y la administración tributaria te otorgue una nueva autorización:

1. Ingresa a **Institución** (`/institucion`).
2. Dirígete a la sección **Datos Fiscales**.
3. Reemplaza el campo **N° de Timbrado Vigente** por el nuevo número provisto por la DNIT.
4. Actualiza las fechas de **Inicio de Vigencia** y la nueva fecha de **Vencimiento** (un año hacia adelante).
5. Haz clic en **"Guardar Cambios"**.
6. **Efecto Inmediato**:
   * A partir del próximo segundo, cada nueva factura emitida en el Punto de Venta se imprimirá automáticamente con el nuevo número de Timbrado y su nueva fecha de vigencia legal.
   * El Libro de Ventas IVA agrupará las ventas bajo el nuevo timbrado sin alterar el histórico de las facturas emitidas bajo el timbrado anterior.

---

## 4. Preguntas Frecuentes y Normativa

### "¿Qué ocurre si se vence la fecha de Timbrado?"
* Emitir facturas con timbrado vencido constituye una falta tributaria grave ante la DNIT. El sistema te alertará visualmente en el panel y en los reportes fiscales. Asegúrate de renovarlo en esta pantalla antes del último día de vigencia indicado en tu constancia tributaria.

### "¿Cómo se reflejan estos datos en el ticket impreso?"
* El encabezado térmico de 58mm o 80mm imprime en sus primeras líneas:
  ```text
  ========================================
       HELADERÍA ARTESANAL DON NICOLA
            RUC: 80012345-6
         TIMBRADO N°: 17894561
    Válido desde: 01/01/2026 hasta: 31/12/2026
        Est: 001 - Pto Exp: 001
      Avda. Mariscal López N° 1234
            Tel: 021-123456
  ========================================
  ```
  Cumpliendo al 100% con los requisitos legales para comprobantes de venta.
