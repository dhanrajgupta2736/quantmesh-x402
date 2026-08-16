# QuantMesh x402 — Render Free Tier Deployment Guide

This guide walks you through migrating the QuantMesh x402 backend from AWS EC2 to **Render Free Tier (100% Lifetime Free)** when you are ready after the hackathon results.

---

## Pre-requisites
- A free account on [render.com](https://render.com).
- GitHub repository access (`dhanrajgupta2736/quantmesh-x402`).
- Access to your DNS management console for `dhanrajgupta.xyz` (e.g. Cloudflare / Namecheap / GoDaddy).

---

## Step 1: Push the Prepared Deployment Files to GitHub

Run these commands in your local project root:
```bash
git add Dockerfile supervisord.conf .dockerignore render.yaml RENDER_DEPLOY_GUIDE.md
git commit -m "Add unified Dockerfile and Render configuration for free lifetime hosting"
git push origin main
```

---

## Step 2: Create Free Web Service on Render

### Option A: Using Blueprint (Recommended - 1 Click)
1. Go to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** $\rightarrow$ **Blueprint**.
3. Connect your GitHub repository `quantmesh-x402`.
4. Render will automatically detect `render.yaml` and configure all settings and environment variables.
5. In the environment variables prompt, enter your secret values:
   - `ROUTER_MNEMONIC`: `your 25 word Algorand router mnemonic`
   - `HF_API_TOKEN`: `your HuggingFace token` (or dummy if using fallback)
6. Click **Apply**.

---

### Option B: Manual Web Service Setup
1. Click **New +** $\rightarrow$ **Web Service**.
2. Connect `quantmesh-x402`.
3. Configure settings:
   - **Name:** `quantmesh-backend`
   - **Language / Runtime:** `Docker`
   - **Instance Type:** `Free` (512 MB RAM / 0.1 CPU)
   - **Health Check Path:** `/api/v1/health`
4. Under **Environment Variables**, add:
   - `PORT` = `4000`
   - `ALGORAND_NETWORK` = `testnet`
   - `ALGOD_SERVER` = `https://testnet-api.algonode.cloud`
   - `ALGOD_PORT` = `443`
   - `ROUTER_ADDRESS` = `4DTSNS35EP24IFWIGXSG5NSD3GDDTPHNVGEXSHG67JDEHUHUNFR3KJGPO4`
   - `ROUTER_MNEMONIC` = `your_mnemonic_here`
   - `HF_API_TOKEN` = `your_hf_token_here`
   - `USDC_TESTNET_ASA_ID` = `10458941`
   - `FACILITATOR_URL` = `https://facilitator.goplausible.xyz`
   - `WORKER_A_URL` = `http://localhost:5001/agent/sentiment`
   - `WORKER_B_URL` = `http://localhost:5002/agent/onchain`
   - `WORKER_C_URL` = `http://localhost:5002/agent/ta`
   - `WORKER_D_URL` = `http://localhost:5001/agent/fusion`
   - `WORKER_E_URL` = `http://localhost:5003/agent/regime`
5. Click **Create Web Service**.

---

## Step 3: Verify the Deployment
Once the build completes (takes ~2 minutes):
1. Render gives you a default URL like `https://quantmesh-backend.onrender.com`.
2. Test the health check endpoint:
   ```bash
   curl https://quantmesh-backend.onrender.com/api/v1/health
   ```
   You should receive: `{"status": "healthy", ...}` with all 5 worker statuses online.

---

## Step 4: Map Custom Domain (`api.dhanrajgupta.xyz`)

1. In the Render Dashboard for your service, click **Settings** $\rightarrow$ **Custom Domains**.
2. Click **Add Custom Domain** and enter: `api.dhanrajgupta.xyz`.
3. In your DNS provider (Cloudflare / Namecheap / GoDaddy):
   - **Delete/Disable** the old `A` record pointing to the AWS EC2 IP address.
   - **Add a `CNAME` record**:
     - **Name / Host:** `api`
     - **Target / Value:** `quantmesh-backend.onrender.com` (or the CNAME target provided by Render)
     - **Proxy status:** DNS Only (or Proxied if on Cloudflare).
4. Render will automatically issue and renew a free **Let's Encrypt SSL/TLS Certificate**.

---

## Step 5: Safely Terminate AWS EC2
Once `https://api.dhanrajgupta.xyz/api/v1/health` resolves and returns healthy:
1. Open the [AWS EC2 Console](https://console.aws.amazon.com/ec2/).
2. Select your `quantmesh-x402` EC2 Instance.
3. Click **Instance State** $\rightarrow$ **Terminate Instance**.
4. Check **Elastic IPs** in the left sidebar and release any allocated Elastic IP to avoid idle charges.
5. Your backend is now 100% free for lifetime on Render!
