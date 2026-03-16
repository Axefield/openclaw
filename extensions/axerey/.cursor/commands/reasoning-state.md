# Reasoning State Persistence

Save and load complete reasoning state for sessions, including memories and connections.

## Usage
Use this command when you need to:
- Save reasoning state for later
- Resume reasoning sessions
- Share reasoning state
- Backup reasoning progress
- Analyze reasoning patterns

## State Contents

Saved state includes:
- All memories in the session
- All memory connections
- Reasoning steps
- Session metadata
- Context information

## Example Usage
```
Save reasoning state:
Session ID: session-123
Include connections: true
```

```
Load reasoning state:
Session ID: session-123
```

## Parameters

### Save State
- **sessionId**: Session identifier (required)
- **includeConnections**: Include memory connections (default: true)

### Load State
- **sessionId**: Session identifier (required)

## State Storage

States are stored in `reasoning_states` table:
- Session ID
- Complete state data (JSON)
- Creation timestamp

## Benefits
- **Session Continuity**: Resume work from saved state
- **State Sharing**: Share reasoning state with others
- **Backup**: Backup reasoning progress
- **Analysis**: Analyze reasoning patterns over time
- **Debugging**: Debug reasoning issues with saved states

## Use Cases

### Session Resume
Save state before long breaks, load to resume exactly where you left off.

### State Sharing
Share reasoning state with team members for collaboration.

### Pattern Analysis
Load historical states to analyze reasoning patterns and improvements.

### Debugging
Save state before errors, load to reproduce and debug issues.

## Best Practices
- Save state regularly during long sessions
- Include connections for complete state
- Use descriptive session IDs
- Clean up old states periodically
- Load state to verify correctness

## Integration

Works with:
- Reasoning step tracking
- Memory connections
- Context broker
- Quality evaluation

