#!/bin/bash
set -e

echo "=================================================="
echo "   QuantMesh x402 Orchestrator EC2 Deployment"
echo "=================================================="

# 1. System Updates & Core Packages
echo "--> [1/7] Updating apt packages..."
sudo apt-get update -y
sudo apt-get install -y curl git nginx certbot python3-certbot-nginx ufw

# 2. Install Node.js 20 LTS & PM2
echo "--> [2/7] Installing Node.js 20 LTS & PM2..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# 3. Clone / Pull Repository
REPO_DIR="$HOME/quantmesh-x402"
if [ ! -d "$REPO_DIR" ]; then
    echo "--> [3/7] Cloning quantmesh-x402 repository..."
    git clone https://github.com/dhanrajgupta2736/quantmesh-x402.git "$REPO_DIR"
else
    echo "--> [3/7] Updating existing repository..."
    cd "$REPO_DIR"
    git pull origin main
fi

# 4. Setup Orchestrator Dependencies & Environment
cd "$REPO_DIR/orchestrator"
echo "--> [4/7] Installing npm dependencies..."
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
# ROUTER_MNEMONIC=your twenty five word algorand mnemonic phrase here
# HF_API_TOKEN=your_huggingface_token_here
WORKER_A_URL=http://localhost:5001/agent/sentiment
WORKER_B_URL=http://localhost:5002/agent/onchain
WORKER_C_URL=http://localhost:5002/agent/ta
WORKER_D_URL=http://localhost:5001/agent/fusion
USDC_TESTNET_ASA_ID=10458941
FACILITATOR_URL=https://facilitator.goplausible.xyz
EOT
fi

# 5. Start Service with PM2 Process Manager
echo "--> [5/7] Starting orchestrator service via PM2..."
pm2 delete orchestrator 2>/dev/null || true
pm2 start "npm run dev" --name "orchestrator"
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME 2>/dev/null || true

# 6. Configure Nginx Reverse Proxy (Port 80 -> 4000)
echo "--> [6/7] Configuring Nginx reverse proxy..."
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

# 7. Configure UFW Firewall Rules
echo "--> [7/7] Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 4000/tcp
echo "y" | sudo ufw enable 2>/dev/null || true

echo "=================================================="
echo " SUCCESS: QuantMesh Orchestrator is LIVE on EC2!"
echo " Reverse Proxy: http://localhost:4000 -> Port 80"
echo "=================================================="
