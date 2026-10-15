# Manuales de Usuario - Sistema de Gestión Comercial y Punto de Venta (Heladería / Minimarket)

Bienvenido a la biblioteca de documentación y manuales de usuario del sistema. Esta guía está diseñada para que cualquier usuario (cajero, auditor, supervisor, encargado o administrador) pueda aprender a utilizar cada funcionalidad paso a paso, resolver dudas operativas y seguir las mejores prácticas comerciales y fiscales paraguayas (SET / DNIT).

---

## 📚 Estructura de la Documentación

Puedes consultar el [**Manual de Usuario General Exhaustivo (Todo en Uno)**](./MANUAL_DE_USUARIO_GENERAL.md) o acceder a las guías detalladas por cada vista y módulo específico:

### 1. Acceso y Operación Inicial
* [**01. Autenticación, Inicio de Sesión y Seguridad**](./01_autenticacion_y_seguridad.md)  
  *Ingreso al sistema, cambio obligatorio de contraseña, expiración de credenciales y cierre seguro de sesión.*
* [**02. Dashboard General y Métricas Diarias**](./02_dashboard_y_metricas.md)  
  *Lectura de KPIs de facturación, ventas del día, accesos rápidos y estado del negocio.*

### 2. Ventas y Atención al Cliente
* [**03. Punto de Venta (POS) y Comandas**](./03_punto_de_venta_pos.md)  
  *Venta de helados en pote y cucurucho por sabores, selección de toppings, bebidas y minimarket, asociación de clientes con RUC/CI, cobros multimoneda (Efectivo, Tarjeta con Voucher obligatorio, QR) e impresión de factura/ticket legal.*
* [**04. Control de Caja, Turnos y Arqueo Ciego**](./04_control_de_caja_y_turnos.md)  
  *Apertura de turno con fondo inicial, registro automático de movimientos, arqueo de valores por medio de pago (Efectivo, Vouchers POS, Transferencias/QR), detección de sobrantes/faltantes y cierre de turno.*
* [**05. Monitor de Pedidos y Despacho en Mostrador**](./05_monitor_de_pedidos.md)  
  *Visualización en tiempo real de comandas, avance de preparación (*Pendiente -> En Preparación -> Listo -> Entregado*) y cancelación controlada.*
* [**06. Directorio y Gestión de Clientes**](./06_directorio_de_clientes.md)  
  *Búsqueda rápida por RUC o Cédula, validación automática de Dígito Verificador (DV) paraguayo, alta de clientes corporativos y consumidores finales.*

### 3. Almacén, Existencias y Auditoría
* [**07. Control Integral de Inventario y Kardex Físico**](./07_inventario_y_kardex.md)  
  *Alertas automáticas de bajo stock mínimo, control de bachas de helado en kg, envases y cucuruchos en unidades, registro de movimientos manuales de entrada/merma y valorización total en Guaraníes (Gs.).*
* [**08. Auditoría y Conteo Físico a Ciegas (Blind Stocktaking)**](./08_auditoria_y_conteo_fisico.md)  
  *Procedimiento de auditoría física a ciegas (sin ver el stock del sistema para evitar cuadres artificiales), carga de cantidades contadas, aplicación de ajustes atómicos en la base de datos, reporte comparativo en vivo y descarga del Acta Oficial en PDF A4 y CSV.*

### 4. Catálogos y Fiscalidad
* [**09. Catálogo de Artículos (Sabores, Envases, Toppings y Productos)**](./09_catalogos_sabores_presentaciones_productos.md)  
  *Creación de sabores en bacha y control de agotado automático, presentaciones térmicas con límite de sabores, adicionales/toppings y artículos de cafetería/bebidas.*
* [**10. Reportes Oficiales, Libro Ventas IVA y Reimpresiones SET**](./10_reportes_y_libro_iva.md)  
  *Generación del Libro de Ventas IVA en formato Hechauka/SET, talonarios fiscales timbrados, reimpresión térmica de comprobantes y auditorías históricas.*

### 5. Configuración y Administración del Sistema
* [**11. Gestión de Usuarios y Personal**](./11_gestion_de_usuarios.md)  
  *Alta de operadores, asignación de rol, activación/desactivación de cuentas, blanqueo y reseteo de contraseñas.*
* [**12. Roles y Matriz de Permisos**](./12_roles_y_permisos.md)  
  *Creación de perfiles personalizados, asignación selectiva de permisos (ej. Rol `AUDITOR` con acceso exclusivo a planilla de conteo físico), roles protegidos `ADMIN` y `OWNER`.*
* [**13. Configuración de Impresoras Térmicas ESC/POS**](./13_impresoras_termicas.md)  
  *Alta de impresoras térmicas de 58mm y 80mm por Red TCP/IP o USB, prueba de impresión, salto de línea y comando de apertura de cajón de dinero.*
* [**14. Datos del Negocio y Timbrado Fiscal Legal**](./14_datos_del_negocio_y_timbrado.md)  
  *Carga de Razón Social, RUC con DV, número de Timbrado emitido por la DNIT, fecha de inicio y vencimiento, establecimiento, punto de expedición y logotipo institucional.*
* [**15. Licenciamiento y Planes del Sistema**](./15_licenciamiento.md)  
  *Consulta de estado de la licencia, vigencia de la suscripción y módulos autorizados (Básico, Estándar, Premium).*
* [**16. Copias de Seguridad y Restauración Integral (Backups)**](./16_copias_de_seguridad_y_restauracion.md)  
  *Generación de respaldos completos en formato binario de PostgreSQL (`.backup`), descarga segura a la computadora y procedimiento de restauración ante contingencias.*

---

## 💡 Recomendaciones para Nuevos Usuarios

1. **Si eres Cajero(a)**: Revisa los manuales **01**, **03** y **04**. Es indispensable abrir turno de caja antes de realizar cualquier venta.
2. **Si eres Auditor(a) de Inventario**: Revisa el manual **08**. Conocerás cómo ingresar las cantidades observadas en los freezers de forma rápida y cómo emitir el acta firmada.
3. **Si eres Encargado(a) o Administrador(a)**: Revisa los manuales **02**, **06**, **07**, **09**, **10**, **11**, **12** y **16** para tener control total de la rentabilidad, personal y resguardo de datos.
