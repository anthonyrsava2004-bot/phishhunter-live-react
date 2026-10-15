# ==============================================================================
# PhishHunter Live React - Dockerfile Multi-Stage (React + FastAPI)
# ==============================================================================

# Etapa 1: Compilación de Frontend React (Vite)
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Etapa 2: Servidor de Producción Python 3.11 Headless
FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    PORT=8000 \
    DATABASE_PATH=database/phishhunter.db

# Dependencias mínimas del sistema requeridas para SSL y red
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalar dependencias de Python
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar backend y motores heurísticos
COPY . /app

# Copiar compilación de React desde la etapa 1
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Asegurar permisos de base de datos SQLite
RUN mkdir -p /app/database && chmod -R 777 /app/database

EXPOSE 8000

# Healthcheck HTTP para validar disponibilidad del servicio
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Inicio con Uvicorn soportando la variable $PORT de Render o puerto por defecto 8000
ENTRYPOINT ["sh", "-c", "uvicorn api:app --host 0.0.0.0 --port ${PORT:-8000}"]
