---
name: memory-operations
description: Memory management - memorize, recall, search with Axerey memory system
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: memory
---

# Memory Operations Skill

## Overview

Manage persistent memory using Axerey's dual storage system (SQLite + vector search).

## Available Tools

- `axerey_memorize` - Store new memories
- `axerey_recall` - Retrieve by query or recent
- `axerey_search` - Semantic vector search
- `axerey_update` - Modify existing memory
- `axerey_forget` - Delete memory
- `axerey_pin` - Pin/unpin for quick access
- `axerey_memory_connect` - Create relationships

## When to Use

- Storing conclusions from analysis
- Retrieving context before new tasks
- Building connected knowledge graphs
- Quick access to pinned items

## Examples

### Memorize with tags

```
memorize({
  text: "NeoCheyenne uses economic simulation for strategy",
  tags: ["neocheyenne", "economic-sim", "strategy"],
  importance: 0.8,
  type: "semantic",
  source: "analysis"
})
```

### Recall recent

```
recall({
  query: "",
  limit: 5
})
```

### Semantic search

```
search({
  query: "investment thesis on semisweet jacket",
  limit: 10
})
```

### Connect related memories

```
memory_connect({
  sourceId: "memory-id-1",
  targetId: "memory-id-2",
  connectionType: "supports",
  strength: 0.8
})
```

## Best Practices

1. Always tag with persona for isolation
2. Set importance based on lasting value
3. Connect related memories for context expansion
4. Pin frequently accessed items
