# Memory Quality Evaluation

Evaluate memory quality using heuristics to assess usefulness and reliability.

## Usage
Use this command when you need to:
- Assess memory quality and usefulness
- Identify high-quality memories
- Filter memories by quality
- Improve memory quality over time
- Make quality-based decisions

## Quality Metrics

### Confidence Score (0-1)
- Measures certainty and factual basis
- Based on: confidence markers, sources, verification status
- Higher = more certain and well-supported

### Relevance Score (0-1)
- Measures relevance to current context
- Based on: semantic similarity, connection strength, tag overlap
- Higher = more relevant to current task

### Quality Score (0-1)
- Measures structural quality and clarity
- Based on: structure, completeness, clarity, detail level
- Higher = better structured and more complete

### Reliability Score (0-1)
- Overall reliability assessment
- Combines: confidence, verification, usage patterns, importance
- Higher = more reliable and trustworthy

## Example Usage
```
Evaluate memory quality:
Memory ID: memory-id-123
Context: "typescript development"
```

## Parameters
- **memoryId**: ID of memory to evaluate (required)
- **context**: Optional context for relevance calculation

## Quality Heuristics

### Confidence Indicators
- Factual claims with sources
- Verified information
- High confidence values
- Calculation results

### Relevance Indicators
- Semantic similarity to context
- Strong connections to relevant memories
- Tag overlap with current task
- Recent usage patterns

### Quality Indicators
- Well-structured content
- Complete information
- Clear descriptions
- Appropriate detail level

### Reliability Indicators
- Verification status
- Usage frequency
- Importance score
- Connection strength

## Automatic Evaluation

Quality metrics are calculated:
- When memories are created
- When memories are updated
- On-demand via API
- During context broker retrieval

## Benefits
- **Quality Filtering**: Focus on high-quality memories
- **Improvement Guidance**: Identify areas for improvement
- **Decision Support**: Make decisions based on quality
- **Knowledge Curation**: Maintain high-quality knowledge base
- **Performance Optimization**: Prioritize high-quality memories

## UI Integration

Quality metrics are displayed in:
- Memory cards (quality badge)
- Memory detail view (detailed breakdown)
- Graph view (color-coded by quality)
- List view (sortable by quality)

## Best Practices
- Regularly evaluate memory quality
- Use quality scores to prioritize memories
- Improve low-quality memories over time
- Use quality metrics in context broker
- Filter memories by quality when needed

