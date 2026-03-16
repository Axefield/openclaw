/**
 * Router Agent
 *
 * Non-grammar classifier agent that routes user intent to the appropriate
 * grammar agent. Outputs routing decision, never produces executable output.
 */

import { OllamaService } from "../../services/ollamaService";
import { GrammarName, grammarLoader } from "../index";

export interface RouterDecision {
  targetGrammar: GrammarName;
  agentType: "memory" | "reasoning" | "general";
  confidence: number;
  reasoning: string;
  extractedParams?: Record<string, any>;
}

export interface RouterAgentOptions {
  model?: string;
  think?: boolean | "low" | "medium" | "high";
}

const ROUTER_PROMPT = `You are a router that classifies user requests and selects the appropriate grammar.
You do NOT execute actions - you only determine which grammar agent should handle the request.

GRAMMAR OPTIONS:
- strict_json: For general JSON output, data formatting, structured responses
- mcp_action: When user wants to invoke a specific MCP tool by name
- memory/memorize: When user wants to store a memory, remember something, learn new info
- memory/recall: When user wants to retrieve memories, remember past events
- memory/search: When user wants to search memories semantically
- memory/update: When user wants to modify/update a stored memory
- memory/forget: When user wants to delete a memory
- memory/pin: When user wants to pin/unpin a memory
- reasoning/mind_balance: When user wants probabilistic decision-making with angel/demon scoring
- reasoning/steelman: When user wants to strengthen an argument charitably
- reasoning/strawman: When user wants to analyze an argument for fallacies
- reasoning/strawman_to_steelman: When user wants to transform a distorted argument to its strongest form

RESPOND ONLY WITH JSON in this exact format:
{
  "targetGrammar": "grammar_name",
  "agentType": "memory|reasoning|general",
  "confidence": 0.0-1.0,
  "reasoning": "1-2 sentence explanation",
  "extractedParams": {"any": "relevant parameters extracted from user input"}
}

Never output executable content. Only output the routing decision.`;

export class RouterAgent {
  private model: string;
  private think: boolean | "low" | "medium" | "high";
  private ollama: OllamaService;

  constructor(options: RouterAgentOptions = {}) {
    this.model = options.model || "qwen3";
    this.think = options.think ?? false;
    this.ollama = new OllamaService();
  }

  private extractJSON(text: string): any {
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

  async route(userInput: string): Promise<RouterDecision> {
    const messages = [
      { role: "system", content: ROUTER_PROMPT },
      { role: "user", content: userInput },
    ];

    const response = await this.ollama.chat(messages, this.model, {
      temperature: 0.1,
      think: this.think,
    });

    const extracted = this.extractJSON(response.content);

    try {
      const parsed =
        typeof extracted === "string" ? JSON.parse(extracted) : extracted;

      return {
        targetGrammar: parsed.targetGrammar || "strict_json",
        agentType: parsed.agentType || "general",
        confidence: parsed.confidence ?? 0.5,
        reasoning: parsed.reasoning || "Default routing",
        extractedParams: parsed.extractedParams || {},
      };
    } catch {
      return {
        targetGrammar: "strict_json",
        agentType: "general",
        confidence: 0.0,
        reasoning:
          "Failed to parse routing response, defaulting to strict_json",
        extractedParams: {},
      };
    }
  }

  setModel(model: string): void {
    this.model = model;
  }
}

export function createRouterAgent(options?: RouterAgentOptions): RouterAgent {
  return new RouterAgent(options);
}
