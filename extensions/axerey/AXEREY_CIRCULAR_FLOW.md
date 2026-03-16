# 🔄 Axerey Circular Information Processing Flow

## The Learning Cycle

```
                    ╔═══════════════════════════════════╗
                    ║      INFORMATION INPUT            ║
                    ║  (User Query / Task / Request)    ║
                    ╚═══════════╦═══════════════════════╝
                                │
                                ▼
        ┌───────────────────────────────────────────────┐
        │                                               │
        │  1️⃣  CONTEXT BROKER                          │
        │      ┌─────────────────────────┐             │
        │      │ • Task Analysis         │             │
        │      │ • Query Embedding       │             │
        │      │ • Tag Filtering         │             │
        │      │ • Optimal K Selection   │             │
        │      └───────────┬─────────────┘             │
        │                  │                           │
        └──────────────────┼───────────────────────────┘
                           │
                           ▼
        ┌───────────────────────────────────────────────┐
        │                                               │
        │  2️⃣  MEMORY RETRIEVAL                        │
        │      ┌─────────────────────────┐             │
        │      │ • Latest Plans           │             │
        │      │ • Recent Executions      │             │
        │      │ • Active Beliefs         │             │
        │      │ • Procedural Rules       │             │
        │      │ • Important Memories     │             │
        │      │ • Semantic Search        │             │
        │      └───────────┬─────────────┘             │
        │                  │                           │
        └──────────────────┼───────────────────────────┘
                           │
                           ▼
        ┌───────────────────────────────────────────────┐
        │                                               │
        │  3️⃣  ADAPTIVE RANKING                        │
        │      ┌─────────────────────────┐             │
        │      │ • Semantic Similarity   │  (60%)      │
        │      │ • Recency Score          │  (20%)      │
        │      │ • Importance Score       │  (15%)      │
        │      │ • Usage Boost            │  (5%)       │
        │      │ • Pin Boost              │  (+0.3)     │
        │      │ • Helpful Boost          │  (+0.1)     │
        │      │ • Outcome Boost          │  (Dynamic)  │
        │      └───────────┬─────────────┘             │
        │                  │                           │
        └──────────────────┼───────────────────────────┘
                           │
                           ▼
        ┌───────────────────────────────────────────────┐
        │                                               │
        │  4️⃣  CONTEXT DELIVERY                        │
        │      ┌─────────────────────────┐             │
        │      │ • Ranked Memories        │             │
        │      │ • Context ID Generated   │             │
        │      │ • Memory IDs Tracked     │             │
        │      │ • Served to User/AI      │             │
        │      └───────────┬─────────────┘             │
        │                  │                           │
        └──────────────────┼───────────────────────────┘
                           │
                           ▼
        ┌───────────────────────────────────────────────┐
        │                                               │
        │  5️⃣  ACTION / EXECUTION                       │
        │      ┌─────────────────────────┐             │
        │      │ • User/AI Uses Context    │             │
        │      │ • Task Execution          │             │
        │      │ • Decision Making         │             │
        │      │ • Problem Solving         │             │
        │      └───────────┬─────────────┘             │
        │                  │                           │
        └──────────────────┼───────────────────────────┘
                           │
                           ▼
        ┌───────────────────────────────────────────────┐
        │                                               │
        │  6️⃣  OUTCOME TRACKING                        │
        │      ┌─────────────────────────┐             │
        │      │ • Label Outcome          │             │
        │      │   - success/failure      │             │
        │      │   - score & efficiency    │             │
        │      │ • Track Context Outcome  │             │
        │      │   - helpful/unhelpful    │             │
        │      │ • Grade Context          │             │
        │      │   - user feedback        │             │
        │      └───────────┬─────────────┘             │
        │                  │                           │
        └──────────────────┼───────────────────────────┘
                           │
                           ▼
        ┌───────────────────────────────────────────────┐
        │                                               │
        │  7️⃣  MEMORY STORAGE                          │
        │      ┌─────────────────────────┐             │
        │      │ • Store Execution        │             │
        │      │   source: "execution"    │             │
        │      │ • Store Outcome          │             │
        │      │   outcome, score, notes  │             │
        │      │ • Generate Embedding     │             │
        │      │ • Update Usage Count     │             │
        │      └───────────┬─────────────┘             │
        │                  │                           │
        └──────────────────┼───────────────────────────┘
                           │
                           ▼
        ┌───────────────────────────────────────────────┐
        │                                               │
        │  8️⃣  PATTERN LEARNING                        │
        │      ┌─────────────────────────┐             │
        │      │ • Extract Rules          │             │
        │      │   IF/THEN patterns       │             │
        │      │ • Consolidate Memories   │             │
        │      │   K-means clustering     │             │
        │      │ • Create Beliefs         │             │
        │      │   semantic facts         │             │
        │      │ • Pattern Mining         │             │
        │      │   success patterns       │             │
        │      └───────────┬─────────────┘             │
        │                  │                           │
        └──────────────────┼───────────────────────────┘
                           │
                           ▼
        ┌───────────────────────────────────────────────┐
        │                                               │
        │  9️⃣  ADAPTIVE ADJUSTMENT                      │
        │      ┌─────────────────────────┐             │
        │      │ • Update Ranking Weights │             │
        │      │   based on outcomes      │             │
        │      │ • Adjust Optimal K       │             │
        │      │   per task type          │             │
        │      │ • Boost Winning Memories │             │
        │      │ • Penalize Losing Ones    │             │
        │      │ • Retrain Ranker          │             │
        │      └───────────┬─────────────┘             │
        │                  │                           │
        └──────────────────┼───────────────────────────┘
                           │
                           ▼
                    ╔═══════════════════════════════════╗
                    ║   🔁 FEEDBACK LOOP COMPLETE       ║
                    ║   System Improved & Ready         ║
                    ║   for Next Cycle                  ║
                    ╚═══════════╦═══════════════════════╝
                                │
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
        ┌───────────────────┐   ┌───────────────────┐
        │  IMPROVED CONTEXT │   │  BETTER DECISIONS │
        │  SELECTION        │   │  & PERFORMANCE    │
        └───────────────────┘   └───────────────────┘
                    │                       │
                    └───────────┬───────────┘
                                │
                                │ (Cycle Repeats)
                                │
                                ▼
                    ╔═══════════════════════════════════╗
                    ║      INFORMATION INPUT            ║
                    ║  (Next Query / Task / Request)    ║
                    ╚═══════════════════════════════════╝
```

## 🔄 Detailed Cycle Breakdown

### Phase 1: Context Acquisition (Steps 1-3)
```
INPUT → CONTEXT BROKER → MEMORY RETRIEVAL → RANKING
  │           │                │                │
  │           │                │                │
  └───────────┴────────────────┴────────────────┘
              Creates Query Embedding
              Selects Optimal Memories
              Scores & Ranks Results
```

**What Happens:**
1. **Context Broker** receives task + tags
2. Generates query embedding from task description
3. Retrieves memories from multiple sources:
   - Latest plans (source: "plan")
   - Recent executions (source: "execution")
   - Active beliefs (belief: true)
   - Procedural rules (type: "procedural")
   - Important memories (pinned or high importance)
4. **Adaptive Ranker** scores each memory using:
   - Semantic similarity (60%)
   - Recency decay (20%)
   - Importance score (15%)
   - Usage frequency (5%)
   - Pin boost (+0.3)
   - Helpful boost (+0.1)
   - **Outcome boost** (learned from past successes)

### Phase 2: Action & Feedback (Steps 4-6)
```
CONTEXT DELIVERY → ACTION → OUTCOME TRACKING
      │              │            │
      │              │            │
      └──────────────┴────────────┘
      Tracks which memories were used
      Records success/failure outcomes
```

**What Happens:**
1. **Context Delivery** sends top-k ranked memories
2. System generates unique `contextId` and tracks which memory IDs were served
3. **Action/Execution** uses the context to perform task
4. **Outcome Tracking** records:
   - `label_outcome()` - success/failure with score
   - `track_context_outcome()` - helpful/unhelpful
   - `grade_context()` - user feedback on memory quality

### Phase 3: Learning & Adaptation (Steps 7-9)
```
MEMORY STORAGE → PATTERN LEARNING → ADAPTIVE ADJUSTMENT
      │                │                    │
      │                │                    │
      └────────────────┴────────────────────┘
      Stores outcomes → Extracts patterns → Updates weights
```

**What Happens:**
1. **Memory Storage** saves execution with:
   - `source: "execution"`
   - `outcome`, `score`, `efficiency`
   - `servedContextId` (links to context used)
2. **Pattern Learning**:
   - `extract_rules()` - Mines IF/THEN patterns from successful executions
   - `consolidate()` - Clusters similar memories into beliefs
   - `reflect()` - Creates distilled lessons
3. **Adaptive Adjustment**:
   - Updates ranking weights based on outcome patterns
   - Adjusts optimal k values per task type (multi-armed bandit)
   - Boosts memories that led to wins
   - Penalizes memories that led to losses
   - `retrain_ranker()` - Optimizes weight distribution

## 🔁 Feedback Loops

### Loop 1: Outcome → Ranking Boost
```
Memory Used → Outcome Recorded → Boost Calculated → Next Ranking
     │              │                    │                │
     │              │                    │                │
     └──────────────┴────────────────────┴────────────────┘
     Memories that lead to success get higher scores
```

**Example:**
- Memory A used in context → Task succeeds (score: 8.5)
- Outcome boost: +0.15 for Memory A
- Next time similar task → Memory A ranks higher

### Loop 2: Context Quality → K Value Learning
```
Context Served → Outcome Quality → K Value Adjusted → Better Context
     │                │                  │                  │
     │                │                  │                  │
     └────────────────┴──────────────────┴──────────────────┘
     System learns optimal number of memories per task type
```

**Example:**
- Planning task with k=5 → Success
- Planning task with k=3 → Failure
- System learns: planning needs k=5 (more context)

### Loop 3: Pattern Mining → Rule Creation → Better Planning
```
Executions → Pattern Mining → Rules Extracted → Future Planning
     │              │                │                │
     │              │                │                │
     └──────────────┴────────────────┴────────────────┘
     Successful patterns become procedural rules
```

**Example:**
- 5 successful executions with feature X → Rule: "IF feature X THEN success"
- Next planning → Rule included in context → Better decisions

### Loop 4: Consolidation → Beliefs → Semantic Knowledge
```
Similar Memories → Clustering → Beliefs Created → Semantic Search
     │                  │              │                │
     │                  │              │                │
     └──────────────────┴──────────────┴────────────────┘
     Related memories consolidated into higher-confidence beliefs
```

**Example:**
- 10 memories about "TypeScript best practices" → Consolidated
- Creates belief: "TypeScript strict mode improves code quality"
- Future searches return this belief (higher confidence)

## 📊 Circular Data Flow

```
                    ┌─────────────────┐
                    │   USER INPUT    │
                    │  (Query/Task)    │
                    └────────┬────────┘
                             │
                             ▼
        ┌────────────────────────────────────┐
        │  1. CONTEXT BROKER                │
        │  • Analyzes task                   │
        │  • Generates query embedding       │
        │  • Selects optimal k               │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │  2. MEMORY RETRIEVAL               │
        │  • Plans, Executions, Beliefs      │
        │  • Rules, Important Memories       │
        │  • Semantic Search                 │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │  3. ADAPTIVE RANKING              │
        │  • Multi-factor scoring            │
        │  • Outcome-based boost             │
        │  • Task-specific optimization      │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │  4. CONTEXT DELIVERY              │
        │  • Top-k memories                  │
        │  • Context ID tracking            │
        │  • Memory ID tracking             │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │  5. ACTION/EXECUTION              │
        │  • Task performed                  │
        │  • Decision made                   │
        │  • Problem solved                  │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │  6. OUTCOME TRACKING              │
        │  • Success/failure recorded        │
        │  • Score & efficiency stored       │
        │  • Context helpfulness rated       │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │  7. MEMORY STORAGE                │
        │  • Execution saved                 │
        │  • Outcome linked                  │
        │  • Embedding generated             │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │  8. PATTERN LEARNING               │
        │  • Rules extracted                 │
        │  • Memories consolidated           │
        │  • Beliefs created                 │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │  9. ADAPTIVE ADJUSTMENT           │
        │  • Weights updated                 │
        │  • K values optimized              │
        │  • Ranker retrained                │
        └────────────┬───────────────────────┘
                     │
                     │ ┌─────────────────────┐
                     │ │ FEEDBACK LOOPS:     │
                     │ │ • Outcome → Boost    │
                     │ │ • Quality → K Value │
                     │ │ • Patterns → Rules   │
                     │ │ • Memory → Beliefs   │
                     │ └─────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │  IMPROVED SYSTEM                   │
        │  • Better context selection        │
        │  • Smarter ranking                  │
        │  • Learned patterns                 │
        │  • Optimized parameters            │
        └────────────┬───────────────────────┘
                     │
                     │ (Cycle Repeats)
                     │
                     ▼
                    ┌─────────┐
                    │ NEXT    │
                    │ CYCLE   │
                    └─────────┘
```

## 🎯 Key Circular Patterns

### Pattern 1: Outcome-Based Learning Cycle
```
Memory Selection → Execution → Outcome → Boost/Penalty → Better Selection
      ↑                                                              │
      └──────────────────────────────────────────────────────────────┘
```

### Pattern 2: Context Quality Improvement Cycle
```
Context Served → User Feedback → Weight Adjustment → Better Context
      ↑                                                      │
      └──────────────────────────────────────────────────────┘
```

### Pattern 3: Knowledge Consolidation Cycle
```
Raw Memories → Clustering → Beliefs → Semantic Search → Better Retrieval
      ↑                                                          │
      └──────────────────────────────────────────────────────────┘
```

### Pattern 4: Rule Extraction Cycle
```
Executions → Pattern Mining → Rules → Planning Context → Better Executions
      ↑                                                          │
      └──────────────────────────────────────────────────────────┘
```

## 🔄 Continuous Improvement Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CYCLE N                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Context  │→ │  Action  │→ │ Outcome  │→ │ Learning │  │
│  │ Selection│  │          │  │ Tracking │  │          │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  ADJUSTMENTS  │
                    │  • Weights    │
                    │  • K Values   │
                    │  • Rules      │
                    │  • Beliefs   │
                    └───────┬───────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   CYCLE N+1 (IMPROVED)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Context  │→ │  Action  │→ │ Outcome  │→ │ Learning │  │
│  │ Selection│  │          │  │ Tracking │  │          │  │
│  │ (Better) │  │ (Better) │  │ (Better) │  │ (Better) │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 💡 How Information Flows Through the Cycle

### Input → Processing → Output → Feedback → Learning

1. **INPUT**: User query, task, or request
2. **PROCESSING**: 
   - Context broker analyzes and retrieves
   - Adaptive ranker scores and ranks
   - Top-k memories selected
3. **OUTPUT**: Context delivered to user/AI
4. **ACTION**: Task executed using context
5. **FEEDBACK**: Outcome recorded (success/failure/helpful)
6. **LEARNING**: 
   - Patterns extracted
   - Weights adjusted
   - Rules created
   - Beliefs consolidated
7. **IMPROVEMENT**: System better for next cycle

### The Self-Improving Loop

```
Every cycle makes the system smarter:
  • Memories that help → Get boosted
  • Patterns that work → Become rules
  • Context that's good → Gets prioritized
  • Decisions that succeed → Inform future decisions
```

---

*This circular flow ensures Axerey continuously learns and improves from every interaction, creating a self-optimizing memory and reasoning system.*

