# Contextual Memory Recording

Record different types of contextual information using the context broker system for complete feedback loops.

## Usage
Use this command when you need to:
- Record planning context for future retrieval
- Store execution experiences and outcomes
- Create consolidated beliefs from knowledge
- Document procedural rules and patterns
- Mark important information for priority access
- Record reasoning processes and decisions
- Track decision outcomes and results

## Contextual Memory Types

### 1. **Plans** - Planning Context
Record planning information that will be retrieved by future context broker calls.

**Memory Type**: Episodic (specific planning events)
**Source**: plan
**Context Role**: Retrieved for planning tasks

```
Record plan:
Text: "Implement user authentication system with JWT tokens and role-based access control"
Tags: ["auth", "jwt", "planning", "security"]
Importance: 0.8
Type: episodic
Source: plan
Session: "auth-implementation"
```

### 2. **Executions** - Implementation Experience
Record execution experiences and outcomes for learning and pattern recognition.

**Memory Type**: Episodic (specific implementation events)
**Source**: execution
**Context Role**: Retrieved for execution tasks

```
Record execution:
Text: "Successfully implemented JWT authentication with proper error handling and validation"
Tags: ["auth", "jwt", "execution", "success"]
Importance: 0.9
Type: episodic
Source: execution
Outcome: success
Score: 0.85
Efficiency: 0.9
Session: "auth-implementation"
```

### 3. **Beliefs** - Consolidated Knowledge
Record consolidated knowledge that represents established facts or patterns.

**Memory Type**: Semantic (consolidated knowledge)
**Source**: execution (derived from experience)
**Context Role**: Retrieved as foundational knowledge
**Special Flag**: belief: true

```
Record belief:
Text: "JWT tokens provide stateless authentication that scales better than session-based auth"
Tags: ["auth", "jwt", "belief", "scalability"]
Importance: 0.7
Type: semantic
Source: execution
Belief: true
Confidence: 0.95
```

### 4. **Rules** - Procedural Knowledge
Record procedural rules and patterns for future application.

**Memory Type**: Procedural (actionable procedures)
**Source**: execution (derived from experience)
**Context Role**: Retrieved for procedural guidance

```
Record rule:
Text: "Always validate JWT tokens on every request and handle token expiration gracefully"
Tags: ["auth", "jwt", "rule", "validation"]
Importance: 0.8
Type: procedural
Source: execution
Confidence: 0.9
```

### 5. **Important** - Critical Information
Mark critical information for priority access in future context retrieval.

**Memory Type**: Any (can be episodic, semantic, or procedural)
**Source**: Any (depends on context)
**Context Role**: Retrieved with priority boost
**Special Flag**: pinned: true OR tags: ['important']

```
Record important:
Text: "User authentication is critical for security - never skip validation steps"
Tags: ["auth", "security", "important", "critical"]
Importance: 1.0
Type: procedural
Source: execution
Pinned: true
```

### 6. **Reasoning** - Decision Processes
Record reasoning processes and decision-making context.

**Memory Type**: Episodic (specific decision events)
**Source**: execution (decision-making process)
**Context Role**: Retrieved for reasoning tasks
**Special Tags**: ['reasoning', 'decision', 'argument']

```
Record reasoning:
Text: "Chose JWT over sessions because of stateless scalability and microservices architecture"
Tags: ["auth", "jwt", "reasoning", "decision", "architecture"]
Importance: 0.8
Type: episodic
Source: execution
Features: {"decision_factors": ["scalability", "stateless", "microservices"]}
```

### 7. **Outcomes** - Decision Results
Record decision outcomes and their effectiveness.

**Memory Type**: Episodic (specific outcome events)
**Source**: execution (outcome tracking)
**Context Role**: Retrieved for pattern recognition and learning
**Special Fields**: outcome, score, efficiency

```
Record outcome:
Text: "JWT implementation resulted in 40% faster authentication and better scalability"
Tags: ["auth", "jwt", "outcome", "performance", "success"]
Importance: 0.9
Type: episodic
Source: execution
Outcome: success
Score: 0.9
Efficiency: 0.85
```

## Contextual Recording Workflow

### Planning Phase
```
1. Record initial plan with source: 'plan'
2. Include relevant tags for future retrieval
3. Set appropriate importance and confidence
4. Link to session for context tracking
```

### Execution Phase
```
1. Record execution experiences with source: 'execution'
2. Include outcome, score, and efficiency metrics
3. Tag with relevant categories and success indicators
4. Store lessons learned and patterns discovered
```

### Learning Phase
```
1. Consolidate experiences into beliefs (belief: true)
2. Extract procedural rules (type: 'procedural')
3. Mark important information (pinned: true)
4. Record reasoning processes and decision factors
```

### Outcome Phase
```
1. Record decision outcomes with success metrics
2. Store performance improvements and results
3. Document what worked and what didn't
4. Update beliefs and rules based on outcomes
```

## Advanced Contextual Recording

### Multi-Stage Recording
```
Record complete context cycle:
1. Plan: "Implement TypeScript strict mode"
2. Execution: "Successfully implemented with no build errors"
3. Belief: "TypeScript strict mode prevents runtime errors"
4. Rule: "Always use strict TypeScript for new projects"
5. Important: "TypeScript configuration is critical for code quality"
6. Reasoning: "Chose strict mode for better type safety"
7. Outcome: "50% reduction in runtime errors"
```

### Pattern-Based Recording
```
Record pattern:
Text: "Database query optimization consistently improves API performance"
Tags: ["database", "optimization", "performance", "pattern"]
Type: procedural
Source: execution
Features: {
  "pattern_type": "performance_optimization",
  "success_rate": 0.85,
  "applicable_domains": ["api", "database", "performance"]
}
```

### Decision Context Recording
```
Record decision context:
Text: "Chose React over Vue for frontend framework based on team expertise and ecosystem"
Tags: ["frontend", "react", "vue", "decision", "reasoning"]
Type: episodic
Source: execution
Features: {
  "decision_factors": ["team_expertise", "ecosystem", "learning_curve"],
  "evaluation_criteria": ["productivity", "maintainability", "scalability"],
  "decision_outcome": "success"
}
```

## Context Broker Integration

### Automatic Context Retrieval
When you record contextual memories with proper tags and sources, the context broker will automatically:
- **Retrieve plans** for planning tasks
- **Include executions** for implementation context
- **Access beliefs** for consolidated knowledge
- **Apply rules** for procedural guidance
- **Prioritize important** information
- **Use reasoning** for decision support
- **Consider outcomes** for pattern recognition

### Learning Feedback Loop
```
1. Record contextual memories with proper categorization
2. Context broker retrieves relevant memories for tasks
3. System learns from outcomes and user feedback
4. Adaptive ranking improves memory selection
5. Better context leads to better decisions
6. Record new outcomes and patterns
7. Cycle continues with improved learning
```

## Best Practices

### Recording Quality
1. **Use consistent tags** for better retrieval
2. **Set appropriate importance** scores
3. **Include relevant metadata** in features
4. **Link to sessions** for context tracking
5. **Record outcomes** with metrics

### Context Organization
1. **Use source field** to categorize by stage
2. **Apply belief flag** for consolidated knowledge
3. **Pin important** information for priority
4. **Include reasoning** processes and factors
5. **Track outcomes** for learning

### Learning Integration
1. **Record complete cycles** from plan to outcome
2. **Extract patterns** from successful experiences
3. **Update beliefs** based on new evidence
4. **Refine rules** from execution results
5. **Mark important** lessons for future access
