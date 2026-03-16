# Memory Connect

Create explicit relationships between memories to build a knowledge graph.

## Usage
Use this command when you need to:
- Link related memories together
- Build knowledge graphs
- Create semantic relationships
- Connect memories by type (supports, contradicts, refines, etc.)

## Connection Types

- **supports**: Memory A supports/validates Memory B
- **contradicts**: Memory A contradicts Memory B
- **refines**: Memory A is a refinement/detail of Memory B
- **derives**: Memory A is derived from Memory B
- **exemplifies**: Memory A is an example of Memory B
- **generalizes**: Memory A generalizes Memory B
- **questions**: Memory A questions/challenges Memory B
- **analyzes**: Memory A analyzes Memory B
- **synthesizes**: Memory A synthesizes Memory B
- **associates**: Memory A is associated with Memory B
- **extends**: Memory A extends/builds upon Memory B
- **applies**: Memory A applies Memory B

## Example Usage
```
Connect memories:
Source: memory-id-1
Target: memory-id-2
Type: supports
Strength: 0.8
Description: "Both memories discuss the same trading strategy"
```

## Parameters
- **sourceId**: ID of the source memory (required)
- **targetId**: ID of the target memory (required)
- **connectionType**: Type of relationship (required)
- **strength**: Connection strength 0-1 (optional, default: 0.5)
- **description**: Human-readable description (optional)
- **inferred**: Whether connection was auto-inferred (default: false)

## Auto-Inference

Connections are automatically inferred when:
- Memories share similar embeddings (similarity > 0.7)
- Memories share multiple meaningful tags
- Memories are in the same session
- Memories have mergedFrom relationships
- Trading memories share successful patterns

## Benefits
- **Graph Visualization**: View memory relationships in graph view
- **Context Expansion**: Context broker uses connections to find related memories
- **Pattern Discovery**: Identify successful patterns and relationships
- **Knowledge Navigation**: Navigate through related memories
- **Trading Analysis**: Connect trades with similar setups and outcomes

## Graph View

Use the Graph View tab in Memory Dashboard to:
- Visualize all connections
- Filter by connection type
- See connection strength
- Navigate between connected memories

## Best Practices
- Use specific connection types for semantic clarity
- Set appropriate strength values (0.7+ for strong connections)
- Add descriptions to explain the relationship
- Review auto-inferred connections and adjust as needed
- Use connections to build knowledge graphs around topics


