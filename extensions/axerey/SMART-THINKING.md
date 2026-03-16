# Axerey Smart-Thinking System

The Smart-Thinking system provides enhanced memory management through graph-based relationships, verification, quality evaluation, and adaptive learning. This document details the scientific architecture and implementation of each component.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Memory Connections](#memory-connections)
3. [Memory Verification](#memory-verification)
4. [Quality Evaluation](#quality-evaluation)
5. [Adaptive Ranking](#adaptive-ranking)
6. [Outcome Tracking](#outcome-tracking)
7. [Reasoning Tools](#reasoning-tools)
8. [Integration Flow](#integration-flow)

---

## Architecture Overview

The Smart-Thinking system consists of four core services that work together to provide intelligent memory management:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Smart-Thinking Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │  Connection │  │Verification  │  │    Quality Service   │ │
│  │  Service    │  │   Service    │  │                      │ │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘ │
│         │                  │                     │             │
│         └──────────────────┼─────────────────────┘             │
│                            ▼                                    │
│                   ┌────────────────┐                           │
│                   │ Adaptive       │                           │
│                   │ Ranker         │                           │
│                   └────────┬───────┘                           │
│                            │                                    │
│                   ┌────────▼───────┐                           │
│                   │ Outcome        │                           │
│                   │ Service        │                           │
│                   └────────────────┘                           │
├─────────────────────────────────────────────────────────────────┤
│                    Memory Layer (VSS)                          │
└─────────────────────────────────────────────────────────────────┘
```

### Core Files

| File                                  | Purpose                          |
| ------------------------------------- | -------------------------------- |
| `src/services/connectionService.ts`   | Graph-based memory relationships |
| `src/services/verificationService.ts` | Factual claim verification       |
| `src/services/qualityService.ts`      | Heuristic quality metrics        |
| `src/adaptive-ranker.ts`              | Outcome-based ranking            |
| `src/services/outcomeService.ts`      | Outcome propagation              |
| `src/reasoning/mind-balance.ts`       | Angel/demon decision scoring     |
| `src/reasoning/argumentation.ts`      | Steelman/strawman analysis       |

---

## Memory Connections

### Concept

Memory connections create explicit graph relationships between memories, enabling:

- Context expansion through related memories
- Verification via opposing/supporting claims
- Knowledge graph traversal for reasoning

### Connection Types

The system supports 12 semantic relationship types:

| Type          | Description                          | Propagation |
| ------------- | ------------------------------------ | ----------- |
| `supports`    | Memory provides evidence for another | +0.8 boost  |
| `contradicts` | Memory opposes another               | -0.2 boost  |
| `refines`     | Memory adds detail/precision         | +0.5 boost  |
| `derives`     | Memory is logically derived          | +0.7 boost  |
| `exemplifies` | Memory provides example              | +0.6 boost  |
| `generalizes` | Memory is broader claim              | +0.5 boost  |
| `questions`   | Memory challenges another            | +0.2 boost  |
| `analyzes`    | Memory breaks down another           | +0.4 boost  |
| `synthesizes` | Memory combines ideas                | +0.4 boost  |
| `associates`  | Memory is related                    | +0.4 boost  |
| `extends`     | Memory builds on another             | +0.8 boost  |
| `applies`     | Memory applies concept               | +0.7 boost  |

### Implementation

**Service**: `src/services/connectionService.ts`

```typescript
interface MemoryConnection {
  id: string;
  sourceId: string;
  targetId: string;
  connectionType: ConnectionType;
  strength: number; // 0-1
  inferred: boolean; // Auto-inferred vs explicit
  inferenceConfidence?: number;
  description?: string;
  createdAt: number;
}
```

**Key Methods**:

- `createConnection()` - Create explicit relationship
- `inferConnections()` - Auto-detect relationships based on similarity
- `getRelatedMemories()` - Graph traversal for context expansion
- `applyTransitivity()` - Infer A→C from A→B and B→C

### Auto-Inference

The system automatically infers connections when memories are created:

```typescript
inferConnectionType(memory1, memory2, similarity): ConnectionType {
  // Contradiction markers
  if (text1.includes('not ') && text2.includes('is ')) return 'contradicts';

  // Support markers
  if (text1.includes('because') || text1.includes('evidence')) return 'supports';

  // Derivation markers
  if (text2.includes('therefore') || text2.includes('conclusion')) return 'derives';

  // High similarity → associates
  if (similarity > 0.8) return 'associates';

  return 'associates';
}
```

### Persona Isolation

Connections are strictly isolated by persona. Both memories must share the `persona:{id}` tag for the connection to be visible.

---

## Memory Verification

### Concept

The verification system validates factual claims and calculations using a memory-first strategy, prioritizing existing verified memories before external searches.

### Verification Strategy

1. **Calculation Verification** - Validates mathematical expressions in memory text
2. **Memory-First Verification** - Checks existing memories for supporting/contradicting evidence
3. **Connection-Based Validation** - Uses `supports`/`contradicts` connections
4. **External Search** - Optional Gon-Search integration for real-time verification

### Status Types

| Status               | Confidence | Boost |
| -------------------- | ---------- | ----- |
| `verified`           | 0.7-0.9    | +0.15 |
| `partially_verified` | 0.5-0.7    | +0.08 |
| `unverified`         | 0.5        | 0     |
| `contradicted`       | 0.3        | -0.10 |
| `uncertain`          | 0.2        | -0.05 |

### Implementation

**Service**: `src/services/verificationService.ts`

```typescript
interface VerificationResult {
  status:
    | "verified"
    | "partially_verified"
    | "unverified"
    | "contradicted"
    | "uncertain";
  confidence: number;
  sources: VerificationSource[];
  verifiedCalculations?: VerifiedCalculation[];
  memoryMatches?: MemoryMatch[];
  truthAdaptation?: TruthAdaptationResult;
  timestamp: string;
}

interface VerifiedCalculation {
  expression: string;
  expected: number;
  actual: number;
  verified: boolean;
}
```

### Calculation Verification

Detects patterns like `5 + 3 = 8`, `100 * 2 = 200`:

```typescript
// Regex pattern: (\d+)\s*([\+\-\*\/])\s*(\d+)\s*=\s*(\d+)
// Matches: "5 + 3 = 8", "100 * 2 = 200", "50 - 25 = 25"

evaluateExpression(a, op, b): number {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return a / b;
  }
}
```

### Memory-First Strategy

1. Search for similar memories using VSS
2. Check for existing `supports` or `contradicts` connections
3. If contradiction found → status = `contradicted`, confidence = 0.3
4. If support found → status = `verified`, confidence = max(current, 0.7)

---

## Quality Evaluation

### Concept

Quality evaluation uses heuristic metrics to assess memory reliability, relevance, and overall quality. These metrics influence ranking decisions.

### Metrics

| Metric             | Description                            | Range |
| ------------------ | -------------------------------------- | ----- |
| `confidence`       | Certainty of the memory's claims       | 0-1   |
| `relevance`        | Semantic similarity to context         | 0-1   |
| `quality`          | Structural completeness                | 0-1   |
| `reliabilityScore` | Composite: confidence + pinned + usage | 0-1   |

### Implementation

**Service**: `src/services/qualityService.ts`

```typescript
interface QualityMetrics {
  confidence: number;
  relevance: number;
  quality: number;
  reliabilityScore: number;
}
```

### Calculation Heuristics

```typescript
// Confidence: base + modifiers
confidence = memory.confidence || 0.5;
if (text.includes("definitely") || text.includes("certainly"))
  confidence += 0.2;
if (verification.status === "verified") confidence += 0.3;

// Relevance (when context provided)
relevance = cosine(memoryEmbedding, contextEmbedding);

// Quality: text structure
if (50 < textLength < 500) quality = 0.7;
else if (textLength >= 500) quality = 0.9;
else quality = 0.4;

// Reliability: composite
reliabilityScore = confidence * 0.6 + (pinned ? 0.2 : 0) + usage * 0.2;
```

### Quality Boosts in Ranking

| Reliability | Boost |
| ----------- | ----- |
| > 0.8       | +0.10 |
| < 0.4       | -0.05 |
| otherwise   | 0     |

---

## Adaptive Ranking

### Concept

The adaptive ranker combines multiple signals to produce contextually relevant memories. It learns from outcomes to optimize ranking over time.

### Default Weights

| Factor       | Weight | Description                            |
| ------------ | ------ | -------------------------------------- |
| `similarity` | 0.60   | Semantic vector similarity             |
| `recency`    | 0.20   | Exponential decay (half-life ~21 days) |
| `importance` | 0.15   | User-assigned importance (0-1)         |
| `usage`      | 0.05   | Historical access count                |

### Boost Factors

| Factor         | Value | Description               |
| -------------- | ----- | ------------------------- |
| `pin`          | +0.30 | Pinned memory             |
| `helpful`      | +0.10 | Marked as helpful         |
| `verification` | +0.15 | Verified status           |
| `quality`      | +0.10 | High reliability          |
| `outcome`      | ±0.20 | Historical win/loss       |
| `connection`   | ±0.20 | Connected memory outcomes |

### Implementation

**File**: `src/adaptive-ranker.ts`

```typescript
class AdaptiveRanker {
  private weights: RankingWeights = {
    similarity: 0.6,
    recency: 0.2,
    importance: 0.15,
    usage: 0.05,
    pin: 0.3,
    helpful: 0.1,
  };

  async rankResults(
    items: Memory[],
    qVec: number[],
    task?: string,
  ): Promise<Memory[]> {
    const scoredItems = await Promise.all(
      items.map(async (m) => {
        const sim = cosine(m.embedding, qVec);
        const recency = Math.exp(-ageDays / 30);
        const pinBoost = m.pinned ? this.weights.pin : 0;
        const outcomeBoost = this.calculateOutcomeBoost(m.id);
        const connectionBoost = await this.calculateConnectionBoost(m.id);
        const verificationBoost = this.getVerificationBoost(m);
        const qualityBoost = await this.getQualityBoost(m);

        const score =
          this.weights.similarity * sim +
          this.weights.recency * recency +
          this.weights.importance * m.importance +
          this.weights.usage * usageBoost +
          pinBoost +
          outcomeBoost +
          connectionBoost +
          verificationBoost +
          qualityBoost;

        return { ...m, _score: score };
      }),
    );

    return scoredItems.sort((a, b) => b._score - a._score);
  }
}
```

### Outcome-Based Learning

The ranker tracks context outcomes and adjusts weights:

```typescript
trackContext(contextId: string, memoryIds: string[]);
updateOutcome(contextId: string, outcome: 'win' | 'loss' | 'breakeven', helpful?: boolean);

// Win rate > 60%: Increase similarity + helpfulness weights
// Win rate < 40%: Increase recency + importance weights

retrainWeights(); // Called periodically, requires ≥10 outcomes
```

### Multi-Armed Bandit for K-Value

Optimizes context size per task:

```typescript
// Task-specific K values
taskKValues = {
  'planning': 5,   // More context for planning
  'execution': 3,  // Focused context for execution
  'review': 4      // Balanced for review
};

// Epsilon-greedy exploration
learnOptimalK(task, k, outcome) {
  if (Math.random() < 0.1) {
    // Explore: try different k
  } else {
    // Exploit: adjust based on outcome
  }
}
```

---

## Outcome Tracking

### Concept

The outcome service records execution outcomes and propagates them to connected memories, enabling the system to learn from both direct and indirect results.

### Implementation

**Service**: `src/services/outcomeService.ts`

```typescript
recordOutcome(contextId, outcome, details: OutcomeDetails): void {
  // 1. Update AdaptiveRanker
  personaRanker.updateOutcome(contextId, outcome, helpful);

  // 2. Update memory outcomes
  for (memId of memoryIds) {
    vssStore.updateOutcome(memId, outcome, score);
    vssStore.updateHelpful(memId, helpful);
  }

  // 3. Propagate to connections
  propagateOutcomeToConnections(memoryIds, outcome, personaId);
}
```

### Connection Propagation

Outcomes propagate through connections with type-specific multipliers:

| Connection Type | Multiplier | Rationale                |
| --------------- | ---------- | ------------------------ |
| `supports`      | 1.0        | Full propagation         |
| `derives`       | 0.9        | Strong logical link      |
| `exemplifies`   | 0.8        | Good evidence            |
| `extends`       | 0.8        | Builds on concept        |
| `applies`       | 0.7        | Practical use            |
| `associates`    | 0.6        | General relation         |
| `contradicts`   | -0.3       | Valuable counter-example |
| `questions`     | 0.2        | Minimal propagation      |

---

## Reasoning Tools

### Mind Balance

**File**: `src/reasoning/mind-balance.ts`

Implements the Angel/Demon advisory system for decision-making:

```typescript
interface MindBalanceArgs {
  // Phase inputs
  theta: number; // Angel phase angle (cos component)
  phi: number; // Demon phase angle (tan component)

  // Advisory weights
  cosine: number; // Stable, ethical grounding [-1, 1]
  tangent: number; // Urgency, risk [-∞, ∞]

  // Mode
  mode: "angel" | "demon" | "blend" | "probabilistic";

  // Safety
  tanClamp?: number; // Prevent runaway values

  // Optional scoring
  scoring?: {
    rules: ("brier" | "log")[];
    abstainThreshold?: number;
  };
}
```

**Modes**:

- `angel`: Cosine-dominant scoring
- `demon`: Tangent-dominant scoring
- `blend`: Weighted combination
- `probabilistic`: Proper scoring rules with abstention

### Argumentation (Steelman/Strawman)

**File**: `src/reasoning/argumentation.ts`

**Steelman**: Strengthen arguments by finding strongest form

```typescript
interface SteelmanArgs {
  opponentClaim: string;
  charitableAssumptions?: string[];
  strongestPremises?: Premise[];
  anticipatedObjections?: Objection[];
}
```

**Strawman**: Identify weaknesses and distortions

```typescript
interface StrawmanArgs {
  originalClaim: string;
  context?: string;
  distortions?: Distortion[];
  fallacies?: Fallacy[];
  requestRefutation?: boolean;
}
```

**Distortions**:

- `exaggeration`, `oversimplification`, `misattribution`
- `context_stripping`, `quote_mining`, `false_dichotomy`

**Fallacies**:

- `strawman`, `ad_hominem`, `slippery_slope`
- `hasty_generalization`, `circular_reasoning`

---

## Integration Flow

### Memory Creation Flow

```
1. User calls memorize tool
   │
   ▼
2. Generate embedding, store in VSS
   │
   ▼
3. ConnectionService.inferConnections()
   - Find similar memories (similarity > 0.7)
   - Auto-detect connection types
   - Create inferred connections
   │
   ▼
4. (Optional) VerificationService.verifyMemory()
   - Check calculations
   - Verify against existing memories
   - Update verification status
   │
   ▼
5. QualityService.evaluateMemoryQuality()
   - Calculate confidence, relevance, quality
   - Store in memory features
   │
   ▼
6. Memory ready for retrieval
```

### Context Retrieval Flow

```
1. User calls context_broker with task type
   │
   ▼
2. AdaptiveRanker.rankResults()
   - Calculate base scores (similarity, recency, importance, usage)
   - Apply boosts:
     • pinBoost (if pinned)
     • helpfulBoost (if marked helpful)
     • outcomeBoost (from historical outcomes)
     • connectionBoost (from connected memories)
     • verificationBoost (if verified)
     • qualityBoost (if high reliability)
   │
   ▼
3. Return top-k memories for task
   - planning: k=5
   - execution: k=3
   - review: k=4
```

### Outcome Feedback Flow

```
1. User labels outcome via grade_context or label_outcome
   │
   ▼
2. OutcomeService.recordOutcome()
   - Update AdaptiveRanker with outcome
   - Update memory outcomes (success/failure/neutral)
   │
   ▼
3. Propagate to connected memories
   - Calculate type-specific boost
   - Update connected memory rankings
   │
   ▼
4. Periodic weight retraining
   - If ≥10 outcomes: adjust weights based on win rate
   - If ≥20 recent outcomes: normalize weights
```

---

## Database Schema

### Core Tables

```sql
-- Memory connections (graph relationships)
CREATE TABLE memory_connections (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  connection_type TEXT NOT NULL,
  strength REAL DEFAULT 0.5,
  inferred INTEGER DEFAULT 0,
  inference_confidence REAL,
  description TEXT,
  created_at INTEGER NOT NULL
);

-- Verification results
CREATE TABLE memory_verifications (
  id TEXT PRIMARY KEY,
  memory_id TEXT NOT NULL,
  status TEXT NOT NULL,
  confidence REAL,
  sources TEXT,
  verified_calculations TEXT,
  timestamp INTEGER
);

-- Reasoning steps
CREATE TABLE reasoning_steps (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  label TEXT,
  description TEXT,
  status TEXT NOT NULL,
  created_at INTEGER
);

-- Reasoning state persistence
CREATE TABLE reasoning_states (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  state_data TEXT,
  created_at INTEGER
);
```

---

## Configuration

### Persona-Specific Rankers

Each persona maintains its own:

```typescript
// Per-persona configuration
personaRankers: Map<string, AdaptiveRanker>;

// With isolated:
- Weights (may differ per persona)
- Task K values
- Context outcomes
- Connection filtering
```

### Verification Configuration

```typescript
config.verification = {
  enabled: true, // Enable verification
  checkCalculations: true, // Auto-detect calculations
  memoryFirst: true, // Check memories before external
  background: true, // Async verification
};
```

---

## Summary

The Smart-Thinking system provides:

| Feature             | Implementation                              | Files                                 |
| ------------------- | ------------------------------------------- | ------------------------------------- |
| Graph Relationships | 12 connection types with auto-inference     | `connectionService.ts`                |
| Verification        | Memory-first, calculation, connection-based | `verificationService.ts`              |
| Quality             | Heuristic metrics with ranking boosts       | `qualityService.ts`                   |
| Adaptive Ranking    | Multi-signal scoring with outcome learning  | `adaptive-ranker.ts`                  |
| Outcome Tracking    | Context + connection propagation            | `outcomeService.ts`                   |
| Reasoning           | Mind Balance + Steelman/Strawman            | `mind-balance.ts`, `argumentation.ts` |

All components work together to provide intelligent, self-improving memory management with strict persona isolation and graceful degradation.
