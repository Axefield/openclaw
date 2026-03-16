#!/usr/bin/env ts-node
/**
 * Cloudflare Origin Certificate Generator
 * 
 * Automatically generates Cloudflare Origin Certificates using the Cloudflare API
 * 
 * Usage:
 *   ts-node scripts/generate-cloudflare-cert.ts
 * 
 * Required Environment Variables:
 *   CLOUDFLARE_API_TOKEN - Your Cloudflare API token with SSL:Edit permissions
 *   CLOUDFLARE_ZONE_ID  - Your Cloudflare Zone ID (optional, will auto-detect from domain)
 *   DOMAIN              - Your domain name (e.g., example.com)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import fetch from 'node-fetch'

interface CloudflareOriginCertRequest {
  type: 'origin-rsa' | 'origin-ecc'
  hosts: string[]
  requested_validity: number
  csr?: string
}

interface CloudflareOriginCertResponse {
  success: boolean
  result: {
    id: string
    certificate: string
    private_key: string
    issuer: string
    serial_number: string
    signature: string
    status: string
    uploaded_on: string
    expires_on: string
    fingerprint_sha256: string
  }
  errors?: Array<{ code: number; message: string }>
}

interface CloudflareZoneResponse {
  success: boolean
  result: Array<{
    id: string
    name: string
  }>
}

class CloudflareCertGenerator {
  private apiToken: string
  private zoneId?: string
  private domain: string
  private certDir: string

  constructor() {
    // Load environment variables
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN || ''
    this.zoneId = process.env.CLOUDFLARE_ZONE_ID
    this.domain = process.env.DOMAIN || process.env.CLOUDFLARE_DOMAIN || ''
    this.certDir = join(process.cwd(), 'certs')

    // Validate required variables
    if (!this.apiToken) {
      console.error('❌ Error: CLOUDFLARE_API_TOKEN environment variable is required')
      console.error('   Get your API token from: https://dash.cloudflare.com/profile/api-tokens')
      console.error('   Required permissions: SSL:Edit')
      process.exit(1)
    }

    if (!this.domain) {
      console.error('❌ Error: DOMAIN or CLOUDFLARE_DOMAIN environment variable is required')
      console.error('   Example: DOMAIN=example.com')
      process.exit(1)
    }
  }

  /**
   * Get Zone ID from domain name
   */
  async getZoneId(): Promise<string> {
    if (this.zoneId) {
      return this.zoneId
    }

    console.log(`🔍 Looking up Zone ID for domain: ${this.domain}`)

    try {
      const response = await fetch('https://api.cloudflare.com/client/v4/zones', {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`)
      }

      const data = await response.json() as CloudflareZoneResponse

      if (!data.success) {
        throw new Error('Failed to fetch zones')
      }

      const zone = data.result.find(z => z.name === this.domain || z.name.endsWith(`.${this.domain}`))

      if (!zone) {
        throw new Error(`Zone not found for domain: ${this.domain}`)
      }

      console.log(`✅ Found Zone ID: ${zone.id}`)
      return zone.id
    } catch (error) {
      console.error('❌ Error fetching Zone ID:', error instanceof Error ? error.message : error)
      throw error
    }
  }

  /**
   * Generate Cloudflare Origin Certificate
   */
  async generateCertificate(): Promise<{ cert: string; key: string }> {
    // Zone ID lookup is optional for Origin CA certificates (they're global)
    // But we'll still validate the domain exists
    if (!this.zoneId) {
      await this.getZoneId() // Just to validate domain exists
    }

    console.log(`🔐 Generating Cloudflare Origin Certificate for: ${this.domain}`)

    // Prepare certificate request
    // Include main domain, subdomains (ar, ut, etc.), and wildcard
    const hosts = [
      this.domain,
      `*.${this.domain}`, // Wildcard for all subdomains
      `ar.${this.domain}`, // Axerey subdomain
      `ut.${this.domain}` // User sync subdomain (if exists)
    ]
    
    // Remove duplicates
    const uniqueHosts = [...new Set(hosts)]
    
    const certRequest: CloudflareOriginCertRequest = {
      type: 'origin-rsa', // Use RSA 2048 (or 'origin-ecc' for ECDSA P-256)
      hosts: uniqueHosts,
      requested_validity: 5475 // 15 years in days (max allowed)
    }
    
    console.log(`   Hosts included: ${uniqueHosts.join(', ')}`)

    try {
      // Cloudflare Origin CA certificates use a global endpoint (not zone-specific)
      const response = await fetch('https://api.cloudflare.com/client/v4/certificates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(certRequest)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API request failed: ${response.statusText}\n${errorText}`)
      }

      const data = await response.json() as CloudflareOriginCertResponse

      if (!data.success) {
        const errors = data.errors?.map(e => `${e.code}: ${e.message}`).join(', ') || 'Unknown error'
        throw new Error(`Failed to generate certificate: ${errors}`)
      }

      console.log('✅ Certificate generated successfully!')
      console.log(`   Certificate ID: ${data.result.id}`)
      console.log(`   Expires: ${data.result.expires_on}`)

      return {
        cert: data.result.certificate,
        key: data.result.private_key
      }
    } catch (error) {
      console.error('❌ Error generating certificate:', error instanceof Error ? error.message : error)
      throw error
    }
  }

  /**
   * Save certificate files
   */
  async saveCertificates(cert: string, key: string): Promise<void> {
    // Create certs directory if it doesn't exist
    if (!existsSync(this.certDir)) {
      mkdirSync(this.certDir, { recursive: true })
      console.log(`📁 Created directory: ${this.certDir}`)
    }

    const certPath = join(this.certDir, 'cert.pem')
    const keyPath = join(this.certDir, 'key.pem')

    // Save certificate
    writeFileSync(certPath, cert, 'utf8')
    console.log(`💾 Saved certificate: ${certPath}`)

    // Save private key
    writeFileSync(keyPath, key, 'utf8')
    console.log(`💾 Saved private key: ${keyPath}`)

    // Set restrictive permissions on private key (Unix-like systems)
    if (process.platform !== 'win32') {
      const { chmodSync } = require('fs')
      chmodSync(keyPath, 0o600) // Read/write for owner only
      console.log(`🔒 Set secure permissions on private key`)
    }

    console.log('')
    console.log('✅ Certificates saved successfully!')
    console.log('')
    console.log('Next steps:')
    console.log('1. Add to your .env file:')
    console.log('   USE_HTTPS=true')
    console.log('   SSL_CERT_PATH=./certs/cert.pem')
    console.log('   SSL_KEY_PATH=./certs/key.pem')
    console.log('')
    console.log('2. Configure Cloudflare SSL/TLS mode:')
    console.log('   Go to: SSL/TLS → Overview → Set to "Full (strict)"')
    console.log('')
    console.log('3. Restart your server')
    console.log('')
    console.log('⚠️  Security: Never commit these files to git!')
    console.log('   Add to .gitignore: certs/*.pem')
  }

  /**
   * Main execution
   */
  async run(): Promise<void> {
    try {
      console.log('🚀 Cloudflare Origin Certificate Generator')
      console.log('==========================================')
      console.log('')

      const { cert, key } = await this.generateCertificate()
      await this.saveCertificates(cert, key)

      console.log('🎉 Done!')
    } catch (error) {
      console.error('')
      console.error('❌ Failed to generate certificate')
      console.error(error instanceof Error ? error.message : error)
      process.exit(1)
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const generator = new CloudflareCertGenerator()
  generator.run()
}

export default CloudflareCertGenerator

