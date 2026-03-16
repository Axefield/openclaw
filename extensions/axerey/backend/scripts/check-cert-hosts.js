#!/usr/bin/env node
/**
 * Check what hostnames are included in your Cloudflare Origin Certificate
 * 
 * Usage:
 *   node scripts/check-cert-hosts.js [path-to-cert.pem]
 * 
 * Default: ./certs/cert.pem
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const certPath = process.argv[2] || path.join(process.cwd(), 'certs', 'cert.pem')

if (!fs.existsSync(certPath)) {
  console.error(`❌ Certificate not found: ${certPath}`)
  console.error('')
  console.error('Usage: node scripts/check-cert-hosts.js [path-to-cert.pem]')
  process.exit(1)
}

try {
  console.log('🔍 Checking certificate hostnames...')
  console.log(`   Certificate: ${certPath}`)
  console.log('')
  
  // Read certificate
  const certContent = fs.readFileSync(certPath, 'utf8')
  
  // Extract hostnames from certificate using OpenSSL
  // Check if openssl is available
  try {
    const opensslOutput = execSync(
      `openssl x509 -in "${certPath}" -text -noout`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    )
    
    // Look for Subject Alternative Name (SAN) entries
    const sanMatch = opensslOutput.match(/Subject Alternative Name:\s*(.*?)(?=\n[A-Z]|\n\n|$)/s)
    
    if (sanMatch) {
      const sanText = sanMatch[1]
      const dnsMatches = sanText.matchAll(/DNS:([^\s,]+)/g)
      
      const hostnames = []
      for (const match of dnsMatches) {
        hostnames.push(match[1])
      }
      
      if (hostnames.length > 0) {
        console.log('✅ Hostnames included in certificate:')
        hostnames.forEach(host => {
          const isWildcard = host.startsWith('*.')
          const icon = isWildcard ? '🌐' : '📍'
          console.log(`   ${icon} ${host}`)
        })
        console.log('')
        
        // Check if it covers ar.truligon.com
        const coversAr = hostnames.some(host => {
          if (host === '*.truligon.com' || host === 'ar.truligon.com') return true
          if (host.startsWith('*.')) {
            const baseDomain = host.substring(2) // Remove '*.'
            return 'ar.truligon.com'.endsWith('.' + baseDomain) || 'ar.truligon.com' === baseDomain
          }
          return false
        })
        
        if (coversAr) {
          console.log('✅ This certificate will work for ar.truligon.com!')
          console.log('   You can use the same certificate files for both services.')
        } else {
          console.log('⚠️  This certificate does NOT include ar.truligon.com')
          console.log('   You need to create a new certificate with:')
          console.log('   - *.truligon.com (wildcard)')
          console.log('   - ar.truligon.com (specific)')
        }
      } else {
        console.log('⚠️  No hostnames found in certificate')
      }
    } else {
      // Try to find CN (Common Name) as fallback
      const cnMatch = opensslOutput.match(/Subject:.*CN\s*=\s*([^\s,]+)/)
      if (cnMatch) {
        console.log(`📍 Common Name: ${cnMatch[1]}`)
        console.log('')
        console.log('⚠️  Certificate only has Common Name, no Subject Alternative Names')
        console.log('   Modern certificates should include SAN entries.')
      } else {
        console.log('⚠️  Could not parse certificate hostnames')
      }
    }
    
    // Show expiration
    const expiryMatch = opensslOutput.match(/Not After\s*:\s*(.+)/)
    if (expiryMatch) {
      console.log('')
      console.log(`📅 Expires: ${expiryMatch[1]}`)
    }
    
  } catch (error) {
    // OpenSSL not available or error - try manual parsing
    console.log('⚠️  OpenSSL not available, trying manual parsing...')
    
    // Simple check for common patterns in PEM
    if (certContent.includes('*.truligon.com') || certContent.includes('ar.truligon.com')) {
      console.log('✅ Certificate appears to include truligon.com subdomains')
    } else if (certContent.includes('truligon.com')) {
      console.log('📍 Certificate includes truligon.com')
      console.log('⚠️  May not include subdomains - check with Cloudflare dashboard')
    }
  }
  
} catch (error) {
  console.error('❌ Error reading certificate:', error.message)
  process.exit(1)
}

console.log('')
console.log('💡 Tip: You can check your certificate in Cloudflare Dashboard:')
console.log('   SSL/TLS → Origin Server → View your certificates')

