# Context Broker System Analysis

Deep dive into how the Vagogon context broker system works and orchestrates memory retrieval for optimal context.

## 🧠 Context Broker Architecture

The context broker is the **intelligent memory retrieval system** that orchestrates multiple components to provide exactly the right memories for any given task. It's designed to be **adaptive**, **learning**, and **context-aware**.

## 🔄 How Context Broker Works

### 1. **Input Processing**
```typescript
async function context_broker({ task, tags, k }: { task: string; tags: string[]; k: number })
```

**Parameters:**
- **task**: The type of task (planning, execution, review, reasoning, decision-making, argument-analysis)
- **tags**: Filter memories by specific tags
- **k**: Number of memories to retrieve (optional - system learns optimal values)

### 2. **Adaptive K Selection**
```typescript
const optimalK = k || adaptiveRanker.getOptimalK(task);
```

**Task-Specific K Values:**
- **planning**: 5 memories (comprehensive context for planning)
- **execution**: 3 memories (focused context for implementation)
- **review**: 4 memories (balanced context for evaluation)

**Learning Mechanism:**
- Uses **multi-armed bandit** approach to learn optimal k values
- Adjusts k based on task outcomes (win/loss/breakeven)
- Explores different k values with epsilon-greedy strategy

### 3. **Multi-Source Memory Gathering**

The context broker gathers memories from **multiple strategic sources**:

#### **Core Sources (Always Included)**
```typescript
// Latest plan
const plans = await vssStore.list({ source: 'plan', tags: tags.length > 0 ? tags : [] });
if (plans.length > 0) {
  context.push(plans[0]); // Most recent plan
}

// Last 3 executions
const executions = await vssStore.list({ source: 'execution', tags: tags.length > 0 ? tags : [] });
context.push(...executions.slice(0, 3));

// Active beliefs (consolidated knowledge)
const beliefs = await vssStore.list({ belief: true, tags: tags.length > 0 ? tags : [] });
context.push(...beliefs.slice(0, 2));

// Relevant procedural rules
const rules = await vssStore.list({ type: 'procedural', tags: tags.length > 0 ? tags : [] });
context.push(...rules.slice(0, 2));

// Important memories (tagged with 'important')
const importantMemories = await vssStore.list({ tags: ['important'] });
context.push(...importantMemories.slice(0, 1));
```

#### **Enhanced Context for Reasoning Tasks**
```typescript
if (task === 'reasoning' || task === 'decision-making' || task === 'argument-analysis') {
  // Reasoning-specific memories
  const reasoningMemories = await vssStore.list({ 
    tags: ['reasoning', 'decision', 'argument', 'mind-balance', 'steelman', 'strawman'] 
  });
  context.push(...reasoningMemories.slice(0, 3));
  
  // Recent decision outcomes
  const decisionOutcomes = await vssStore.list({ 
    source: 'execution', 
    tags: ['decision', 'reasoning'] 
  });
  context.push(...decisionOutcomes.slice(0, 2));
}
```

### 4. **Deduplication**
```typescript
const uniqueContext = context.filter((mem, index, arr) => 
  arr.findIndex(m => m.id === mem.id) === index
);
```

### 5. **Adaptive Ranking**

The system uses a **sophisticated ranking algorithm** that combines multiple factors:

#### **Ranking Formula**
```typescript
const score = 
  this.weights.similarity * sim +           // 60% - Semantic similarity
  this.weights.recency * recency +          // 20% - Recency (exponential decay)
  this.weights.importance * importance +     // 15% - Importance score
  this.weights.usage * usageBoost +         // 5% - Usage boost (capped at 0.2)
  pinBoost +                                // +0.3 - Pin boost
  helpfulBoost +                            // +0.1 - User feedback boost
  outcomeBoost;                             // Dynamic - Outcome-based boost
```

#### **Ranking Factors Explained**

**1. Semantic Similarity (60%)**
- Uses **cosine similarity** between query vector and memory embeddings
- Generated from task + tags: `await embeddings.embed(\`${task} ${tags.join(' ')}\`)`
- Most important factor for relevance

**2. Recency (20%)**
- **Exponential decay** with ~20.8 day half-life
- Formula: `Math.exp(-ageDays / 30)`
- Recent memories get higher scores

**3. Importance (15%)**
- User-assigned importance score (0-1)
- Prioritizes high-importance memories

**4. Usage Boost (5%)**
- Capped at 0.2: `Math.min(m.usage / 10, 0.2)`
- Frequently used memories get slight boost

**5. Pin Boost (+0.3)**
- Pinned memories get significant boost
- Ensures important memories are always considered

**6. Helpful Boost (+0.1)**
- User-rated helpful memories get boost
- User-rated unhelpful memories get penalty
- Learns from user feedback

**7. Outcome Boost (Dynamic)**
- **Most sophisticated factor** - learns from outcomes
- Memories that consistently lead to "wins" get boost
- Memories that consistently lead to "losses" get penalty
- Requires at least 2 data points for confidence

### 6. **Outcome-Based Learning**

#### **Context Tracking**
```typescript
// Track this context for outcome learning
const finalContext = rankedContext.slice(0, optimalK);
adaptiveRanker.trackContext(contextId, finalContext.map(m => m.id));

// Set served context ID for outcome tracking
for (const mem of finalContext) {
  await vssStore.setServedContext(mem.id, contextId);
}
```

#### **Outcome Calculation**
```typescript
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

### 7. **Weight Adaptation**

The system **automatically adjusts ranking weights** based on performance:

```typescript
retrainWeights() {
  // Adjust weights based on overall performance
  if (winRate > 0.6) {
    // We're doing well, increase importance of similarity and helpfulness
    this.weights.similarity = Math.min(0.8, this.weights.similarity + 0.05);
    this.weights.helpful = Math.min(0.2, this.weights.helpful + 0.02);
  } else if (winRate < 0.4) {
    // We're struggling, increase importance of recency and importance
    this.weights.recency = Math.min(0.3, this.weights.recency + 0.05);
    this.weights.importance = Math.min(0.25, this.weights.importance + 0.05);
  }
}
```

## 🎯 Context Broker Intelligence

### **Multi-Source Strategy**
The context broker doesn't just do semantic search - it **strategically combines** different types of memories:

1. **Plans** - Latest planning context
2. **Executions** - Recent implementation experience
3. **Beliefs** - Consolidated knowledge
4. **Rules** - Procedural knowledge
5. **Important** - User-marked critical information
6. **Reasoning** - Task-specific reasoning memories
7. **Outcomes** - Past decision results

### **Task-Aware Adaptation**
Different tasks get **specialized context**:
- **Reasoning tasks** get additional reasoning-specific memories
- **Decision-making** gets decision outcomes and patterns
- **Argument analysis** gets argument-related memories

### **Learning Integration**
The system **learns from every interaction**:
- Tracks which memories were provided
- Records task outcomes (win/loss/breakeven)
- Adjusts ranking weights based on performance
- Learns optimal k values for each task type

## 🔧 Technical Implementation

### **Vector Search Integration**
- Uses **hybrid VSS** (HNSW + Vectorlite) for performance
- **1536-dimensional embeddings** from OpenAI
- **Fallback to cosine similarity** if VSS unavailable
- **Metadata filtering** combined with vector similarity

### **Database Integration**
- **SQLite** with automatic indexing
- **JSON storage** for complex fields
- **Context tracking** with served_context_id
- **Outcome storage** for learning

### **Performance Optimization**
- **Efficient queries** with proper indexing
- **Batch operations** for context tracking
- **Memory deduplication** to avoid redundancy
- **Adaptive k values** to minimize noise

## 🚀 Key Benefits

### **Intelligent Context Selection**
- **Multi-factor ranking** considers relevance, recency, importance, usage, and outcomes
- **Task-specific adaptation** provides relevant context for different types of work
- **Learning from outcomes** improves context quality over time

### **Adaptive Learning**
- **Automatic weight adjustment** based on performance
- **Optimal k learning** for each task type
- **Outcome-based memory boosting** for successful patterns

### **Comprehensive Coverage**
- **Multiple memory sources** ensure comprehensive context
- **Strategic memory selection** from plans, executions, beliefs, rules, and important memories
- **Reasoning-specific context** for complex analytical tasks

The context broker is the **brain** of the Vagogon system - it intelligently orchestrates memory retrieval to provide exactly the right context for any task, learning and improving over time.
