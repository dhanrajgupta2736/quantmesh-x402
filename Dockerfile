# ====================================================================
# QuantMesh x402 — Unified Multi-Service Container
# Runs Orchestrator (Node.js/Hono) + 3 Python FastAPI Worker Agents
# Managed by Supervisor inside 1 container (100% Free Lifetime on Render)
# ====================================================================

FROM node:20-slim

# 1. Install Python, Pip, Supervisor, and curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    supervisor \
    curl \
    git \
    && mkdir -p /var/log/supervisor /var/run \
    && rm -rf /var/lib/apt/lists/*


WORKDIR /app

# 2. Setup Python Environment & Install Worker Dependencies
COPY agent-sentiment-fusion/requirements.txt /app/agent-sentiment-fusion/
COPY agent-onchain-ta/requirements.txt /app/agent-onchain-ta/
COPY agent-regime-classifier/requirements.txt /app/agent-regime-classifier/

RUN pip3 install --no-cache-dir --break-system-packages \
    -r /app/agent-sentiment-fusion/requirements.txt \
    -r /app/agent-onchain-ta/requirements.txt \
    -r /app/agent-regime-classifier/requirements.txt

# 3. Copy Python Agent Source Codes
COPY agent-sentiment-fusion /app/agent-sentiment-fusion
COPY agent-onchain-ta /app/agent-onchain-ta
COPY agent-regime-classifier /app/agent-regime-classifier

# 4. Setup Node.js Orchestrator
WORKDIR /app/orchestrator
COPY orchestrator/package*.json ./
COPY orchestrator/lib ./lib
RUN npm install

COPY orchestrator/tsconfig.json ./
COPY orchestrator/src ./src
RUN npm run build || true

# 5. Setup Supervisor Configuration
WORKDIR /app
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# 6. Expose Orchestrator Port (Default 4000 or Render's dynamic $PORT)
EXPOSE 4000

# 7. Start Supervisor (Launches Orchestrator + 3 FastAPI Agents)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
