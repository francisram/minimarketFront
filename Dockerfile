# ==============================================================================
# Etapa 1: Compilación de la aplicación Angular
# ==============================================================================
FROM node:22-alpine AS build
WORKDIR /app

# Instalar dependencias con caché de capas
COPY package.json package-lock.json ./
RUN npm ci

# Copiar código fuente y compilar
COPY . .
RUN npm run build

# ==============================================================================
# Etapa 2: Servidor web Nginx ligero para producción
# ==============================================================================
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remover archivos por defecto de Nginx
RUN rm -rf ./*

# Copiar artefactos compilados de Angular
COPY --from=build /app/dist/minisuperangular/browser ./

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar certificados SSL para HTTPS
COPY ssl/ /etc/nginx/ssl/

# Exponer puertos HTTP y HTTPS
EXPOSE 80 443

# Iniciar servidor
CMD ["nginx", "-g", "daemon off;"]
