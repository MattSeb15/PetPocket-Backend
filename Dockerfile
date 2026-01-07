# syntax=docker/dockerfile:1

# Usamos imagen basada en Debian para mejor compatibilidad con binarios precompilados (p.ej. bcrypt)
FROM node:20-slim

WORKDIR /app

# Copiar manifests e instalar dependencias primero (mejor cache de Docker)
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar el resto del código
COPY . .

# Importante: si el host tiene node_modules (Windows), puede sobrescribir los binarios Linux.
# Forzamos una instalación limpia dentro de la imagen.
RUN rm -rf node_modules \
    && npm ci --omit=dev

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
