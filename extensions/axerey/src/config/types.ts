/**
 * Ahrimagon Configuration Types
 * Defines the configuration schema for MCP services
 */

export interface AhrimagonConfig {
  /** Configuration metadata */
  version?: string;
  signature?: string;
  timestamp?: string;
  environment?: string;
  checksum?: string;

  /** Server configuration */
  server?: {
    name?: string;
    version?: string;
    description?: string;
    capabilities?: {
      tools?: {
        listChanged?: boolean;
        maxConcurrent?: number;
      };
      resources?: {
        maxMemory?: number;
        maxCpu?: number;
      };
    };
  };

  /** Mind Balance tool configuration */
  mindBalance?: {
    /** Default abstention threshold [0,1] */
    abstainThreshold?: number;
    /** Default tangent clamp value */
    tanClamp?: number;
    /** Default normalization setting */
    normalize?: boolean;
    /** Default scoring configuration */
    scoring?: {
      rules?: ('brier' | 'log')[];
      abstentionScore?: number | null;
    };
  };

  /** Argumentation tools configuration */
  argumentation?: {
    /** Default confidence calculation settings */
    confidence?: {
      /** Base score multiplier for premises */
      premiseWeight?: number;
      /** Score multiplier for addressed objections */
      objectionWeight?: number;
      /** Penalty for residual risks */
      riskPenalty?: number;
    };
    /** Default response generation settings */
    responses?: {
      /** Enable detailed rationale generation */
      detailedRationale?: boolean;
      /** Include evidence citations by default */
      includeEvidence?: boolean;
    };
  };

  /** Security configuration */
  security?: {
    encryption?: {
      enabled?: boolean;
      algorithm?: string;
      keyDerivation?: string;
    };
    access?: {
      requireAuth?: boolean;
      allowedOrigins?: string[];
      rateLimiting?: {
        requestsPerMinute?: number;
        burstSize?: number;
      };
    };
    audit?: {
      enabled?: boolean;
      logLevel?: string;
      retentionDays?: number;
    };
  };

  /** Global tool settings */
  tools?: {
    /** Default timeout for tool execution (ms) */
    timeout?: number;
    /** Enable debug logging */
    debug?: boolean;
    /** Maximum retry attempts */
    maxRetries?: number;
    /** Resource limits */
    resourceLimits?: {
      maxMemoryMB?: number;
      maxCpuPercent?: number;
    };
  };

  /** Environment-specific overrides */
  environments?: {
    development?: Partial<AhrimagonConfig>;
    production?: Partial<AhrimagonConfig>;
    testing?: Partial<AhrimagonConfig>;
  };
}

/**
 * Configuration file format detection
 */
export type ConfigFormat = 'json' | 'markdown' | 'auto';

/**
 * Configuration loader options
 */
export interface ConfigLoaderOptions {
  /** Configuration file path */
  configPath?: string;
  /** Configuration format (auto-detect if not specified) */
  format?: ConfigFormat;
  /** Environment to load (development, production, testing) */
  environment?: string;
  /** Merge with default configuration */
  mergeDefaults?: boolean;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: AhrimagonConfig = {
  server: {
    name: 'mcp-mind-argumentation',
    version: '1.0.0',
    description: 'MCP Mind Balance & Argumentation Service'
  },
  mindBalance: {
    abstainThreshold: 0.70,
    tanClamp: 3.0,
    normalize: true,
    scoring: {
      rules: ['brier', 'log'],
      abstentionScore: 0.0
    }
  },
  argumentation: {
    confidence: {
      premiseWeight: 0.5,
      objectionWeight: 0.3,
      riskPenalty: 0.3
    },
    responses: {
      detailedRationale: true,
      includeEvidence: true
    }
  },
  tools: {
    timeout: 30000,
    debug: false,
    maxRetries: 3
  }
};
