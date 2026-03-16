# GBNF Grammar Enforcement Pipeline - Specification

> **Version**: 1.0.0  
> **Last Updated**: 2026-02-17  
> **Status**: Implemented

## Overview

The GBNF Grammar Enforcement Pipeline guarantees deterministic, machine-ingestable outputs from LLMs by enforcing hard grammar constraints (GBNF) through Ollama/llama.cpp. This system transforms LLM outputs from probabilistic strings into structured, validated data that can be safely consumed by downstream systems like MCP.

---

## Core Principles

1. **Grammar as Authority**: GBNF defines possibility, not prompts
2. **Single Output**: One grammar-valid response per invocation
3. **Fail-Safe**: Invalid outputs trigger errors, never execution
4. **Observable**: All grammar operations are tracked and governed

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│   Client    │────▶│  RouterAgent │────▶│ GrammarAgent  │
└─────────────┘     └──────────────┘     └───────────────┘
                           │                     │
                           ▼                     ▼
                    ┌──────────────┐     ┌───────────────┐
                    │   Grammar    │     │   Validator   │
                    │    Loader    │     │               │
                    └──────────────┘     └───────────────┘
                                              │
                                              ▼
                                       ┌───────────────┐
                                       │    MCP        │
                                       │   Execution   │
                                       └───────────────┘
```

---

## Directory Structure

```
backend/src/grammar/
├── index.ts                    # GrammarLoader + GrammarValidator
├── observability.ts             # Metrics, governance, health checks
├── agents/
│   ├── index.ts                # Agent exports
│   ├── grammarAgent.ts         # Single-output grammar agent
│   └── routerAgent.ts          # Intent → grammar routing
└── grammars/
    ├── strict_json.gbnf        # Generic JSON output
    ├── mcp_action.gbnf        # Generic MCP tool call
    ├── memory/
    │   ├── memorize.gbnf       # Store memories
    │   ├── recall.gbnf         # Retrieve memories
    │   ├── search.gbnf         # Semantic search
    │   ├── update.gbnf         # Modify memory
    │   ├── forget.gbnf         # Delete memory
    │   └── pin.gbnf            # Pin/unpin memory
    └── reasoning/
        ├── mind_balance.gbnf   # Probabilistic decision-making
        ├── steelman.gbnf       # Strengthen arguments
        ├── strawman.gbnf       # Analyze fallacies
        ├── strawman_to_steelman.gbnf
        ├── reasoning_step.gbnf
        └── memory_connect.gbnf
```

---

## Available Grammars

### Core Grammars

| Grammar       | Description           | Required Fields     |
| ------------- | --------------------- | ------------------- |
| `strict_json` | Generic JSON output   | Valid JSON object   |
| `mcp_action`  | Generic MCP tool call | `name`, `arguments` |

### Memory Tool Grammars

| Grammar           | Tool              | Required Fields                                              |
| ----------------- | ----------------- | ------------------------------------------------------------ |
| `memory/memorize` | `axerey_memorize` | `text`, `tags`, `importance`, `type`, `source`, `confidence` |
| `memory/recall`   | `axerey_recall`   | `query` or `limit`                                           |
| `memory/search`   | `axerey_search`   | `query`                                                      |
| `memory/update`   | `axerey_update`   | `id`, `text`                                                 |
| `memory/forget`   | `axerey_forget`   | `id`                                                         |
| `memory/pin`      | `axerey_pin`      | `id`, `pinned`                                               |

### Reasoning Tool Grammars

| Grammar                          | Tool                          | Required Fields                                                  |
| -------------------------------- | ----------------------------- | ---------------------------------------------------------------- |
| `reasoning/mind_balance`         | `axerey_mind_balance`         | `topic`, `theta`, `phi`, `cosine`, `tangent`, `mode`             |
| `reasoning/steelman`             | `axerey_steelman`             | `opponentClaim`                                                  |
| `reasoning/strawman`             | `axerey_strawman`             | `originalClaim`                                                  |
| `reasoning/strawman_to_steelman` | `axerey_strawman_to_steelman` | `originalClaim`                                                  |
| `reasoning/reasoning_step`       | `axerey_reasoning_step`       | `action`                                                         |
| `reasoning/memory_connect`       | `axerey_memory_connect`       | `sourceId`, `targetId`, `connectionType`, `strength`, `inferred` |

---

## API Endpoints

### List Available Grammars

```bash
GET /api/ollama/grammar/list

Response:
{
  "success": true,
  "data": {
    "grammars": ["strict_json", "mcp_action", ...],
    "count": 14
  }
}
```

### Route Intent

```bash
POST /api/ollama/grammar/route
{
  "message": "Remember that I prefer TypeScript",
  "model": "qwen3",
  "think": true
}

Response:
{
  "success": true,
  "data": {
    "targetGrammar": "memory/memorize",
    "agentType": "memory",
    "confidence": 0.95,
    "reasoning": "User wants to store a preference in memory",
    "extractedParams": {}
  }
}
```

### Grammar-Enforced Chat

```bash
POST /api/ollama/grammar/chat
{
  "message": "Remember that I prefer TypeScript over JavaScript",
  "grammar": "memory/memorize",
  "model": "qwen3",
  "think": false,
  "temperature": 0.1
}

Response:
{
  "success": true,
  "data": {
    "output": {
      "name": "axerey_memorize",
      "arguments": {
        "text": "User prefers TypeScript over JavaScript",
        "tags": ["preference", "programming"],
        "importance": 0.8,
        "type": "episodic",
        "source": "execution",
        "confidence": 1.0
      }
    },
    "raw": "{\"name\":\"axerey_memorize\",...}",
    "grammar": "memory/memorize",
    "validated": true,
    "validationErrors": [],
    "timing": {
      "start": 1700000000000,
      "end": 1700000001500,
      "duration": 1500
    }
  }
}
```

### Validate Output

```bash
POST /api/ollama/grammar/validate
{
  "output": "{\"name\":\"axerey_memorize\",\"arguments\":{...}}",
  "grammar": "memory/memorize"
}

Response:
{
  "success": true,
  "data": {
    "valid": true,
    "errors": [],
    "parsed": {...}
  }
}
```

---

## Usage Examples

### TypeScript Usage

```typescript
import { createGrammarAgent, createRouterAgent } from "./grammar/agents";

// Option 1: Direct grammar execution
const agent = createGrammarAgent("memory/memorize", {
  model: "qwen3",
  temperature: 0.1,
});

const result = await agent.execute("Remember my coffee preference: oat milk");
console.log(result.output); // Validated MCP action

// Option 2: Route first, then execute
const router = createRouterAgent();
const decision = await router.route("Find my notes about the meeting");

if (decision.confidence > 0.8) {
  const agent = createGrammarAgent(decision.targetGrammar);
  const result = await agent.execute(decision.extractedParams.query);
}
```

---

## Governance & Observability

### Metrics Tracked

- Total calls per grammar
- Success/failure rates
- Average duration
- Last called/success/failure timestamps

### Health Checks

```typescript
import { getGrammarHealth, grammarMetrics } from "./grammar/observability";

const health = getGrammarHealth("memory/memorize");
// {
//   healthy: true,
//   failureRate: 0.02,
//   averageDuration: 1200,
//   quarantined: false,
//   recommendation: 'OK'
// }

// Get full governance report
const report = grammarMetrics.getGovernanceReport();
```

### Quarantine System

Grammars are automatically quarantined when:

- Failure rate exceeds 50%
- Or configurable threshold

Quarantined grammars cannot be executed until manually lifted.

---

## Error Handling

| Error                                    | Cause                    | Resolution                               |
| ---------------------------------------- | ------------------------ | ---------------------------------------- |
| `Invalid grammar: x`                     | Grammar not found        | Use `/grammar/list` to see valid options |
| `Output is not valid JSON`               | Model output malformed   | Retry with different temperature/model   |
| `Missing required field: arguments.text` | Schema validation failed | Check grammar requirements               |
| `Grammar QUARANTINED`                    | High failure rate        | Review errors, lift quarantine           |

---

## Model Recommendations

| Use Case           | Recommended Model |
| ------------------ | ----------------- |
| Simple JSON output | `qwen2.5:1.5b`    |
| Complex tool calls | `qwen3`           |
| Reasoning/analysis | `deepseek-r1`     |
| High accuracy      | `qwen3:14b`       |

---

## Future Enhancements

- [ ] JSON Schema to GBNF converter
- [ ] Grammar versioning system
- [ ] A/B testing for grammar variants
- [ ] Streaming grammar validation
- [ ] Custom grammar editor UI
- [ ] Grammar diff/migration tools

---

## Related Files

- `backend/src/services/ollamaService.ts` - Ollama integration
- `backend/src/services/axereyToolBridge.ts` - Tool definitions
- `backend/src/routes/ollama.ts` - API routes
