# Guía de Requisitos de Hardware y Sistema
### Sistema de Gestión y Punto de Venta (POS) para Heladerías y Cafeterías

---

## 1. Métricas Reales de Consumo (Telemetría en Vivo)

El sistema ha sido optimizado con tecnologías modernas de alta eficiencia. En pruebas reales sobre Docker, el consumo medido del stack completo es:

| Contenedor | Tecnología | Rol | Memoria RAM en Reposo |
|---|---|---|:---:|
| `heladeria-front` | Nginx + Angular 19 (PWA) | Servidor Web de Frontend | **~13 MB** |
| `heladeria-api` | Java 21 / Spring Boot 3 | API REST, Seguridad y Lógica | **~340 MB** |
| `heladeria-postgres` | PostgreSQL 16 Alpine | Motor de Base de Datos Transaccional | **~65 MB** |
| **Consumo Total del Stack** | | | **~418 MB** |

> **Conclusión:** El sistema es extremadamente ligero. Consume menos de **0.5 GB de RAM** en total para toda su infraestructura de backend, frontend y base de datos.

---

## 2. Escenarios de Implementación y Requisitos

Dependiendo de la escala del local o cadena, el sistema admite tres arquitecturas de hardware:

---

### ESCENARIO A: "Todo en Uno" (Servidor y Caja en la misma PC)
*El modelo más frecuente en locales chicos y medianos: la misma computadora del mostrador corre Docker y a la vez es utilizada por el cajero para registrar ventas en pantalla completa.*

| Componente | Requisito Mínimo | Requisito Recomendado (Óptimo) |
|---|---|---|
| **Procesador (CPU)** | Intel Core i3 (4ª gen+) / Celeron moderno (N4020, N5095) / AMD Athlon | **Intel Core i3 / i5 (8ª gen+) / AMD Ryzen 3 / Intel N100** |
| **Memoria RAM** | 4 GB | **8 GB DDR4** *(Garantiza fluidez total con Windows/Linux + Navegador + Docker)* |
| **Almacenamiento** | 60 GB HDD | **120 GB SSD o NVMe** *(Un disco SSD es crucial para arranques rápidos y consultas fluidas)* |
| **Sistema Operativo** | Windows 10/11 (64-bit) con Docker Desktop o Linux | **Linux (Ubuntu 22.04 / 24.04 LTS o Linux Mint)** para máxima estabilidad sin reinicios forzados |
| **Pantalla** | Monitor estándar 1366 × 768 | **Monitor Táctil de 15" a 21.5" (Full HD 1920 × 1080)** |

---

### ESCENARIO B: Servidor Local Dedicado / Mini PC + Terminales Táctiles
*Ideal para heladerías con alto tráfico o con varias cajas/mozos: una Mini PC compacta y silenciosa en la oficina o trastienda procesa el sistema, y en el mostrador se atiende desde tablets Android.*

#### Especificaciones de la Mini PC Servidor:
* **Modelo Sugerido:** Mini PC tipo **Intel N100** (Beelink Mini S12, GMKtec, Chuwi o similares).
* **Consumo Eléctrico:** Muy bajo (consume entre **10W y 15W**, ideal para estar encendida todo el día).
* **CPU:** Intel Alder Lake N100 (4 núcleos / 4 hilos hasta 3.4 GHz).
* **RAM:** 8 GB DDR4 / DDR5.
* **Disco:** 128 GB o 256 GB SSD M.2 NVMe.
* **Sistema Operativo:** **Ubuntu Server 24.04 LTS** (sin entorno gráfico de escritorio, consume solo ~600 MB de RAM en total con el sistema corriendo).

---

### ESCENARIO C: Dispositivos Clientes (Tablets, Celulares y PCs de Cobro)
*Los dispositivos que usan los cajeros o despachadores en el mostrador solo ejecutan el frontend web (PWA).*

| Dispositivo | Requisitos Mínimos | Modelos Recomendados |
|---|---|---|
| **Tablet Android** | Android 9.0+, 2 GB RAM, Pantalla 8" a 10" | Samsung Galaxy Tab A7 / A9, Lenovo Tab M8 / M10, o All-in-One POS Android |
| **Computadora Cliente** | Cualquier PC o Laptop con navegador moderno | Cualquier PC con Windows, Linux o Mac con Google Chrome / Firefox |
| **Celular / Móvil** | Pantalla táctil de 6" o superior | Cualquier smartphone Android o iOS con Wi-Fi |

---

## 3. Periféricos y Hardware de Punto de Venta (POS)

Para completar la estación de cobro en el mostrador, se recomienda el siguiente equipamiento:

### 1. Impresora Térmica de Tickets y Comandas
* **Protocolo:** **ESC/POS** (Estándar de la industria soportado nativamente por el sistema).
* **Ancho de Papel:**
  * **80 mm (Recomendado):** Permite imprimir tickets legibles con logotipo del negocio, detalle amplio de sabores, QR y pie de página institucional.
  * **58 mm:** Formato compacto más económico.
* **Tipo de Conexión:**
  * **Ethernet (Red LAN RJ45) o Wi-Fi (Altamente recomendado):** La impresora se conecta directo al router de la heladería. De esta manera, cualquier tablet o PC de cobro puede enviar a imprimir a la misma ticketera sin cables hacia la PC.
  * **USB:** Conexión directa a la computadora principal.

### 2. Cajón / Gaveta de Dinero Monedero
* **Conexión:** Interfaz estándar **RJ11** conectada a la impresora térmica.
* **Apertura Automática:** Se abre automáticamente por pulso eléctrico de la impresora cada vez que se emite un ticket de venta en efectivo o al hacer una apertura de caja.

### 3. Lector de Código de Barras (Opcional)
* **Tipo:** Lector láser o 2D USB (Plug & Play, no requiere drivers especiales).
* **Uso:** Venta rápida en mostrador de bebidas envasadas, alfajores, chocolates y productos empaquetados.

### 4. UPS (Sistema de Energía Ininterrumpida / Batería de Respaldo)
* **Capacidad Recomendada:** **500 VA a 650 VA** (protección básica con 15 a 30 minutos de autonomía).
* **Importancia Crítica:**
  * Protege la base de datos PostgreSQL de apagones bruscos que puedan corromper transacciones en caliente.
  * Mantiene encendido el router Wi-Fi y la computadora para terminar de cobrar y despachar al cliente que está en el mostrador durante un corte de luz.

---

## 4. Requisitos de Red y Conectividad

* **Operación 100% Local (LAN):**
  * El sistema **NO requiere conexión a internet para vender, cobrar ni imprimir tickets**. Todo el flujo se resuelve en la red interna del local.
* **Router Wi-Fi:**
  * Router estándar de doble banda (2.4 GHz y 5 GHz) con asignación de **IP Estática o Reserva DHCP** para la máquina servidor y para las impresoras de red.
* **Puertos de Red Utilizados:**
  * `8086` (HTTP) / `8443` (HTTPS) $\rightarrow$ Frontend Web (Angular/Nginx).
  * `8085` $\rightarrow$ Backend API (Spring Boot).
  * `5435` $\rightarrow$ Base de Datos (PostgreSQL).
  * `9100` $\rightarrow$ Puerto estándar RAW para impresoras térmicas de red.

---

## 5. Resumen: "Kit Ideal Recomendado" para una Heladería

Para una heladería que busca la mejor relación precio-calidad y durabilidad:

1. **Servidor:** Mini PC Intel N100 (8 GB RAM, 128 GB SSD) con Ubuntu o Windows 11.
2. **Punto de Venta:** Pantalla táctil de 15" o Tablet Samsung Galaxy Tab A9 de 8.7" con soporte para mostrador.
3. **Impresora:** Impresora térmica de 80 mm con conexión Ethernet (RJ45).
4. **Cajón de Dinero:** Gaveta metálica estándar de 4 billetes / 8 monedas con conector RJ11.
5. **Protección:** UPS de 650 VA para la Mini PC y el Router.
