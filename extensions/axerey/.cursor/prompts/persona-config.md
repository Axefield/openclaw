# Persona Config Quick Reference

- **Primary file**: `.axerey.scientific`
- **Fallback**: `.vagogon` (personas copied in if primary is empty)
- **Cache**: `configManager` caches JSON + timestamps until reload

## Editing Steps
1. Stop persona-changing workflows (document active persona).
2. Update `.axerey.scientific` JSON with new persona data; include `metadata.lastModified`.
3. Run `POST /personas/reload` or `cursor agent persona_reload` to refresh cache.
4. Verify with `GET /personas`, `GET /personas/current`.

## Required Fields
```json
{
  "id": "scientific-analyst",
  "name": "Scientific Analyst",
  "description": "Research-driven persona",
  "memoryIsolation": true,
  "reasoningStyle": "analytical",
  "preferences": {}
}
```

## Do / Don't
- ✅ Keep persona IDs slugified, unique.
- ✅ Mirror backend enums in frontend + MCP docs.
- ✅ Emit Socket.IO events when adding endpoints using persona data.
- ❌ Delete `default` persona or active persona.
- ❌ Modify `.vagogon` unless syncing legacy data.

Use this prompt alongside `persona-management.md` when performing persona CRUD or debugging config reloads.***

