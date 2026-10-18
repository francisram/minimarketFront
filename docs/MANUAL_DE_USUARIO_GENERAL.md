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
13. [Módulo 10: Reportes Fiscales SET, Libro Ventas IVA, Compras a Proveedores y Reimpresiones](#13-módulo-10-reportes-fiscales-set-libro-ventas-iva-compras-a-proveedores-y-reimpresiones)
14. [Módulo 11: Gestión de Usuarios y Personal](#14-módulo-11-gestión-de-usuarios-y-personal)
15. [Módulo 12: Roles y Matriz de Permisos](#15-módulo-12-roles-y-matriz-de-permisos)
16. [Módulo 13: Configuración de Impresoras Térmicas ESC/POS](#16-módulo-13-configuración-de-impresoras-térmicas-escpos)
17. [Módulo 14: Datos del Negocio y Timbrado Fiscal Legal](#17-módulo-14-datos-del-negocio-y-timbrado-fiscal-legal)
18. [Módulo 15: Licenciamiento del Software](#18-módulo-15-licenciamiento-del-software)
19. [Módulo 16: Copias de Seguridad, Restauración Drag & Drop y Disaster Recovery](#19-módulo-16-copias-de-seguridad-restauración-drag--drop-y-disaster-recovery)
20. [Módulo 17: Padrón de Proveedores y Artículos Suministrados](#20-módulo-17-padrón-de-proveedores-y-artículos-suministrados)
21. [Módulo 18: Facturas de Compra de Proveedores e Ingreso a Stock](#21-módulo-18-facturas-de-compra-de-proveedores-e-ingreso-a-stock)
22. [Preguntas Frecuentes y Solución de Incidencias](#22-preguntas-frecuentes-y-solución-de-incidencias)

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

---

## 2. Seguridad y Roles del Sistema

El sistema implementa un control de acceso basado en roles (*Role-Based Access Control - RBAC*). Cada usuario tiene asignado un perfil que determina exactamente a qué pantallas, botones y operaciones puede acceder.

| Rol Sugerido | Descripción de Funciones | Módulos Autorizados Típicos |
| :--- | :--- | :--- |
| **OWNER / PROPIETARIO** | Máxima jerarquía comercial y técnica. Administra suscripciones, licencias, respaldos y configuración del negocio. | Todos los módulos sin excepción. |
| **ADMIN / GERENTE** | Supervisión operativa total de sucursal, compras, márgenes, usuarios, roles, catálogo y fiscalidad. | Todos excepto licenciamiento avanzado. |
| **CAJERO / VENDEDOR** | Operación de salón y mostrador: apertura de caja, venta en POS, cobro, emisión de tickets y arqueo final. | POS, Caja, Clientes, Monitor de Pedidos. |
| **ENCARGADO DE COMPRAS** | Recepción de pedidos de proveedores, registro de facturas de compra y gestión del padrón de distribuidores. | Compras, Proveedores, Stock, Catálogos. |
| **AUDITOR / INVENTARIO** | Auditoría y control de existencias. Realiza el conteo físico de bachas y mercaderías a ciegas y emite actas. | Auditoría & Conteo Físico, Dashboard. |
| **COCINA / DESPACHO** | Personal de armado de pedidos, envasado de helados o preparación de cafetería. | Monitor de Pedidos. |

---

## 3. El Ciclo Operativo Diario

```
  +-------------------------------------------------------------+
  |                   1. APERTURA DE TURNO                      |
  |  El cajero ingresa a Caja (/caja) y declara el fondo inicial|
  +-------------------------------------------------------------+
                                 |
                                 v
  +-------------------------------------------------------------+
  |              2. VENTAS EN EL POS Y PEDIDOS                  |
  |  Cobro de helados, escaneo de bebidas, tickets y facturas   |
  +-------------------------------------------------------------+
                                 |
                                 v
  +-------------------------------------------------------------+
  |           3. RECEPCIÓN DE MERCADERÍA Y COMPRAS              |
  |  Llegada de proveedores, carga de facturas e ingreso a stock|
  +-------------------------------------------------------------+
                                 |
                                 v
  +-------------------------------------------------------------+
  |               4. ARQUEO CIEGO Y CIERRE DE TURNO             |
  |  El cajero cuenta efectivo y vouchers sin ver el sistema    |
  +-------------------------------------------------------------+
```

---

## 4. Módulo 1: Autenticación e Inicio de Sesión
* **Acceso**: Iniciar sesión con usuario y contraseña asignada.
* **Cambio Obligatorio de Clave**: Si es el primer ingreso, el sistema solicitará una nueva contraseña segura (mínimo 6 caracteres).
* **Bloqueo de Inactividad**: La sesión expira de forma segura protegiendo las terminales del local.

---

## 5. Módulo 2: Dashboard General y Métricas de Rendimiento
* **Acceso**: `/dashboard`.
* Muestra en tiempo real: Facturación acumulada del día, cantidad de pedidos despachados, ticket promedio, estado de la caja y accesos directos al POS.

---

## 6. Módulo 3: Punto de Venta (POS) y Venta de Mostrador
* **Acceso**: `/pos`.
* **Lector de Código de Barras**: Escaneo directo de artículos envasados y bebidas para agregarlos en menos de 1 segundo.
* **Venta de Helados**: Selección de pote/cucurucho, control estricto del límite de sabores y agregado de toppings opcionales.
* **Cobro Multimoneda**: Efectivo con cálculo de vuelto, Tarjetas (con campo obligatorio para N° de Voucher del POS físico) y Billeteras Digitales / QR.
* **Emisión Fiscal**: Impresión térmica de factura legal paraguaya con RUC/CI del cliente y liquidación de IVA.

---

## 7. Módulo 4: Control de Caja, Turnos y Arqueo Ciego
* **Acceso**: `/caja`.
* **Apertura**: Ingreso del fondo inicial para cambio.
* **Movimientos en Turno**: Registro categorizado de entradas y salidas de dinero menor.
* **Arqueo Ciego**: El operador cuenta el dinero físico sin que el sistema le muestre el total teórico. Al confirmar, el sistema calcula si hubo sobrante o faltante y genera el acta de cierre.

---

## 8. Módulo 5: Monitor de Pedidos y Despacho
* **Acceso**: `/pedidos`.
* Tablero Kanban en tiempo real para el personal de despacho en mostrador (*Pendiente -> En Preparación -> Listo -> Entregado*). Desacopla la caja del despacho de helados.

---

## 9. Módulo 6: Directorio y Gestión de Clientes (RUC / CI)
* **Acceso**: `/clientes`.
* Directorio de clientes con validación automática del Dígito Verificador (DV) paraguayo (Módulo 11) para evitar rechazos en facturas electrónicas o declaraciones juradas ante la SET.

---

## 10. Módulo 7: Control de Inventario, Bachas y Kardex Físico
* **Acceso**: `/stock`.
* Control de existencias de helado (en kg), potes térmicos (en unidades) y productos envasados. Registro de movimientos y valorización total del stock en Guaraníes.

---

## 11. Módulo 8: Auditoría y Conteo Físico a Ciegas (Blind Stocktaking)
* **Acceso**: `/auditoria`.
* Proceso de auditoría periódica donde el auditor cuenta las bachas y mercaderías reales sin ver el stock del sistema. Al finalizar, el sistema contrasta los valores, actualiza el stock real y emite el Acta Oficial en PDF A4 firmada y CSV.

---

## 12. Módulo 9: Catálogo Maestro Retail ERP, Multi-Proveedor y Calculadora de Margen
* **Acceso**: Menú Lateral > **Artículos & Catálogo ERP** (`/catalogos/maestro`).

### Funcionalidades Destacadas:
1. **Catálogo Maestro ERP**:
   * Clasificación en 5 categorías comerciales: `VENTA_DIRECTA`, `ENVASE`, `SABOR`, `TOPPING`, `INSUMO`.
   * Atributos específicos según tipo: atributos dietarios para sabores (Sin TACC, Vegano, Sin Azúcar) y límite de sabores para envases.
2. **Modelo Multi-Proveedor (N:M)**:
   * Cada artículo puede ser provisto por varias empresas distintas con sus respectivos **Costos de Compra Pactados** y códigos de referencia.
   * Marca de **⭐ Proveedor Principal** para priorizar pedidos automáticos.
3. **Calculadora Inteligente de Margen Comercial**:
   * Al ingresar el Costo (Gs.) y el % de Margen deseado, calcula de inmediato el Precio de Venta al público:
     $$\text{Precio Venta} = \text{Precio Costo} \times \left(1 + \frac{\text{Margen}}{100}\right)$$
   * Botones rápidos con un solo clic: **15%**, **20%**, **30%**, **50%**.
   * Cálculo bidireccional y badge con el importe neto de ganancia en Guaraníes.

---

## 13. Módulo 10: Reportes Fiscales SET, Libro Ventas IVA, Compras a Proveedores y Reimpresiones
* **Acceso**: Menú Lateral > **Reportes** (`/reportes`).

### Submódulos Disponibles:
1. **Compras a Proveedores (Nuevo)**:
   * Consolidado de facturas de compra de distribuidores con cálculo automático del **Crédito Fiscal IVA** (IVA 10%, IVA 5% y Exentas).
   * Filtros combinados por rango de fechas (Hoy, Esta semana, Este mes, Últimos 30 días, Todo el año), proveedor, condición (Contado/Crédito) y estado.
   * Tarjetas KPI dinámicas y botón para ver el detalle de renglones de cada factura.
   * **Descarga en CSV (Excel)** (UTF-8 con BOM y separador `;`) y **PDF A4 Apaisado (Landscape)** con membrete institucional.
2. **Libro de Ventas IVA**:
   * Generación mensual obligatoria para la SET/DNIT en PDF y formato Hechauka (CSV).
3. **Cajas y Turnos**:
   * Historial de auditoría de arqueos y turnos cerrados.
4. **Rankings y Talonarios**:
   * Artículos más vendidos y control de comprobantes timbrados restantes.
5. **Reimpresión de Comprobantes Térmicos**:
   * Reimpresión de tickets o facturas ante rotura o extravío.

---

## 14. Módulo 11: Gestión de Usuarios y Personal
* **Acceso**: `/usuarios`.
* Creación de cuentas para operadores, asignación de perfiles y restablecimiento de contraseñas.

---

## 15. Módulo 12: Roles y Matriz de Permisos
* **Acceso**: `/roles`.
* Creación de perfiles a medida y asignación selectiva de permisos por pantalla.

---

## 16. Módulo 13: Configuración de Impresoras Térmicas ESC/POS
* **Acceso**: `/impresoras`.
* Configuración de ticketeras térmicas por Red TCP/IP o USB (formatos 58mm y 80mm), prueba de impresión y apertura de gaveta.

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

### Procedimientos Paso a Paso:
1. **Generar Respaldo**: Clic en *"Generar y Descargar Respaldo Ahora"*. Genera un volcado binario comprimido de PostgreSQL (`pg_dump -Fc` formato `.dump`) y lo descarga automáticamente al equipo.
2. **Restaurar desde Archivo Local**: Arrastra el archivo `.dump` al recuadro punteado (*dropzone*), confirma la advertencia y el sistema restablecerá la base de datos al 100%.
3. **Recuperación ante Desastres (Disaster Recovery)**: Si se elimina el contenedor o el volumen Docker (`postgres_data`), al volver a iniciar con Docker el sistema arrancará limpio con el usuario `admin` / `admin123`. Basta con ingresar a `/backup` y subir el archivo `.dump` descargado; PostgreSQL reconstruirá de inmediato todas las 28 tablas, clientes, compras, ventas y usuarios originales.
4. **Capacidad Técnica**: Soporta archivos de respaldo de hasta **100 MB** tanto en Nginx como en Spring Boot.

---

## 20. Módulo 17: Padrón de Proveedores y Artículos Suministrados
* **Acceso**: Menú Lateral > **Proveedores** (`/proveedores`).

### Funcionalidades:
1. **Directorio Comercial**: RUC con Dígito Verificador, Razón Social, Vendedor de contacto, teléfono, correo y datos bancarios para transferencias.
2. **Contador y Modal de Artículos Suministrados**: Badge que indica cuántos productos provee la empresa. Al hacer clic, abre la grilla con todos los artículos provistos, costos pactados y marca de proveedor principal ⭐.

---

## 21. Módulo 18: Facturas de Compra de Proveedores e Ingreso a Stock
* **Acceso**: Menú Lateral > **Facturas de Compra** (`/compras`).

### Funcionalidades:
1. **Registro con Respaldo Fiscal**:
   * Carga de Proveedor, N° Factura física, Timbrado, Fecha de Emisión, Condición (Contado / Crédito) y Vencimiento.
2. **Carga Rápida por Código de Barras**:
   * Escaneo con pistola óptica que detecta el artículo y pre-carga su costo pactado.
3. **Carga Masiva en Bloque (Selección Múltiple)**:
   * Grilla para marcar decenas de artículos con el filtro **`⭐ Solo de este Proveedor`** e insertarlos en un solo paso.
4. **Alta Rápida de Artículos en Caliente (`+ ¿Artículo nuevo?`)**:
   * Permite registrar un artículo no existente en el catálogo sin cerrar la compra actual, fijar su margen comercial, vincularlo al proveedor e insertarlo de inmediato a la factura.
5. **Protección contra Cierre Accidental**:
   * Clics fuera del modal bloqueados y diálogo de confirmación si se intenta cancelar con datos cargados.
6. **Triple Impacto Automático**:
   * Aumenta el stock en almacén, registra el Crédito Fiscal IVA (10%, 5% y Exentas) y actualiza el kardex.
7. **Exportación Inmediata**:
   * Botones en cabecera para descargar el listado de compras en **CSV** y **PDF A4**.

---

## 22. Preguntas Frecuentes y Solución de Incidencias

### 1. ¿Por qué el POS dice "Caja Cerrada"?
* **Solución**: Debes abrir turno de caja en `/caja` con el fondo inicial antes de registrar ventas.

### 2. ¿Cómo calculo el precio de venta sugerido al cargar un producto?
* **Solución**: Al registrar o editar un artículo (en Catálogos o en el alta rápida de Compras), ingresa el Precio Costo y pulsa los botones de margen sugerido (**15%**, **20%**, **30%**, **50%**). La calculadora fijará el precio de venta automáticamente.

### 3. ¿Qué pasa si borro todo incluyendo los volúmenes de Docker y vuelvo a levantar desde Docker? ¿Servirá el backup descargado?
* **Solución**: **Sí, servirá perfectamente.** Al levantar de cero, inicia sesión con el usuario de fábrica `admin` / `admin123`. Ve a `/backup`, arrastra tu archivo `.dump` descargado y confirma la restauración. El motor eliminará las tablas semilla vacías y reconstruirá el 100% de tus ventas, compras, productos y usuarios con sus contraseñas reales.

### 4. ¿Cómo obtengo el informe de compras a proveedores para el contador?
* **Solución**: Ingresa a `/reportes` > Pestaña **Compras a Proveedores** (ícono de camión). Selecciona el período (ej. *Este mes*) y pulsa **Exportar CSV** para obtener la planilla Excel con el crédito fiscal desglosado, o **Descargar PDF (A4)** para el documento impreso.

### 5. ¿Cómo evito perder una factura de compra si hago clic afuera sin querer?
* **Solución**: El modal tiene protección nativa de bloqueo de fondo (`closeOnBackdrop: false`). Además, si pulsas cancelar teniendo artículos cargados, el sistema te solicitará confirmación explícita para evitar descartar los datos por error.

---
*Manual elaborado conforme a la versión vigente del Sistema Retail ERP Heladería & Minimarket.*  
*Para asistencia técnica o consultas de soporte, contacte al área de sistemas autorizada.*
