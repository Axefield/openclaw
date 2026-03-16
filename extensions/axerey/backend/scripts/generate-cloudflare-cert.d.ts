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
declare class CloudflareCertGenerator {
    private apiToken;
    private zoneId?;
    private domain;
    private certDir;
    constructor();
    /**
     * Get Zone ID from domain name
     */
    getZoneId(): Promise<string>;
    /**
     * Generate Cloudflare Origin Certificate
     */
    generateCertificate(): Promise<{
        cert: string;
        key: string;
    }>;
    /**
     * Save certificate files
     */
    saveCertificates(cert: string, key: string): Promise<void>;
    /**
     * Main execution
     */
    run(): Promise<void>;
}
export default CloudflareCertGenerator;
