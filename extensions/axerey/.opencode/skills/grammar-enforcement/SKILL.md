---
name: grammar-enforcement
description: GBNF grammar enforcement for deterministic, validated JSON outputs
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: output
---

# Grammar Enforcement Skill

## Overview

Ensure deterministic, machine-ingestable outputs by enforcing GBNF grammar constraints.

## Purpose

- Transform probabilistic LLM outputs into structured data
- Validate outputs against schemas before execution
- Guarantee MCP tool call format compliance

## Grammar Types

### Core

- `strict_json` - Any valid JSON
- `mcp_action` - MCP tool call format

### Memory

- `memory/memorize` - Store with full schema
- `memory/recall` - Retrieve memories
- `memory/search` - Vector search
- `memory/update` - Modify memory
- `memory/forget` - Delete memory
- `memory/pin` - Pin/unpin

### Reasoning

- `reasoning/mind_balance` - Decision scoring
- `reasoning/steelman` - Argument strengthening
- `reasoning/strawman` - Fallacy analysis
- `reasoning/strawman_to_steelman` - Transform claims

## Usage

### Direct Grammar Output

Generate grammar-valid JSON directly:

```json
{
  "name": "axerey_memorize",
  "arguments": {
    "text": "Investment thesis: NeoCheyenne has strong defensibility",
    "tags": ["neocheyenne", "investment", "defensibility"],
    "importance": 0.9,
    "type": "semantic",
    "source": "analysis",
    "confidence": 1.0
  }
}
```

### Validation

Always validate output against schema:

1. Parse JSON
2. Check required fields
3. Verify field types
4. Confirm tool name matches

## Principles

1. **Grammar is authority** - Schema defines possibility
2. **Single output** - One grammar-valid response
3. **Fail-safe** - Invalid outputs error, never execute
4. **Observable** - Track validation success rates

## Error Handling

- Missing required field → Add field
- Invalid JSON → Retry generation
- Schema mismatch → Correct format
- Validation fails → Never return to user
