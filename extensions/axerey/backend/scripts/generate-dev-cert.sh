#!/bin/bash
# Generate self-signed SSL certificate for development

CERT_DIR="./certs"
mkdir -p "$CERT_DIR"

echo "🔐 Generating self-signed SSL certificate for development..."
echo "⚠️  This certificate is for DEVELOPMENT ONLY - browsers will show a security warning"

openssl req -x509 -newkey rsa:4096 -nodes \
  -keyout "$CERT_DIR/key.pem" \
  -out "$CERT_DIR/cert.pem" \
  -days 365 \
  -subj "/C=US/ST=State/L=City/O=Development/CN=localhost"

echo "✅ Certificate generated:"
echo "   Cert: $CERT_DIR/cert.pem"
echo "   Key:  $CERT_DIR/key.pem"
echo ""
echo "To use HTTPS, set in your .env file:"
echo "   USE_HTTPS=true"
echo ""
echo "Note: You'll need to accept the self-signed certificate in your browser."

