# Contextual Workflow Management

Complete workflow for recording and retrieving contextual stages using the context broker system.

## Usage
Use this command to manage the complete contextual workflow from planning through execution to learning, ensuring the context broker has rich contextual information to work with.

## Complete Contextual Workflow

### Phase 1: Planning Context Recording
```
1. Start session with clear objectives
2. Record initial plan with source: 'plan'
3. Set up context broker for planning task
4. Retrieve relevant planning context
5. Refine plan based on retrieved context
6. Record updated plan with reasoning
```

### Phase 2: Execution Context Recording
```
1. Begin execution phase
2. Record execution steps with source: 'execution'
3. Use context broker for implementation guidance
4. Record outcomes, successes, and failures
5. Document lessons learned and patterns
6. Store execution experiences for future use
```

### Phase 3: Learning Context Recording
```
1. Analyze execution outcomes
2. Consolidate experiences into beliefs
3. Extract procedural rules from patterns
4. Mark important lessons for priority access
5. Record reasoning processes and decision factors
6. Update knowledge base with new insights
```

### Phase 4: Outcome Context Recording
```
1. Record decision outcomes with metrics
2. Store performance improvements and results
3. Document what worked and what didn't
4. Update beliefs and rules based on outcomes
5. Create patterns for future application
6. Complete the contextual learning cycle
```

## Contextual Recording Examples

### Complete Project Workflow
```
Project: "Implement TypeScript strict mode"

Phase 1 - Planning:
Record plan: "Implement TypeScript strict mode across the codebase"
Tags: ["typescript", "strict-mode", "planning"]
Source: plan
Importance: 0.8

Phase 2 - Execution:
Record execution: "Successfully implemented TypeScript strict mode with no build errors"
Tags: ["typescript", "strict-mode", "execution", "success"]
Source: execution
Outcome: success
Score: 0.9

Phase 3 - Learning:
Record belief: "TypeScript strict mode prevents runtime errors by catching type mismatches at compile time"
Tags: ["typescript", "strict-mode", "belief"]
Type: semantic
Belief: true
Confidence: 0.95

Record rule: "Always use TypeScript strict mode for new projects to prevent runtime errors"
Tags: ["typescript", "strict-mode", "rule"]
Type: procedural
Source: execution

Phase 4 - Outcome:
Record outcome: "TypeScript strict mode implementation resulted in 50% reduction in runtime errors"
Tags: ["typescript", "strict-mode", "outcome", "success"]
Source: execution
Outcome: success
Score: 0.9
Efficiency: 0.85
```

### Decision-Making Workflow
```
Decision: "Choose between microservices and monolith architecture"

Phase 1 - Planning:
Record plan: "Evaluate microservices vs monolith for new platform architecture"
Tags: ["architecture", "microservices", "monolith", "planning"]
Source: plan

Phase 2 - Execution:
Record execution: "Conducted comprehensive architecture evaluation with team"
Tags: ["architecture", "evaluation", "execution"]
Source: execution

Record reasoning: "Chose microservices based on team structure and scalability requirements"
Tags: ["architecture", "microservices", "reasoning", "decision"]
Source: execution
Features: {
  "decision_factors": ["team_structure", "scalability", "technology_diversity"],
  "evaluation_criteria": ["maintainability", "scalability", "team_autonomy"]
}

Phase 3 - Learning:
Record belief: "Microservices work well for teams with clear domain boundaries"
Tags: ["architecture", "microservices", "belief"]
Type: semantic
Belief: true

Record rule: "Choose microservices when team has clear domain expertise and scalability needs"
Tags: ["architecture", "microservices", "rule"]
Type: procedural

Phase 4 - Outcome:
Record outcome: "Microservices implementation improved team productivity and system scalability"
Tags: ["architecture", "microservices", "outcome", "success"]
Source: execution
Outcome: success
Score: 0.85
```

## Context Broker Integration Patterns

### Planning Context Pattern
```
1. Record initial plan with source: 'plan'
2. Use context broker to retrieve relevant planning context
3. Refine plan based on retrieved experiences and rules
4. Record updated plan with reasoning
5. Context broker will include this plan in future planning tasks
```

### Execution Context Pattern
```
1. Record execution steps with source: 'execution'
2. Use context broker for implementation guidance
3. Retrieve relevant rules, beliefs, and past executions
4. Record outcomes and lessons learned
5. Context broker learns from execution outcomes
```

### Learning Context Pattern
```
1. Analyze execution outcomes and patterns
2. Consolidate experiences into beliefs (belief: true)
3. Extract procedural rules (type: 'procedural')
4. Mark important lessons (pinned: true)
5. Context broker uses beliefs and rules for future tasks
```

### Decision Context Pattern
```
1. Record decision process with reasoning tags
2. Use context broker for decision support
3. Retrieve past decisions and outcomes
4. Record decision rationale and factors
5. Context broker learns from decision outcomes
```

## Advanced Contextual Patterns

### Multi-Stage Recording
```
Record complete contextual cycle:
1. Plan: "Implement user authentication"
2. Execution: "Successfully implemented JWT authentication"
3. Belief: "JWT provides stateless authentication"
4. Rule: "Always validate JWT tokens on requests"
5. Important: "Authentication is critical for security"
6. Reasoning: "Chose JWT for scalability"
7. Outcome: "40% faster authentication, better scalability"
```

### Pattern-Based Recording
```
Record performance pattern:
1. Execution: "Database query optimization improved API performance"
2. Belief: "Query optimization consistently improves performance"
3. Rule: "Optimize database queries before adding caching"
4. Important: "Database performance is critical for user experience"
5. Outcome: "50% performance improvement from query optimization"
```

### Learning Loop Recording
```
Record learning cycle:
1. Plan: "Learn new technology"
2. Execution: "Studied and implemented new technology"
3. Belief: "Technology provides specific benefits"
4. Rule: "Use technology for specific use cases"
5. Important: "Key learning points for future reference"
6. Reasoning: "Chose technology based on specific criteria"
7. Outcome: "Successful implementation with measured benefits"
```

## Context Broker Benefits

### Complete Feedback Loop
- **Record contextual stages** for future retrieval
- **Retrieve relevant context** for current tasks
- **Learn from outcomes** to improve context selection
- **Adapt ranking** based on success patterns
- **Build knowledge** over time through contextual cycles

### Intelligent Context Selection
- **Plans** provide planning context for future tasks
- **Executions** offer implementation experience
- **Beliefs** supply consolidated knowledge
- **Rules** give procedural guidance
- **Important** ensures priority access to critical information
- **Reasoning** supports decision-making processes
- **Outcomes** enable pattern recognition and learning

### Adaptive Learning
- **Outcome tracking** improves memory selection
- **Pattern recognition** identifies successful approaches
- **Weight adaptation** optimizes ranking factors
- **K-value learning** finds optimal context sizes
- **Continuous improvement** through feedback loops

## Best Practices

### Recording Discipline
1. **Record at each phase** of the contextual workflow
2. **Use consistent tags** for better retrieval
3. **Set appropriate importance** scores
4. **Include relevant metadata** in features
5. **Link to sessions** for context tracking

### Context Quality
1. **Record complete cycles** from plan to outcome
2. **Extract patterns** from successful experiences
3. **Update beliefs** based on new evidence
4. **Refine rules** from execution results
5. **Mark important** lessons for future access

### Learning Integration
1. **Track outcomes** systematically
2. **Learn from failures** as well as successes
3. **Adapt approaches** based on results
4. **Build expertise** through contextual cycles
5. **Improve context quality** over time
