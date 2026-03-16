---
name: structured-reasoning
description: Structured thinking - steelman, strawman, mind_balance for rigorous analysis
license: MIT
compatibility: opencode
metadata:
  audience: analysts
  category: reasoning
---

# Structured Reasoning Skill

## Overview

Apply rigorous analytical frameworks using Axerey's reasoning tools.

## Available Tools

- `axerey_steelman` - Strengthen arguments charitably
- `axerey_strawman` - Identify fallacies/distortions
- `axerey_strawman_to_steelman` - Transform distorted to strongest
- `axerey_mind_balance` - Probabilistic decision scoring
- `axerey_reasoning_step` - Track reasoning steps

## When to Use

- Evaluating investment theses
- Analyzing counterarguments
- Making high-stakes decisions
- Ensuring rigorous analysis

## Frameworks

### Steelman

Finds the strongest version of any argument.

**Input:**

```
steelman({
  opponentClaim: "Tokenomics will fail because..."
})
```

**Output:** Strongest premises, anticipated objections, evidence

### Strawman

Identifies distortions, fallacies, and weak points.

**Input:**

```
strawman({
  originalClaim: "The project will succeed because...",
  requestRefutation: true
})
```

**Output:** Distortions, fallacies, refutation options

### Mind Balance

Probabilistic scoring with angel/demon advisors.

**Input:**

```
mind_balance({
  topic: "Invest in NeoCheyenne",
  theta: 0.785,    // belief strength
  phi: 0.524,     // uncertainty
  cosine: 0.7,    // alignment
  tangent: 0.4,   // risk/reward
  mode: "blend"   // angel|demon|blend|probabilistic
})
```

**Output:** Decision score, confidence, recommendation

### Reasoning Steps

Track your thinking process.

**Start step:**

```
reasoning_step({
  action: "start",
  kind: "evaluation",
  label: "analyze-investment",
  description: "Evaluating NeoCheyenne investment opportunity"
})
```

**Complete step:**

```
reasoning_step({
  action: "complete",
  stepId: "step-id-from-start",
  justification: {
    summary: "Strong investment due to..."
  }
})
```

## Best Practices

1. Always steelman before strawman
2. Use mind_balance for binary decisions
3. Track reasoning steps for complex analysis
4. Store conclusions in memory
