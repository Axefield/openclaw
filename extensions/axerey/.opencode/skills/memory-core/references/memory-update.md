# Update Memory

Modify existing memory content and regenerate embeddings.

## Usage
Use this command when you need to:
- Correct inaccurate information
- Add additional details to existing memories
- Update outdated solutions or decisions
- Refine memory descriptions
- Merge related information

## When to Update
- Information has changed or been corrected
- Memory is incomplete or unclear
- Need to add context or details
- Consolidating similar memories
- Fixing typos or formatting

## Example Usage
```
Update memory ID: "mem_12345"
New text: "The user prefers strict TypeScript typing with no use of `any`, requires that type errors not be ignored in the build, and prefers using strongly mapped TypeScript interfaces"
```

## Parameters
- **id**: Memory ID to update (required)
- **text**: New memory content (required)

## Important Notes
- Updating regenerates embeddings for semantic search
- Original memory is replaced, not duplicated
- Use this for corrections, not new information
- Consider creating new memory for additional context
