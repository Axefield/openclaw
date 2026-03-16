/**
 * Ahrimagon Configuration Validator
 * Scientific-grade validation with cryptographic verification
 */

import Ajv, { type ValidateFunction, type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { createHash, createHmac } from 'crypto';
import { Vagogon_CONFIG_SCHEMA } from './vagogon-schema.js';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  security: SecurityCheck[];
  integrity: IntegrityCheck;
}

export interface ValidationError {
  path: string;
  message: string;
  code: string;
  severity: 'error' | 'critical';
}

export interface ValidationWarning {
  path: string;
  message: string;
  code: string;
  suggestion?: string;
}

export interface SecurityCheck {
  check: string;
  passed: boolean;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface IntegrityCheck {
  signatureValid: boolean;
  timestampValid: boolean;
  checksumValid: boolean;
  message: string;
}

export class AhrimagonConfigValidator {
  private ajv: Ajv;
  private validate: ValidateFunction;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: true,
      validateFormats: true
    });
    
    addFormats(this.ajv);
    this.validate = this.ajv.compile(Vagogon_CONFIG_SCHEMA);
  }

  /**
   * Validate configuration with comprehensive checks
   */
  async validateConfig(config: any, options: {
    verifySignature?: boolean;
    publicKey?: string;
    strictMode?: boolean;
  } = {}): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const security: SecurityCheck[] = [];

    // Schema validation
    const valid = this.validate(config);
    if (!valid) {
      errors.push(...this.formatAjvErrors(this.validate.errors || []));
    }

    // Security checks
    security.push(...await this.performSecurityChecks(config));

    // Integrity verification
    const integrity = await this.verifyIntegrity(config, options);

    // Business logic validation
    warnings.push(...this.performBusinessLogicChecks(config));

    // Numerical stability checks
    warnings.push(...this.performNumericalStabilityChecks(config));

    return {
      valid: valid && errors.length === 0,
      errors,
      warnings,
      security,
      integrity
    };
  }

  /**
   * Generate configuration signature
   */
  generateSignature(config: any, privateKey: string): string {
    const configString = JSON.stringify(config, null, 2);
    return createHmac('sha256', privateKey)
      .update(configString)
      .digest('hex')
      .toUpperCase();
  }

  /**
   * Verify configuration signature
   */
  verifySignature(config: any, signature: string, publicKey: string): boolean {
    const expectedSignature = this.generateSignature(config, publicKey);
    return signature === expectedSignature;
  }

  /**
   * Generate configuration checksum
   */
  generateChecksum(config: any): string {
    const configString = JSON.stringify(config, null, 2);
    return createHash('sha256')
      .update(configString)
      .digest('hex')
      .toUpperCase();
  }

  private formatAjvErrors(errors: ErrorObject[]): ValidationError[] {
    return errors.map(error => ({
      path: error.instancePath || error.schemaPath,
      message: error.message || 'Validation error',
      code: error.keyword || 'unknown',
      severity: this.getErrorSeverity(error)
    }));
  }

  private getErrorSeverity(error: ErrorObject): 'error' | 'critical' {
    const criticalKeywords = ['required', 'type', 'format', 'pattern'];
    return criticalKeywords.includes(error.keyword || '') ? 'critical' : 'error';
  }

  private async performSecurityChecks(config: any): Promise<SecurityCheck[]> {
    const checks: SecurityCheck[] = [];

    // Check for sensitive data exposure
    const sensitiveKeys = ['password', 'secret', 'key', 'token', 'credential'];
    const hasSensitiveData = this.findSensitiveData(config, sensitiveKeys);
    
    checks.push({
      check: 'sensitive_data_exposure',
      passed: !hasSensitiveData,
      message: hasSensitiveData ? 'Sensitive data detected in configuration' : 'No sensitive data found',
      severity: hasSensitiveData ? 'critical' : 'low'
    });

    // Check for insecure defaults
    const hasInsecureDefaults = this.checkInsecureDefaults(config);
    checks.push({
      check: 'insecure_defaults',
      passed: !hasInsecureDefaults,
      message: hasInsecureDefaults ? 'Insecure default values detected' : 'Secure defaults verified',
      severity: hasInsecureDefaults ? 'high' : 'low'
    });

    // Check for excessive permissions
    const hasExcessivePermissions = this.checkExcessivePermissions(config);
    checks.push({
      check: 'excessive_permissions',
      passed: !hasExcessivePermissions,
      message: hasExcessivePermissions ? 'Excessive permissions detected' : 'Permissions within acceptable limits',
      severity: hasExcessivePermissions ? 'medium' : 'low'
    });

    return checks;
  }

  private async verifyIntegrity(config: any, options: {
    verifySignature?: boolean;
    publicKey?: string;
  }): Promise<IntegrityCheck> {
    const { verifySignature = false, publicKey } = options;
    
    let signatureValid = true;
    let timestampValid = true;
    let checksumValid = true;
    let message = 'Integrity verification passed';

    // Verify signature if requested
    if (verifySignature && publicKey && config.signature) {
      signatureValid = this.verifySignature(config, config.signature, publicKey);
      if (!signatureValid) {
        message = 'Signature verification failed';
      }
    }

    // Verify timestamp
    if (config.timestamp) {
      const timestamp = new Date(config.timestamp);
      const now = new Date();
      const age = now.getTime() - timestamp.getTime();
      const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year
      
      timestampValid = age >= 0 && age <= maxAge;
      if (!timestampValid) {
        message = 'Invalid or expired timestamp';
      }
    }

    // Verify checksum
    if (config.checksum) {
      const expectedChecksum = this.generateChecksum(config);
      checksumValid = config.checksum === expectedChecksum;
      if (!checksumValid) {
        message = 'Checksum verification failed';
      }
    }

    return {
      signatureValid,
      timestampValid,
      checksumValid,
      message
    };
  }

  private performBusinessLogicChecks(config: any): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Check for conflicting settings
    if (config.mindBalance?.abstainThreshold > 0.9) {
      warnings.push({
        path: 'mindBalance.abstainThreshold',
        message: 'Very high abstention threshold may reduce decision-making capability',
        code: 'high_abstention_threshold',
        suggestion: 'Consider lowering to 0.7-0.8 for better decision coverage'
      });
    }

    // Check for performance implications
    if (config.tools?.timeout > 60000) {
      warnings.push({
        path: 'tools.timeout',
        message: 'High timeout value may impact user experience',
        code: 'high_timeout',
        suggestion: 'Consider reducing to 30 seconds or less'
      });
    }

    return warnings;
  }

  private performNumericalStabilityChecks(config: any): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Check for numerical stability issues
    if (config.mindBalance?.tanClamp < 1.0) {
      warnings.push({
        path: 'mindBalance.tanClamp',
        message: 'Low tangent clamp may cause numerical instability',
        code: 'low_tan_clamp',
        suggestion: 'Consider increasing to at least 1.0 for numerical stability'
      });
    }

    // Check for precision issues
    if (config.mindBalance?.abstainThreshold && 
        config.mindBalance.abstainThreshold.toString().split('.')[1]?.length > 2) {
      warnings.push({
        path: 'mindBalance.abstainThreshold',
        message: 'High precision abstention threshold may not be meaningful',
        code: 'excessive_precision',
        suggestion: 'Consider rounding to 2 decimal places'
      });
    }

    return warnings;
  }

  private findSensitiveData(obj: any, sensitiveKeys: string[]): boolean {
    if (typeof obj !== 'object' || obj === null) return false;
    
    for (const key in obj) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        return true;
      }
      if (this.findSensitiveData(obj[key], sensitiveKeys)) {
        return true;
      }
    }
    return false;
  }

  private checkInsecureDefaults(config: any): boolean {
    // Check for debug mode in production
    if (config.environment === 'production' && config.tools?.debug === true) {
      return true;
    }

    // Check for weak security settings
    if (config.security?.encryption?.enabled === false) {
      return true;
    }

    return false;
  }

  private checkExcessivePermissions(config: any): boolean {
    // Check for excessive resource limits
    if (config.tools?.resourceLimits?.maxMemoryMB > 4096) {
      return true;
    }

    // Check for high rate limits
    if (config.security?.access?.rateLimiting?.requestsPerMinute > 5000) {
      return true;
    }

    return false;
  }
}

export const configValidator = new AhrimagonConfigValidator();
