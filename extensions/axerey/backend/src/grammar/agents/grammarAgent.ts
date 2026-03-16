/**
 * Grammar Agent Base Class
 *
 * Single-output, no-retry agent bound to one grammar.
 * Guarantees grammar-valid output through GBNF enforcement.
 */

import { OllamaService, OllamaChatRequest } from "../../services/ollamaService";
import { GrammarName, grammarLoader, grammarValidator } from "../index";

export interface GrammarAgentOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  think?: boolean | "low" | "medium" | "high";
}

export interface GrammarAgentResult {
  output: any;
  raw: string;
  grammar: GrammarName;
  validated: boolean;
  validationErrors: string[];
  timing: {
    start: number;
    end: number;
    duration: number;
  };
}

export interface AgentSystemPromptConfig {
  identity: string;
  constraints: string[];
  outputFormat: string;
  examples?: string[];
}

const DEFAULT_SYSTEM_PROMPTS: Record<GrammarName, AgentSystemPromptConfig> = {
  strict_json: {
    identity: "JSON Generator",
    constraints: [
      "Output ONLY valid JSON",
      "No explanations, no conversational text",
      "No markdown code blocks",
      "Single output only",
    ],
    outputFormat: "Valid JSON object",
  },
  mcp_action: {
    identity: "MCP Action Agent",
    constraints: [
      "Output ONLY valid JSON matching MCP action format",
      "Use correct tool names from axerey_* namespace",
      "Include all required arguments for the tool",
      "No explanations, no conversational text",
      "Single output only",
    ],
    outputFormat: '{"name": "tool_name", "arguments": {...}}',
  },
  "memory/memorize": {
    identity: "Memory Agent",
    constraints: [
      "Output ONLY valid JSON for axerey_memorize tool",
      "Include required fields: text, tags, importance, type, source",
      "No explanations, no conversational text",
      "Single output only",
    ],
    outputFormat:
      '{"name": "axerey_memorize", "arguments": {"text": "...", "tags": [...], ...}}',
  },
  "memory/recall": {
    identity: "Memory Recall Agent",
    constraints: [
      "Output ONLY valid JSON for axerey_recall tool",
      "At least one of query or limit required",
      "No explanations, no conversational text",
      "Single output only",
    ],
    outputFormat:
      '{"name": "axerey_recall", "arguments": {"query": "...", "limit": N}}',
  },
  "memory/search": {
    identity: "Semantic Search Agent",
    constraints: [
      "Output ONLY valid JSON for axerey_search tool",
      "Query field is required",
      "No explanations, no conversational text",
      "Single output only",
    ],
    outputFormat:
      '{"name": "axerey_search", "arguments": {"query": "...", ...}}',
  },
  "memory/update": {
    identity: "Memory Update Agent",
    constraints: [
      "Output ONLY valid JSON for axerey_update tool",
      "Both id and text fields required",
      "No explanations, no conversational text",
      "Single output only",
    ],
    outputFormat:
      '{"name": "axerey_update", "arguments": {"id": "...", "text": "...}}',
  },
  "memory/forget": {
    identity: "Memory Delete Agent",
    constraints: [
      "Output ONLY valid JSON for axerey_forget tool",
      "Id field is required",
      "No explanations, no conversational text",
      "Single output only",
    ],
    outputFormat: '{"name": "axerey_forget", "arguments": {"id": "..."}}',
  },
  "memory/pin": {
    identity: "Memory Pin Agent",
    constraints: [
      "Output ONLY valid JSON for axerey_pin tool",
      "Both id and pinned fields required",
      "No explanations, no conversational text",
      "Single output only",
    ],
    outputFormat:
      '{"name": "axerey_pin", "arguments": {"id": "...", "pinned": true|false}}',
  },
  "reasoning/mind_balance": {
    identity: "Decision Analysis Agent",
    constraints: [
      "Output ONLY valid JSON for axerey_mind_balance tool",
      "Required fields: topic, theta, phi, cosine, tangent, mode",
      "No explanations, no conversational text",
      "Single output only",
    ],
    outputFormat:
      '{"name": "axerey_mind_balance", "arguments": {"topic": "...", "theta": N, ...}}',
  },
  "reasoning/steelman": {
    identity: "Argument Steelman Agent",
    constraints: [
      "Output ONLY valid JSON for axerey_steelman tool",
      "Required field: opponentClaim",
      "No explanations, no conversational text",
      "Single output only",
    ],
    outputFormat:
      '{"name": "axerey_steelman", "arguments": {"opponentClaim": "...", ...}}',
  },
  "reasoning/strawman": {
    identity: "Argument Analysis Agent",
    constraints: [
      "Output ONLY valid JSON for axerey_strawman tool",
      "Required field: originalClaim",
      "No explanations, no conversational text",
      "Single output only",
    ],
    outputFormat:
      '{"name": "axerey_strawman", "arguments": {"originalClaim": "...", ...}}',
  },
  "reasoning/strawman_to_steelman": {
    identity: "Argument Transform Agent",
    constraints: [
      "Output ONLY valid JSON for axerey_strawman_to_steelman tool",
      "Required field: originalClaim",
      "No explanations, no conversational text",
      "Single output only",
    ],
    outputFormat:
      '{"name": "axerey_strawman_to_steelman", "arguments": {"originalClaim": "...", ...}}',
  },
  "reasoning/reasoning_step": {
    identity: "Reasoning Step Agent",
    constraints: [
      "Output ONLY valid JSON for axerey_reasoning_step tool",
      "Required field: action",
      "No explanations, no conversational text",
      "Single output only",
    ],
    outputFormat:
      '{"name": "axerey_reasoning_step", "arguments": {"action": "start|complete|fail", ...}}',
  },
  "reasoning/memory_connect": {
    identity: "Memory Connection Agent",
    constraints: [
      "Output ONLY valid JSON for axerey_memory_connect tool",
      "Required fields: sourceId, targetId, connectionType, strength, inferred",
      "No explanations, no conversational text",
      "Single output only",
    ],
    outputFormat:
      '{"name": "axerey_memory_connect", "arguments": {"sourceId": "...", ...}}',
  },
};

export class GrammarAgent {
  protected grammar: GrammarName;
  protected model: string;
  protected temperature: number;
  protected think: boolean | "low" | "medium" | "high";
  protected ollama: OllamaService;

  constructor(grammar: GrammarName, options: GrammarAgentOptions = {}) {
    this.grammar = grammar;
    this.model = options.model || "qwen3";
    this.temperature = options.temperature ?? 0.1;
    this.think = options.think ?? false;
    this.ollama = new OllamaService();
  }

  protected buildSystemPrompt(): string {
    const config = DEFAULT_SYSTEM_PROMPTS[this.grammar];

    return `You are ${config.identity}.
Your role is to output grammar-constrained data.

CRITICAL CONSTRAINTS:
${config.constraints.map((c) => `- ${c}`).join("\n")}

OUTPUT FORMAT:
${config.outputFormat}

Output ONLY the JSON. No explanations.`;
  }

  protected extractJSON(text: string): string {
    let trimmed = text.trim();

    if (trimmed.startsWith("```json")) {
      trimmed = trimmed.slice(7);
    } else if (trimmed.startsWith("```")) {
      trimmed = trimmed.slice(3);
    }

    if (trimmed.endsWith("```")) {
      trimmed = trimmed.slice(0, -3);
    }

    return trimmed.trim();
  }

  async execute(input: string): Promise<GrammarAgentResult> {
    const startTime = Date.now();

    const grammar = await grammarLoader.load(this.grammar);

    const messages: OllamaChatRequest["messages"] = [
      {
        role: "system",
        content: this.buildSystemPrompt(),
      },
      {
        role: "user",
        content: input,
      },
    ];

    const response = await this.ollama.chat(messages, this.model, {
      temperature: this.temperature,
      think: this.think,
    });
    const raw = response.content;
    const extracted = this.extractJSON(raw);

    const validation = await grammarValidator.validateStrict(
      this.grammar,
      extracted,
    );

    const endTime = Date.now();

    return {
      output: validation.parsed || null,
      raw: extracted,
      grammar: this.grammar,
      validated: validation.valid,
      validationErrors: validation.errors,
      timing: {
        start: startTime,
        end: endTime,
        duration: endTime - startTime,
      },
    };
  }

  getGrammar(): GrammarName {
    return this.grammar;
  }

  setModel(model: string): void {
    this.model = model;
  }

  setTemperature(temperature: number): void {
    this.temperature = temperature;
  }
}

export function createGrammarAgent(
  grammar: GrammarName,
  options?: GrammarAgentOptions,
): GrammarAgent {
  return new GrammarAgent(grammar, options);
}
