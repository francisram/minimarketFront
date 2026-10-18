# Manuales de Usuario - Sistema de Gestión Comercial y Punto de Venta (Heladería / Minimarket)

Bienvenido a la biblioteca de documentación y manuales de usuario del sistema. Esta guía está diseñada para que cualquier usuario (cajero, heladero, auditor, encargado o administrador) pueda aprender a utilizar cada funcionalidad paso a paso, resolver dudas operativas y seguir las mejores prácticas comerciales y fiscales paraguayas (SET / DNIT).

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
  *Venta de helados en pote y cucurucho por sabores, selección de toppings, bebidas y minimarket, escaneo de código de barras, clientes con RUC/CI, cobros multimoneda (Efectivo, Tarjeta con Voucher obligatorio, QR) e impresión de factura legal.*
* [**04. Control de Caja, Turnos y Arqueo Ciego**](./04_control_de_caja_y_turnos.md)  
  *Apertura de turno con fondo inicial, registro de movimientos, arqueo de valores por medio de pago (Efectivo, Vouchers POS, Transferencias/QR), detección de sobrantes/faltantes y cierre de turno.*
* [**05. Monitor de Pedidos y Despacho en Mostrador**](./05_monitor_de_pedidos.md)  
  *Visualización en tiempo real de comandas, avance de preparación (*Pendiente -> En Preparación -> Listo -> Entregado*) y cancelación controlada.*
* [**06. Directorio y Gestión de Clientes**](./06_directorio_de_clientes.md)  
  *Búsqueda rápida por RUC o Cédula, validación automática de Dígito Verificador (DV) paraguayo, alta de clientes corporativos y consumidores finales.*

### 3. Almacén, Existencias y Abastecimiento
* [**07. Control Integral de Inventario y Kardex Físico**](./07_inventario_y_kardex.md)  
  *Alertas automáticas de stock mínimo, control de bachas de helado en kg, envases y cucuruchos en unidades, registro de movimientos y valorización en Guaraníes (Gs.).*
* [**08. Auditoría y Conteo Físico a Ciegas (Blind Stocktaking)**](./08_auditoria_y_conteo_fisico.md)  
  *Auditoría física sin ver el stock del sistema para evitar manipulaciones, carga de cantidades contadas, aplicación de ajustes atómicos y descarga del Acta Oficial en PDF A4 y CSV.*
* [**17. Padrón de Proveedores y Artículos Suministrados**](./17_proveedores.md)  
  *Directorio de distribuidores mayoristas con RUC y datos bancarios, contador de artículos y consulta interactiva de catálogo provisto con costos pactados y proveedor principal ⭐.*
* [**18. Facturas de Compra de Proveedores e Ingreso a Stock**](./18_compras_a_proveedores.md)  
  *Registro de facturas de compra con respaldo fiscal (Contado/Crédito), carga rápida por código de barras, selección múltiple en bloque por proveedor habitual, alta rápida de artículos en caliente con calculadora de margen comercial, protección contra cierre accidental y exportación en CSV y PDF.*

### 4. Catálogos y Fiscalidad
* [**09. Catálogo de Artículos (Maestro ERP, Sabores, Envases, Toppings y Productos)**](./09_catalogos_sabores_presentaciones_productos.md)  
  *Catálogo Maestro Retail ERP clasificado en 5 tipos de artículos, multi-proveedor N:M con costos individuales y calculadora inteligente de margen comercial (15%, 20%, 30%, 50%) con sugerencia automática de precio de venta.*
* [**10. Reportes Oficiales, Libro Ventas IVA, Compras y Reimpresiones**](./10_reportes_y_libro_iva.md)  
  *Generación del Libro de Ventas IVA, nuevo reporte completo de Compras a Proveedores con liquidación de Crédito Fiscal IVA y descargas en CSV (Excel) y PDF A4 Apaisado, talonarios timbrados y reimpresiones térmicas.*

### 5. Configuración y Administración del Sistema
* [**11. Gestión de Usuarios y Personal**](./11_gestion_de_usuarios.md)  
  *Alta de operadores, asignación de rol, activación/desactivación de cuentas, blanqueo y reseteo de contraseñas.*
* [**12. Roles y Matriz de Permisos**](./12_roles_y_permisos.md)  
  *Creación de perfiles personalizados, asignación selectiva de permisos y roles protegidos `ADMIN` y `OWNER`.*
* [**13. Configuración de Impresoras Térmicas ESC/POS**](./13_impresoras_termicas.md)  
  *Alta de impresoras térmicas de 58mm y 80mm por Red TCP/IP o USB, prueba de impresión y comando de apertura de cajón.*
* [**14. Datos del Negocio y Timbrado Fiscal Legal**](./14_datos_del_negocio_y_timbrado.md)  
  *Razón Social, RUC con DV, número de Timbrado emitido por la DNIT, fecha de caducidad y logotipo institucional.*
* [**15. Licenciamiento y Planes del Sistema**](./15_licenciamiento.md)  
  *Estado de la licencia, vigencia de la suscripción y módulos autorizados.*
* [**16. Copias de Seguridad y Restauración Integral (Backups)**](./16_copias_de_seguridad_y_restauracion.md)  
  *Generación de respaldos completos en formato binario de PostgreSQL (`.dump`), zona de subida drag & drop, procedimiento de Disaster Recovery desde cero con Docker y límites de carga de hasta 100 MB.*

---

## 💡 Recomendaciones por Rol de Usuario

1. **Cajeros(as)**: Manuales **01**, **03** y **04**. Indispensable abrir turno de caja antes de realizar cualquier venta.
2. **Encargados(as) de Compras y Almacén**: Manuales **07**, **17** y **18** para registrar compras, recepcionar pedidos de proveedores habituales y alimentar el stock.
3. **Auditores(as) de Inventario**: Manual **08** para la toma de conteo físico a ciegas y emisión del acta de discrepancias.
4. **Gerentes y Propietarios**: Manuales **02**, **09**, **10**, **11**, **12** y **16** para supervisar rentabilidad, márgenes de ganancia, libros impositivos y resguardo seguro de datos.
