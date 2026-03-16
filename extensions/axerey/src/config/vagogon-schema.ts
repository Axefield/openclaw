/**
 *  Configuration Schema
 * Flexible JSON Schema for Vagogon MCP server
 */

export const Vagogon_CONFIG_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://vagogon.ai/schemas/config/v1.0.0",
  title: "Vagogon MCP Configuration",
  description: "Configuration schema for Vagogon MCP server",
  type: "object",
  required: ["version"],
  additionalProperties: true, // Allow additional properties
  properties: {
    version: {
      type: "string",
      description: "Configuration schema version"
    },
    environment: {
      type: "string",
      enum: ["development", "staging", "production", "testing"],
      description: "Target environment for this configuration"
    },
    security: {
      type: "object",
      additionalProperties: true,
      properties: {
        encryptionEnabled: { type: "boolean" },
        signatureVerification: { type: "boolean" },
        auditLogging: { type: "boolean" },
        strictMode: { type: "boolean" }
      }
    },
    reasoning: {
      type: "object",
      additionalProperties: true,
      properties: {
        mindBalance: {
          type: "object",
          additionalProperties: true
        },
        argumentation: {
          type: "object",
          additionalProperties: true
        }
      }
    },
    memory: {
      type: "object",
      additionalProperties: true,
      properties: {
        vssEnabled: { type: "boolean" },
        vectorDimension: { type: "number" },
        maxMemories: { type: "number" },
        retentionDays: { type: "number" }
      }
    },
    performance: {
      type: "object",
      additionalProperties: true,
      properties: {
        cacheSize: { type: "number" },
        batchSize: { type: "number" },
        timeoutMs: { type: "number" }
      }
    },
    metadata: {
      type: "object",
      additionalProperties: true,
      properties: {
        createdAt: { type: "string" },
        lastModified: { type: "string" },
        version: { type: "string" }
      }
    }
  }
};
