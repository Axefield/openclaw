/**
 * Axerey Tool Bridge
 *
 * Converts Axerey MCP tools to Ollama tool calling format
 * and executes tool calls via the MCP server
 */

import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// Import tool definitions from the MCP server
// We'll load these dynamically or import the tool schemas
export interface AxereyTool {
  name: string;
  description: string;
  inputSchema: z.ZodType<any>;
}

/**
 * Core memory tools - Priority 1
 */
const MEMORY_TOOLS: AxereyTool[] = [
  {
    name: "axerey_memorize",
    description:
      "Store new memories with text, tags, importance, and optional expiration",
    inputSchema: z.object({
      text: z.string().min(1),
      tags: z.array(z.string()).default([]),
      importance: z.number().min(0).max(1).default(0.5),
      expiresAt: z.string().datetime().optional(),
      sessionId: z.string().optional(),
      type: z.enum(["episodic", "semantic", "procedural"]).default("episodic"),
      source: z
        .enum(["plan", "signal", "execution", "account"])
        .default("plan"),
      confidence: z.number().min(0).max(1).default(1.0),
      features: z.record(z.string(), z.unknown()).optional(),
    }),
  },
  {
    name: "axerey_recall",
    description: "Retrieve memories by query or get recent ones",
    inputSchema: z.object({
      query: z.string().default(""),
      limit: z.number().int().min(1).max(50).default(8),
      tags: z.array(z.string()).default([]),
      sessionId: z.string().optional(),
    }),
  },
  {
    name: "axerey_search",
    description: "Semantic search through stored memories",
    inputSchema: z.object({
      query: z.string().min(1),
      limit: z.number().int().min(1).max(50).default(8),
      tags: z.array(z.string()).default([]),
      sessionId: z.string().optional(),
    }),
  },
  {
    name: "axerey_update",
    description: "Modify existing memory text",
    inputSchema: z.object({
      id: z.string(),
      text: z.string().min(1),
    }),
  },
  {
    name: "axerey_forget",
    description: "Delete a memory by ID",
    inputSchema: z.object({
      id: z.string(),
    }),
  },
  {
    name: "axerey_pin",
    description: "Pin/unpin memories for quick access",
    inputSchema: z.object({
      id: z.string(),
      pinned: z.boolean().default(true),
    }),
  },
];

/**
 * Reasoning tools - Priority 1
 */
const REASONING_TOOLS: AxereyTool[] = [
  {
    name: "axerey_mind_balance",
    description:
      "Probabilistic decision-making with abstention-aware scoring using angel/demon advisory system",
    inputSchema: z.object({
      topic: z.string().min(1),
      theta: z.number(),
      phi: z.number(),
      cosine: z.number().min(-1).max(1),
      tangent: z.number(),
      mode: z.enum(["angel", "demon", "blend", "probabilistic"]),
      tanClamp: z.number().optional().default(3.0),
      normalize: z.boolean().optional().default(true),
      scoring: z
        .object({
          rules: z
            .array(z.enum(["brier", "log", "quadratic", "spherical"]))
            .optional(),
          abstainThreshold: z.number().min(0).max(1).optional(),
          abstentionScore: z.number().optional(),
        })
        .optional(),
    }),
  },
  {
    name: "axerey_steelman",
    description:
      "Strengthen arguments by finding their most charitable, strongest version",
    inputSchema: z.object({
      opponentClaim: z.string().min(1),
      charitableAssumptions: z.array(z.string()).optional(),
      strongestPremises: z
        .array(
          z.object({
            text: z.string(),
            support: z.string().optional(),
            evidence: z
              .array(
                z.object({
                  title: z.string().optional(),
                  url: z.string().optional(),
                  doi: z.string().optional(),
                  note: z.string().optional(),
                }),
              )
              .optional(),
          }),
        )
        .optional(),
      anticipatedObjections: z
        .array(
          z.object({
            text: z.string(),
            severity: z.enum(["low", "medium", "high"]).optional(),
            response: z.string().optional(),
            evidence: z
              .array(
                z.object({
                  title: z.string().optional(),
                  url: z.string().optional(),
                  doi: z.string().optional(),
                  note: z.string().optional(),
                }),
              )
              .optional(),
          }),
        )
        .optional(),
      context: z.string().optional(),
    }),
  },
  {
    name: "axerey_strawman",
    description:
      "Analyze arguments to identify distortions, fallacies, and weak points",
    inputSchema: z.object({
      originalClaim: z.string().min(1),
      distortions: z
        .array(
          z.enum([
            "exaggeration",
            "oversimplification",
            "misattribution",
            "context_stripping",
            "straw_person_minor",
            "quote_mining",
            "false_dichotomy",
          ]),
        )
        .optional(),
      fallacies: z
        .array(
          z.enum([
            "strawman",
            "ad_hominem",
            "false_dichotomy",
            "slippery_slope",
            "appeal_to_authority",
            "circular_reasoning",
          ]),
        )
        .optional(),
      requestRefutation: z.boolean().optional().default(false),
      context: z.string().optional(),
    }),
  },
  {
    name: "axerey_strawman_to_steelman",
    description:
      "Transform distorted claims back to their strongest form through systematic analysis",
    inputSchema: z.object({
      originalClaim: z.string().min(1),
      distortions: z
        .array(
          z.enum([
            "exaggeration",
            "oversimplification",
            "misattribution",
            "context_stripping",
            "straw_person_minor",
            "quote_mining",
            "false_dichotomy",
          ]),
        )
        .optional(),
      context: z.string().optional(),
    }),
  },
];

/**
 * Smart-Thinking improvement tools
 */
const SMART_THINKING_TOOLS: AxereyTool[] = [
  {
    name: "axerey_reasoning_step",
    description:
      "Track reasoning steps with status, duration, and justifications",
    inputSchema: z.object({
      action: z.enum(["start", "complete", "fail", "add_justification"]),
      stepId: z.string().optional(),
      kind: z
        .enum([
          "context",
          "verification",
          "graph",
          "evaluation",
          "memory",
          "planning",
        ])
        .optional(),
      label: z.string().optional(),
      description: z.string().optional(),
      parents: z.array(z.string()).optional(),
      details: z.record(z.string(), z.unknown()).optional(),
      justification: z
        .object({
          summary: z.string(),
          heuristics: z.array(z.string()).optional(),
          timestamp: z.string().optional(),
        })
        .optional(),
      sessionId: z.string().optional(),
    }),
  },
  {
    name: "axerey_memory_connect",
    description: "Create explicit relationships between memories",
    inputSchema: z.object({
      sourceId: z.string(),
      targetId: z.string(),
      connectionType: z.enum([
        "supports",
        "contradicts",
        "refines",
        "derives",
        "exemplifies",
        "generalizes",
        "questions",
        "analyzes",
        "synthesizes",
        "associates",
        "extends",
        "applies",
      ]),
      strength: z.number().min(0).max(1).default(0.5),
      description: z.string().optional(),
      inferred: z.boolean().default(false),
      inferenceConfidence: z.number().min(0).max(1).optional(),
    }),
  },
  {
    name: "axerey_verify_memory",
    description:
      "Verify factual claims and calculations using memory-first strategy and truth-adaptation",
    inputSchema: z.object({
      memoryId: z.string(),
      forceVerification: z.boolean().default(false),
      containsCalculations: z.boolean().default(false),
      useTruthAdaptation: z.boolean().default(true),
      checkMemoriesFirst: z.boolean().default(true),
      useGonSearch: z.boolean().default(true),
      gonSearchProfile: z
        .enum(["TECH_NEWS", "PRODUCT_DEALS", "RESEARCH", "GENERIC"])
        .default("GENERIC"),
    }),
  },
  {
    name: "axerey_evaluate_memory_quality",
    description: "Evaluate memory quality using heuristics",
    inputSchema: z.object({
      memoryId: z.string(),
      context: z.string().optional(),
    }),
  },
  {
    name: "axerey_save_reasoning_state",
    description: "Save complete reasoning state for a session",
    inputSchema: z.object({
      sessionId: z.string(),
      includeConnections: z.boolean().default(true),
    }),
  },
  {
    name: "axerey_load_reasoning_state",
    description: "Load reasoning state from a previous session",
    inputSchema: z.object({
      sessionId: z.string(),
    }),
  },
  {
    name: "axerey_suggest_next_steps",
    description: "Suggest next reasoning steps based on current state",
    inputSchema: z.object({
      sessionId: z.string().optional(),
      limit: z.number().min(1).max(10).default(3),
      context: z.string().optional(),
    }),
  },
  {
    name: "axerey_get_reasoning_trace",
    description: "Get complete reasoning trace for a session",
    inputSchema: z.object({
      sessionId: z.string(),
    }),
  },
];

/**
 * Map Axerey tool names to MCP tool names
 */
const AXEREY_TO_MCP_MAP: Record<string, string> = {
  axerey_memorize: "memorize",
  axerey_recall: "recall",
  axerey_search: "search",
  axerey_update: "update",
  axerey_forget: "forget",
  axerey_pin: "pin",
  axerey_mind_balance: "mind.balance",
  axerey_steelman: "argument.steelman",
  axerey_strawman: "argument.strawman",
  axerey_strawman_to_steelman: "argument.pipeline.strawman-to-steelman",
  axerey_reasoning_step: "reasoning_step",
  axerey_memory_connect: "memory_connect",
  axerey_verify_memory: "verify_memory",
  axerey_evaluate_memory_quality: "evaluate_memory_quality",
  axerey_save_reasoning_state: "save_reasoning_state",
  axerey_load_reasoning_state: "load_reasoning_state",
  axerey_suggest_next_steps: "suggest_next_steps",
  axerey_get_reasoning_trace: "get_reasoning_trace",
};

export class AxereyToolBridge {
  private mcpServerUrl?: string;
  private mcpServer?: any; // MCP Server instance if available
  private allTools: AxereyTool[];

  constructor() {
    // Combine all tools
    this.allTools = [
      ...MEMORY_TOOLS,
      ...REASONING_TOOLS,
      ...SMART_THINKING_TOOLS,
    ];
  }

  /**
   * Convert Zod schema to JSON Schema for Ollama
   */
  private convertZodToJSONSchema(schema: z.ZodType<any>): any {
    try {
      // Use type assertion to avoid TypeScript's excessive depth error
      return zodToJsonSchema(schema as any, { target: "openApi3" }) as any;
    } catch (error) {
      console.error("Error converting Zod schema:", error);
      // Fallback to basic schema
      return {
        type: "object",
        properties: {},
        additionalProperties: true,
      };
    }
  }

  /**
   * Convert Axerey tool to Ollama tool format
   */
  convertToOllamaTool(tool: AxereyTool): any {
    return {
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: this.convertZodToJSONSchema(tool.inputSchema),
      },
    };
  }

  /**
   * Get all Axerey tools as Ollama tools
   */
  getAllOllamaTools(): Array<any> {
    return this.allTools.map((tool) => this.convertToOllamaTool(tool));
  }

  /**
   * Get tools by category
   */
  getMemoryTools(): Array<any> {
    return MEMORY_TOOLS.map((tool) => this.convertToOllamaTool(tool));
  }

  getReasoningTools(): Array<any> {
    return REASONING_TOOLS.map((tool) => this.convertToOllamaTool(tool));
  }

  /**
   * Map Ollama tool name back to Axerey/MCP tool name
   */
  getMCPToolName(ollamaToolName: string): string {
    return (
      AXEREY_TO_MCP_MAP[ollamaToolName] || ollamaToolName.replace("axerey_", "")
    );
  }

  /**
   * Execute a tool call via MCP server
   * This will be implemented to call the actual MCP server
   */
  async executeToolCall(toolCall: {
    name: string;
    arguments: any;
  }): Promise<string> {
    const mcpToolName = this.getMCPToolName(toolCall.name);

    // TODO: Implement actual MCP server call
    // For now, return a placeholder
    // In production, this would:
    // 1. Connect to MCP server
    // 2. Call the tool with arguments
    // 3. Return the result as a string

    console.log(
      `[AxereyToolBridge] Executing tool: ${mcpToolName}`,
      toolCall.arguments,
    );

    // Placeholder implementation
    // In the full implementation, this would call the MCP server
    return JSON.stringify({
      tool: mcpToolName,
      arguments: toolCall.arguments,
      result: "Tool execution will be implemented with MCP server integration",
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Validate tool arguments against schema
   */
  validateToolArguments(
    toolName: string,
    args: any,
  ): { valid: boolean; error?: string } {
    const tool = this.allTools.find((t) => t.name === toolName);
    if (!tool) {
      return { valid: false, error: `Tool ${toolName} not found` };
    }

    try {
      tool.inputSchema.parse(args);
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          error: `Validation error: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`,
        };
      }
      return { valid: false, error: "Unknown validation error" };
    }
  }
}

export const axereyToolBridge = new AxereyToolBridge();
export default axereyToolBridge;
