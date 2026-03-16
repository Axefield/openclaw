# Axerey Integration Plan for Truligon

## Overview
Set up Axerey backend at `ar.truligon.com` that syncs users from `truligon.com` using Cloudflare Tunnel and existing infrastructure.

---

## Phase 1: Certificate Setup (5 minutes)

### Step 1.1: Check Existing Certificate
```bash
# Navigate to your truligon project
cd ../truligon

# Check if certificate includes wildcard
# Option A: Use the check script (if you have it)
node scripts/check-cert-hosts.js

# Option B: Check manually with OpenSSL
openssl x509 -in certs/cert.pem -text -noout | grep "DNS:"
```

**What to look for:**
- ✅ If you see `DNS:*.truligon.com` → **You can reuse the certificate!** Skip to Step 1.3
- ❌ If you only see `DNS:truligon.com` → **You need a new certificate** → Go to Step 1.2

### Step 1.2: Generate New Certificate (Only if needed)
```bash
# In axerey/backend directory
cd c:\Users\p5_pa\axerey\backend

# Set environment variables
$env:CLOUDFLARE_API_TOKEN="your-api-token"
$env:DOMAIN="truligon.com"

# Generate certificate
npm run generate-cloudflare-cert
```

**Result:** Creates `backend/certs/cert.pem` and `backend/certs/key.pem`

### Step 1.3: Copy Certificate Files (If reusing existing)
```bash
# Copy from truligon to axerey
cp ../truligon/certs/cert.pem backend/certs/cert.pem
cp ../truligon/certs/key.pem backend/certs/key.pem
```

---

## Phase 2: Environment Configuration (5 minutes)

### Step 2.1: Create `.env` File
```bash
cd c:\Users\p5_pa\axerey\backend
copy env.example .env
```

### Step 2.2: Edit `.env` File
Open `backend/.env` and set:

```env
# Server
PORT=3122
NODE_ENV=production
FRONTEND_URL=https://ar.truligon.com

# HTTPS (use the certificate you just set up)
USE_HTTPS=true
SSL_CERT_PATH=./certs/cert.pem
SSL_KEY_PATH=./certs/key.pem

# Domain
AXEREY_SUBDOMAIN=ar.truligon.com
SYNC_SOURCE_DOMAIN=truligon.com

# User Sync - IMPORTANT: Set a strong secret
SYNC_SECRET=generate-a-strong-random-secret-here

# Database
PCM_DB=./pcm.db

# Ollama (if using)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=qwen2.5:1.5b
```

**Important:** Generate a strong `SYNC_SECRET` (same one you'll use in truligon.com):
```powershell
# Generate a random secret
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

---

## Phase 3: Cloudflare Tunnel Setup (10 minutes)

### Step 3.1: Check Existing Tunnel
```bash
# See what tunnels you have
cloudflared tunnel list
```

**Decision:**
- **Option A:** Use existing tunnel (if it supports multiple routes)
- **Option B:** Create new tunnel for Axerey (recommended for separation)

### Step 3.2A: Add Route to Existing Tunnel
```bash
# If using existing "truligon" tunnel
cloudflared tunnel route dns truligon ar.truligon.com
```

### Step 3.2B: Create New Tunnel (Recommended)
```bash
# Create new tunnel named "axerey"
cloudflared tunnel create axerey

# Note the tunnel ID that's displayed
# It will look like: 96039733-08c3-4a6b-8111-e62d1392ce2b
```

### Step 3.3: Configure Tunnel
Edit your Cloudflare tunnel config file (usually `~/.cloudflared/config.yml` or in your project):

```yaml
tunnel: axerey  # or "truligon" if using existing
credentials-file: C:\Users\p5_pa\.cloudflared\<tunnel-id>.json

ingress:
  # Axerey backend
  - hostname: ar.truligon.com
    service: https://localhost:3122
    originRequest:
      noHappyEyeballs: true
      httpHostHeader: ar.truligon.com
  
  # Main truligon app (if using same tunnel)
  - hostname: truligon.com
    service: https://localhost:443
    originRequest:
      noHappyEyeballs: true
      httpHostHeader: truligon.com
  
  # Catch-all
  - service: http_status:404
```

### Step 3.4: Route DNS
```bash
# Route ar.truligon.com to your tunnel
cloudflared tunnel route dns axerey ar.truligon.com

# Or if using existing tunnel
cloudflared tunnel route dns truligon ar.truligon.com
```

---

## Phase 4: Cloudflare DNS Configuration (2 minutes)

### Step 4.1: Verify DNS Record
1. Go to https://dash.cloudflare.com
2. Select **truligon.com**
3. Go to **DNS** → **Records**
4. Verify `ar` CNAME record exists:
   - **Type:** CNAME
   - **Name:** `ar`
   - **Target:** `<your-tunnel-id>.cfargotunnel.com`
   - **Proxy:** ON (orange cloud) ✅

### Step 4.2: Set SSL/TLS Mode
1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to **Full (strict)**
3. This ensures Cloudflare validates your origin certificate

---

## Phase 5: Test Axerey Server (5 minutes)

### Step 5.1: Start Axerey Backend
```bash
cd c:\Users\p5_pa\axerey\backend

# Development
npm run dev

# Or production
npm run build
npm start
```

**Expected output:**
```
🌌 Ouranigon API server running on port 3122
🔗 API available at: https://localhost:3122/api
🔒 HTTPS/TLS enabled
```

### Step 5.2: Test Locally
```powershell
# Test HTTPS locally (will show cert warning - that's OK)
curl -k https://localhost:3122/api/health
```

**Expected:** JSON response with status

### Step 5.3: Test via Cloudflare
```powershell
# Test through Cloudflare Tunnel
curl https://ar.truligon.com/api/health
```

**Expected:** JSON response (no cert warning)

### Step 5.4: Test Sync Endpoint
```powershell
# Test user sync (replace SYNC_SECRET with your actual secret)
$secret = "your-sync-secret-here"
$body = @{
    externalId = "test_user_1"
    username = "testuser"
    email = "test@truligon.com"
    role = "user"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://ar.truligon.com/api/sync/user" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $secret"
        "Content-Type" = "application/json"
        "X-Sync-Source" = "truligon.com"
    } `
    -Body $body
```

**Expected:** JSON response with created user

---

## Phase 6: Integrate User Sync in truligon.com (15 minutes)

### Step 6.1: Add Sync Function to truligon.com

**If truligon.com is Node.js:**
```javascript
// Add to your truligon.com codebase
const axios = require('axios');

async function syncUserToAxerey(userData) {
  const syncSecret = process.env.AXEREY_SYNC_SECRET;
  const axereyUrl = 'https://ar.truligon.com/api/sync/user';
  
  try {
    const response = await axios.post(axereyUrl, {
      externalId: userData.id.toString(),
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
    // Don't throw - allow truligon.com to continue even if sync fails
    return null;
  }
}
```

**If truligon.com is PHP:**
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
        'externalId' => (string)$userData['id'],
        'username' => $userData['username'],
        'email' => $userData['email'],
        'role' => $userData['role'] ?? 'user',
        'isActive' => $userData['isActive'] ?? true,
        'metadata' => $userData['metadata'] ?? []
    ]));
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return $httpCode === 200 ? json_decode($response, true) : null;
}
```

### Step 6.2: Add Environment Variable to truligon.com
Add to your truligon.com `.env`:
```env
AXEREY_SYNC_SECRET=your-sync-secret-here  # Same as in Axerey .env
```

### Step 6.3: Call Sync on User Events
Add sync calls in your truligon.com code:

**On user registration:**
```javascript
// After user is created in truligon.com
await syncUserToAxerey({
  id: newUser.id,
  username: newUser.username,
  email: newUser.email,
  role: 'user',
  isActive: true
});
```

**On user update:**
```javascript
// After user is updated in truligon.com
await syncUserToAxerey({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role,
  isActive: user.isActive
});
```

**On user deactivation:**
```javascript
// When user is deleted/deactivated in truligon.com
const response = await axios.post(
  `https://ar.truligon.com/api/sync/user/${user.id}/deactivate`,
  {},
  {
    headers: {
      'Authorization': `Bearer ${process.env.AXEREY_SYNC_SECRET}`,
      'X-Sync-Source': 'truligon.com'
    }
  }
);
```

---

## Phase 7: Final Verification (5 minutes)

### Step 7.1: Verify All Endpoints
```powershell
# 1. Axerey health
curl https://ar.truligon.com/api/health

# 2. Sync health
curl -H "Authorization: Bearer your-secret" https://ar.truligon.com/api/sync/health

# 3. Create test user
# (Use the test command from Phase 5.4)
```

### Step 7.2: Check Logs
- Check Axerey server logs for sync requests
- Check truligon.com logs for sync calls
- Verify no errors

### Step 7.3: Test Full Flow
1. Create a user in truligon.com
2. Verify user appears in Axerey (check database or API)
3. Update user in truligon.com
4. Verify update syncs to Axerey
5. Deactivate user in truligon.com
6. Verify user is deactivated in Axerey

---

## Summary Checklist

- [ ] Phase 1: Certificate set up (reused or generated)
- [ ] Phase 2: Environment variables configured
- [ ] Phase 3: Cloudflare Tunnel configured for ar.truligon.com
- [ ] Phase 4: DNS record created and SSL mode set to Full (strict)
- [ ] Phase 5: Axerey server tested and running
- [ ] Phase 6: User sync integrated in truligon.com
- [ ] Phase 7: Full flow tested and verified

---

## Troubleshooting

**Certificate issues:**
- Verify certificate includes `*.truligon.com` or `ar.truligon.com`
- Check SSL/TLS mode is "Full (strict)" in Cloudflare

**Tunnel issues:**
- Verify tunnel is running: `cloudflared tunnel list`
- Check tunnel config points to `https://localhost:3122`
- Verify DNS record points to correct tunnel endpoint

**Sync issues:**
- Verify `SYNC_SECRET` matches in both applications
- Check Authorization header format: `Bearer <secret>`
- Verify `X-Sync-Source` header is set
- Check Axerey server logs for errors

---

## Estimated Time: ~45 minutes total

- Phase 1: 5 min
- Phase 2: 5 min
- Phase 3: 10 min
- Phase 4: 2 min
- Phase 5: 5 min
- Phase 6: 15 min
- Phase 7: 5 min

---

**You're done!** Axerey is now integrated with your Truligon infrastructure. 🎉

