# Reasoning Step Tracker

Track individual steps in reasoning sessions with status, duration, and justifications.

## Usage
Use this command when you need to:
- Track reasoning progress
- Monitor step completion
- Record justifications for decisions
- Build reasoning traces
- Analyze reasoning patterns

## Step Kinds

- **context**: Context gathering and retrieval
- **verification**: Memory verification steps
- **graph**: Graph traversal and connection analysis
- **evaluation**: Memory quality evaluation
- **memory**: Memory operations (create, update, search)
- **planning**: Planning and design steps

## Step Status

- **in_progress**: Step is currently executing
- **completed**: Step finished successfully
- **failed**: Step encountered an error

## Example Usage
```
Start reasoning step:
Kind: context
Label: "Gather relevant memories"
Description: "Retrieve memories for planning task"
```

```
Complete reasoning step:
Step ID: step-123
Justification: "Found 5 relevant memories with high similarity"
```

## Parameters

### Start Step
- **stepId**: Unique step identifier (optional, auto-generated)
- **kind**: Type of reasoning step (required)
- **label**: Human-readable label (optional)
- **description**: Detailed description (optional)
- **parents**: Parent step IDs (optional)
- **details**: Additional metadata (optional)

### Complete Step
- **stepId**: Step identifier (required)
- **justification**: Justification object with:
  - **summary**: Brief summary (required)
  - **heuristics**: Heuristics used (optional)
  - **timestamp**: Timestamp (optional)

### Fail Step
- **stepId**: Step identifier (required)
- **description**: Error description (optional)

## Step Tracking

Steps are stored in `reasoning_steps` table:
- Step metadata (kind, label, description)
- Status and timing (started, completed, duration)
- Parent relationships (for hierarchical steps)
- Justifications and details

## Benefits
- **Progress Tracking**: Monitor reasoning progress
- **Debugging**: Identify where reasoning fails
- **Learning**: Analyze successful reasoning patterns
- **Transparency**: Understand decision-making process
- **Optimization**: Improve reasoning efficiency

## Reasoning Traces

Steps can be retrieved as reasoning traces:
- Complete timeline of steps
- Status and duration for each step
- Justifications and decisions
- Parent-child relationships

## Best Practices
- Start steps before beginning work
- Complete steps with clear justifications
- Use appropriate step kinds for clarity
- Track parent relationships for complex reasoning
- Review reasoning traces to improve patterns

## UI Integration

Reasoning steps are displayed in:
- Reasoning Timeline view
- Step status indicators
- Duration and timing information
- Justification details

