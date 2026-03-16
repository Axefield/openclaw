# Memorize

Store and manage memories for persistent knowledge retention and context-aware assistance.

## Usage
Use this command when you need to:
- Store important information for future reference
- Remember decisions, outcomes, or learnings
- Create persistent knowledge that survives sessions
- Build context for future tasks
- Track project progress and insights

## Memory Operations
- **Store Memory**: Create new memories with content and metadata
- **Retrieve Memories**: Search and recall relevant memories
- **Update Memory**: Modify existing memory content
- **Delete Memory**: Remove outdated or incorrect memories
- **Pin Memory**: Mark important memories for quick access
- **Search Memories**: Find memories by content or tags

## Example Usage
```
Memorize: "Project Alpha completed successfully with 15% cost savings"
Memorize: "User prefers detailed technical explanations over summaries"
Memorize: "AWS outage on Oct 20, 2025 - us-east-1 DynamoDB issues"
Memorize: "Key stakeholder feedback: focus on cross-region resilience"
```

## Memory Types
- **Episodic**: Specific events, experiences, or occurrences
- **Semantic**: General knowledge, facts, or concepts
- **Procedural**: How-to knowledge, processes, or workflows

## Memory Parameters
- **text**: The memory content (required)
- **tags**: Array of tags for categorization (optional)
- **importance**: Importance level 0-1 (optional, default 0.5)
- **type**: episodic, semantic, or procedural (optional, default episodic)
- **expiresAt**: Expiration date/time (optional)
- **confidence**: Confidence in the memory accuracy 0-1 (optional, default 1)

## Memory Features
- **Semantic Search**: Find memories by meaning, not just keywords
- **Adaptive Ranking**: Important memories surface more frequently
- **Context Awareness**: Memories relevant to current task are prioritized
- **Decay Management**: Old, unused memories fade over time
- **Consolidation**: Related memories can be merged or clustered
- **Reflection**: System learns from memory usage patterns

## Memory Categories
- **Project Information**: Decisions, milestones, outcomes
- **User Preferences**: Communication style, technical level
- **Technical Knowledge**: Solutions, patterns, best practices
- **Stakeholder Information**: Roles, preferences, communication history
- **Process Knowledge**: Workflows, procedures, methodologies
- **Market Intelligence**: Trends, analysis, competitive information

## Best Practices
- **Be Specific**: Include relevant details and context
- **Use Tags**: Categorize memories for better retrieval
- **Set Importance**: Mark critical information appropriately
- **Regular Cleanup**: Remove outdated or incorrect memories
- **Contextual Details**: Include when, where, why information
- **Actionable Content**: Focus on information that drives decisions

## Memory Management
- **Automatic Decay**: Unused memories fade over time
- **Manual Cleanup**: Review and remove outdated memories
- **Consolidation**: Merge related memories when appropriate
- **Pin Important**: Mark critical memories for quick access
- **Search Optimization**: Use descriptive tags and content

## Integration
- **Context Broker**: Memories inform context selection
- **Adaptive Learning**: Memory usage improves ranking
- **Reasoning**: Memories support decision-making processes
- **Reflection**: System learns from memory effectiveness

## Examples by Category

### Project Memories
```
Memorize: "Q4 2025 strategy pivot: focus on AI integration over cloud migration"
Memorize: "Budget approval: $2M allocated for resilience improvements"
Memorize: "Stakeholder meeting outcome: AWS outage analysis well-received"
```

### Technical Memories
```
Memorize: "DynamoDB global tables reduce cross-region latency by 40%"
Memorize: "CDN origin shielding prevents 90% of origin requests during spikes"
Memorize: "Circuit breaker pattern reduces cascade failures in microservices"
```

### User Preferences
```
Memorize: "User prefers bullet points over paragraphs for technical summaries"
Memorize: "User values data-driven recommendations with specific metrics"
Memorize: "User likes proactive suggestions for risk mitigation"
```

### Market Intelligence
```
Memorize: "Morgan Stanley forecasts DXY dropping to 91.00 by mid-2026"
Memorize: "BOE warns of 2008-like echoes in private credit structures"
Memorize: "Margin debt up 32% in 5 months creating systemic fragility"
```
