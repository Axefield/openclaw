/**
 * Grammar Loader and Validator
 *
 * Loads GBNF grammar files, compiles them for llama.cpp,
 * and validates model outputs against grammars
 */

import * as fs from "fs";
import * as path from "path";

export interface GrammarRule {
  name: string;
  definition: string;
}

export interface CompiledGrammar {
  name: string;
  source: string;
  rules: GrammarRule[];
  compiled: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  parsed?: any;
}

export type GrammarName =
  | "strict_json"
  | "mcp_action"
  | "memory/memorize"
  | "memory/recall"
  | "memory/search"
  | "memory/update"
  | "memory/forget"
  | "memory/pin"
  | "reasoning/mind_balance"
  | "reasoning/steelman"
  | "reasoning/strawman"
  | "reasoning/strawman_to_steelman"
  | "reasoning/reasoning_step"
  | "reasoning/memory_connect";

const GRAMMAR_DIR = path.join(__dirname, "grammars");

export class GrammarLoader {
  private grammarCache: Map<string, CompiledGrammar> = new Map();

  async load(grammarName: GrammarName): Promise<CompiledGrammar> {
    const cached = this.grammarCache.get(grammarName);
    if (cached) return cached;

    const grammarPath = path.join(GRAMMAR_DIR, `${grammarName}.gbnf`);

    if (!fs.existsSync(grammarPath)) {
      throw new Error(`Grammar not found: ${grammarName} at ${grammarPath}`);
    }

    const source = fs.readFileSync(grammarPath, "utf-8");
    const rules = this.parseGBNF(source);
    const compiled = this.compileToLlamaCpp(rules);

    const grammar: CompiledGrammar = {
      name: grammarName,
      source,
      rules,
      compiled,
    };

    this.grammarCache.set(grammarName, grammar);
    return grammar;
  }

  private parseGBNF(source: string): GrammarRule[] {
    const rules: GrammarRule[] = [];
    const lines = source.split("\n");

    let currentRule: { name: string; definition: string } | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const ruleMatch = trimmed.match(/^(\w+)\s*::=\s*(.+)$/);
      if (ruleMatch) {
        if (currentRule) {
          rules.push(currentRule);
        }
        currentRule = {
          name: ruleMatch[1],
          definition: ruleMatch[2].trim(),
        };
      } else if (currentRule && trimmed) {
        currentRule.definition += " " + trimmed;
      }
    }

    if (currentRule) {
      rules.push(currentRule);
    }

    return rules;
  }

  private compileToLlamaCpp(rules: GrammarRule[]): string {
    const grammar: Record<string, any> = {};

    for (const rule of rules) {
      grammar[rule.name] = this.ruleToLlamaCpp(rule.definition, rules);
    }

    return JSON.stringify(grammar);
  }

  private ruleToLlamaCpp(definition: string, allRules: GrammarRule[]): any {
    const tokens = this.tokenize(definition);
    return this.tokensToLlamaCpp(tokens, allRules);
  }

  private tokenize(definition: string): string[] {
    const tokens: string[] = [];
    let current = "";
    let inString = false;
    let escapeNext = false;

    for (const char of definition) {
      if (escapeNext) {
        current += char;
        escapeNext = false;
        continue;
      }

      if (char === "\\") {
        escapeNext = true;
        current += char;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        current += char;
        continue;
      }

      if (inString) {
        current += char;
        continue;
      }

      if (/\s/.test(char)) {
        if (current) {
          tokens.push(current);
          current = "";
        }
        continue;
      }

      current += char;
    }

    if (current) {
      tokens.push(current);
    }

    return tokens;
  }

  private tokensToLlamaCpp(tokens: string[], allRules: GrammarRule[]): any {
    if (tokens.length === 0) {
      return { type: "empty" };
    }

    if (tokens.length === 1) {
      return this.singleTokenToLlamaCpp(tokens[0], allRules);
    }

    const alternatives: any[] = [];
    let currentAlt: any[] = [];
    let inAlternative = false;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token === "|") {
        if (currentAlt.length > 0) {
          alternatives.push(
            currentAlt.length === 1
              ? currentAlt[0]
              : { type: "sequence", seq: currentAlt },
          );
          currentAlt = [];
        }
        inAlternative = true;
        continue;
      }

      if (token === "(") {
        let depth = 1;
        let groupEnd = i + 1;
        while (depth > 0 && groupEnd < tokens.length) {
          if (tokens[groupEnd] === "(") depth++;
          if (tokens[groupEnd] === ")") depth--;
          groupEnd++;
        }
        const groupTokens = tokens.slice(i + 1, groupEnd - 1);
        currentAlt.push(this.tokensToLlamaCpp(groupTokens, allRules));
        i = groupEnd - 1;
        continue;
      }

      if (token === "[") {
        let depth = 1;
        let optEnd = i + 1;
        while (depth > 0 && optEnd < tokens.length) {
          if (tokens[optEnd] === "[") depth++;
          if (tokens[optEnd] === "]") depth--;
          optEnd++;
        }
        const optTokens = tokens.slice(i + 1, optEnd - 1);
        const optRule = this.tokensToLlamaCpp(optTokens, allRules);
        currentAlt.push({ type: "option", opt: [optRule] });
        i = optEnd - 1;
        continue;
      }

      currentAlt.push(this.singleTokenToLlamaCpp(token, allRules));
    }

    if (currentAlt.length > 0) {
      alternatives.push(
        currentAlt.length === 1
          ? currentAlt[0]
          : { type: "sequence", seq: currentAlt },
      );
    }

    if (alternatives.length === 1) {
      return alternatives[0];
    }

    return { type: "alternatives", alt: alternatives };
  }

  private singleTokenToLlamaCpp(token: string, allRules: GrammarRule[]): any {
    if (token.startsWith('"') && token.endsWith('"')) {
      const literal = token
        .slice(1, -1)
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");
      return { type: "literal", value: literal };
    }

    if (token === "string") {
      return {
        type: "rule",
        name: "string",
        definition: { type: "regex", regex: ".*" },
      };
    }

    if (token === "number") {
      return { type: "regex", regex: "-?[0-9]+" };
    }

    if (token === "boolean") {
      return { type: "regex", regex: "true|false" };
    }

    if (token.startsWith('"') || token.startsWith("'")) {
      const literal = token.slice(1, -1);
      return { type: "literal", value: literal };
    }

    if (token === "*" || token === "+" || token === "?") {
      return { type: "repeat", op: token };
    }

    const ruleExists = allRules.find((r) => r.name === token);
    if (ruleExists) {
      return { type: "rule", name: token };
    }

    return { type: "regex", regex: token };
  }

  listAvailable(): GrammarName[] {
    const available: GrammarName[] = [
      "strict_json",
      "mcp_action",
      "memory/memorize",
      "memory/recall",
      "memory/search",
      "memory/update",
      "memory/forget",
      "memory/pin",
      "reasoning/mind_balance",
      "reasoning/steelman",
      "reasoning/strawman",
      "reasoning/strawman_to_steelman",
      "reasoning/reasoning_step",
      "reasoning/memory_connect",
    ];
    return available;
  }
}

export class GrammarValidator {
  constructor(private loader: GrammarLoader) {}

  async validate(
    grammarName: GrammarName,
    output: string,
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
      const grammar = await this.loader.load(grammarName);

      const parsed = JSON.parse(output);

      return {
        valid: true,
        errors: [],
        parsed,
      };
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "Unknown parse error");
      return {
        valid: false,
        errors,
      };
    }
  }

  async validateStrict(
    grammarName: GrammarName,
    output: string,
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
      const grammar = await this.loader.load(grammarName);

      let parsed: any;
      try {
        parsed = JSON.parse(output);
      } catch {
        errors.push("Output is not valid JSON");
        return { valid: false, errors };
      }

      const schemaErrors = this.validateAgainstSchema(grammarName, parsed);
      errors.push(...schemaErrors);

      return {
        valid: errors.length === 0,
        errors,
        parsed,
      };
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "Unknown validation error");
      return { valid: false, errors };
    }
  }

  private validateAgainstSchema(
    grammarName: GrammarName,
    parsed: any,
  ): string[] {
    const errors: string[] = [];

    switch (grammarName) {
      case "mcp_action":
        if (!parsed.name) errors.push("Missing required field: name");
        if (!parsed.arguments) errors.push("Missing required field: arguments");
        break;

      case "memory/memorize":
        if (!parsed.name || parsed.name !== "axerey_memorize")
          errors.push("Invalid tool name");
        if (!parsed.arguments?.text)
          errors.push("Missing required field: arguments.text");
        break;

      case "memory/recall":
        if (!parsed.name || parsed.name !== "axerey_recall")
          errors.push("Invalid tool name");
        if (!parsed.arguments?.query && !parsed.arguments?.limit) {
          errors.push(
            "At least one of arguments.query or arguments.limit required",
          );
        }
        break;

      case "memory/search":
        if (!parsed.name || parsed.name !== "axerey_search")
          errors.push("Invalid tool name");
        if (!parsed.arguments?.query)
          errors.push("Missing required field: arguments.query");
        break;

      case "memory/update":
        if (!parsed.name || parsed.name !== "axerey_update")
          errors.push("Invalid tool name");
        if (!parsed.arguments?.id)
          errors.push("Missing required field: arguments.id");
        if (!parsed.arguments?.text)
          errors.push("Missing required field: arguments.text");
        break;

      case "memory/forget":
        if (!parsed.name || parsed.name !== "axerey_forget")
          errors.push("Invalid tool name");
        if (!parsed.arguments?.id)
          errors.push("Missing required field: arguments.id");
        break;

      case "memory/pin":
        if (!parsed.name || parsed.name !== "axerey_pin")
          errors.push("Invalid tool name");
        if (!parsed.arguments?.id)
          errors.push("Missing required field: arguments.id");
        if (parsed.arguments?.pinned === undefined)
          errors.push("Missing required field: arguments.pinned");
        break;

      case "reasoning/mind_balance":
        if (!parsed.name || parsed.name !== "axerey_mind_balance")
          errors.push("Invalid tool name");
        if (!parsed.arguments?.topic)
          errors.push("Missing required field: arguments.topic");
        if (!parsed.arguments?.mode)
          errors.push("Missing required field: arguments.mode");
        break;

      case "reasoning/steelman":
        if (!parsed.name || parsed.name !== "axerey_steelman")
          errors.push("Invalid tool name");
        if (!parsed.arguments?.opponentClaim)
          errors.push("Missing required field: arguments.opponentClaim");
        break;

      case "reasoning/strawman":
        if (!parsed.name || parsed.name !== "axerey_strawman")
          errors.push("Invalid tool name");
        if (!parsed.arguments?.originalClaim)
          errors.push("Missing required field: arguments.originalClaim");
        break;

      case "reasoning/strawman_to_steelman":
        if (!parsed.name || parsed.name !== "axerey_strawman_to_steelman")
          errors.push("Invalid tool name");
        if (!parsed.arguments?.originalClaim)
          errors.push("Missing required field: arguments.originalClaim");
        break;
    }

    return errors;
  }
}

export const grammarLoader = new GrammarLoader();
export const grammarValidator = new GrammarValidator(grammarLoader);
