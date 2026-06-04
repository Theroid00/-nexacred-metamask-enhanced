# ==========================================
# Stage 1: Build the React Frontend
# ==========================================
FROM node:18-bullseye-slim AS frontend-builder
WORKDIR /build

# Copy frontend source and build configurations
COPY frontend/nexacred/package*.json ./
RUN npm install
COPY frontend/nexacred/ ./
RUN npm run build

# ==========================================
# Stage 2: Build the Unified Runtime
# ==========================================
FROM python:3.10-slim-bullseye

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PORT=7860
WORKDIR /app

# Install system dependencies (Node.js, Nginx, Supervisord)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    nginx \
    supervisor \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copy built frontend assets from Stage 1
COPY --from=frontend-builder /build/dist /app/frontend/nexacred/dist

# Copy Node.js Backend API and install dependencies
COPY backend/Backend /app/backend/Backend
RUN cd /app/backend/Backend && npm install --production

# Copy FastAPI Transaction Analyzer and install Python dependencies
COPY backend/services /app/backend/services
RUN pip install --no-cache-dir -r /app/backend/services/requirements.txt

# Copy deployment configurations
COPY nginx.conf /etc/nginx/sites-available/default
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Setup required execution directories and permissions
RUN mkdir -p /var/log/supervisor /var/run/supervisor \
    && chmod -R 777 /var/log /var/run /var/lib/nginx /run

# Expose port 7860 (Hugging Face Spaces default)
EXPOSE 7860

# Start Process Manager
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
