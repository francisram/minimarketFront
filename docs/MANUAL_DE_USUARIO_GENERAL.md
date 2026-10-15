# MANUAL GENERAL DE USUARIO
## Sistema de Gestión Comercial, Punto de Venta y Facturación Legal Paraguaya (SET / DNIT)
### Especializado para Heladerías, Confiterías y Minimarkets

---

# Tabla de Contenidos

1. [Introducción y Conceptos Clave](#1-introducción-y-conceptos-clave)
2. [Seguridad y Roles del Sistema](#2-seguridad-y-roles-del-sistema)
3. [El Ciclo Operativo Diario](#3-el-ciclo-operativo-diario)
4. [Módulo 1: Autenticación e Inicio de Sesión](#4-módulo-1-autenticación-e-inicio-de-sesión)
5. [Módulo 2: Dashboard General y Métricas de Rendimiento](#5-módulo-2-dashboard-general-y-métricas-de-rendimiento)
6. [Módulo 3: Punto de Venta (POS) y Venta de Mostrador](#6-módulo-3-punto-de-venta-pos-y-venta-de-mostrador)
7. [Módulo 4: Control de Caja, Turnos y Arqueo Ciego](#7-módulo-4-control-de-caja-turnos-y-arqueo-ciego)
8. [Módulo 5: Monitor de Pedidos y Despacho](#8-módulo-5-monitor-de-pedidos-y-despacho)
9. [Módulo 6: Directorio y Gestión de Clientes (RUC / CI)](#9-módulo-6-directorio-y-gestión-de-clientes-ruc--ci)
10. [Módulo 7: Control de Inventario, Bachas y Kardex Físico](#10-módulo-7-control-de-inventario-bachas-y-kardex-físico)
11. [Módulo 8: Auditoría y Conteo Físico a Ciegas (Blind Stocktaking)](#11-módulo-8-auditoría-y-conteo-físico-a-ciegas-blind-stocktaking)
12. [Módulo 9: Catálogo de Productos, Sabores, Envases y Toppings](#12-módulo-9-catálogo-de-productos-sabores-envases-y-toppings)
13. [Módulo 10: Reportes Fiscales SET, Libro Ventas IVA y Reimpresiones](#13-módulo-10-reportes-fiscales-set-libro-ventas-iva-y-reimpresiones)
14. [Módulo 11: Gestión de Usuarios y Personal](#14-módulo-11-gestión-de-usuarios-y-personal)
15. [Módulo 12: Roles y Matriz de Permisos](#15-módulo-12-roles-y-matriz-de-permisos)
16. [Módulo 13: Configuración de Impresoras Térmicas ESC/POS](#16-módulo-13-configuración-de-impresoras-térmicas-escpos)
17. [Módulo 14: Datos del Negocio y Timbrado Fiscal Legal](#17-módulo-14-datos-del-negocio-y-timbrado-fiscal-legal)
18. [Módulo 15: Licenciamiento del Software](#18-módulo-15-licenciamiento-del-software)
19. [Módulo 16: Copias de Seguridad y Restauración Integral (Backups)](#19-módulo-16-copias-de-seguridad-y-restauración-integral-backups)
20. [Preguntas Frecuentes y Solución de Incidencias](#20-preguntas-frecuentes-y-solución-de-incidencias)

---

## 1. Introducción y Conceptos Clave

Este sistema es una solución integral desarrollada específicamente para negocios del rubro gastronómico y comercial en Paraguay, con especial énfasis en **heladerías artesanales**, **confiterías**, **minimarkets** y tiendas de conveniencia.

### Particularidades del Negocio Contempladas:
* **Moneda Nacional**: Todos los importes monetarios se expresan en **Guaraníes (Gs.)**, sin decimales y con separador de miles por punto (`15.000 Gs.`), respetando el estándar financiero paraguayo.
* **Venta Fraccionada de Helados**: Los sabores de helado se gestionan por peso en kilogramos (`kg`) con hasta 3 decimales (`0.250 kg`, `0.500 kg`, `1.000 kg`), mientras que los envases (potes térmicos de 1/4 kg, 1/2 kg, 1 kg, cucuruchos, vasitos) se controlan por unidades (`u`).
* **Cumplimiento Tributario Paraguayo (SET / DNIT)**:
  * Facturación con número de **Timbrado oficial**, vigencia desde/hasta y numeración secuencial (`001-001-0000123`).
  * Validación estricta del **Dígito Verificador (DV)** según el algoritmo oficial Módulo 11 para RUCs paraguayos.
  * Desglose impositivo en comprobantes: Exentas, Gravadas 5%, Gravadas 10% y Liquidación total del IVA (10% e 5%).
  * Generación del **Libro de Ventas IVA** mensual apto para el sistema de control tributario *Marangatu / Hechauka*.

---

## 2. Seguridad y Roles del Sistema

El sistema implementa un control de acceso basado en roles (*Role-Based Access Control - RBAC*). Cada usuario tiene asignado un perfil que determina exactamente a qué pantallas, botones y operaciones puede acceder.

| Rol Sugerido | Descripción de Funciones | Módulos Autorizados Típicos |
| :--- | :--- | :--- |
| **OWNER / PROPIETARIO** | Máxima jerarquía comercial y técnica. Administra suscripciones, licencias, respaldos y configuración del negocio. | Todos los módulos sin excepción. |
| **ADMIN / GERENTE** | Supervisión operativa total de sucursal, compras, márgenes, usuarios, roles, catálogo y fiscalidad. | Todos excepto licenciamiento avanzado. |
| **CAJERO / VENDEDOR** | Operación de salón y mostrador: apertura de caja, venta en POS, cobro, emisión de tickets y arqueo final. | POS, Caja, Clientes, Monitor de Pedidos. |
| **AUDITOR / INVENTARIO** | Auditoría y control de existencias. Realiza el conteo físico de bachas y mercaderías a ciegas y emite actas. | Auditoría & Conteo Físico, Dashboard. |
| **COCINA / DESPACHO** | Personal de armado de pedidos, envasado de helados o preparación de cafetería. | Monitor de Pedidos. |

---

## 3. El Ciclo Operativo Diario

Para garantizar el orden administrativo, la cuadratura de caja y la consistencia del stock, se debe seguir esta rutina diaria:

```
[1. INICIO DE JORNADA]
   └── El Cajero inicia sesión con su usuario y contraseña.
   └── Ingresa a "Control de Caja" y realiza la "Apertura de Turno" declarando el fondo fijo (cambio inicial).

[2. DURANTE EL TURNO]
   └── En "Punto de Venta (POS)":
        ├── Selecciona el envase/pote y elige los sabores disponibles (o productos de minimarket).
        ├── Agrega toppings si el cliente lo solicita.
        ├── Asocia el cliente (por RUC o Sin Nombre / Consumidor Final).
        ├── Cobra seleccionando el medio de pago (Efectivo, Tarjeta con Voucher, QR).
        └── Emite el ticket o factura legal en la impresora térmica.
   └── En cocina/mostrador se visualiza y prepara en el "Monitor de Pedidos".
   └── Si hay gastos menores de caja (ej. compra de hielo, insumos urgentes), se registran como egreso en "Caja".

[3. CIERRE DE JORNADA / CAMBIO DE TURNO]
   └── El Cajero realiza el "Arqueo Ciego de Caja":
        ├── Cuenta físicamente los billetes y monedas en efectivo.
        ├── Suma los comprobantes/vouchers de tarjetas de crédito/débito.
        ├── Verifica el total de cobros recibidos por QR o transferencias bancarias.
        └── Ingresa estos 3 importes en el formulario de cierre.
   └── El sistema calcula automáticamente la diferencia (Sobrante, Faltante o Exacto).
   └── Se imprime el comprobante de Cierre de Caja en la ticketera.

[4. AUDITORÍA PERIÓDICA]
   └── El Auditor ingresa a "Auditoría & Conteo Físico" e inicia un conteo físico a ciegas de bachas y freezers.
   └── Aplica el ajuste de stock y descarga el Acta Oficial en PDF firmada.
```

---

## 4. Módulo 1: Autenticación e Inicio de Sesión

### ¿Dónde se encuentra?
Ruta: `/login` (es la pantalla inicial del sistema).

### Paso a Paso: Iniciar Sesión
1. Ingresa tu **Nombre de Usuario** asignado por la administración (ej. `cajero1`, `admin`).
2. Ingresa tu **Contraseña**.
3. Haz clic en el botón azul **"Iniciar Sesión"** o presiona `Enter`.
4. Si las credenciales son correctas, el sistema cargará tu sesión y te redirigirá a tu módulo principal (Dashboard o POS según tus permisos).

### Situaciones Especiales:
* **"Usuario o contraseña incorrectos"**: Verifica que no tengas activada la tecla de mayúsculas (`Bloq Mayús`). Si olvidaste tu clave, solicita al Administrador que la restablezca desde *Gestión de Usuarios*.
* **"Tu contraseña ha expirado / Debe cambiar contraseña"**: Por política de seguridad, el sistema te redirigirá automáticamente a la pantalla de cambio de clave. Debes ingresar tu contraseña actual y la nueva contraseña (mínimo 6 caracteres).
* **"Cuenta desactivada"**: Tu usuario ha sido inhabilitado temporalmente por la gerencia. Contacta a tu supervisor.
* **Cerrar Sesión**: En la barra superior derecha, haz clic en tu nombre o avatar y selecciona **"Cerrar Sesión"**. Nunca dejes tu terminal abierta al terminar tu turno.

---

## 5. Módulo 2: Dashboard General y Métricas de Rendimiento

### ¿Dónde se encuentra?
Menú Lateral: **Dashboard** (`/dashboard`).

### Objetivo:
Brindar a los encargados y dueños un panorama inmediato del rendimiento económico del negocio, ventas del día, ticket promedio y alertas operativas.

### Componentes de la Pantalla:
1. **Tarjetas Superiores de Métricas (KPIs)**:
   * **Ventas del Día (Gs.)**: Total acumulado de ventas cobradas en la fecha actual.
   * **Cantidad de Pedidos**: Volumen de transacciones emitidas hoy.
   * **Ticket Promedio (Gs.)**: Promedio de gasto por cada cliente (`Total Gs. / Cantidad Pedidos`).
   * **Estado de la Caja**: Indica si hay una caja abierta en la terminal actual y el cajero responsable.
2. **Gráfico de Ventas por Hora / Día**: Permite visualizar los picos de afluencia de clientes para optimizar turnos de personal.
3. **Distribución por Medio de Pago**: Gráfico circular que muestra el porcentaje cobrado en Efectivo, Tarjetas (POS) y QR.
4. **Accesos Rápidos**: Botones para saltar directamente a *Nueva Venta en POS*, *Control de Caja* o *Reportes*.

---

## 6. Módulo 3: Punto de Venta (POS) y Venta de Mostrador

### ¿Dónde se encuentra?
Menú Lateral: **Punto de Venta (POS)** (`/pos`).

### Requisito Indispensable:
**Debe existir una Caja Abierta** en la terminal. Si intentas cobrar con la caja cerrada, el sistema te advertirá que debes abrir turno primero.

### Procedimientos Paso a Paso:

#### Situación A: Venta de Helado por Sabores y Pote
1. En el catálogo izquierdo verás las categorías: *Potes/Envases*, *Sabores*, *Toppings*, *Bebidas/Otros*.
2. Haz clic en la pestaña **Envases** y selecciona el formato deseado (ej. *Pote Térmico 1 kg*, *Pote 1/2 kg*, *Cucurucho Doble*).
3. Automáticamente se abrirá una ventana emergente para **Seleccionar Sabores**:
   * La ventana te indicará el límite máximo de sabores que admite ese envase (ej. hasta 4 sabores para 1 kg).
   * Selecciona los sabores deseados haciendo clic sobre ellos (ej. *Dulce de Leche Granizado*, *Chocolate Suizo*, *Frutilla a la Crema*).
   * Si un sabor está agotado (stock 0 kg), el botón aparecerá deshabilitado con la etiqueta *"Agotado"*.
4. Haz clic en **"Confirmar Sabores"**. El pote con sus sabores se añadirá a la orden en la columna derecha.

#### Situación B: Agregar Toppings o Coberturas
1. Haz clic en la pestaña **Toppings**.
2. Selecciona salsas (chocolate, frutilla), confites, chips o nueces. Cada uno se agregará con su precio adicional configurado.

#### Situación C: Venta de Productos de Minimarket y Bebidas
1. Haz clic en la pestaña **Bebidas / Productos** o utiliza la **Barra de Búsqueda / Lector de Código de Barras**.
2. Al escanear o tipear el nombre (ej. *Agua Mineral 500ml*, *Gaseosa*), el producto se suma al carrito. Puedes aumentar o disminuir la cantidad con los botones `+` y `-`.

#### Situación D: Asignar Datos del Cliente para Factura Legal
1. En la parte superior de la orden verás el selector de cliente (por defecto: *"Sin Nombre / Consumidor Final"*).
2. Para emitir comprobante nominativo:
   * Escribe el RUC o Cédula en el buscador.
   * Si el cliente ya existe, selecciónalo de la lista desplegable.
   * Si es un cliente nuevo, haz clic en **"+ Nuevo Cliente"**, ingresa su RUC con DV, Razón Social y Teléfono, y guárdalo. Quedará vinculado inmediatamente a la venta.

#### Situación E: Cobro de la Orden y Emisión de Factura
1. Haz clic en el botón grande verde **"Cobrar (F10)"** o presiona la tecla `F10`.
2. Se abrirá la **Ventana de Cobro**:
   * **Efectivo**: Ingresa el monto entregado por el cliente en el campo *Monto Recibido*. El sistema calculará automáticamente el **Vuelto en Gs.** en números grandes.
   * **Tarjeta de Débito o Crédito**:
     > [!IMPORTANT]
     > **Validación de Voucher Obligatoria**: Por control contable y arqueo de fin de turno, al seleccionar Tarjeta es **estrictamente obligatorio ingresar el Número de Voucher / Cupón** emitido por el datáfono físico (POS de Bancard / Dinelco). Sin este número, el botón de confirmar cobro permanecerá bloqueado.
   * **Código QR / Transferencia Bancaria**: Selecciona la opción QR e ingresa el ID de transacción o referencia bancaria.
   * **Pago Mixto**: Puedes dividir el pago (ej. 30.000 Gs. en efectivo y 50.000 Gs. con tarjeta ingresando el voucher).
3. Selecciona el tipo de comprobante: **Ticket Térmico** o **Factura Legal SET**.
4. Haz clic en **"Confirmar y Emitir"**:
   * La comanda se envía al *Monitor de Pedidos*.
   * Se descuenta el stock de ingredientes y envases.
   * Se envía la orden de impresión a la ticketera configurada.
   * Se abre el cajón de dinero automáticamente si está conectado.

---

## 7. Módulo 4: Control de Caja, Turnos y Arqueo Ciego

### ¿Dónde se encuentra?
Menú Lateral: **Control de Caja** (`/caja`).

### Objetivo:
Garantizar la transparencia en el manejo del dinero, evitar sustracciones y cuadrar exactamente los valores recaudados en cada turno de trabajo.

### Procedimientos Paso a Paso:

#### 1. Apertura de Turno (Inicio del Día o Cambio de Cajero)
1. Si no hay caja abierta, la pantalla mostrará el formulario de **Apertura de Caja**.
2. Verifica que el cajero asignado sea tu usuario.
3. En el campo **Fondo Inicial de Caja (Gs.)**, ingresa la cantidad de dinero en efectivo que te entregó la administración como cambio/sencillo (ej. `200.000 Gs.`).
4. Haz clic en **"Abrir Turno de Caja"**. A partir de este instante, el POS queda habilitado para cobrar.

#### 2. Durante el Turno: Consultas y Movimientos Manuales
* **Panel de Movimientos**: Muestra en tiempo real cada venta realizada en el turno, indicando hora, N° de ticket, medio de pago y monto.
* **Registrar Ingreso Manual**: Si recibes más sencillo durante el día, haz clic en *"Ingreso de Dinero"*, ingresa el importe y el motivo (ej. *"Cambio recibido de gerencia"*).
* **Registrar Egreso Manual**: Si se paga un gasto menor de caja, haz clic en *"Egreso / Retiro"*, escribe el monto y el concepto (ej. *"Compra de rollos de papel térmico"* o *"Pago a delivery"*).

#### 3. Cierre de Turno con Arqueo Ciego Desglosado
Al finalizar el turno de trabajo:
1. Haz clic en el botón superior **"Cerrar Turno de Caja"**.
2. Se desplegará el modal de **Arqueo Ciego de Valores**:
   > [!NOTE]
   > El sistema no muestra cuánto dinero "debería haber" en el formulario para evitar que el operador coloque números falsos para forzar el cuadre. El cajero debe contar honestamente sus valores reales.
3. Ingresa los 3 valores reales que tienes físicamente en mano:
   * **Efectivo Físico en Cajón (Gs.)**: Cuenta todos los billetes y monedas del cajón y escribe el total.
   * **Total Vouchers de Tarjetas (Gs.)**: Toma todos los cupones impresos por el POS de tarjetas, súmalos e ingresa el importe total.
   * **Total Cobros por QR / Transferencias (Gs.)**: Revisa el resumen de cobros QR en el terminal o panel de cobros e ingresa el total.
4. (Opcional) Ingresa observaciones de cierre (ej. *"Turno tarde sin novedades"*).
5. Haz clic en **"Confirmar y Cerrar Caja"**.
6. **Resultado del Arqueo**:
   * El sistema contrasta el total esperado vs el total declarado.
   * Si la diferencia es `0 Gs.`, la caja está **Cuadrada (Exacta)**.
   * Si hay diferencia, se clasificará claramente en **Sobrante** (verde) o **Faltante** (rojo) por cada medio de pago.
7. Se emite automáticamente el **Comprobante de Cierre de Caja (Z)** en la ticketera para ser firmado y entregado a administración con el sobre de dinero.

---

## 8. Módulo 5: Monitor de Pedidos y Despacho

### ¿Dónde se encuentra?
Menú Lateral: **Monitor de Pedidos** (`/pedidos`).

### Objetivo:
Pantalla estilo KDS (*Kitchen Display System*) pensada para la zona de despacho, bacha de helados o cocina, donde el personal visualiza las órdenes pendientes y su contenido exacto.

### Estados de un Pedido:
1. 🟡 **Pendiente**: Pedido recién cobrado en caja. Aparece con alerta sonora o visual.
2. 🔵 **En Preparación**: El despachador presiona *"Iniciar Preparación"* para indicar que está sirviendo los potes de helado o preparando los productos.
3. 🟢 **Listo**: Pedido terminado en bandeja listo para entrega al cliente.
4. ⚪ **Entregado**: El cliente retiró su compra. La tarjeta se archiva del monitor activo.
5. 🔴 **Cancelado**: Anulado por orden de gerencia.

---

## 9. Módulo 6: Directorio y Gestión de Clientes (RUC / CI)

### ¿Dónde se encuentra?
Menú Lateral: **Clientes** (`/clientes`).

### Procedimientos Paso a Paso:

#### 1. Registrar un Nuevo Cliente
1. Haz clic en el botón **"Nuevo Cliente"**.
2. Completa los campos:
   * **Tipo de Documento**: Selecciona `RUC` (empresas / contribuyentes) o `CEDULA_IDENTIDAD` (personas particulares).
   * **Número de Documento**: Ingresa el número base sin guiones (ej. `80012345`).
   * **Dígito Verificador (DV)**:
     * Si seleccionas RUC, el sistema **calcula automáticamente el DV oficial** mediante el algoritmo Módulo 11 paraguayo (ej. `-6`).
   * **Razón Social / Nombre Completo**: Nombre legal que aparecerá en la Factura del cliente (ej. *"López Hermanos S.A."* o *"Juan Carlos Benítez"*).
   * **Teléfono / WhatsApp**: Útil para avisos de pedidos o delivery.
   * **Correo Electrónico**: Para envío digital de comprobantes.
   * **Dirección**: Localidad o domicilio fiscal.
3. Haz clic en **"Guardar Cliente"**.

#### 2. Modificar o Inactivar un Cliente
* En la tabla de clientes, utiliza el buscador para localizarlo por RUC o Nombre.
* Haz clic en el botón **Editar (ícono lápiz)** para corregir datos.
* Para dar de baja a un cliente duplicado o inactivo, puedes desactivar la casilla *"Activo"*.

---

## 10. Módulo 7: Control de Inventario, Bachas y Kardex Físico

### ¿Dónde se encuentra?
Menú Lateral: **Inventario & Stock** (`/stock`).

### Organización de Pestañas:
1. **Alertas Críticas**: Lista todos los artículos que se encuentran por debajo del nivel mínimo de reposición configurado.
2. **Sabores en Bacha**: Existencias reales de cada sabor en kilogramos (`kg`).
3. **Envases y Cucuruchos**: Potes térmicos, vasitos y conos en unidades (`u`).
4. **Bebidas y Cafetería**: Productos empaquetados simples con código de barras en unidades (`u`).
5. **Movimientos & Kardex**: Libro histórico de entradas por compras, salidas por ventas automáticas del POS, ajustes físicos y mermas.
6. **Valorización en Gs.**: Valor total del capital invertido en mercaderías valorado al costo unitario.
7. **Auditoría & Conteo Físico**: Módulo especializado de auditoría ciega (ver Módulo 8).

### Paso a Paso: Registrar Movimiento Manual de Stock (Entrada o Merma)
1. En el encabezado superior haz clic en **"Registrar Movimiento"**.
2. Completa los datos:
   * **Tipo de Artículo**: `PRODUCTO`, `SABOR` o `ENVASE`.
   * **Seleccionar Artículo**: Elige el producto específico de la lista.
   * **Tipo de Movimiento**:
     * `ENTRADA_COMPRA`: Recepción de mercadería de proveedores.
     * `SALIDA_MERMA`: Helado derretido por corte de luz, envase roto, producto vencido.
     * `AJUSTE_POSITIVO` / `AJUSTE_NEGATIVO`: Correcciones administrativas.
   * **Cantidad**: En kilogramos (para helados) o unidades (para productos y envases).
   * **Costo Unitario (Gs.)**: Costo de compra del artículo.
   * **Motivo / Justificación**: Explica la causa (ej. *"Rotura de pote en transporte"* o *"Factura proveedor N° 5849"*).
3. Haz clic en **"Guardar Movimiento"**. El saldo actual del producto y el Kardex se actualizan de inmediato.

---

## 11. Módulo 8: Auditoría y Conteo Físico a Ciegas (Blind Stocktaking)

### ¿Dónde se encuentra?
* Menú Lateral directo: **Auditoría & Conteo Físico** (`/auditoria`).
* O desde `/stock`, pestaña **"Auditoría & Conteo Físico"**.

### ¿Qué es el Inventario a Ciegas?
Es una metodología de control interno donde el operador que cuenta la mercadería en los freezers **NO puede ver lo que el sistema tiene registrado**, evitando que copie números o complete cantidades ficticias para cuadrar el inventario.

### Procedimiento Paso a Paso para el Auditor:

#### Paso 1: Iniciar Conteo Físico
1. Haz clic en el botón principal **"Iniciar Nuevo Conteo Físico"**.
2. Se cargará la **Planilla de Conteo Físico**:
   * Todos los artículos del catálogo aparecen con su campo de conteo en blanco (`0`).
   * No se muestra el stock teórico del sistema ni discrepancias previas.
   * La barra superior indica el progreso: *Total a Contar*, *Artículos Contados*, *Pendientes por Contar* y *% de Avance*.

#### Paso 2: Registro del Conteo en Freezers y Estanterías
1. Recorre los freezers y estantes con una tablet, laptop o planilla.
2. Ingresa en la columna **"Stock Físico (Contado)"** la cantidad exacta observada:
   * Para Sabores: Ingresa los kilogramos pesados (ej. `4.250` kg).
   * Para Envases y Productos: Ingresa las unidades contadas (ej. `120` u).
3. Conforme escribas un valor, el badge de la fila cambiará automáticamente de amarillo (`Pendiente`) a verde (`Contado`).
4. Puedes usar el buscador o los filtros por rubro (*Sabores*, *Envases*, *Bebidas*) para encontrar artículos rápidamente.

#### Paso 3: Confirmación y Ajuste Automático en Base de Datos
1. Escribe las observaciones de la auditoría en la cabecera (ej. *"Auditoría mensual cierre de turno mañana - Verificación Freezer 1 y 2"*).
2. Haz clic en **"Aplicar Conteo y Ajustar Stock"**.
   > [!WARNING]
   > Debes haber contado al menos un artículo para poder aplicar la auditoría.
3. Se abrirá el modal de confirmación con el resumen de artículos contados vs pendientes (advirtiendo que los no contados quedarán en 0).
4. Haz clic en **"Confirmar y Aplicar Inventario"**:
   * El sistema actualiza atómicamente el stock real de la base de datos al valor contado.
   * Si un sabor estaba marcado como agotado y ahora tiene existencia positiva, se reactiva automáticamente para la venta en el POS.
   * Se registran los asientos de regularización en el Kardex.

#### Paso 4: Visualización y Exportación del Reporte Comparativo
Inmediatamente tras aplicar (o en cualquier momento desde el historial):
1. Se abre el **Reporte Comparativo Completo**:
   * Muestra la tabla con: *Stock Sistema (Antes)*, *Stock Físico (Contado)*, *Diferencia (+/-)*, *Costo Unitario*, *Impacto Económico en Gs.* y *Resultado (Coincide / Faltante / Sobrante)*.
2. **Descargar Acta PDF A4**: Genera un documento apaisado institucional con membrete oficial paraguayo, tarjetas de resumen y **líneas de firma manuscrita para el Auditor y el Gerente**.
3. **Exportar CSV**: Archivo delimitado por punto y coma (`;`) para abrir directamente en Microsoft Excel.

---

## 12. Módulo 9: Catálogo de Productos, Sabores, Envases y Toppings

### ¿Dónde se encuentra?
Menú Lateral: **Catálogos** (`/catalogos/sabores`, `/catalogos/presentaciones`, `/catalogos/toppings`, `/catalogos/productos`).

### Procedimientos Paso a Paso:

#### 1. Sabores de Helado (`/catalogos/sabores`)
* **Crear Nuevo Sabor**:
  1. Clic en *"Nuevo Sabor"*.
  2. Ingresa: Nombre (ej. *"Dulce de Leche Especial"*), Descripción, Categoría (Crema, Agua, Especial) y Stock Inicial en kg.
  3. Clic en *"Guardar"*.
* **Marcar Sabor como Agotado manualmente**: Si una bacha se termina en el mostrador antes de que se agote en el sistema, haz clic en el interruptor de estado para desactivarlo temporalmente; desaparecerá del POS de inmediato.

#### 2. Presentaciones y Envases (`/catalogos/presentaciones`)
* **Crear Presentación**:
  1. Clic en *"Nueva Presentación"*.
  2. Ingresa: Nombre (ej. *"Cucurucho Bañado"*), Precio de Venta en Gs., Capacidad máxima de sabores permitidos (ej. `2`), y si descuenta stock de envase.
  3. Clic en *"Guardar"*.

#### 3. Toppings y Agregados (`/catalogos/toppings`)
* Ingresa nombre del adicional (ej. *"Salsa de Frutilla Tibia"*, *"Nueces Picadas"*), precio extra en Gs. y estado activo.

#### 4. Productos Simples y Bebidas (`/catalogos/productos`)
* Carga de artículos unitarios de minimarket: Nombre, Código de Barras (EAN), Precio de Venta, Costo de Compra, Stock Actual y Stock Mínimo para alertas.

---

## 13. Módulo 10: Reportes Fiscales SET, Libro Ventas IVA y Reimpresiones

### ¿Dónde se encuentra?
Menú Lateral: **Reportes** (`/reportes`).

### Submódulos Disponibles:

#### 1. Libro de Ventas IVA (Normativa SET / DNIT)
1. Selecciona el **Mes y Año fiscal** a consultar.
2. La tabla consolida todas las ventas del periodo desglosadas por comprobante:
   * Fecha de emisión, N° de Timbrado, N° de Comprobante (13 dígitos: `001-001-0000123`).
   * RUC del Comprador con Dígito Verificador.
   * Razón Social o Nombre del Cliente.
   * Total Facturado en Gs.
   * Gravadas al 10% y Liquidación IVA 10%.
   * Gravadas al 5% y Liquidación IVA 5%.
   * Ventas Exentas de IVA.
3. Haz clic en **"Exportar Libro Ventas PDF"** o **"Exportar Formato Hechauka (CSV)"** para entregar al contador de la empresa.

#### 2. Talonarios y Timbrados Fiscales
* Permite verificar la cantidad de facturas emitidas vs el rango autorizado por la DNIT (ej. Desde `0000001` hasta `0005000`), avisando cuando restan pocas hojas antes de agotar el talonario.

#### 3. Reimpresión de Comprobantes Térmicos
* Si la ticketera se quedó sin papel durante una venta o el cliente solicita copia de su comprobante, busca el ticket por número o fecha y haz clic en **"Reimprimir Ticket"**.

---

## 14. Módulo 11: Gestión de Usuarios y Personal

### ¿Dónde se encuentra?
Menú Lateral: **Usuarios** (`/usuarios`).  
*Acceso restringido a roles `ADMIN` y `OWNER`.*

### Procedimientos Paso a Paso:

#### Situación 1: Registrar un Nuevo Usuario (Operador / Cajero / Auditor)
1. Haz clic en el botón superior derecho **"Nuevo Usuario"**.
2. En el formulario emergente completa:
   * **Nombre de Usuario (Username)**: Identificador único sin espacios (ej. `carlos.lopez`, `cajeratarde`).
   * **Rol Asignado**: Selecciona de la lista desplegable el perfil de permisos que tendrá (ej. `CAJERO`, `AUDITOR`, `ADMIN`, `SUPERVISOR`).
   * **Contraseña Inicial**: Escribe una clave segura de al menos 6 caracteres.
   * **Confirmar Contraseña**: Vuelve a escribir la misma clave.
   * **Opciones de Seguridad**:
     * ☑ **Debe cambiar contraseña en el primer inicio de sesión**: Recomendado marcarlo para que el empleado elija su propia clave privada al ingresar por primera vez.
     * ☑ **La contraseña nunca expira**: Márcalo solo si no deseas forzar caducidad periódica.
3. Haz clic en **"Crear Usuario"**. El nuevo usuario ya puede iniciar sesión en cualquier terminal.

#### Situación 2: Activar o Inactivar una Cuenta de Usuario
* Si un empleado sale de vacaciones o deja de pertenecer a la empresa:
  1. En la tabla de usuarios localiza su fila.
  2. Haz clic en el botón de estado o en el menú de acciones y selecciona **"Desactivar Usuario"**.
  3. El usuario quedará con badge gris/rojo `Inactivo` y sus credenciales serán rechazadas inmediatamente en el login.
  4. Para reactivarlo, haz clic nuevamente en **"Activar Usuario"**.

#### Situación 3: Restablecer Contraseña Olvidada (Blanqueo de Clave)
* Si un cajero o auditor olvidó su contraseña:
  1. En su fila de usuario haz clic en el botón **"Cambiar Contraseña" (ícono de llave)**.
  2. Ingresa la nueva contraseña temporal y confirma.
  3. Marca la casilla *"Forzar cambio en el próximo inicio"*.
  4. Guarda los cambios e infórmale la clave temporal al empleado.

---

## 15. Módulo 12: Roles y Matriz de Permisos

### ¿Dónde se encuentra?
Menú Lateral: **Roles y Permisos** (`/roles`).  
*Acceso restringido a roles `ADMIN` y `OWNER`.*

### Procedimientos Paso a Paso:

#### Situación 1: Crear un Rol Personalizado (Ej. Rol Exclusivo "AUDITOR")
1. Haz clic en el botón **"Nuevo Rol"**.
2. En el campo **Nombre del Rol**, escribe el identificador en mayúsculas (ej. `AUDITOR` o `SUPERVISOR_SALON`).
3. En la sección **Permisos y Módulos Permitidos**, marca únicamente las casillas de las pantallas que este perfil podrá usar:
   * Para un Auditor: Marca **"Dashboard General"** y **"Auditoría & Conteo Físico"**. Deja desmarcadas las demás.
   * Para un Cajero: Marca **"Punto de Venta / POS"**, **"Control de Caja"**, **"Clientes"** y **"Dashboard"**.
4. Puedes usar los botones *"Marcar Todos"* o *"Limpiar"* para agilizar la selección.
5. Haz clic en **"Crear Rol"**. Ahora podrás asignarlo a cualquier usuario en el Módulo de Usuarios.

#### Situación 2: Modificar Permisos de un Rol Existente
1. En la tarjeta del rol deseado haz clic en el botón **Editar (ícono lápiz)**.
   > [!NOTE]
   > Los roles base del sistema (`ADMIN` y `OWNER`) están protegidos contra eliminación y cambio de nombre, pero puedes personalizar sus módulos asociados.
2. Marca o desmarca las casillas de módulos según los nuevos requerimientos del negocio.
3. Haz clic en **"Actualizar Rol"**. Los cambios surtirán efecto de inmediato para todos los usuarios que tengan ese rol.

---

## 16. Módulo 13: Configuración de Impresoras Térmicas ESC/POS

### ¿Dónde se encuentra?
Menú Lateral: **Impresoras** (`/impresoras`).

### Procedimientos Paso a Paso:
1. Haz clic en **"Nueva Impresora"**.
2. Completa los parámetros técnicos de la ticketera:
   * **Nombre Identificador**: Ej. *"Ticketera Mostrador 1"* o *"Impresora Cocina"*.
   * **Tipo de Conexión**:
     * `RED / TCP-IP`: Ingresa la dirección IP de la impresora en la red local (ej. `192.168.1.150`) y el puerto (por defecto `9100`).
     * `USB`: Selecciona el puerto local o cola de impresión.
   * **Ancho del Papel**: `80mm` (estándar de facturas y tickets anchos) o `58mm` (tickets compactos).
   * **Apertura de Cajón**: Activa esta casilla si la impresora tiene cable RJ11 conectado a la gaveta de dinero para que se abra automáticamente al cobrar.
   * **Corte Automático de Papel**: Envía el comando ESC/POS de guillotina al terminar la impresión.
3. Haz clic en **"Guardar y Probar Impresión"**: La ticketera imprimirá un ticket de prueba confirmando la comunicación exitosa.

---

## 17. Módulo 14: Datos del Negocio y Timbrado Fiscal Legal

### ¿Dónde se encuentra?
Menú Lateral: **Datos del Negocio** (`/institucion`).

### Campos Obligatorios para Facturación Legal:
* **Razón Social / Titular**: Nombre comercial o societario registrado en la DNIT.
* **RUC Emisor**: RUC con Dígito Verificador (ej. `80099887-1`).
* **Número de Timbrado**: Número oficial de 8 dígitos otorgado por la SET / DNIT (ej. `17894561`).
* **Vigencia del Timbrado**: Fecha de Inicio y Fecha de Vencimiento legal.
* **Establecimiento y Punto de Expedición**: Códigos de 3 dígitos (ej. Establecimiento `001`, Punto de Expedición `001`).
* **Dirección del Local**: Calle, numeración y ciudad (aparecerá en la cabecera de las facturas).
* **Teléfono de Contacto**: Aparece en el pie del ticket para atención a clientes.
* **Logotipo Institucional**: Carga la imagen de la heladería/minimarket para imprimir en los reportes oficiales en PDF.

---

## 18. Módulo 15: Licenciamiento del Software

### ¿Dónde se encuentra?
Menú Lateral: **Licencia** (`/licencia`).

### ¿Qué información se visualiza?
* **Plan Activo**: Indica si la instalación cuenta con plan *Básico*, *Estándar* o *Premium*.
* **Vigencia de la Suscripción**: Días restantes antes del vencimiento.
* **Módulos Habilitados**: Lista de funcionalidades activadas en la licencia del negocio.
* **Actualizaciones**: Estado de la versión instalada y canales de soporte técnico.

---

## 19. Módulo 16: Copias de Seguridad y Restauración Integral (Backups)

### ¿Dónde se encuentra?
Menú Lateral: **Copias de Seguridad** (`/backup`).  
*Acceso exclusivo a roles `ADMIN` y `OWNER`.*

### Procedimientos Paso a Paso:

#### 1. Generar una Copia de Seguridad Inmediata
1. Haz clic en el botón principal **"Generar Respaldo Ahora"**.
2. El sistema creará una instantánea completa de la base de datos PostgreSQL en formato binario comprimido (`.backup`), incluyendo todos los clientes, ventas históricas, stock, recetas, usuarios y asientos fiscales.
3. El nuevo archivo aparecerá en la tabla de respaldos con su fecha, hora y tamaño en MB.

#### 2. Descargar la Copia de Seguridad a tu Computadora
* En la lista de respaldos generados, haz clic en el botón **Descargar (ícono de nube/flecha)** en la fila del backup deseado.
* Guarda el archivo en un pendrive externo o servicio de almacenamiento en la nube para resguardo ante robo o fallo del equipo.

#### 3. Restauración Integral de Datos
> [!CAUTION]
> La restauración reemplaza todos los datos actuales del sistema por los contenidos en el archivo de respaldo seleccionado. Se recomienda realizar una copia previa antes de restaurar.
1. Haz clic en el botón **"Restaurar Base de Datos"**.
2. Selecciona el archivo de respaldo (`.backup`).
3. Confirma la advertencia de seguridad. El sistema restaurará la información de forma atómica y reiniciará los servicios para aplicar los cambios.

---

## 20. Preguntas Frecuentes y Solución de Incidencias

### 1. ¿Por qué el POS no me deja cobrar y dice "Caja Cerrada"?
**Causa**: No se ha abierto el turno de caja en la terminal actual.  
**Solución**: Dirígete a *Control de Caja* (`/caja`), ingresa el monto inicial de cambio y haz clic en *Abrir Turno de Caja*.

### 2. ¿Por qué no me deja confirmar un cobro con Tarjeta?
**Causa**: Falta ingresar el número de voucher.  
**Solución**: Tras pasar la tarjeta por el POS físico (Bancard / Dinelco), lee el número de cupón/voucher impreso e ingrésalo en el campo requerido de la pantalla de cobro.

### 3. ¿Cómo hago si un sabor de helado se terminó en el freezer?
**Solución**: Ingresa a *Catálogo de Sabores* y desactiva el interruptor del sabor, o realiza un movimiento de ajuste en *Inventario*. El sabor se mostrará automáticamente como "Agotado" en el POS para que ningún cajero lo seleccione por error.

### 4. ¿Qué pasa si el conteo físico de la auditoría arrojó menos stock que el sistema?
**Solución**: El módulo de auditoría a ciegas detectará la diferencia como *Faltante* y aplicará el ajuste atómico para que el sistema refleje la cantidad real contada. El acta en PDF dejará constancia formal de la pérdida y el impacto en Gs. para la gerencia.

### 5. ¿La ticketera no imprime o imprime caracteres extraños?
**Causa**: Desconexión de cable de red/USB o configuración errónea de baudios/IP.  
**Solución**: Revisa en *Impresoras* (`/impresoras`) que la dirección IP coincida con la asignada en la red local. Realiza una prueba con el botón *"Probar Impresión"*.

---
*Manual elaborado conforme a la versión vigente del Sistema de Gestión Comercial Heladería / Minimarket.*  
*Para asistencia técnica o consultas de soporte, contacte al área de sistemas autorizada.*
