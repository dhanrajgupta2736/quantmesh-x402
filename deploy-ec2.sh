#!/bin/bash
set -e

echo "=================================================="
echo "   QuantMesh x402 Orchestrator EC2 Deployment"
echo "=================================================="

# 1. System Updates & Core Packages
echo "--> [1/8] Updating apt packages & installing Python..."
sudo apt-get update -y
sudo apt-get install -y curl git nginx certbot python3-certbot-nginx ufw python3 python3-pip python3-venv

# 2. Install Node.js 20 LTS & PM2
echo "--> [2/8] Installing Node.js 20 LTS & PM2..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# 3. Clone / Pull Repository
REPO_DIR="$HOME/quantmesh-x402"
if [ ! -d "$REPO_DIR" ]; then
    echo "--> [3/8] Cloning quantmesh-x402 repository..."
    git clone https://github.com/dhanrajgupta2736/quantmesh-x402.git "$REPO_DIR"
else
    echo "--> [3/8] Updating existing repository..."
    cd "$REPO_DIR"
    git pull origin main
fi

# 4. Setup Python Worker Agents (FastAPI Services)
echo "--> [4/8] Installing & starting Python FastAPI worker services..."
cd "$REPO_DIR/agent-sentiment-fusion"
pip3 install --break-system-packages -r requirements.txt
pm2 delete sentiment-fusion-worker 2>/dev/null || true
pm2 start "uvicorn main:app --host 0.0.0.0 --port 5001" --name "sentiment-fusion-worker"

cd "$REPO_DIR/agent-onchain-ta"
pip3 install --break-system-packages -r requirements.txt
pm2 delete onchain-ta-worker 2>/dev/null || true
pm2 start "uvicorn main:app --host 0.0.0.0 --port 5002" --name "onchain-ta-worker"

# 5. Setup Orchestrator Dependencies & Environment
cd "$REPO_DIR/orchestrator"
echo "--> [5/8] Installing npm dependencies..."
npm install

if [ ! -f ".env" ]; then
    echo "--> Creating default orchestrator .env file..."
    cat <<EOT > .env
PORT=4000
ALGORAND_NETWORK=testnet
ALGOD_SERVER=https://testnet-api.algonode.cloud
ALGOD_PORT=443
ALGOD_TOKEN=
ROUTER_ADDRESS=4DTSNS35EP24IFWIGXSG5NSD3GDDTPHNVGEXSHG67JDEHUHUNFR3KJGPO4
ROUTER_MNEMONIC=your_twenty_five_word_algorand_mnemonic_phrase_here
# HF_API_TOKEN=your_huggingface_token_here
WORKER_A_URL=http://localhost:5001/agent/sentiment
WORKER_B_URL=http://localhost:5002/agent/onchain
WORKER_C_URL=http://localhost:5002/agent/ta
WORKER_D_URL=http://localhost:5001/agent/fusion
USDC_TESTNET_ASA_ID=10458941
FACILITATOR_URL=https://facilitator.goplausible.xyz
EOT
fi

if ! grep -q "^ROUTER_MNEMONIC=" .env || grep -q "^ROUTER_MNEMONIC=your_twenty_five_word" .env; then
  echo ""
  echo "========================================================================="
  echo " ⚠️ WARNING: ROUTER_MNEMONIC is not set in orchestrator/.env"
  echo " The atomic worker payout (this project's core feature) will be SKIPPED"
  echo " on every request until you edit orchestrator/.env and set this manually."
  echo "========================================================================="
  echo " Deploy halted. Edit orchestrator/.env, set ROUTER_MNEMONIC, then re-run."
  exit 1
fi

# 6. Start Service with PM2 Process Manager
echo "--> [6/8] Starting orchestrator service via PM2..."
pm2 delete orchestrator 2>/dev/null || true
pm2 start "npm run dev" --name "orchestrator"
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME 2>/dev/null || true

# 7. Configure Nginx Reverse Proxy (Port 80 -> 4000)
echo "--> [7/8] Configuring Nginx reverse proxy..."
sudo cat <<EOT | sudo tee /etc/nginx/sites-available/quantmesh > /dev/null
server {
    listen 80;
    server_name api.dhanrajgupta.xyz;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOT

sudo ln -sf /etc/nginx/sites-available/quantmesh /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# 8. Configure UFW Firewall Rules
echo "--> [8/8] Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 4000/tcp
echo "y" | sudo ufw enable 2>/dev/null || true

echo "=================================================="
echo " SUCCESS: QuantMesh Orchestrator is LIVE on EC2!"
echo " Reverse Proxy: http://localhost:4000 -> Port 80"
echo "=================================================="
