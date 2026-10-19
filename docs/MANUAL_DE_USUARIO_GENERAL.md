# MANUAL GENERAL DE USUARIO
## Sistema de Gestión Comercial Retail ERP, Punto de Venta y Facturación Legal Paraguaya (SET / DNIT)
### Especializado para Heladerías, Confiterías, Cafeterías y Minimarkets

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
12. [Módulo 9: Catálogo Maestro Retail ERP, Multi-Proveedor y Calculadora de Margen](#12-módulo-9-catálogo-maestro-retail-erp-multi-proveedor-y-calculadora-de-margen)
13. [Módulo 10: Reportes Fiscales SET, Libro Ventas IVA, Compras a Proveedores y Analítica](#13-módulo-10-reportes-fiscales-set-libro-ventas-iva-compras-a-proveedores-y-analítica)
14. [Módulo 11: Gestión de Usuarios y Personal](#14-módulo-11-gestión-de-usuarios-y-personal)
15. [Módulo 12: Roles y Matriz de Permisos](#15-módulo-12-roles-y-matriz-de-permisos)
16. [Módulo 13: Configuración de Impresoras Térmicas ESC/POS](#16-módulo-13-configuración-de-impresoras-térmicas-escpos)
17. [Módulo 14: Datos del Negocio y Timbrado Fiscal Legal](#17-módulo-14-datos-del-negocio-y-timbrado-fiscal-legal)
18. [Módulo 15: Licenciamiento del Software](#18-módulo-15-licenciamiento-del-software)
19. [Módulo 16: Copias de Seguridad, Restauración Drag & Drop y Disaster Recovery](#19-módulo-16-copias-de-seguridad-restauración-drag--drop-y-disaster-recovery)
20. [Módulo 17: Padrón de Proveedores y Artículos Suministrados](#20-módulo-17-padrón-de-proveedores-y-artículos-suministrados)
21. [Módulo 18: Facturas de Compra de Proveedores e Ingreso a Stock](#21-módulo-18-facturas-de-compra-de-proveedores-e-ingreso-a-stock)
22. [Módulo 19: Bitácora Centralizada de Auditoría (Audit Trail)](#22-módulo-19-bitácora-centralizada-de-auditoría-audit-trail)
23. [Preguntas Frecuentes y Solución de Incidencias](#23-preguntas-frecuentes-y-solución-de-incidencias)

---

## 1. Introducción y Conceptos Clave

Este sistema es una solución integral desarrollada específicamente para negocios del rubro gastronómico y comercial en Paraguay, con especial énfasis en **heladerías artesanales**, **confiterías**, **cafeterías** y **minimarkets**.

### Particularidades del Negocio Contempladas:
* **Moneda Nacional**: Todos los importes monetarios se expresan en **Guaraníes (Gs.)**, sin decimales y con separador de miles por punto (`15.000 Gs.`), respetando el estándar financiero paraguayo.
* **Venta Fraccionada de Helados**: Los sabores de helado se gestionan por peso en kilogramos (`kg`) con hasta 3 decimales (`0.250 kg`, `0.500 kg`, `1.000 kg`), mientras que los envases (potes térmicos de 1/4 kg, 1/2 kg, 1 kg, cucuruchos, vasitos) se controlan por unidades (`u`).
* **Catálogo Maestro Retail ERP y Multi-Proveedor (N:M)**: Clasificación de artículos en 5 tipos comerciales (`VENTA_DIRECTA`, `ENVASE`, `SABOR`, `TOPPING`, `INSUMO`), con posibilidad de asociar múltiples distribuidores por artículo, almacenar costos de compra individuales pactados y designar un **⭐ Proveedor Principal**.
* **Calculadora Inteligente de Margen Comercial**: Asistencia en tiempo real para determinar el Precio de Venta al público en función del costo y márgenes de ganancia habituales (**15%**, **20%**, **30%**, **50%**).
* **Cumplimiento Tributario Paraguayo (SET / DNIT)**:
  * Facturación con número de **Timbrado oficial**, vigencia desde/hasta y numeración secuencial (`001-001-0000123`).
  * Validación estricta del **Dígito Verificador (DV)** según el algoritmo oficial Módulo 11 para RUCs paraguayos.
  * Desglose impositivo en comprobantes: Exentas, Gravadas 5%, Gravadas 10% y Liquidación total del IVA (10% e 5%).
  * Generación del **Libro de Ventas IVA** mensual apto para el sistema tributario *Marangatu / Hechauka*.
  * Registro de facturas de compra para cómputo de **Crédito Fiscal IVA** y exportación de compras en **CSV** y **PDF A4**.
* **Trazabilidad Inmutable**: Registro centralizado en la **Bitácora de Auditoría** de quién, cuándo y qué modificó en precios, costos, compras, anulaciones, turnos de caja y stock.

---

## 2. Seguridad y Roles del Sistema

El sistema implementa un control de acceso basado en roles (*Role-Based Access Control - RBAC*). Cada usuario tiene asignado un perfil que determina exactamente a qué pantallas, botones y operaciones puede acceder.

| Rol Sugerido | Descripción de Funciones | Módulos Autorizados Típicos |
| :--- | :--- | :--- |
| **OWNER / PROPIETARIO** | Máxima jerarquía comercial y técnica. Administra suscripciones, licencias, respaldos, bitácora y configuración del negocio. | Todos los módulos sin excepción. |
| **ADMIN / GERENTE** | Supervisión operativa total de sucursal, compras, márgenes, usuarios, roles, catálogo, bitácora y fiscalidad. | Todos excepto licenciamiento avanzado. |
| **CAJERO / VENDEDOR** | Operación de salón y mostrador: apertura de caja, venta en POS, cobro, emisión de tickets y arqueo final. | POS, Caja, Clientes, Monitor de Pedidos. |
| **AUDITOR / ENCARGADO DE ALMACÉN** | Relevamiento físico de mercaderías, conteo a ciegas, emisión de actas y recepción de compras. | Inventario, Auditoría de Stock, Compras, Proveedores. |

---

## 3. El Ciclo Operativo Diario

Un día habitual de operación sigue este flujo estándar:

```
[Inicio de Turno]
  └─> 1. Iniciar sesión con usuario propio.
  └─> 2. Abrir Turno de Caja ingresando el fondo inicial en Guaraníes (Gs.).

[Durante la Jornada Comercial]
  ├─> 3. Venta en POS: Escaneo por Código de Barras / Código de Producto / Selección táctil de potes, sabores y adicionales.
  ├─> 4. Cobro: Efectivo (cálculo de vuelto), Tarjeta (ingreso obligatorio de Voucher) o QR.
  ├─> 5. Impresión automática de factura legal o ticket térmico.
  ├─> 6. Monitor de mostrador: preparación y entrega de pedidos.
  └─> 7. Recepción de mercaderías: Carga de facturas de compra desde `/compras`.

[Cierre de Turno]
  └─> 8. Cierre de Caja ciego: el cajero cuenta sus valores físicos y el sistema calcula automáticamente las diferencias.
```

---

## 4. Módulo 1: Autenticación e Inicio de Sesión
* **Acceso**: `/login`.
* Ingreso seguro con credenciales encriptadas (BCrypt) y tokens JWT. Cambio obligatorio de clave si fue blanqueada por un administrador.

---

## 5. Módulo 2: Dashboard General y Métricas de Rendimiento
* **Acceso**: `/dashboard`.
* Visualización en tiempo real de facturación acumulada, comensales atendidos, métodos de pago más utilizados y alertas de reposición de bachas.

---

## 6. Módulo 3: Punto de Venta (POS) y Venta de Mostrador
* **Acceso**: Menú Lateral > **Punto de Venta (POS)** (`/pos`).

### Funcionalidades Destacadas:
1. **Multiplicador de Cantidad Rápido (`[Cant: 1]`)**:
   * Casilla editable ubicada junto al buscador/lector de código de barras.
   * Permite indicar la cantidad deseada antes de escanear o seleccionar un producto (ej. ingresar `6` para agregar 6 unidades al instante).
   * Al pulsar `Enter` en la casilla, el cursor pasa automáticamente al buscador de código de barras.
   * Tras agregar el producto, se restablece automáticamente a `1`.
2. **Búsqueda Multimodal (3 Vías de Entrada)**:
   * 🏷️ **Código de Barras**: Con pistola lectora USB o tecleado manual. Al escanear o presionar `Enter`, el producto se agrega **automáticamente al ticket** con la cantidad indicada. Admite también atajo directo como `6*codigo` o `6x codigo`.
   * 🔢 **Código de Producto / ID**: Permite buscar artículos por su ID numérico o código interno de inventario.
   * 🔍 **Nombre / Descripción**: Búsqueda incremental por texto libre.
3. **Botón Rápido `+` en Artículos**: Cada tarjeta de producto incorpora un botón compacto `+` y permite añadir al ticket respetando la cantidad indicada en `[Cant: N]`.
4. **Potes de Helado y Sabores**: Asignación interactiva de sabores según la capacidad del pote térmico con bloqueo visual de bachas agotadas.
5. **Cobro Multimedio**:
   * Efectivo con cálculo de vuelto.
   * Tarjetas de débito/crédito con **obligatoriedad de ingresar el N° de Voucher / Cupón POS** para habilitar la confirmación.
   * Pagos con QR y transferencias bancarias.

---

## 7. Módulo 4: Control de Caja, Turnos y Arqueo Ciego
* **Acceso**: `/caja`.
* Apertura de turno con fondo inicial, movimientos de caja durante el día y arqueo de valores físico a ciegas al cerrar turno.

---

## 8. Módulo 5: Monitor de Pedidos y Despacho
* **Acceso**: `/pedidos`.
* Pantalla de cocina y despacho que actualiza el estado de las órdenes en preparación.

---

## 9. Módulo 6: Directorio y Gestión de Clientes (RUC / CI)
* **Acceso**: `/clientes`.
* Directorio de clientes con validación automática del Dígito Verificador (DV) paraguayo (Módulo 11).

---

## 10. Módulo 7: Control de Inventario, Bachas y Kardex Físico
* **Acceso**: `/stock`.
* Control de existencias de helado (en kg), potes térmicos (en unidades) y productos envasados. Registro de mermas y valorización monetaria total del stock. Las compras se canalizan por el módulo oficial de compras.

---

## 11. Módulo 8: Auditoría y Conteo Físico a Ciegas (Blind Stocktaking)
* **Acceso**: Menú Lateral > **Auditoría & Conteo Físico** (`/auditoria` o `/stock`).
* Toma de inventario físico sin ver el stock del sistema para evitar manipulaciones. Al finalizar, el sistema contrasta los valores, reactiva sabores agotados con existencia positiva y emite el Acta Oficial en PDF A4 y CSV.

---

## 12. Módulo 9: Catálogo Maestro Retail ERP, Multi-Proveedor y Calculadora de Margen
* **Acceso**: Menú Lateral > **Artículos & Catálogo ERP** (`/catalogos/maestro`).
* Catálogo clasificado en 5 tipos comerciales (`VENTA_DIRECTA`, `ENVASE`, `SABOR`, `TOPPING`, `INSUMO`), asignación multi-proveedor N:M con costos pactados y calculadora de margen comercial (15%, 20%, 30%, 50%).

---

## 13. Módulo 10: Reportes Fiscales SET, Libro Ventas IVA, Compras a Proveedores y Analítica
* **Acceso**: Menú Lateral > **Reportes** (`/reportes`).

### Nueva Interfaz: Selector con Iconos y Descripciones
La navegación se realiza mediante un **Selector Desplegable Moderno** que agrupa los 9 reportes integrados con sus respectivos íconos temáticos:

1. 📊 **Dashboard Ejecutivo**: Métricas clave y KPIs de facturación en tiempo real.
2. 🛒 **Ventas Detalladas**: Desglose de ventas, comensales y medios de pago.
3. 🚚 **Compras a Proveedores**: Facturas recibidas, liquidación de **Crédito Fiscal IVA** (IVA 10%, 5% y Exentas) y descargas en CSV y PDF A4 horizontal.
4. 📑 **Libro Ventas IVA (SET)**: Libro impositivo mensual para declaraciones SET / DNIT Hechauka.
5. 💵 **Auditoría de Cajas**: Sesiones de caja, arqueos ciegos y control de sobrantes/faltantes.
6. 🏆 **Ranking Productos & Sabores**: Artículos estrella y sabores más vendidos.
7. 🖨️ **Reimpresiones**: Emisión de duplicados de comprobantes térmicos.
8. 📄 **Talonarios & Timbrado SET**: Monitoreo de timbrados vigentes y alertas preventivas.
9. 🏬 **Inventario & Kardex**: Valuación del almacén y existencias físicas.

---

## 14. Módulo 11: Gestión de Usuarios y Personal
* **Acceso**: `/usuarios`.
* Creación de operadores, asignación de perfiles y restablecimiento de contraseñas.

---

## 15. Módulo 12: Roles y Matriz de Permisos
* **Acceso**: `/roles`.
* Creación de perfiles a medida y asignación selectiva de permisos por pantalla.

---

## 16. Módulo 13: Configuración de Impresoras Térmicas ESC/POS
* **Acceso**: `/impresoras`.
* Configuración de ticketeras térmicas por Red TCP/IP o USB (formatos 58mm y 80mm).

---

## 17. Módulo 14: Datos del Negocio y Timbrado Fiscal Legal
* **Acceso**: `/institucion`.
* Carga de Razón Social, RUC, número de Timbrado DNIT, fechas de vigencia y logotipo de la empresa.

---

## 18. Módulo 15: Licenciamiento del Software
* **Acceso**: `/licencia`.
* Información sobre el plan contratado, módulos activos y vigencia de la suscripción.

---

## 19. Módulo 16: Copias de Seguridad, Restauración Drag & Drop y Disaster Recovery
* **Acceso**: `/backup`.
* Generación de volcados binarios de PostgreSQL (`.dump`), restauración arrastrando el archivo y soporte para archivos de hasta 100 MB.

---

## 20. Módulo 17: Padrón de Proveedores y Artículos Suministrados
* **Acceso**: Menú Lateral > **Proveedores** (`/proveedores`).
* Directorio comercial de distribuidores mayoristas con RUC, datos bancarios y contador de artículos suministrados con costos pactados.

---

## 21. Módulo 18: Facturas de Compra de Proveedores e Ingreso a Stock
* **Acceso**: Menú Lateral > **Facturas de Compra** (`/compras`).
* Registro formal de compras con timbrado, carga por código de barras, selección masiva en bloque, alta rápida de artículos en caliente (`+ ¿Artículo nuevo?`), protección contra cierre accidental y triple impacto automático (stock, crédito fiscal IVA y kardex).

---

## 22. Módulo 19: Bitácora Centralizada de Auditoría (Audit Trail)
* **Acceso**: Menú Lateral > **Bitácora de Auditoría** (`/bitacora`).
* **Permisos**: Rol `ADMIN` o `OWNER`.

### Propósito y Alcance:
Registro oficial, inmutable y cronológico de todas las operaciones y modificaciones realizadas por los operadores:
1. **Trazabilidad Total**: Registra fecha, hora, usuario, terminal (IP), módulo y el cambio exacto con contraste de valores (`Valor Anterior ➔ Valor Nuevo`).
2. **Eventos Capturados**: Modificaciones de precios de venta y costos, altas/bajas de artículos y sabores, compras a proveedores, facturas anuladas con su motivo obligatorio, aperturas/cierres de caja con arqueos y ajustes de stock.
3. **4 Tarjetas KPI**: Total de eventos, usuarios con actividad, modificaciones realizadas y bajas/anulaciones.
4. **Filtros Interactivos**: Presets rápidos de fechas (*Hoy, Esta Semana, Este Mes, Todo el Historial*), filtros por usuario, módulo, tipo de acción y buscador en tiempo real.
5. **Exportaciones Oficiales**:
   * **Descargar CSV (Excel)**: Formato UTF-8 con BOM y separador `;`.
   * **Exportar PDF (A4 Apaisado)**: Documento formal con membrete del negocio y sumatorias para gerencia o auditoría externa.

---

## 23. Preguntas Frecuentes y Solución de Incidencias

### 1. ¿Cuál es la diferencia entre la "Bitácora de Auditoría", "Auditoría de Stock" y "Auditoría de Cajas"?
* **Bitácora de Auditoría (`/bitacora`)**: Registra **quién hizo qué cambio en el sistema** (cambios de precios, compras anuladas, ajustes, etc.).
* **Auditoría & Conteo Físico (`/auditoria`)**: Es la planilla de **conteo físico de mercaderías en almacén** para detectar faltantes o sobrantes de bachas y productos.
* **Auditoría de Cajas (`/reportes`)**: Es el panel de **arqueos y turnos de caja** donde se coteja lo recaudado físicamente por los cajeros vs. el sistema.

### 2. ¿Cómo funciona la búsqueda de productos en el POS?
* Puedes escanear directamente con la pistola el **Código de Barras** (se agregará automáticamente al ticket al escanear o presionar `Enter`), o escribir el **Código de Producto / ID interno**, o tipear el **Nombre** del producto.

### 3. ¿Por qué en el registro manual de stock ya no está la opción "Entrada por compra a proveedor"?
* Porque todas las compras a proveedores deben registrarse a través del módulo oficial de **Facturas de Compra (`/compras`)**, asegurando que queden asociadas a una factura legal, timbrado, RUC del distribuidor, liquidación de Crédito Fiscal IVA y trazabilidad en la bitácora.

### 4. ¿Cómo obtengo el informe de compras a proveedores para el contador?
* Ingresa a `/reportes`, abre el **Selector de Reportes** y elige **Compras a Proveedores** (ícono de camión 🚚). Selecciona el período impositivo y pulsa **Descargar CSV** para obtener la planilla Excel con el crédito fiscal desglosado, o **Descargar PDF (A4)** para el documento impreso.

### 5. ¿Qué pasa si borro todo incluyendo los volúmenes de Docker y vuelvo a levantar desde Docker? ¿Servirá el backup descargado?
* **Sí, servirá perfectamente.** Al levantar de cero, inicia sesión con el usuario de fábrica `admin` / `admin123`. Ve a `/backup`, arrastra tu archivo `.dump` descargado y confirma la restauración. El motor reconstruirá el 100% de tus datos originales.

---
*Manual elaborado conforme a la versión vigente del Sistema Retail ERP Heladería & Minimarket.*  
*Para asistencia técnica o consultas de soporte, contacte al área de sistemas autorizada.*
