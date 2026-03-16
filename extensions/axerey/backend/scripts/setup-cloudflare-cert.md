# Cloudflare Origin Certificate Setup

## 🚀 Quick Start: Automated (Recommended)

### Option 1: Node.js Script (Easiest)

Use the automated script to generate certificates via Cloudflare API:

### Option A: TypeScript Version

```bash
# Set environment variables
export CLOUDFLARE_API_TOKEN="your-api-token"
export DOMAIN="yourdomain.com"

# Run the script
cd backend
npx ts-node scripts/generate-cloudflare-cert.ts
```

### Option B: JavaScript Version (No compilation needed)

```bash
# Set environment variables
export CLOUDFLARE_API_TOKEN="your-api-token"
export DOMAIN="yourdomain.com"

# Run the script
cd backend
node scripts/generate-cloudflare-cert.js
```

### Option 2: Cloudflare CLI (Wrangler)

If you prefer using the official Cloudflare CLI:

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Generate origin certificate
wrangler tail --format pretty
# Note: Wrangler doesn't directly generate origin certs, but you can use it
# to manage other Cloudflare resources. For certs, use the API scripts above.
```

**Note:** The Cloudflare CLI (Wrangler) is primarily for Workers and Pages. For Origin Certificates, the API scripts above are the recommended approach.

### Getting Your API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use **Edit zone DNS** template or create custom token with:
   - **Permissions:** `SSL:Edit`, `Zone:Read`
   - **Zone Resources:** Include your domain
4. Copy the token and set as `CLOUDFLARE_API_TOKEN`

### Environment Variables

Add to your `.env` file:

```env
CLOUDFLARE_API_TOKEN=your-api-token-here
DOMAIN=yourdomain.com
# Optional - will auto-detect if not provided
CLOUDFLARE_ZONE_ID=your-zone-id
```

---

## 📋 Manual Setup (Alternative)

### 1. Generate Certificate in Cloudflare Dashboard

1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain
3. Navigate to **SSL/TLS** → **Origin Server**
4. Click **Create Certificate**

### 2. Configure Certificate Settings

**Recommended Settings:**
- **Private key type:** `RSA (2048)` or `ECDSA (P-256)`
- **Hostnames:** 
  - `yourdomain.com`
  - `*.yourdomain.com` (for subdomains)
- **Validity:** `15 years` (longest option)
- **Certificate Authority:** `Cloudflare Origin CA`

### 3. Download Certificate Files

After creating, you'll see:
- **Origin Certificate** (the certificate file)
- **Private Key** (keep this secret!)

### 4. Save Files to Your Server

**Option A: Manual Copy-Paste**

```bash
cd backend
mkdir -p certs

# Create cert.pem (paste the Origin Certificate)
nano certs/cert.pem
# Paste certificate content, save (Ctrl+X, Y, Enter)

# Create key.pem (paste the Private Key)
nano certs/key.pem
# Paste private key content, save
```

**Option B: Using Cloudflare API (Advanced)**

```bash
# Install Cloudflare CLI (optional)
npm install -g cloudflare-cli

# Or use curl to fetch via API
# (requires API token with SSL:Edit permissions)
```

### 5. Set File Permissions (Linux/Mac)

```bash
chmod 600 certs/key.pem  # Private key should be read-only by owner
chmod 644 certs/cert.pem # Certificate can be readable
```

### 6. Configure Environment

Add to your `.env` file:

```env
USE_HTTPS=true
SSL_CERT_PATH=./certs/cert.pem
SSL_KEY_PATH=./certs/key.pem
```

### 7. Configure Cloudflare SSL Mode

1. Go to **SSL/TLS** → **Overview**
2. Set SSL/TLS encryption mode to:
   - **Full (strict)** - Recommended (validates your origin cert)
   - **Full** - Works but less secure (doesn't validate cert)

### 8. Test Your Setup

```bash
# Start your server
npm run dev

# Test from Cloudflare (should work)
curl https://yourdomain.com/api/health

# Test direct access (will show warning - this is normal)
curl -k https://your-server-ip:3122/api/health
```

## File Structure

```
backend/
├── certs/
│   ├── cert.pem    # Cloudflare Origin Certificate
│   └── key.pem     # Private Key (keep secret!)
├── .env            # Configuration
└── src/
    └── server.ts   # Server code
```

## Important Security Notes

⚠️ **Never commit certificates to git!**

Add to `.gitignore`:
```
backend/certs/*.pem
backend/certs/*.key
```

✅ **Cloudflare Origin Certificates:**
- Are **only trusted by Cloudflare** (not browsers)
- Perfect for origin servers behind Cloudflare proxy
- Free and easy to manage
- Long validity (up to 15 years)

❌ **Not suitable for:**
- Direct browser access (bypassing Cloudflare)
- Public API endpoints accessed directly
- Internal services not behind Cloudflare

## Troubleshooting

### Certificate Not Working

1. **Check file paths** in `.env`
2. **Verify certificate format** (should be PEM)
3. **Check Cloudflare SSL mode** (should be Full or Full Strict)
4. **Verify DNS** (orange cloud should be enabled)

### Browser Shows Warning

If accessing directly (not through Cloudflare):
- This is **normal** - Cloudflare Origin Certs aren't trusted by browsers
- Access through your domain (via Cloudflare) instead
- Or use Let's Encrypt for direct access

### Cloudflare Shows SSL Error

1. Check SSL/TLS mode is **Full** or **Full Strict**
2. Verify certificate includes your domain
3. Check certificate hasn't expired
4. Ensure private key matches certificate

## Renewal

Cloudflare Origin Certificates last up to 15 years, but you can:
- Generate a new one anytime in the dashboard
- Replace the files and restart your server
- No downtime if done correctly

## Alternative: Let's Encrypt

If you need browser-trusted certificates (for direct access):
- Use Let's Encrypt instead
- See `HTTPS_SETUP.md` for Let's Encrypt instructions

