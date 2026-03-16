# Mind Balance Decision

Use probabilistic decision-making with angel/demon advisory system for complex choices.

## Usage
Use this command when you need to:
- Make important technical decisions
- Evaluate multiple options objectively
- Get balanced perspective on choices
- Analyze trade-offs systematically
- Make decisions with uncertainty

## Decision Modes
- **angel**: Optimistic, opportunity-focused perspective
- **demon**: Critical, risk-focused perspective
- **blend**: Balanced combination of both
- **probabilistic**: Statistical analysis of options

## Example Usage
```
Mind balance decision:
Topic: "Choose between React and Vue for frontend framework"
Theta: 0.7 (optimism level)
Phi: 0.3 (risk tolerance)
Cosine: 0.8 (similarity to past decisions)
Tangent: 1.2 (complexity factor)
Mode: blend
```

## Advanced Examples
```
Technical decision:
Topic: "Should we use microservices or monolith architecture?"
Theta: 0.6, Phi: 0.4, Cosine: 0.7, Tangent: 1.5
Mode: probabilistic
Scoring: brier, abstainThreshold: 0.3

Business decision:
Topic: "Invest in new development tools or focus on current stack?"
Theta: 0.8, Phi: 0.2, Cosine: 0.9, Tangent: 0.8
Mode: angel
Normalize: true

Risk assessment:
Topic: "Deploy to production now or wait for more testing?"
Theta: 0.3, Phi: 0.7, Cosine: 0.6, Tangent: 2.0
Mode: demon
TanClamp: 2.5
```

## Parameters
- **topic**: Decision topic or question (required)
- **theta**: Optimism level (0-1)
- **phi**: Risk tolerance (0-1)
- **cosine**: Similarity to past decisions (-1 to 1)
- **tangent**: Complexity factor
- **mode**: angel, demon, blend, or probabilistic

## Benefits
- Objective decision analysis
- Multiple perspective evaluation
- Risk-opportunity balance
- Data-driven insights
- Reduced decision bias
