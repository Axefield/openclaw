# TypeScript Standards for Vagogon

## Compiler Configuration

**Target**: ES2022
**Module**: ES2022
**Strict Mode**: true (all strict checks enabled)

Reference: `tsconfig.json` in project root

## Module Imports

**CRITICAL**: Always use `.js` extensions in imports (ES2022 requirement)

**Correct**:
```typescript
import { Memory } from './memory.js';
import { MCPCommand } from '../core/mcp-command.js';
import { z } from 'zod';
```

**Incorrect**:
```typescript
import { Memory } from './memory';  // Missing .js extension
import { MCPCommand } from '../core/mcp-command';  // Missing .js extension
```

**Applies to**: All local module imports in `src/` directory

## Type System

**Interface Definition**:
- Define in `src/types/` or alongside implementation
- Use comprehensive interfaces for complex objects
- Reference: `src/config/types.ts` for patterns

**Zod Schema Pattern**:
```typescript
const MySchema = z.object({
  name: z.string(),
  value: z.number(),
  optional: z.string().optional()
});

type MyType = z.infer<typeof MySchema>;
```

**Runtime Validation**: All MCP tool inputs must use Zod schemas

## Error Handling

**Async Operations**: Always use try-catch
```typescript
async function myFunction() {
  try {
    const result = await someAsyncOperation();
    return { success: true, data: result };
  } catch (error) {
    console.error('Operation failed:', error);
    return { success: false, error: error.message };
  }
}
```

**Graceful Degradation**: Fallback to simpler behavior on error
- Never break functionality due to optional features
- Provide meaningful error messages
- Log errors for debugging

**MCP Layer**: Never throw errors to MCP protocol
- Return error messages in tool responses
- Use try-catch in all tool implementations
- Log errors but don't expose internals

## Documentation

**JSDoc Standards**:
```typescript
/**
 * Stores a new memory with the given parameters
 * @param params - Memory parameters including text, tags, and importance
 * @param params.text - The memory content text
 * @param params.tags - Array of tags for categorization
 * @param params.importance - Importance score between 0 and 1
 * @returns Promise resolving to memory ID and metadata
 * @throws Never throws - returns error in response object
 */
async function memorize(params: MemorizeParams): Promise<MemorizeResult> {
  // Implementation
}
```

**Documentation Requirements**:
- Public APIs (all exported functions/classes)
- Complex algorithms and business logic
- MCP tool methods
- Parameters, return types, and potential errors

**Reference**: See `src/reasoning/mind-balance.ts` for documentation style

## Naming Conventions

**Variables and Functions**: `camelCase`
```typescript
const memoryStore = new MemoryStore();
function calculateSimilarity() { }
```

**Classes and Interfaces**: `PascalCase`
```typescript
class MemoryStore { }
interface MemoryConfig { }
type MemoryType = 'episodic' | 'semantic' | 'procedural';
```

**Constants**: `UPPER_SNAKE_CASE` (for true constants)
```typescript
const MAX_MEMORY_SIZE = 1000;
const DEFAULT_TIMEOUT = 30000;
```

**Private Class Members**: Prefix with `_`
```typescript
class MyClass {
  private _config: Config;
  private _initialized = false;
  
  public getConfig() {
    return this._config;
  }
}
```

## Type Safety Best Practices

**Strict Null Checks**: Always handle undefined/null
```typescript
// Good
if (value !== undefined && value !== null) {
  processValue(value);
}

// Better
if (value) {
  processValue(value);
}
```

**Type Guards**: Use for runtime type checking
```typescript
function isMemory(obj: any): obj is Memory {
  return obj && typeof obj.text === 'string' && typeof obj.importance === 'number';
}
```

**Generic Types**: Use for reusable components
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

## Import Organization

**Order**:
1. Node.js built-ins
2. External packages
3. Internal modules (relative imports)

**Example**:
```typescript
// Node.js built-ins
import { randomUUID } from 'node:crypto';

// External packages
import { z } from 'zod';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

// Internal modules
import { MemoryStore } from './memory.js';
import { MCPCommand } from '../core/mcp-command.js';
```

## Key Principles

1. **Strict Typing**: Use TypeScript's strict mode features
2. **ES2022 Modules**: Always use `.js` extensions
3. **Error Safety**: Never throw unhandled errors
4. **Documentation**: Document all public APIs
5. **Consistency**: Follow established naming conventions
