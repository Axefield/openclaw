/**
 * Ahrimagon Configuration Manager
 * Provides easy access to configuration values for tools
 */

import { configLoader } from './loader.js';
import type { AhrimagonConfig } from './types.js';

export class AhrimagonConfigManager {
  private static instance: AhrimagonConfigManager;
  private config: AhrimagonConfig = {};

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): AhrimagonConfigManager {
    if (!AhrimagonConfigManager.instance) {
      AhrimagonConfigManager.instance = new AhrimagonConfigManager();
    }
    return AhrimagonConfigManager.instance;
  }

  /**
   * Initialize configuration
   */
  async initialize(): Promise<void> {
    this.config = await configLoader.load();
  }

  /**
   * Get mind balance configuration
   */
  getMindBalanceConfig() {
    return this.config.mindBalance || {};
  }

  /**
   * Get argumentation configuration
   */
  getArgumentationConfig() {
    return this.config.argumentation || {};
  }

  /**
   * Get tools configuration
   */
  getToolsConfig() {
    return this.config.tools || {};
  }

  /**
   * Get server configuration
   */
  getServerConfig() {
    return this.config.server || {};
  }

  /**
   * Get specific configuration value with fallback
   */
  getValue<T>(path: string, defaultValue: T): T {
    const keys = path.split('.');
    let current: any = this.config;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }
    
    return current !== undefined ? current : defaultValue;
  }

  /**
   * Check if configuration is loaded
   */
  isLoaded(): boolean {
    return Object.keys(this.config).length > 0;
  }

  /**
   * Reload configuration
   */
  async reload(): Promise<void> {
    this.config = await configLoader.load();
  }

  /**
   * Get full configuration
   */
  getFullConfig(): AhrimagonConfig {
    return { ...this.config };
  }
}

/**
 * Global configuration manager instance
 */
export const configManager = AhrimagonConfigManager.getInstance();
