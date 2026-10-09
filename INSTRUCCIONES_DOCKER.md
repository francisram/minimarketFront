# 🍦 Guía de Despliegue en Docker: Frontend Heladería Artesanal

Esta guía detalla los pasos para compilar, levantar y gestionar la aplicación web cliente de la Heladería Artesanal en contenedores **Docker** tanto en **Windows** como en **Linux**.

---

## 📌 Datos de la Aplicación en Docker

* **Puerto Asignado**: `8086` (evita colisiones con otros contenedores activos como la API en `8085` o bases de datos).
* **URL de Acceso Local**: [http://localhost:8086](http://localhost:8086)
* **Backend REST (Spring Boot)**: `http://localhost:8085`
* **Servidor Web Interno**: Nginx Alpine optimizado para Angular SPA (Single Page Application).

---

## 📋 Requisitos Previos

1. **Docker Engine** y **Docker Compose** instalados y en ejecución:
   * **En Windows**: Tener instalado y abierto [Docker Desktop](https://www.docker.com/products/docker-desktop/) (con integración WSL2 recomendada).
   * **En Linux**: Tener instalado `docker` y el plugin `docker-compose-plugin` (o `docker-compose`).

---

## 🐧 1. Instrucciones para LINUX (Ubuntu / Debian / Fedora / Arch)

Abre tu terminal en la raíz del proyecto (`minimarketFront`):

```bash
cd /ruta/al/proyecto/minimarketFront
```

### Opción A: Usando Docker Compose (Recomendada)

1. **Construir y levantar en segundo plano**:
   ```bash
   docker compose up -d --build
   ```

2. **Verificar que el contenedor está corriendo**:
   ```bash
   docker ps | grep heladeria-front
   ```

3. **Ver los logs en tiempo real**:
   ```bash
   docker compose logs -f
   ```

4. **Detener el contenedor**:
   ```bash
   docker compose down
   ```

---

### Opción B: Usando Docker CLI directamente (Sin Compose)

1. **Construir la imagen**:
   ```bash
   docker build -t heladeria-front .
   ```

2. **Ejecutar el contenedor mapeando el puerto 8086**:
   ```bash
   docker run -d \
     --name heladeria-front \
     -p 8086:80 \
     --restart unless-stopped \
     heladeria-front
   ```

3. **Detener y eliminar el contenedor cuando sea necesario**:
   ```bash
   docker stop heladeria-front
   docker rm heladeria-front
   ```

---

## 🪟 2. Instrucciones para WINDOWS (PowerShell o CMD)

1. Abre **PowerShell** o **Símbolo del sistema (CMD)** como Administrador.
2. Navega al directorio donde clonaste o descargaste el repositorio:
   ```powershell
   cd C:\Ruta\Al\Proyecto\minimarketFront
   ```

3. Asegúrate de que **Docker Desktop** esté iniciado (ícono de la ballena verde en la barra de tareas).

4. **Levantar la aplicación con Docker Compose**:
   ```powershell
   docker compose up -d --build
   ```

5. **Acceder a la aplicación**:
   Abre cualquier navegador web (Chrome, Edge, Firefox) e ingresa a:
   👉 **http://localhost:8086**

6. **Detener la aplicación**:
   ```powershell
   docker compose down
   ```

---

## ⚙️ 3. Cómo Cambiar el Puerto de Salida

Si prefieres usar otro puerto en tu máquina anfitriona (por ejemplo, el `4200` o `3000`):

1. Abre el archivo [`docker-compose.yml`](docker-compose.yml).
2. Modifica la sección `ports`:
   ```yaml
   ports:
     - "4200:80"   # Cambia 8086 por el puerto deseado
   ```
3. Re-levanta el contenedor:
   ```bash
   docker compose up -d
   ```

---

## 🔍 4. Comandos Útiles de Mantenimiento

| Acción | Comando |
| :--- | :--- |
| Ver estado de contenedores | `docker compose ps` |
| Ver logs del servidor Nginx | `docker logs -f heladeria-front` |
| Reiniciar la aplicación | `docker restart heladeria-front` |
| Reconstruir desde cero sin caché | `docker compose build --no-cache && docker compose up -d` |
| Acceder a la consola dentro del contenedor | `docker exec -it heladeria-front sh` |

---

## 💡 5. Resolución de Problemas Frecuentes

1. **"Puerto 8086 ya está en uso"**:
   * En Linux/Mac: `sudo lsof -i :8086` o `sudo ss -tulpn | grep 8086`
   * En Windows: `netstat -ano | findstr :8086`
   * Si está ocupado, edita `docker-compose.yml` y asigna otro puerto libre.

2. **"No se conecta con el Backend"**:
   * Verifica que el contenedor del backend `heladeria-api` esté corriendo en el puerto `8085` (`docker ps`).
   * La aplicación web en el navegador del cliente se comunica directamente con `http://localhost:8085`.

3. **Recarga de página (F5) en subrutas de Angular**:
   * La configuración de Nginx ya incluye `try_files $uri $uri/ /index.html;`, por lo que navegar a `/pos`, `/pedidos`, `/impresoras` o `/login` y refrescar la página funcionará fluidamente sin errores 404.
