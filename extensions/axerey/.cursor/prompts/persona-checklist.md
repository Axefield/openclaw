# Persona Ops Checklist

## Before You Start
- Confirm current persona via `/personas/current`.
- Record session_end for the outgoing persona if switching contexts.
- Load this prompt plus `@persona-config.md`.

## List / Inspect
1. `GET /personas` → verify array + `isActive`.
2. `GET /personas/:id` for detailed view.
3. `GET /personas/:id/config` if system settings are needed.

## Create
1. Pick name + slug ID (`generatePersonaId` logic).
2. POST `/personas` with `{ id, name, description, memoryIsolation, reasoningStyle, preferences }`.
3. Confirm WebSocket broadcast or refresh UI table.

## Update
1. PUT `/personas/:id` with partial fields.
2. Ensure enums stay in sync (`reasoningStyle`).
3. Reload personas to confirm.

## Switch
1. POST `/personas/switch` with `{ personaId }`.
2. Note `previousPersonaId` and log in memory (`session_start` for new persona).
3. UI should show active badge + disable delete on active persona.

## Delete
1. Ensure target is neither `default` nor currently active.
2. DELETE `/personas/:id`.
3. Document removal and refresh list.

## Reload Config
- POST `/personas/reload` after manual file edits.
- Verify `personas`, `currentPersonaId`, and `metadata.lastModified`.

## After Any Change
- Update `commands/persona-management.md` or relevant docs if new flows exist.
- Run smoke tests on persona-dependent features (memory isolation, reasoning tools).***

