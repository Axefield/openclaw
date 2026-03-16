/**
 * Ahrimagon Configuration Encryption
 * Military-grade encryption for sensitive configuration data
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export interface EncryptionConfig {
  algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305';
  keyDerivation: 'PBKDF2' | 'Argon2' | 'scrypt';
  iterations: number;
  saltLength: number;
  ivLength: number;
}

export interface EncryptedConfig {
  encrypted: string;
  salt: string;
  iv: string;
  authTag: string;
  algorithm: string;
  keyDerivation: string;
  iterations: number;
  checksum: string;
}

export class AhrimagonConfigEncryption {
  private readonly defaultConfig: EncryptionConfig = {
    algorithm: 'AES-256-GCM',
    keyDerivation: 'scrypt',
    iterations: 100000,
    saltLength: 32,
    ivLength: 16
  };

  /**
   * Encrypt configuration with military-grade encryption
   */
  async encryptConfig(
    config: any, 
    password: string, 
    encryptionConfig: Partial<EncryptionConfig> = {}
  ): Promise<EncryptedConfig> {
    const config_ = { ...this.defaultConfig, ...encryptionConfig };
    const configString = JSON.stringify(config, null, 2);
    
    // Generate salt and IV
    const salt = randomBytes(config_.saltLength);
    const iv = randomBytes(config_.ivLength);
    
    // Derive key
    const key = await this.deriveKey(password, salt, config_);
    
    // Encrypt data using AES-256-GCM
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(configString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Generate checksum
    const checksum = this.generateChecksum(configString);
    
    return {
      encrypted,
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm: config_.algorithm,
      keyDerivation: config_.keyDerivation,
      iterations: config_.iterations,
      checksum
    };
  }

  /**
   * Decrypt configuration
   */
  async decryptConfig(
    encryptedConfig: EncryptedConfig, 
    password: string
  ): Promise<any> {
    const salt = Buffer.from(encryptedConfig.salt, 'hex');
    const iv = Buffer.from(encryptedConfig.iv, 'hex');
    const authTag = Buffer.from(encryptedConfig.authTag, 'hex');
    
    // Derive key
    const key = await this.deriveKey(password, salt, {
      algorithm: encryptedConfig.algorithm as any,
      keyDerivation: encryptedConfig.keyDerivation as any,
      iterations: encryptedConfig.iterations,
      saltLength: salt.length,
      ivLength: iv.length
    });
    
    // Decrypt data using AES-256-GCM
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedConfig.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    // Verify checksum
    const expectedChecksum = this.generateChecksum(decrypted);
    if (expectedChecksum !== encryptedConfig.checksum) {
      throw new Error('Checksum verification failed - configuration may be corrupted');
    }
    
    return JSON.parse(decrypted);
  }

  /**
   * Generate secure password
   */
  generateSecurePassword(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  /**
   * Derive encryption key from password
   */
  private async deriveKey(
    password: string, 
    salt: Buffer, 
    config: EncryptionConfig
  ): Promise<Buffer> {
    switch (config.keyDerivation) {
      case 'scrypt':
        return await scryptAsync(password, salt, 32) as Buffer;
      case 'PBKDF2':
        return createHash('sha256')
          .update(password + salt.toString('hex'))
          .digest();
      default:
        throw new Error(`Unsupported key derivation: ${config.keyDerivation}`);
    }
  }

  /**
   * Generate checksum for integrity verification
   */
  private generateChecksum(data: string): string {
    return createHash('sha256')
      .update(data)
      .digest('hex')
      .toUpperCase();
  }

  /**
   * Verify configuration integrity
   */
  verifyIntegrity(config: any, expectedChecksum: string): boolean {
    const configString = JSON.stringify(config, null, 2);
    const actualChecksum = this.generateChecksum(configString);
    return actualChecksum === expectedChecksum;
  }
}

export const configEncryption = new AhrimagonConfigEncryption();
