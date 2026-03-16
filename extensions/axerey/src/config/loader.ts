/**
 * Ahrimagon Configuration Loader
 * Supports both .ahrimagon (JSON) and ahrimagon.md (Markdown) configuration files
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import type { 
  AhrimagonConfig, 
  ConfigLoaderOptions, 
  ConfigFormat, 
  ConfigValidationResult 
} from './types.js';
import { DEFAULT_CONFIG } from './types.js';

export class AhrimagonConfigLoader {
  private config: AhrimagonConfig = { ...DEFAULT_CONFIG };

  /**
   * Load configuration from file
   */
  async load(options: ConfigLoaderOptions = {}): Promise<AhrimagonConfig> {
    const {
      configPath = this.findConfigFile(),
      format = 'auto',
      environment = 'production',
      mergeDefaults = true
    } = options;

    if (!configPath || !existsSync(configPath)) {
      console.warn(`Configuration file not found: ${configPath}`);
      return mergeDefaults ? { ...DEFAULT_CONFIG } : {};
    }

    // Store config path for reference
    const detectedFormat = format === 'auto' ? this.detectFormat(configPath) : format;
    
    try {
      const fileContent = readFileSync(configPath, 'utf-8');
      const loadedConfig = this.parseConfig(fileContent, detectedFormat);
      
      // Apply environment-specific overrides
      const finalConfig = this.applyEnvironmentOverrides(loadedConfig, environment);
      
      // Merge with defaults if requested
      this.config = mergeDefaults 
        ? this.mergeConfigs(DEFAULT_CONFIG, finalConfig)
        : finalConfig;

      return this.config;
    } catch (error) {
      throw new Error(`Failed to load configuration from ${configPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): AhrimagonConfig {
    return this.config;
  }

  /**
   * Validate configuration
   */
  validate(config: AhrimagonConfig = this.config): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate mindBalance settings
    if (config.mindBalance?.abstainThreshold !== undefined) {
      if (config.mindBalance.abstainThreshold < 0 || config.mindBalance.abstainThreshold > 1) {
        errors.push('mindBalance.abstainThreshold must be between 0 and 1');
      }
    }

    if (config.mindBalance?.tanClamp !== undefined) {
      if (config.mindBalance.tanClamp <= 0) {
        errors.push('mindBalance.tanClamp must be positive');
      }
    }

    // Validate argumentation settings
    if (config.argumentation?.confidence) {
      const conf = config.argumentation.confidence;
      if (conf.premiseWeight !== undefined && conf.premiseWeight < 0) {
        errors.push('argumentation.confidence.premiseWeight must be non-negative');
      }
      if (conf.objectionWeight !== undefined && conf.objectionWeight < 0) {
        errors.push('argumentation.confidence.objectionWeight must be non-negative');
      }
      if (conf.riskPenalty !== undefined && conf.riskPenalty < 0) {
        errors.push('argumentation.confidence.riskPenalty must be non-negative');
      }
    }

    // Validate tools settings
    if (config.tools?.timeout !== undefined && config.tools.timeout <= 0) {
      errors.push('tools.timeout must be positive');
    }

    if (config.tools?.maxRetries !== undefined && config.tools.maxRetries < 0) {
      errors.push('tools.maxRetries must be non-negative');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Find configuration file in current directory and parent directories
   */
  private findConfigFile(): string | null {
    const possibleNames = ['.ahrimagon', 'ahrimagon.md', 'ahrimagon.json'];
    let currentDir = process.cwd();

    while (currentDir !== dirname(currentDir)) {
      for (const name of possibleNames) {
        const filePath = join(currentDir, name);
        if (existsSync(filePath)) {
          return filePath;
        }
      }
      currentDir = dirname(currentDir);
    }

    return null;
  }

  /**
   * Detect configuration file format
   */
  private detectFormat(filePath: string): ConfigFormat {
    if (filePath.endsWith('.json') || filePath.endsWith('.ahrimagon')) {
      return 'json';
    } else if (filePath.endsWith('.md')) {
      return 'markdown';
    }
    
    // Try to detect by content
    const content = readFileSync(filePath, 'utf-8').trim();
    if (content.startsWith('{') || content.startsWith('[')) {
      return 'json';
    } else if (content.startsWith('#')) {
      return 'markdown';
    }
    
    return 'json'; // Default fallback
  }

  /**
   * Parse configuration based on format
   */
  private parseConfig(content: string, format: ConfigFormat): AhrimagonConfig {
    switch (format) {
      case 'json':
        return this.parseJsonConfig(content);
      case 'markdown':
        return this.parseMarkdownConfig(content);
      default:
        throw new Error(`Unsupported configuration format: ${format}`);
    }
  }

  /**
   * Parse JSON configuration
   */
  private parseJsonConfig(content: string): AhrimagonConfig {
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Invalid JSON configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse Markdown configuration
   */
  private parseMarkdownConfig(content: string): AhrimagonConfig {
    const config: AhrimagonConfig = {};
    const lines = content.split('\n');
    let currentSection: string | null = null;
    let currentSubsection: string | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() || '';
      
      // Skip empty lines and comments
      if (!line || line.startsWith('<!--') || line.startsWith('#')) {
        continue;
      }

      // Section headers (## Server, ## Mind Balance, etc.)
      if (line.startsWith('## ')) {
        const sectionName = line.substring(3).toLowerCase().replace(/\s+/g, '');
        currentSection = sectionName;
        currentSubsection = null;
        continue;
      }

      // Subsection headers (### Configuration, ### Settings, etc.)
      if (line.startsWith('### ')) {
        const subsectionName = line.substring(4).toLowerCase().replace(/\s+/g, '');
        currentSubsection = subsectionName;
        continue;
      }

      // Key-value pairs
      if (line.includes(':')) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        
        if (!currentSection) continue;

        const parsedValue = this.parseValue(value);
        this.setNestedValue(config, currentSection, currentSubsection, key?.trim() || '', parsedValue);
      }
    }

    return config;
  }

  /**
   * Parse configuration value from string
   */
  private parseValue(value: string): any {
    const trimmed = value.trim();
    
    // Boolean values
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    
    // Null values
    if (trimmed === 'null') return null;
    
    // Numbers
    if (!isNaN(Number(trimmed)) && trimmed !== '') {
      return Number(trimmed);
    }
    
    // Arrays (comma-separated)
    if (trimmed.includes(',')) {
      return trimmed.split(',').map(item => this.parseValue(item.trim()));
    }
    
    // Strings (remove quotes if present)
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }
    
    return trimmed;
  }

  /**
   * Set nested configuration value
   */
  private setNestedValue(
    config: any, 
    section: string, 
    subsection: string | null, 
    key: string, 
    value: any
  ): void {
    if (!config[section]) {
      config[section] = {};
    }
    
    const target = subsection ? (config[section][subsection] ||= {}) : config[section];
    target[key] = value;
  }

  /**
   * Apply environment-specific overrides
   */
  private applyEnvironmentOverrides(config: AhrimagonConfig, environment: string): AhrimagonConfig {
    if (!config.environments || !config.environments[environment as keyof typeof config.environments]) {
      return config;
    }

    const envOverrides = config.environments[environment as keyof typeof config.environments];
    return this.mergeConfigs(config, envOverrides || {});
  }

  /**
   * Deep merge two configuration objects
   */
  private mergeConfigs(defaultConfig: any, userConfig: any): any {
    const result = { ...defaultConfig };
    
    for (const key in userConfig) {
      if (userConfig[key] && typeof userConfig[key] === 'object' && !Array.isArray(userConfig[key])) {
        result[key] = this.mergeConfigs(defaultConfig[key] || {}, userConfig[key]);
      } else {
        result[key] = userConfig[key];
      }
    }
    
    return result;
  }
}

/**
 * Global configuration instance
 */
export const configLoader = new AhrimagonConfigLoader();
