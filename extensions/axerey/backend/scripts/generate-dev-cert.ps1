# Generate self-signed SSL certificate for development (PowerShell)
# Run this script from the backend directory

$certDir = ".\certs"
if (-not (Test-Path $certDir)) {
    New-Item -ItemType Directory -Path $certDir | Out-Null
}

Write-Host "🔐 Generating self-signed SSL certificate for development..." -ForegroundColor Cyan
Write-Host "⚠️  This certificate is for DEVELOPMENT ONLY - browsers will show a security warning" -ForegroundColor Yellow

# Generate certificate using OpenSSL (if available) or PowerShell
if (Get-Command openssl -ErrorAction SilentlyContinue) {
    openssl req -x509 -newkey rsa:4096 -nodes `
        -keyout "$certDir\key.pem" `
        -out "$certDir\cert.pem" `
        -days 365 `
        -subj "/C=US/ST=State/L=City/O=Development/CN=localhost"
    
    Write-Host "✅ Certificate generated using OpenSSL" -ForegroundColor Green
} else {
    # Use PowerShell's New-SelfSignedCertificate (Windows only)
    Write-Host "OpenSSL not found, using PowerShell certificate generation..." -ForegroundColor Yellow
    
    $cert = New-SelfSignedCertificate `
        -DnsName "localhost" `
        -CertStoreLocation "cert:\LocalMachine\My" `
        -KeyUsage DigitalSignature, KeyEncipherment `
        -Type SSLServerCertificate `
        -FriendlyName "Axerey Dev Certificate"
    
    # Export certificate and key
    $certPath = "$certDir\cert.pem"
    $keyPath = "$certDir\key.pem"
    
    # Export certificate to PEM
    $cert | Export-Certificate -FilePath $certPath -Type CERT
    
    # Export private key (requires additional steps - simplified here)
    Write-Host "⚠️  PowerShell certificate export is complex." -ForegroundColor Yellow
    Write-Host "   Please install OpenSSL for Windows or use WSL:" -ForegroundColor Yellow
    Write-Host "   https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Or use the bash script: ./scripts/generate-dev-cert.sh" -ForegroundColor Cyan
    
    # Clean up
    Remove-Item "cert:\LocalMachine\My\$($cert.Thumbprint)" -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Certificate location:" -ForegroundColor Green
Write-Host "   Cert: $certDir\cert.pem"
Write-Host "   Key:  $certDir\key.pem"
Write-Host ""
Write-Host "To use HTTPS, set in your .env file:" -ForegroundColor Cyan
Write-Host "   USE_HTTPS=true"
Write-Host ""
Write-Host "Note: You'll need to accept the self-signed certificate in your browser." -ForegroundColor Yellow

