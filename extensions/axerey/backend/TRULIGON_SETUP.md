# Truligon Architecture Setup Guide

This guide explains how to set up Axerey to work with your Truligon infrastructure.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Cloudflare                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ truligon.com │  │ ar.truligon  │  │ ut.truligon   │ │
│  │  (Main App)  │  │  (Axerey)    │  │  (User Sync)  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬────────┘ │
│         │                  │                  │          │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          │  Cloudflare Tunnel                  │
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼─────────┐
│         │                  │                  │          │
│  ┌──────▼──────┐  ┌────────▼──────┐  ┌───────▼──────┐  │
│  │  Port 443   │  │  Port 3122    │  │  (External)  │  │
│  │  (truligon) │  │  (Axerey)     │  │              │  │
│  └─────────────┘  └───────────────┘  └──────────────┘  │
│                                                          │
│              Your Local Server                           │
└──────────────────────────────────────────────────────────┘
```

## Components

1. **truligon.com** - Main application (port 443, Cloudflare Tunnel)
2. **ar.truligon.com** - Axerey backend (port 3122, this project)
3. **ut.truligon.com** - User sync source (syncs users to Axerey)

## Setup Steps

### 1. Check Your Existing Certificate

**First, check if your existing certificate already covers subdomains:**

```bash
# Check what hostnames are in your certificate
node scripts/check-cert-hosts.js

# Or check manually
openssl x509 -in certs/cert.pem -text -noout | grep "DNS:"
```

**If your certificate includes `*.truligon.com` (wildcard):**
- ✅ **You can reuse the same certificate!** 
- Just copy the certificate files to Axerey's `backend/certs/` directory
- No need to generate a new one

**If your certificate only includes `truligon.com` (no wildcard):**
- You'll need to create a new certificate with subdomain support
- Or add subdomains to your existing certificate in Cloudflare dashboard

### 2. Generate New Certificate (Only if needed)

If you need a new certificate, it will include:
- `truligon.com` (main domain)
- `*.truligon.com` (wildcard for all subdomains)
- `ar.truligon.com` (Axerey subdomain)
- `ut.truligon.com` (user sync subdomain)

**Using the automated script:**

```bash
cd backend

# Set environment variables
$env:CLOUDFLARE_API_TOKEN="your-api-token"
$env:DOMAIN="truligon.com"

# Generate certificate
npm run generate-cloudflare-cert
```

Or manually:

```bash
# TypeScript version
npx ts-node scripts/generate-cloudflare-cert.ts

# JavaScript version (no compilation)
node scripts/generate-cloudflare-cert.js
```

This will create:
- `backend/certs/cert.pem` - Origin certificate
- `backend/certs/key.pem` - Private key

**Or reuse existing certificate:**

If you already have a certificate with wildcard support, just copy it:

```bash
# Copy from truligon project (adjust path as needed)
cp ../truligon/certs/cert.pem backend/certs/cert.pem
cp ../truligon/certs/key.pem backend/certs/key.pem
```

### 3. Configure Environment Variables

Create `backend/.env`:

```env
# Server Configuration
PORT=3122
NODE_ENV=production
FRONTEND_URL=https://ar.truligon.com

# HTTPS Configuration
USE_HTTPS=true
SSL_CERT_PATH=./certs/cert.pem
SSL_KEY_PATH=./certs/key.pem

# Domain Configuration
AXEREY_SUBDOMAIN=ar.truligon.com
SYNC_SOURCE_DOMAIN=ut.truligon.com

# User Sync (for truligon.com to sync users)
SYNC_SECRET=your-super-secret-sync-key-here

# Cloudflare API
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token-here
CLOUDFLARE_DOMAIN=truligon.com

# Database
PCM_DB=./pcm.db

# Ollama (if using)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=qwen2.5:1.5b
```

### 4. Set Up Cloudflare Tunnel for Axerey

Similar to your truligon.com setup, create a tunnel for `ar.truligon.com`:

**Option A: Use existing tunnel (if it supports multiple routes)**

```bash
# Add route to existing tunnel
cloudflared tunnel route dns truligon ar.truligon.com
```

**Option B: Create separate tunnel for Axerey**

```bash
# Create new tunnel
cloudflared tunnel create axerey

# Configure tunnel (edit config.yml)
cloudflared tunnel route dns axerey ar.truligon.com
```

**Tunnel Configuration (`config.yml`):**

```yaml
tunnel: axerey
credentials-file: C:\Users\p5_pa\axerey\.cloudflared\<tunnel-id>.json

ingress:
  - hostname: ar.truligon.com
    service: https://localhost:3122
    originRequest:
      noHappyEyeballs: true
      httpHostHeader: ar.truligon.com
  - service: http_status:404
```

### 5. Configure DNS in Cloudflare

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select **truligon.com**
3. Go to **DNS** → **Records**
4. Add/Update records:
   - **Type:** CNAME
   - **Name:** `ar`
   - **Target:** `<your-tunnel-id>.cfargotunnel.com`
   - **Proxy:** ON (orange cloud)

### 6. Configure SSL/TLS Mode

1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to **Full (strict)**
3. This ensures Cloudflare validates your origin certificate

### 7. Set Up User Sync from truligon.com

In your truligon.com application, add code to sync users to Axerey:

**Example (Node.js):**

```javascript
const axios = require('axios');

async function syncUserToAxerey(userData) {
  const syncSecret = process.env.AXEREY_SYNC_SECRET;
  const axereyUrl = 'https://ar.truligon.com/api/sync/user';
  
  try {
    const response = await axios.post(axereyUrl, {
      externalId: userData.id,
      username: userData.username,
      email: userData.email,
      role: userData.role || 'user',
      isActive: userData.isActive !== false,
      metadata: userData.metadata || {}
    }, {
      headers: {
        'Authorization': `Bearer ${syncSecret}`,
        'Content-Type': 'application/json',
        'X-Sync-Source': 'truligon.com'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to sync user to Axerey:', error.response?.data || error.message);
    throw error;
  }
}

// Call when user is created/updated in truligon.com
syncUserToAxerey({
  id: user.id,
  username: user.username,
  email: user.email,
  role: 'user',
  isActive: true
});
```

**Example (PHP):**

```php
function syncUserToAxerey($userData) {
    $syncSecret = getenv('AXEREY_SYNC_SECRET');
    $axereyUrl = 'https://ar.truligon.com/api/sync/user';
    
    $ch = curl_init($axereyUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $syncSecret,
        'X-Sync-Source: truligon.com'
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'externalId' => $userData['id'],
        'username' => $userData['username'],
        'email' => $userData['email'],
        'role' => $userData['role'] ?? 'user',
        'isActive' => $userData['isActive'] ?? true
    ]));
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return json_decode($response, true);
}
```

### 8. Start Axerey Server

```bash
cd backend

# Development
npm run dev

# Production
npm run build
npm start
```

The server will:
- Start on `https://localhost:3122` with your Cloudflare origin certificate
- Be accessible via Cloudflare Tunnel at `https://ar.truligon.com`
- Accept user sync requests from `truligon.com`

### 9. Test the Setup

**Test HTTPS locally:**
```bash
curl -k https://localhost:3122/api/health
```

**Test via Cloudflare:**
```bash
curl https://ar.truligon.com/api/health
```

**Test user sync:**
```bash
curl -X POST https://ar.truligon.com/api/sync/user \
  -H "Authorization: Bearer your-sync-secret" \
  -H "Content-Type: application/json" \
  -H "X-Sync-Source: truligon.com" \
  -d '{
    "externalId": "test_user_1",
    "username": "testuser",
    "email": "test@truligon.com",
    "role": "user"
  }'
```

## Port Configuration

- **truligon.com**: Port 443 (main application)
- **ar.truligon.com**: Port 3122 (Axerey backend)
- Both use the same Cloudflare origin certificate
- Both accessible via Cloudflare Tunnel

## Security Notes

1. ✅ **Same certificate works for both** - The wildcard `*.truligon.com` covers all subdomains
2. ✅ **Cloudflare Tunnel** - No need to expose ports directly to internet
3. ✅ **Origin certificates** - Only trusted by Cloudflare (perfect for tunnel setup)
4. ✅ **Sync authentication** - Uses shared secret key (`SYNC_SECRET`)

## Troubleshooting

### Certificate Not Working
- Verify certificate includes `ar.truligon.com` and `*.truligon.com`
- Check SSL/TLS mode is set to **Full (strict)** in Cloudflare
- Ensure certificate files are in `backend/certs/`

### Tunnel Connection Issues
- Verify tunnel is running: `cloudflared tunnel list`
- Check tunnel configuration points to `https://localhost:3122`
- Ensure DNS record points to correct tunnel endpoint

### Sync Not Working
- Verify `SYNC_SECRET` matches in both truligon.com and Axerey
- Check `Authorization: Bearer <secret>` header is correct
- Ensure `X-Sync-Source` header is set (optional but recommended)

## Next Steps

1. ✅ Generate Cloudflare origin certificate
2. ✅ Configure environment variables
3. ✅ Set up Cloudflare Tunnel for `ar.truligon.com`
4. ✅ Configure DNS in Cloudflare
5. ✅ Set SSL/TLS mode to Full (strict)
6. ✅ Implement user sync in truligon.com
7. ✅ Test the integration
8. ✅ Deploy!

Your Axerey backend is now integrated with your Truligon infrastructure! 🎉

