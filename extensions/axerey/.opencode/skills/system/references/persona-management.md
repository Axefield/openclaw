# Persona Management

Manage different analytical personas with isolated memory contexts and specialized capabilities. Backed by the persona API (`backend/src/routes/persona.ts`) and config manager (`backend/src/services/configManager.ts`).

## Usage
Use this command when you need to:
- Switch between different analytical contexts
- Isolate memories by persona
- Access persona-specific configurations
- Manage multiple analytical perspectives
- Organize work by different roles or contexts

## Persona Operations
- **List Personas**: `GET /personas` → array with `isActive` flag
- **Current Persona**: `GET /personas/current`
- **Persona Details**: `GET /personas/:id` or `GET /personas/:id/config`
- **Create Persona**: `POST /personas`
- **Update Persona**: `PUT /personas/:id`
- **Delete Persona**: `DELETE /personas/:id` (not allowed for active/default)
- **Switch Persona**: `POST /personas/switch`
- **Reload Config**: `POST /personas/reload`

## Example Usage
```
# List personas
cursor agent run http --method GET --path /personas

# Switch personas safely
cursor agent run http --method POST --path /personas/switch --body '{ "personaId": "scientific-analyst" }'

# Reload config after editing .axerey.scientific
cursor agent run http --method POST --path /personas/reload
```

## Persona Types (examples)
- **general**: Standard analytical persona
- **scientific**: Research and analysis focused (`reasoningStyle: analytical`)
- **technical**: Development and engineering focused
- **strategic**: Business and planning focused
- **creative**: Design and innovation focused

## Benefits
- **Memory Isolation**: Each persona has separate memory context
- **Specialized Capabilities**: Persona-specific tools and configurations
- **Context Switching**: Easy switching between analytical modes
- **Organized Knowledge**: Memories organized by analytical perspective
- **Focused Analysis**: Persona-specific reasoning and decision-making

## Parameters & Payloads
- **Create**: `{ id, name, description?, memoryIsolation?, reasoningStyle?, preferences? }`
- **Update**: Partial fields above
- **Switch**: `{ personaId }`
- **Reload**: No body

## Best Practices
- Use consistent slug IDs (`generatePersonaId` mirrors frontend logic)
- Always run `session_end` / `session_start` when switching personas to maintain isolated memory logs
- Keep memory isolation enabled unless requirements dictate otherwise
- Update `.axerey.scientific` via API where possible; if edited manually, run `/personas/reload`
- Reference prompts `@persona-config.md` and `@persona-checklist.md` during CRUD operations

## Related Tools & Events
- MCP tools: `persona_list`, `persona_switch`, `persona_current`, `persona_config`
- Socket.IO events: `persona_created`, `persona_updated`, `persona_deleted`, `persona_switched`

Use this command doc with the prompts/rules above whenever you handle persona workflows.***
