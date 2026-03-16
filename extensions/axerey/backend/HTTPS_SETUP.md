# HTTPS Setup Guide

This guide explains how to enable HTTPS for the Axerey backend server.

## Difficulty: **Easy** ⭐⭐

The server now supports HTTPS with minimal configuration changes.

## Quick Start (Development)

### Option 1: Self-Signed Certificate (Fastest)

1. **Generate a self-signed certificate:**

   **Windows (PowerShell):**
   ```powershell
   cd backend
   .\scripts\generate-dev-cert.ps1
   ```

   **Linux/Mac/WSL:**
   ```bash
   cd backend
   chmod +x scripts/generate-dev-cert.sh
   ./scripts/generate-dev-cert.sh
   ```

2. **Enable HTTPS in your `.env` file:**
   ```env
   USE_HTTPS=true
   SSL_CERT_PATH=./certs/cert.pem
   SSL_KEY_PATH=./certs/key.pem
   ```

3. **Start the server:**
   ```bash
   npm run dev
   ```

4. **Access the API:**
   - Navigate to `https://localhost:3122/api/health`
   - Accept the browser security warning (self-signed cert)

### Option 2: Using mkcert (Recommended for Development)

`mkcert` creates locally-trusted certificates that browsers accept automatically:

1. **Install mkcert:**
   ```bash
   # Windows (with Chocolatey)
   choco install mkcert
   
   # Mac
   brew install mkcert
   
   # Linux
   # See: https://github.com/FiloSottile/mkcert#linux
   ```

2. **Create local CA and certificate:**
   ```bash
   cd backend
   mkcert -install
   mkdir -p certs
   mkcert -key-file certs/key.pem -cert-file certs/cert.pem localhost 127.0.0.1 ::1
   ```

3. **Enable HTTPS in `.env`:**
   ```env
   USE_HTTPS=true
   ```

4. **Start the server** - no browser warnings!

## Production Setup

### Using Cloudflare Origin Certificates (Recommended if using Cloudflare)

If you're using Cloudflare for DNS/CDN, **Cloudflare Origin Certificates** are the easiest option:

1. **Generate Origin Certificate in Cloudflare Dashboard:**
   - Go to: **SSL/TLS** → **Origin Server** → **Create Certificate**
   - Select:
     - **Private key type:** RSA (2048) or ECDSA (P-256)
     - **Hostnames:** `yourdomain.com`, `*.yourdomain.com` (for subdomains)
     - **Validity:** 15 years (recommended)
   - Click **Create**

2. **Download the certificate:**
   - Copy the **Origin Certificate** (the `.pem` file)
   - Copy the **Private Key** (keep this secret!)

3. **Save the files:**
   ```bash
   cd backend
   mkdir -p certs
   # Paste the certificate into certs/cert.pem
   # Paste the private key into certs/key.pem
   ```

4. **Configure your server:**
   ```env
   USE_HTTPS=true
   SSL_CERT_PATH=./certs/cert.pem
   SSL_KEY_PATH=./certs/key.pem
   ```

5. **Configure Cloudflare SSL/TLS mode:**
   - Go to: **SSL/TLS** → **Overview**
   - Set to: **Full (strict)** (recommended) or **Full**
   - This ensures Cloudflare validates your origin certificate

**Important Notes:**
- ✅ Cloudflare Origin Certificates are **only trusted by Cloudflare**, not browsers
- ✅ This is perfect when Cloudflare proxies your traffic (orange cloud)
- ✅ Browsers connect to Cloudflare (which has a valid cert), Cloudflare connects to your origin (using the origin cert)
- ✅ If accessing your server directly (bypassing Cloudflare), you'll get a browser warning

**For Direct Access (without Cloudflare proxy):**
If you need direct HTTPS access that browsers trust, use Let's Encrypt instead (see below).

### Using Let's Encrypt (Free SSL)

1. **Install Certbot:**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install certbot
   
   # Or use Docker
   docker run -it --rm -v /etc/letsencrypt:/etc/letsencrypt certbot/certbot certonly --standalone
   ```

2. **Obtain certificate:**
   ```bash
   sudo certbot certonly --standalone -d yourdomain.com
   ```

3. **Configure environment:**
   ```env
   USE_HTTPS=true
   SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
   SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
   ```

4. **Auto-renewal (crontab):**
   ```bash
   0 0 * * * certbot renew --quiet && systemctl reload your-app
   ```

### Using Reverse Proxy (Nginx/Caddy)

**Nginx Example:**
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3122;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Caddy (Automatic HTTPS):**
```caddy
yourdomain.com {
    reverse_proxy localhost:3122
}
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `USE_HTTPS` | `false` | Enable HTTPS (set to `true`) |
| `SSL_CERT_PATH` | `./certs/cert.pem` | Path to SSL certificate |
| `SSL_KEY_PATH` | `./certs/key.pem` | Path to SSL private key |
| `NODE_ENV` | `development` | When set to `production`, HTTPS is auto-enabled |

### Automatic HTTPS in Production

If `NODE_ENV=production`, HTTPS is automatically enabled (unless `USE_HTTPS=false` is explicitly set).

## What Changed

The server now:
- ✅ Supports both HTTP and HTTPS
- ✅ Automatically updates CORS origins based on protocol
- ✅ Configures Socket.IO for WSS (WebSocket Secure) when HTTPS is enabled
- ✅ Falls back to HTTP if certificates are missing (with warning)
- ✅ Works seamlessly with existing code

## Troubleshooting

### Certificate Not Found
```
⚠️  HTTPS certificate not found, falling back to HTTP
```
**Solution:** Generate certificates using the scripts above, or set `USE_HTTPS=false`

### Browser Security Warning
**For self-signed certs:** This is expected. Click "Advanced" → "Proceed to localhost"

**For mkcert:** Should work without warnings. If not, run `mkcert -install`

### Port Already in Use
Change the port in `server.ts` or set `PORT` environment variable.

### CORS Errors
Make sure your frontend is also using HTTPS if the backend is:
```env
FRONTEND_URL=https://localhost:5173
```

## Security Notes

- 🔒 Self-signed certificates are **NOT secure** for production
- 🔒 Always use trusted certificates (Let's Encrypt, commercial CA) in production
- 🔒 Keep private keys secure and never commit them to git
- 🔒 Use strong cipher suites in production (Node.js defaults are good)

## Next Steps

1. Generate certificates for your environment
2. Set `USE_HTTPS=true` in your `.env`
3. Update frontend URLs to use `https://`
4. Test the API at `https://localhost:3122/api/health`

That's it! Your server is now HTTPS-ready. 🎉

