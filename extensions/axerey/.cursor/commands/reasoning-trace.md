# Reasoning Trace

Get complete reasoning trace for a session, showing all steps with status and justifications.

## Usage
Use this command when you need to:
- Review reasoning history
- Understand decision-making process
- Debug reasoning issues
- Analyze reasoning patterns
- Learn from past reasoning

## Trace Contents

Complete trace includes:
- All reasoning steps in chronological order
- Step status (in_progress, completed, failed)
- Step duration and timing
- Justifications for each step
- Parent-child relationships
- Step details and metadata

## Example Usage
```
Get reasoning trace:
Session ID: session-123
```

## Parameters
- **sessionId**: Session identifier (required)

## Trace Format

Returns timeline of steps:
```json
{
  "sessionId": "session-123",
  "steps": [
    {
      "id": "step-1",
      "kind": "context",
      "label": "Gather relevant memories",
      "status": "completed",
      "startedAt": 1234567890,
      "completedAt": 1234567900,
      "duration": 10,
      "justifications": [...]
    },
    ...
  ]
}
```

## Benefits
- **Transparency**: Understand how decisions were made
- **Learning**: Learn from successful reasoning patterns
- **Debugging**: Identify where reasoning went wrong
- **Optimization**: Improve reasoning efficiency
- **Documentation**: Document reasoning process

## Use Cases

### Review Session
Review complete reasoning trace to understand how conclusions were reached.

### Pattern Analysis
Analyze traces to identify successful reasoning patterns.

### Debugging
Use traces to identify where reasoning failed or produced unexpected results.

### Learning
Study traces to improve reasoning skills and patterns.

## Best Practices
- Review traces regularly to improve reasoning
- Use traces to identify optimization opportunities
- Share traces for collaborative learning
- Use traces for documentation
- Analyze traces for pattern discovery

## UI Integration

Traces are displayed in:
- Reasoning Timeline view
- Step-by-step visualization
- Status and duration indicators
- Justification details

