# Store Memory

Store important information in the axerey memory system for future reference.

## Usage
Use this command when you want to save:
- Key decisions or insights
- Important project details
- Learning outcomes
- Code patterns or solutions
- Meeting notes or discussions

## Memory Types
- **Episodic**: Specific events/experiences (e.g., "Successfully implemented JWT authentication")
- **Semantic**: General knowledge/facts (e.g., "JWT tokens provide stateless authentication")
- **Procedural**: Rules and procedures (e.g., "Always validate JWT tokens on requests")

## Memory Sources
- **plan**: Planning context and objectives
- **execution**: Implementation experiences and outcomes
- **signal**: External information and observations
- **account**: Documentation and record keeping

## Special Memory Flags
- **belief: true**: Consolidated knowledge and established facts
- **pinned: true**: Important information for quick access
- **important**: Critical information (use in tags)

## Example Usage
```
Store this memory: "The user prefers strict TypeScript typing with no use of `any` and requires that type errors not be ignored in the build"
Tags: ["typescript", "preferences", "coding-standards"]
Importance: 0.8
Type: procedural
Confidence: 1.0
Source: execution
```

## Advanced Examples
```
Store episodic memory:
Text: "Successfully implemented JWT authentication with proper error handling"
Tags: ["auth", "jwt", "success"]
Importance: 0.9
Type: episodic
Source: execution
Session: "auth-implementation"

Store semantic memory (belief):
Text: "TypeScript strict mode prevents runtime errors by catching type mismatches at compile time"
Tags: ["typescript", "knowledge", "compilation"]
Importance: 0.7
Type: semantic
Belief: true
Confidence: 0.95

Store procedural memory (rule):
Text: "Always use strongly mapped TypeScript interfaces instead of multiple specific methods for better maintainability"
Tags: ["typescript", "procedure", "maintainability"]
Importance: 0.8
Type: procedural
Source: execution

Store important memory:
Text: "User authentication is critical for security - never skip validation steps"
Tags: ["auth", "security", "important", "critical"]
Importance: 1.0
Type: procedural
Pinned: true
```

## Parameters
- **text**: The content to remember (required)
- **tags**: Array of tags for organization (optional)
- **importance**: 0-1 scale for prioritization (default: 0.5)
- **type**: episodic, semantic, or procedural (default: episodic)
- **confidence**: 0-1 scale for reliability (default: 1.0)
- **expiresAt**: Optional expiration date
- **sessionId**: Optional session tracking
