/**
 * Ahrimagon Configuration Schema
 * Scientific-grade JSON Schema with comprehensive validation
 */

export const AHRIMAGON_CONFIG_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://ahrimagon.ai/schemas/config/v1.0.0",
  title: "Ahrimagon MCP Configuration",
  description: "Scientific-grade configuration schema for Ahrimagon MCP services",
  type: "object",
  required: ["version"],
  properties: {
    version: {
      type: "string",
      pattern: "^\\d+\\.\\d+\\.\\d+$",
      description: "Configuration schema version (semantic versioning)"
    },
    signature: {
      type: "string",
      pattern: "^[A-Fa-f0-9]{64}$",
      description: "SHA-256 signature of configuration content for integrity verification"
    },
    timestamp: {
      type: "string",
      format: "date-time",
      description: "ISO 8601 timestamp of configuration creation"
    },
    environment: {
      type: "string",
      enum: ["development", "staging", "production", "testing"],
      description: "Target environment for this configuration"
    },
    server: {
      type: "object",
      properties: {
        name: {
          type: "string",
          minLength: 1,
          maxLength: 100,
          pattern: "^[a-zA-Z0-9-_]+$",
          description: "Server identifier (alphanumeric, hyphens, underscores only)"
        },
        version: {
          type: "string",
          pattern: "^\\d+\\.\\d+\\.\\d+$",
          description: "Server version (semantic versioning)"
        },
        description: {
          type: "string",
          maxLength: 500,
          description: "Human-readable server description"
        },
        capabilities: {
          type: "object",
          properties: {
            tools: {
              type: "object",
              properties: {
                listChanged: { type: "boolean" },
                maxConcurrent: { type: "integer", minimum: 1, maximum: 1000 }
              }
            },
            resources: {
              type: "object",
              properties: {
                maxMemory: { type: "integer", minimum: 1024 },
                maxCpu: { type: "number", minimum: 0.1, maximum: 100.0 }
              }
            }
          }
        }
      },
      required: ["name", "version"]
    },
    mindBalance: {
      type: "object",
      properties: {
        abstainThreshold: {
          type: "number",
          minimum: 0.0,
          maximum: 1.0,
          multipleOf: 0.01,
          description: "Confidence threshold for abstention (0.0-1.0)"
        },
        tanClamp: {
          type: "number",
          minimum: 0.1,
          maximum: 100.0,
          multipleOf: 0.1,
          description: "Tangent clamping value for numerical stability"
        },
        normalize: {
          type: "boolean",
          description: "Enable signal normalization"
        },
        scoring: {
          type: "object",
          properties: {
            rules: {
              type: "array",
              items: {
                type: "string",
                enum: ["brier", "log", "quadratic", "spherical"]
              },
              uniqueItems: true,
              minItems: 1,
              maxItems: 4
            },
            abstentionScore: {
              type: ["number", "null"],
              minimum: 0.0,
              maximum: 1.0
            },
            calibration: {
              type: "object",
              properties: {
                temperature: { type: "number", minimum: 0.1, maximum: 10.0 },
                method: { type: "string", enum: ["platt", "isotonic", "beta"] }
              }
            }
          },
          required: ["rules"]
        },
        validation: {
          type: "object",
          properties: {
            maxIterations: { type: "integer", minimum: 1, maximum: 10000 },
            convergenceThreshold: { type: "number", minimum: 1e-10, maximum: 1e-3 },
            numericalPrecision: { type: "integer", minimum: 32, maximum: 128 }
          }
        }
      }
    },
    argumentation: {
      type: "object",
      properties: {
        confidence: {
          type: "object",
          properties: {
            premiseWeight: {
              type: "number",
              minimum: 0.0,
              maximum: 2.0,
              multipleOf: 0.01
            },
            objectionWeight: {
              type: "number",
              minimum: 0.0,
              maximum: 2.0,
              multipleOf: 0.01
            },
            riskPenalty: {
              type: "number",
              minimum: 0.0,
              maximum: 1.0,
              multipleOf: 0.01
            },
            uncertaintyModel: {
              type: "string",
              enum: ["bayesian", "frequentist", "dempster-shafer", "possibilistic"]
            }
          }
        },
        responses: {
          type: "object",
          properties: {
            detailedRationale: { type: "boolean" },
            includeEvidence: { type: "boolean" },
            maxPremises: { type: "integer", minimum: 1, maximum: 50 },
            maxObjections: { type: "integer", minimum: 1, maximum: 50 }
          }
        },
        validation: {
          type: "object",
          properties: {
            logicalConsistency: { type: "boolean" },
            evidenceVerification: { type: "boolean" },
            fallacyDetection: { type: "boolean" }
          }
        }
      }
    },
    security: {
      type: "object",
      properties: {
        encryption: {
          type: "object",
          properties: {
            enabled: { type: "boolean" },
            algorithm: { type: "string", enum: ["AES-256-GCM", "ChaCha20-Poly1305"] },
            keyDerivation: { type: "string", enum: ["PBKDF2", "Argon2", "scrypt"] }
          }
        },
        access: {
          type: "object",
          properties: {
            requireAuth: { type: "boolean" },
            allowedOrigins: {
              type: "array",
              items: { type: "string", format: "uri" }
            },
            rateLimiting: {
              type: "object",
              properties: {
                requestsPerMinute: { type: "integer", minimum: 1, maximum: 10000 },
                burstSize: { type: "integer", minimum: 1, maximum: 1000 }
              }
            }
          }
        },
        audit: {
          type: "object",
          properties: {
            enabled: { type: "boolean" },
            logLevel: { type: "string", enum: ["debug", "info", "warn", "error"] },
            retentionDays: { type: "integer", minimum: 1, maximum: 3650 }
          }
        }
      }
    },
    tools: {
      type: "object",
      properties: {
        timeout: {
          type: "integer",
          minimum: 1000,
          maximum: 300000,
          description: "Tool execution timeout in milliseconds"
        },
        debug: { type: "boolean" },
        maxRetries: {
          type: "integer",
          minimum: 0,
          maximum: 10
        },
        resourceLimits: {
          type: "object",
          properties: {
            maxMemoryMB: { type: "integer", minimum: 64, maximum: 8192 },
            maxCpuPercent: { type: "number", minimum: 1.0, maximum: 100.0 }
          }
        }
      }
    },
    environments: {
      type: "object",
      patternProperties: {
        "^(development|staging|production|testing)$": {
          type: "object",
          description: "Environment-specific overrides"
        }
      },
      additionalProperties: false
    },
    metadata: {
      type: "object",
      properties: {
        author: { type: "string", maxLength: 100 },
        organization: { type: "string", maxLength: 100 },
        license: { type: "string", maxLength: 50 },
        tags: {
          type: "array",
          items: { type: "string", maxLength: 50 },
          maxItems: 20
        }
      }
    }
  },
  additionalProperties: false
} as const;
