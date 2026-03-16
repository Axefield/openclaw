# mHC vs Axerey Systems: Architectural Comparison

## Executive Summary

This document compares **mHC (Manifold-Constrained Hyper-Connections)** from DeepSeek-AI with **Axerey's memory and reasoning systems**. While mHC focuses on neural network architecture (residual connections in transformers), and Axerey focuses on memory systems, there are striking architectural parallels in their approaches to connectivity, stability, and adaptive learning.

---

## 1. Core Architectural Concepts

### mHC (Manifold-Constrained Hyper-Connections)

**Domain**: Neural Network Architecture (Transformers/LLMs)

**Core Innovation**:
- Extends residual connections by expanding residual stream width
- Uses learnable mappings (`H^res`, `H^pre`, `H^post`) to mix features
- Projects onto constrained manifolds to restore identity mapping property
- Addresses training instability and scalability issues

**Key Equation**:
```
x_{l+1} = H^res_l * x_l + H^post_l^T * F(H^pre_l * x_l, W_l)
```

### Axerey Systems

**Domain**: Memory and Reasoning Systems (MCP Server)

**Core Innovation**:
- Dual storage pattern (SQLite + Vector Search)
- Graph-based memory connections (12 connection types)
- Adaptive ranking with outcome-based learning
- Smart-Thinking enhancements (verification, quality, connections)

**Key Architecture**:
```typescript
MemoryStore (SQLite) + VSSMemoryStore (Vector Search)
  ↓
ConnectionService (Graph Relationships)
  ↓
AdaptiveRanker (Outcome-Based Learning)
```

---

## 2. Connectivity Patterns

### mHC: Hyper-Connections

**Structure**:
- **Residual Stream Expansion**: Feature dimension expanded from `C` to `n×C` (expansion rate `n`)
- **Learnable Mappings**:
  - `H^res ∈ ℝ^{n×n}`: Mixes features within residual stream
  - `H^pre ∈ ℝ^{1×n}`: Aggregates from `nC`-dim stream to `C`-dim layer input
  - `H^post ∈ ℝ^{1×n}`: Maps layer output back onto stream

**Connection Types**: Implicit (through matrix multiplications)

### Axerey: Memory Connections

**Structure**:
- **Memory Graph**: Explicit graph relationships between memories
- **Connection Types** (12 types):
  - `supports`, `contradicts`, `refines`, `derives`
  - `exemplifies`, `generalizes`, `questions`, `analyzes`
  - `synthesizes`, `associates`, `extends`, `applies`

**Connection Properties**:
- **Strength**: 0-1 (learnable/inferred)
- **Inferred**: Auto-inference based on similarity, tags, sessions
- **Transitivity**: Supports transitive relationships

**Code Reference**:
```12:24:src/services/connectionService.ts
export type ConnectionType =
  | 'supports'
  | 'contradicts'
  | 'refines'
  | 'derives'
  | 'exemplifies'
  | 'generalizes'
  | 'questions'
  | 'analyzes'
  | 'synthesizes'
  | 'associates'
  | 'extends'
  | 'applies';
```

---

## 3. Constraint Mechanisms

### mHC: Manifold Constraints

**Problem**: Hyper-Connections lose identity mapping property, causing:
- Training instability
- Limited scalability
- Numerical instability

**Solution**: **Manifold-Constrained Projection**
- Projects residual connection space onto specific manifold
- Restores identity mapping property
- Uses Sinkhorn-Knopp algorithm for doubly stochastic matrices
- Maintains stability while preserving performance gains

**Key Insight**: Constrain the learnable mappings to preserve fundamental properties

### Axerey: Ranking Constraints

**Problem**: Memory access overhead, context selection quality, scalability

**Solution**: **Multi-Factor Ranking with Constraints**
- **Ranking Algorithm** (constrained weights):
  - 60% semantic similarity
  - 20% recency (exponential decay)
  - 15% importance score
  - 5% usage boost
  - +0.3 pin boost
  - +0.1 helpful boost
  - Dynamic outcome-based boost
  - Connection strength boost

**Code Reference**:
```74:113:src/adaptive-ranker.ts
  async rankResults(items: Memory[], qVec: number[], task?: string): Promise<Memory[]> {
    const now = Date.now();
    
    const scoredItems = await Promise.all(items.map(async (m) => {
      const sim = cosine(m.embedding, qVec);
      const ageDays = (now - m.createdAt) / (1000 * 60 * 60 * 24);
      const recency = Math.exp(-ageDays / 30); // half-life ~20.8 days
      const importance = m.importance;
      const usageBoost = Math.min(m.usage / 10, 0.2);
      const pinBoost = m.pinned ? this.weights.pin : 0;
      const helpfulBoost = m.helpful === true ? this.weights.helpful : 
                           m.helpful === false ? -this.weights.helpful : 0;

      // Calculate outcome-based boost
      const outcomeBoost = this.calculateOutcomeBoost(m.id);
      
      // Calculate connection-based boost (if connection service available)
      const connectionBoost = await this.calculateConnectionBoost(m.id);
      
      // Calculate verification and quality boosts (if quality service available)
      const verificationBoost = this.getVerificationBoost(m);
      const qualityBoost = await this.getQualityBoost(m);

      const score = 
        this.weights.similarity * sim + 
        this.weights.recency * recency + 
        this.weights.importance * importance + 
        this.weights.usage * usageBoost + 
        pinBoost + 
        helpfulBoost +
        outcomeBoost +
        connectionBoost +
        verificationBoost +
        qualityBoost;

      return { ...m, _score: score } as any;
    }));
    
    return scoredItems.sort((a, b) => b._score - a._score);
  }
```

**Key Insight**: Constrain ranking weights to maintain stability while enabling adaptive learning

---

## 4. Stability and Scalability

### mHC: Training Stability

**Challenges**:
- Numerical instability in unconstrained hyper-connections
- Loss of identity mapping property
- Memory access overhead

**Solutions**:
1. **Manifold Projection**: Sinkhorn-Knopp algorithm (t_max = 20 iterations)
2. **Infrastructure Optimization**:
   - Kernel fusion
   - Recomputation strategies
   - Overlapping communication in DualPipe

**Results**: Effective for training at scale (3B, 9B, 27B models)

### Axerey: System Stability

**Challenges**:
- Memory access overhead (vector search)
- Context selection quality
- Scalability with large memory stores

**Solutions**:
1. **Graceful Degradation**: Fallback to cosine similarity if VSS unavailable
2. **Connection-Based Expansion**: Follows memory connections for context
3. **Adaptive Ranking**: Outcome-based learning with weight constraints
4. **Quality-Aware Selection**: Prioritizes verified, high-quality memories

**Code Reference**:
```115:145:src/adaptive-ranker.ts
  // Calculate connection-based boost
  private async calculateConnectionBoost(memoryId: string): Promise<number> {
    if (!this.connectionService || !this.personaId) return 0;
    
    // Get connections for this memory (persona-filtered)
    const connections = this.connectionService.getConnections(memoryId, this.personaId);
    if (connections.length === 0) return 0;
    
    // Calculate boost based on connected memories' outcome history
    let totalBoost = 0;
    for (const conn of connections) {
      const connectedId = conn.sourceId === memoryId ? conn.targetId : conn.sourceId;
      const connectedBoost = this.calculateOutcomeBoost(connectedId);
      
      // Scale by connection strength and type
      const typeMultipliers: Record<string, number> = {
        'supports': 0.8,
        'derives': 0.7,
        'exemplifies': 0.6,
        'associates': 0.4,
        'contradicts': -0.2, // Contradictions provide context but reduce confidence
        'questions': 0.2
      };
      
      const multiplier = typeMultipliers[conn.connectionType] || 0.5;
      totalBoost += connectedBoost * multiplier * conn.strength;
    }
    
    // Normalize by number of connections (cap at 0.2)
    return Math.min(totalBoost / Math.max(connections.length, 1), 0.2);
  }
```

---

## 5. Adaptive Learning Mechanisms

### mHC: Learnable Mappings

**Learning**:
- `H^res`, `H^pre`, `H^post` are learnable parameters
- Trained end-to-end with the model
- Constrained to manifolds during training

**Adaptation**: Implicit through gradient descent

### Axerey: Outcome-Based Learning

**Learning**:
- **Outcome Tracking**: Tracks wins/losses/breakeven for contexts
- **Weight Adjustment**: Retrains ranking weights based on outcomes
- **Connection Learning**: Connection strength adjusted by outcomes
- **K-Value Learning**: Multi-armed bandit for optimal context size

**Code Reference**:
```175:202:src/adaptive-ranker.ts
  // Calculate boost based on historical outcomes
  private calculateOutcomeBoost(memoryId: string): number {
    const relevantContexts = this.contextOutcomes.filter(c => 
      c.memoryIds.includes(memoryId) && c.outcome !== null
    );

    if (relevantContexts.length === 0) return 0;

    const wins = relevantContexts.filter(c => c.outcome === 'win').length;
    const losses = relevantContexts.filter(c => c.outcome === 'loss').length;
    const total = relevantContexts.length;

    if (total < 2) return 0; // Need at least 2 data points

    const winRate = wins / total;
    const confidence = Math.max(wins, losses) / total;

    // Boost memories that consistently lead to wins
    if (winRate > 0.6 && confidence > 0.7) {
      return 0.2; // Strong positive boost
    } else if (winRate > 0.5 && confidence > 0.6) {
      return 0.1; // Moderate positive boost
    } else if (winRate < 0.4 && confidence > 0.7) {
      return -0.1; // Negative boost for consistently bad outcomes
    }

    return 0;
  }
```

**Adaptation**: Explicit outcome-based learning with feedback loops

---

## 6. Infrastructure Optimizations

### mHC: System-Level Optimizations

1. **Kernel Fusion**: Fuses operations to reduce memory access
2. **Recomputation**: Strategic recomputation to save memory
3. **Overlapping Communication**: DualPipe for parallel communication

**Focus**: Training efficiency and memory bandwidth

### Axerey: System-Level Optimizations

1. **Dual Storage Pattern**: SQLite (persistent) + Vector Search (semantic)
2. **Connection Caching**: Graph traversal optimization
3. **Graceful Degradation**: Fallback strategies
4. **Persona Isolation**: Strict memory isolation per persona

**Focus**: Query efficiency and system reliability

---

## 7. Key Architectural Parallels

| Aspect | mHC | Axerey |
|--------|-----|--------|
| **Core Innovation** | Hyper-connections in residual stream | Memory connections in knowledge graph |
| **Constraint Mechanism** | Manifold projection (Sinkhorn-Knopp) | Ranking weight constraints |
| **Stability Solution** | Restore identity mapping | Outcome-based learning with constraints |
| **Connection Types** | Implicit (matrix operations) | Explicit (12 semantic types) |
| **Learning Mechanism** | Gradient descent on learnable mappings | Outcome-based weight adjustment |
| **Scalability Focus** | Training at scale (3B-27B models) | Memory systems at scale |
| **Infrastructure** | Kernel fusion, recomputation | Dual storage, connection caching |

---

## 8. Fundamental Differences

### Domain Focus

- **mHC**: Neural network architecture (forward pass computation)
- **Axerey**: Memory and reasoning systems (persistent knowledge)

### Connection Semantics

- **mHC**: Implicit connections through matrix multiplications
- **Axerey**: Explicit semantic connections (supports, contradicts, etc.)

### Learning Paradigm

- **mHC**: End-to-end gradient descent
- **Axerey**: Outcome-based reinforcement learning

### Constraint Application

- **mHC**: Mathematical constraints (doubly stochastic matrices)
- **Axerey**: Heuristic constraints (ranking weights, connection strength)

---

## 9. Potential Cross-Pollination Ideas

### From mHC to Axerey

1. **Manifold Constraints for Connections**: Could apply Sinkhorn-Knopp to normalize connection strength matrices
2. **Kernel Fusion**: Could fuse memory retrieval operations
3. **Recomputation**: Could recompute embeddings on-demand to save storage

### From Axerey to mHC

1. **Explicit Connection Types**: Could add semantic connection types to hyper-connections
2. **Outcome-Based Learning**: Could track training outcomes to adjust hyper-connection weights
3. **Quality Metrics**: Could add quality evaluation for different connection patterns

---

## 10. Conclusion

While **mHC** and **Axerey** operate in different domains (neural network architecture vs. memory systems), they share remarkable architectural parallels:

1. **Both use graph-like connectivity patterns** (hyper-connections vs. memory connections)
2. **Both apply constraints to maintain stability** (manifold projection vs. ranking constraints)
3. **Both address scalability challenges** (training at scale vs. memory systems at scale)
4. **Both use adaptive learning** (gradient descent vs. outcome-based learning)

The key insight is that **both systems recognize the importance of constrained connectivity**—whether in neural network layers or memory graphs—to achieve stability, scalability, and performance.

**mHC** demonstrates that unconstrained hyper-connections can be unstable, and **Axerey** demonstrates that unconstrained memory connections can be inefficient. Both systems solve this through **intelligent constraint mechanisms** that preserve fundamental properties while enabling adaptive learning.

---

## References

- **mHC Paper**: [arXiv:2512.24880v1](https://arxiv.org/abs/2512.24880v1) - "mHC: Manifold-Constrained Hyper-Connections" (DeepSeek-AI, 2025)
- **Axerey Systems**: See `.cursor/rules/01-architecture.md` and `src/adaptive-ranker.ts`



