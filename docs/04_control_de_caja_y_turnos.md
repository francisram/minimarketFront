# Manual de Usuario: Control de Caja, Turnos y Arqueo Ciego

## 1. Propósito del Módulo
El módulo de **Control de Caja** administra el ciclo de vida de cada turno comercial. Asegura la custodia del efectivo, registra las entradas y salidas de dinero no operativas, y realiza el arqueo ciego final para cuadrar exactamente los valores recaudados en Efectivo, Tarjetas (con Vouchers) y Billeteras Digitales/QR.

* **Ruta de acceso en el sistema**: Menú Lateral > **Control de Caja** (`/caja`).
* **Permisos requeridos**: Rol `CAJERO`, `ADMIN`, `OWNER` o permiso `caja`.

---

## 2. Elementos de la Pantalla de Caja

La pantalla varía dinámicamente según el estado del turno:

### Cuando la Caja está Cerrada:
* Formulario centrado de **Apertura de Turno** solicitando el Fondo Inicial de Sencillo.

### Cuando la Caja está Abierta (En Operación):
1. **Barra de Resumen del Turno**:
   * **Cajero Responsable**: Usuario que abrió la sesión de caja.
   * **Fecha y Hora de Apertura**: Momento exacto en que se habilitó el turno.
   * **Fondo Inicial (Gs.)**: Dinero recibido para dar cambio al inicio del turno.
   * **Total Ventas en Turno (Gs.)**: Total facturado y cobrado hasta el momento.
2. **Desglose de Ventas por Medio de Pago en Vivo**:
   * Total recaudado en **Efectivo**.
   * Total cobrado con **Tarjetas (POS)**.
   * Total recibido por **Código QR / Transferencias**.
3. **Botonera de Operaciones de Turno**:
   * Botón **"Ingreso de Dinero"**: Para registrar aportes extraordinarios de sencillo.
   * Botón **"Egreso / Retiro"**: Para registrar pagos menores de caja (hielo, insumos urgentes, delivery).
   * Botón **"Cerrar Turno de Caja"**: Inicia el proceso de arqueo y cierre.
4. **Tabla de Movimientos de la Sesión**: Registro cronológico de cada venta, ticket, entrada o salida de efectivo.

---

## 3. Procedimientos Paso a Paso

### Procedimiento A: Cómo Abrir un Turno de Caja

1. Al inicio de tu jornada laboral, dirígete al menú **Control de Caja** (`/caja`).
2. Si la caja de la terminal está cerrada, verás la pantalla de **Apertura de Caja**.
3. En el campo **Fondo Inicial en Efectivo (Gs.)**:
   * Cuenta físicamente los billetes y monedas que te entregó la administración como sencillo o cambio para iniciar el día.
   * Escribe el importe total en Guaraníes (ejemplo: `200000`).
4. (Opcional) En el campo de observaciones puedes colocar un comentario (ej. *"Turno Mañana - Mostrador 1"*).
5. Haz clic en el botón azul **"Abrir Turno de Caja"**.
6. A partir de este momento:
   * La sesión queda activa y registrada a tu nombre.
   * El Punto de Venta (POS) queda habilitado para cobrar ventas.

---

### Procedimiento B: Registrar un Ingreso Manual de Efectivo

Si durante el turno te quedas sin billetes chicos o monedas y gerencia te provee más sencillo:

1. En la pantalla de Caja haz clic en el botón **"Ingreso de Dinero"**.
2. En la ventana emergente completa:
   * **Monto a Ingresar (Gs.)**: Importe recibido (ej. `100000`).
   * **Motivo / Concepto**: Escribe la justificación (ej. *"Refuerzo de sencillo entregado por administración"*).
3. Haz clic en **"Guardar Ingreso"**. El efectivo disponible en caja se sumará automáticamente.

---

### Procedimiento C: Registrar un Egreso o Retiro Menor de Caja

Si debes realizar un pago en efectivo por un gasto menor del local:

1. Haz clic en el botón **"Egreso / Retiro"**.
2. En la ventana emergente completa:
   * **Monto a Retirar (Gs.)**: Importe abonado (ej. `25000`).
   * **Motivo / Concepto**: Detalla con claridad el gasto (ej. *"Compra de 2 bolsas de hielo por corte de suministro"* o *"Pago a delivery por envío"*).
   * **N° de Factura / Recibo del Gasto**: Si el proveedor te entregó un recibo o factura legal por la compra, escribe su número para respaldo contable.
3. Haz clic en **"Confirmar Egreso"**:
   * El dinero se descuenta del efectivo total esperado en cajón.
   * Se imprime un comprobante de egreso para que guardes el recibo firmado dentro de la gaveta.

---

### Procedimiento D: Cierre de Turno con Arqueo Ciego Desglosado

Al finalizar tu horario de trabajo, debes realizar el arqueo y cierre formal de tu caja:

1. En la pantalla de Caja, haz clic en el botón **"Cerrar Turno de Caja"**.
2. Se desplegará la ventana de **Arqueo Ciego de Valores**:
   > [!NOTE]
   > **¿Por qué es Ciego?**: La pantalla no te muestra cuánto dinero "debería haber", de modo que debes contar los valores reales con total honestidad y sin sesgos.

3. **Ingresa los 3 Valores Físicos Recaudados**:
   * **1. Total Efectivo en Cajón (Gs.) \***:
     * Cuenta todos los billetes y monedas que tienes en la gaveta (incluyendo el fondo inicial). Escribe la suma total.
   * **2. Total Vouchers de Tarjetas (Gs.) \***:
     * Toma todos los comprobantes / cupones impresos por el datáfono físico (POS de Bancard / Dinelco).
     * Súmalos con una calculadora o imprime el reporte de cierre del datáfono físico.
     * Escribe el importe total en Guaraníes.
   * **3. Total Cobros por QR / Transferencias (Gs.) \***:
     * Revisa tu terminal de cobro QR o extracto bancario de la jornada.
     * Escribe el monto total de pagos recibidos por esta vía.
4. **Observaciones de Cierre**: Ingresa cualquier comentario relevante (ej. *"Todo en orden, entregado a cajero entrante"*).
5. Haz clic en **"Confirmar y Cerrar Caja"**.

---

## 4. Interpretación del Resultado del Arqueo

Una vez confirmado el cierre, el sistema compara tus valores declarados contra las ventas registradas por el software y emite el informe:

* 🟢 **Caja Exacta (Diferencia = 0 Gs.)**: Lo que contaste coincide a la perfección con las ventas registradas.
* 🟡 **Sobrante (+X Gs.)**: Tienes físicamente más dinero o vouchers de los que el sistema esperaba (puede deberse a propinas no separadas o cobros no registrados en el POS).
* 🔴 **Faltante (-X Gs.)**: Tienes físicamente menos dinero del que el sistema calculó (puede deberse a un vuelto mal entregado o un gasto no registrado).

Se imprimirá en la ticketera el **Acta de Cierre de Caja (Reporte Z)** detallando:
* Hora de inicio y fin de turno.
* Fondo inicial.
* Ventas por medio de pago.
* Egresos e ingresos manuales.
* Importes declarados vs calculados.
* Diferencia final y espacio para firma manuscrita del Cajero y del Supervisor.
