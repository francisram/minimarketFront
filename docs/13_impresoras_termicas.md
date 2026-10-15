# Manual de Usuario: Configuración de Impresoras Térmicas ESC/POS

## 1. Propósito del Módulo
El módulo de **Impresoras Térmicas** permite conectar, calibrar y gestionar las impresoras de tickets y comandas instaladas en el negocio (marcas Epson, Bixolon, Xprinter, Hasar, POS-D, etc.). El sistema soporta comunicación directa por protocolo estándar **ESC/POS** a través de red local (TCP Raw), colas de impresión CUPS (Linux / macOS) e impresoras compartidas en red local de Windows (SMB).

* **Ruta de acceso en el sistema**: Menú Lateral > **Impresoras** (`/impresoras`).
* **Permisos requeridos**: Rol `ADMIN` o `OWNER`, o permiso explícito `impresoras`.

---

## 2. Tipos de Conexión Disponibles

El sistema soporta tres modalidades de conectividad para adaptarse a cualquier infraestructura de red:

1. **Red Local (TCP Raw / Ethernet o Wi-Fi)**:
   * **Recomendado para locales comerciales**.
   * La ticketera está conectada directamente al router mediante cable de red (RJ45) o red inalámbrica, y posee una dirección IP fija (ej. `192.168.1.200`).
   * No depende de ninguna computadora encendida para funcionar.
   * Puerto por defecto: `9100`.
2. **Recurso Compartido de Windows (SMB Share)**:
   * Para impresoras térmicas conectadas por cable USB a una computadora con sistema operativo Windows en caja o mostrador.
   * Se accede mediante la ruta UNC de red: `\\IP_DEL_EQUIPO\NOMBRE_COMPARTIDO` (ej. `\\192.168.1.50\TicketeraCaja`).
   * Puerto SMB: `445` (admite usuario y contraseña de red si la PC lo requiere).
3. **Servidor de Impresión CUPS (Linux / macOS)**:
   * Para servidores o terminales basadas en Linux (Ubuntu, Debian) o Mac donde la impresora está configurada mediante el subsistema CUPS.

---

## 3. Procedimientos Paso a Paso

### Procedimiento A: Cómo Registrar una Impresora de Red (Ethernet / Wi-Fi)

1. En el módulo de Impresoras, haz clic en el botón azul **"+ Nueva Impresora"**.
2. En la ventana emergente, completa los datos:
   * **Nombre Descriptivo \***: Asigna un nombre claro que identifique su ubicación (ej. *Ticketera Caja 1* o *Comandera Mostrador*).
   * **Tipo de Conexión \***: Selecciona `Socket TCP Raw (Red)`.
   * **Dirección IP \***: Escribe la dirección IP asignada a la impresora en la red local (ej. `192.168.1.200`).
   * **Puerto TCP \***: Mantén el valor estándar `9100` (salvo configuración especial del fabricante).
   * **Ancho de Papel \***:
     * `80 mm`: Formato estándar ancho (permite facturas detalladas, logos y desglose de IVA claro).
     * `58 mm`: Formato angosto y compacto para tickets de despacho rápido.
   * **Destino / Propósito**:
     * `Caja / Ventas`: Para emisión de tickets legales y facturas.
     * `Cocina / Comandas`: Para impresión automática de pedidos de elaboración.
   * **Apertura de Cajón Portamonedas**:
     * Marca la casilla si la impresora tiene conectado el cable RJ11 de la gaveta de dinero en su parte trasera.
3. Haz clic en **"Guardar Impresora"**.

---

### Procedimiento B: Cómo Registrar una Impresora USB Compartida en Windows

1. En la computadora Windows donde está conectada físicamente la impresora:
   * Abre *Panel de Control > Dispositivos e Impresoras*.
   * Haz clic derecho sobre la impresora térmica > *Propiedades de Impresora* > Pestaña *Compartir*.
   * Marca *"Compartir esta impresora"* y dale un nombre corto sin espacios ni acentos (ejemplo: `TICKET1`).
   * Anota la dirección IP de esa computadora (ej. `192.168.1.45`).
2. En el sistema web, ve a **Impresoras > Nueva Impresora**.
3. Selecciona el tipo de conexión `Windows Share (SMB)`.
4. Ingresa:
   * **Dirección IP**: `192.168.1.45`.
   * **Nombre de Cola / Recurso**: `TICKET1`.
   * **Puerto**: `445`.
   * **Usuario y Contraseña**: (Opcional, sólo si la PC de Windows requiere autenticación para compartir).
5. Haz clic en **"Guardar Impresora"**.

---

### Procedimiento C: Realizar una Prueba de Impresión (Test Print)

Para confirmar que la red y el mecanismo de corte térmico funcionan adecuadamente:

1. Localiza la tarjeta de la impresora registrada en la pantalla.
2. Haz clic en el botón **"Test de Impresión"** (ícono de hoja con texto).
3. El sistema enviará inmediatamente un trabajo de prueba por ESC/POS.
4. La impresora emitirá un ticket con el siguiente contenido:
   * Título: *--- TEST DE IMPRESIÓN ---*
   * Nombre de la impresora y fecha/hora exacta.
   * Línea de prueba de caracteres y texto centrado.
   * Salto de papel de cortesía y corte de guillotina automático (si el modelo lo soporta).
5. Si el ticket sale correctamente, la ticketera está lista para operar en el Punto de Venta.

---

### Procedimiento D: Abrir el Cajón de Dinero (Test de Gaveta)

1. En la tarjeta de la impresora de Caja, haz clic en el botón **"Abrir Cajón"** (ícono de gaveta / billete).
2. El sistema enviará el pulso eléctrico ESC/POS (Pin 2 / Pin 5) a través del puerto RJ11 de la ticketera.
3. El cerrojo del cajón portamonedas debe dispararse y abrirse al instante.
   * *Uso Operativo*: Este mismo comando se envía automáticamente al completar una venta en efectivo en el POS o al registrar movimientos en el Control de Caja.

---

## 4. Preguntas Frecuentes y Diagnóstico de Fallas

### "Presiono 'Test de Impresión' y la impresora no responde"
1. **Verifica cables y luces**: Asegúrate de que la impresora tenga papel térmico cargado (con el lado sensible hacia el cabezal térmico) y que la luz de `Power` esté fija en azul/verde (sin parpadeos de `Error`).
2. **Comprueba la IP**: Apaga la impresora, mantén presionado el botón *Feed* (Avance de papel) y enciéndela sin soltar el botón durante 3 segundos. La impresora imprimirá su auto-test con la dirección IP actual asignada por el router. Verifica que coincida exactamente con la IP configurada en el sistema.
3. **Misma Red Local**: Asegúrate de que el servidor o la computadora que corre el sistema esté conectada a la misma red local o Wi-Fi que la impresora.

### "El texto sale con caracteres extraños o símbolos raros"
* Asegúrate de haber seleccionado el ancho de papel correcto (`80mm` o `58mm`). El sistema utiliza la tabla de caracteres estándar ESC/POS para idioma español (página de códigos 850 / UTF-8 compatible).
