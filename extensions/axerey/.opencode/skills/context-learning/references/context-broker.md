# Get Context

Retrieve the most relevant memories for specific tasks using the context broker with Smart-Thinking enhancements.

## Usage
Use this command when you need to:
- Get context for planning tasks
- Retrieve relevant memories for execution
- Find information for code review
- Access task-specific knowledge
- Get curated memory sets
- Expand context using memory connections

## Task Types
- **planning**: Memories relevant for planning and design
- **execution**: Memories needed for implementation
- **review**: Memories for testing and review processes

## Example Usage
```
Get context for: planning
Tags: ["typescript", "backend"]
Number of memories: 5
```

## Parameters
- **task**: planning, execution, or review (required)
- **tags**: Filter by specific tags (optional)
- **k**: Number of memories to retrieve (1-20, default: 5)

## Smart-Thinking Enhancements

### Connection-Based Expansion
Context broker automatically expands context using memory connections:
- Retrieves related memories via connections
- Follows connection chains (supports, derives, exemplifies)
- Boosts connected memories in ranking
- Uses connection strength for relevance

### Trading Pattern Integration
For trading-related queries:
- Identifies trading patterns from successful outcomes
- Connects trades with similar setups
- Uses rule extraction for pattern matching
- Prioritizes high-win-rate patterns

### Adaptive Ranking
Context selection uses adaptive ranking:
- Learns from outcome feedback
- Adjusts weights based on helpfulness
- Prioritizes verified and high-quality memories
- Considers connection strength and type

### Quality-Aware Selection
Context broker considers:
- Memory quality metrics (confidence, relevance, reliability)
- Verification status
- Connection strength
- Usage patterns and outcomes

## Benefits
- Task-specific memory retrieval
- Optimized context for current work
- Reduced information overload
- Better decision making
- Improved task performance
- Connection-aware context expansion
- Pattern-based memory discovery
