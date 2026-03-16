# Architecture Decision

Make informed architectural decisions using memory context and reasoning tools.

## Usage
Use this command when you need to:
- Choose between architectural options
- Evaluate technology choices
- Make design decisions
- Consider trade-offs systematically
- Document decision rationale

## Decision Process
1. **Context Gathering**: Retrieve relevant memories about similar decisions
2. **Record Decision Plan**: Document decision criteria and evaluation approach
3. **Option Analysis**: Use mind-balance to evaluate options objectively
4. **Argument Analysis**: Steelman different perspectives
5. **Record Decision Reasoning**: Document decision process and factors
6. **Pattern Recognition**: Look for successful patterns in past decisions
7. **Record Decision Outcome**: Store decision with rationale and metrics
8. **Extract Decision Rules**: Create procedural knowledge from decision patterns

## Example Usage
```
Architecture decision:
Question: "Should we use microservices or monolith for this project?"
Context: "E-commerce platform with expected growth"
Options: ["microservices", "monolith", "modular-monolith"]

1. Record decision plan: "Evaluate microservices vs monolith for e-commerce platform"
   - Source: 'plan'
   - Tags: ["architecture", "microservices", "monolith", "planning"]

2. Get context from context broker for architecture decisions

3. Execute option analysis with mind-balance

4. Record decision reasoning: "Chose microservices for team autonomy and scalability"
   - Tags: ["architecture", "reasoning", "decision"]
   - Features: {"decision_factors": ["team_autonomy", "scalability", "technology_diversity"]}

5. Record decision outcome: "Microservices implementation improved team productivity"
   - Source: 'execution'
   - Outcome: success
   - Score: 0.8

6. Record belief: "Microservices work well for teams with clear domain boundaries"
   - Belief: true
   - Type: semantic

7. Extract rule: "Choose microservices when team has clear domain expertise and scalability needs"
   - Type: 'procedural'

8. Mark important: "Architecture decisions impact long-term maintainability"
   - Pinned: true
```

## Analysis Framework
- **Technical Requirements**: Performance, scalability, maintainability
- **Team Capabilities**: Skills, experience, resources
- **Business Context**: Timeline, budget, future plans
- **Risk Assessment**: Potential issues and mitigation
- **Success Patterns**: Past successful decisions

## Benefits
- Data-driven decisions
- Multiple perspective analysis
- Risk-aware evaluation
- Pattern-based insights
- Documented rationale
