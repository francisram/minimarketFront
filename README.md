# Minimarket & Heladería Frontend - Retail ERP & Punto de Venta (POS)

Sistema web y PWA empresarial de alta disponibilidad para la gestión integral de heladerías artesanales, confiterías, cafeterías y minimarkets en Paraguay.

---

## 🚀 Características Principales

* **Punto de Venta Táctil (POS)**: Despacho ágil en menos de 15 segundos, soporte de escáner de código de barras para bebidas y envasados, venta fraccionada de helados por peso y presentaciones térmicas con límite de gustos.
* **Catálogo Maestro Retail ERP**: Clasificación unificada de artículos en 5 categorías (`VENTA_DIRECTA`, `ENVASE`, `SABOR`, `TOPPING`, `INSUMO`), soporte multi-proveedor (N:M) y calculadora inteligente de margen comercial (**15%**, **20%**, **30%**, **50%**) con estimación de precios de venta en tiempo real.
* **Facturas de Compra de Proveedores**: Carga rápida con lector de código de barras, selección múltiple en bloque por proveedor habitual, alta rápida de artículos en caliente sin perder la compra en curso, protección contra cierre accidental, ingreso a stock y liquidación de Crédito Fiscal IVA.
* **Padrón de Proveedores**: Directorio de distribuidores con RUC, datos bancarios, contador de artículos y consulta de catálogo suministrado con costos pactados.
* **Reportes Fiscales y Liquidación SET/DNIT**: Libro de Ventas IVA, Reporte de Compras a Proveedores con liquidación de Crédito Fiscal IVA, y descargas oficiales en **CSV (Excel)** y **PDF A4 Apaisado**.
* **Control de Caja y Turnos**: Arqueo ciego con detección de sobrantes y faltantes, y registro de movimientos por medios de pago.
* **Auditoría de Inventario a Ciegas**: Conteo físico sin visualización de stock teórico y emisión de actas oficiales firmadas en PDF A4.
* **Copias de Seguridad y Disaster Recovery**: Volcados binarios de PostgreSQL (`.dump`), restauración drag & drop y reconstrucción completa desde cero con Docker.

---

## 🛠️ Stack Tecnológico

* **Framework:** Angular 19+ (Standalone Components, Signals reactivas, HttpClient, Router Guards).
* **Diseño y Estilos:** CSS moderno responsivo con temas claros/oscuros y adaptación inmersiva para tablets y modo PWA/APK Kiosco.
* **Generación Documental:** `jspdf` y `jspdf-autotable` para reportes vectoriales A4.
* **Servidor Web y Proxy:** Nginx Alpine con certificados SSL locales y soporte de transferencias de hasta 100 MB.

---

## 📚 Biblioteca de Documentación

Todos los manuales de usuario y especificaciones técnicas se encuentran en la carpeta [`docs/`](./docs/README.md):
* [**Manual General Exhaustivo (Todo en Uno)**](./docs/MANUAL_DE_USUARIO_GENERAL.md)
* [**Dossier de Módulos y Bondades del Sistema**](./MODULOS_Y_BONDADES.md)
* [09. Catálogo de Artículos y Calculadora de Margen](./docs/09_catalogos_sabores_presentaciones_productos.md)
* [10. Reportes Oficiales, Ventas y Compras](./docs/10_reportes_y_libro_iva.md)
* [16. Copias de Seguridad y Restauración](./docs/16_copias_de_seguridad_y_restauracion.md)
* [17. Padrón de Proveedores](./docs/17_proveedores.md)
* [18. Facturas de Compra de Proveedores](./docs/18_compras_a_proveedores.md)

---

## 🐳 Ejecución con Docker

```bash
# Iniciar frontend con Docker Compose
docker compose up -d --build heladeria-front
```

Acceso local: `http://localhost:8086/` (HTTP) o `https://localhost:8443/` (HTTPS).
