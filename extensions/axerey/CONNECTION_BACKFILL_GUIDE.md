# Memory Connection Backfill Guide

## Overview

This guide explains how to backfill memory connections from existing memory data. The backfill script analyzes your existing memories and infers connections based on **Axerey's complete system architecture**:

### Core Relationships
1. **Shared Tags** → `associates` connections (optimized for 1444 tags)
2. **Same Session ID** → `extends` connections (sequential memories)
3. **Similar Embeddings** → `supports` or `refines` connections
4. **MergedFrom Relationships** → `derives` connections
5. **Same Type/Source** → `associates` connections (with shared tags)

### Axerey-Specific Relationships
6. **Memory Type Transitions** → `generalizes`, `derives`, `applies`
7. **Belief System** → `supports`, `contradicts`
8. **Outcome Tracking** → `exemplifies`, `questions`, `supports`
9. **Context Tracking** → `associates` (same servedContextId)
10. **Helpful Feedback** → `supports`, `contradicts`
11. **Source Workflows** → `extends` (plan→execution), `derives` (execution→account)
12. **Confidence/Quality** → `supports` (high→low confidence)
13. **Features-Based** → `associates` (same reasoningType)
14. **Argument Analysis** → `refines`, `contradicts`, `supports`, `derives` (steelman/strawman/pipeline)

## Running the Backfill

### Prerequisites

1. Ensure your database exists and has memories
2. The connection tables will be created automatically if they don't exist

### Command

```bash
npm run backfill-connections
```

Or specify a custom database path:

```bash
tsc scripts/backfill-connections.ts --outDir dist/scripts --module esnext --target es2020 --moduleResolution node && node dist/scripts/backfill-connections.js ./path/to/your/database.db
```

## Connection Types Inferred

### Axerey-Specific Connection Types

### 1. Derives (Strength: 0.9, Confidence: 0.95)
- **Source**: `mergedFrom` field in memories
- **Logic**: If memory A has memory B in its `mergedFrom` array, create `A derives B`
- **Use Case**: Shows memory provenance and evolution

### 2. Associates (Strength: 0.4-0.85, Confidence: 0.7-0.8)
- **Source**: Shared tags between memories (OPTIMIZED for large tag sets)
- **Optimization Strategy**:
  - **Tag Frequency Analysis**: Categorizes tags as common (>15% of memories), medium, or rare (<2%)
  - **Rare Tag Combinations**: Connects memories sharing rare 2-tag combinations (2-10 memories)
  - **Multiple Shared Tags**: Requires 2+ shared meaningful tags (excludes common tags)
  - **Rare Single Tags**: Connects memories sharing rare tags (2-5 memories only)
- **Strength Calculation**: 
  - Rare combinations: 0.5 + (shared tags × 0.1), up to 0.85
  - Multiple tags: 0.4 + (shared tags × 0.15), up to 0.8
  - Rare tags: 0.7 fixed
- **Use Case**: Groups related memories by meaningful tag relationships, avoiding over-connection from common tags

### 3. Extends (Strength: 0.5-0.7, Confidence: 0.75)
- **Source**: Same `sessionId` with sequential creation times
- **Logic**: Memories created in sequence within the same session
- **Optimization**: Only connects adjacent pairs (not all-to-all), and only if created within 24 hours
- **Strength Calculation**: Decays over time (hours)
- **Use Case**: Shows conversation/thought flow

### 4. Supports (Strength: 0.85+, Confidence: 0.85+)
- **Source**: Very high semantic similarity (>0.85)
- **Logic**: Memories with nearly identical embeddings
- **Optimization**: Limits to 20 comparisons per memory, keeps top 3 most similar
- **Use Case**: Identifies strongly related or duplicate content

### 5. Refines (Strength: 0.7-0.85, Confidence: 0.7-0.85)
- **Source**: High similarity (>0.75) with same type and source
- **Logic**: Similar memories of the same category
- **Optimization**: Only processes if similarity >0.75 to avoid noise
- **Use Case**: Shows memory refinement or iteration

### 6. Type/Source + Shared Tags (Strength: 0.4, Confidence: 0.6)
- **Source**: Same type and source, plus at least one shared meaningful tag
- **Logic**: Requires both same category AND shared tag (avoids over-connecting)
- **Optimization**: Limits to 3 connections per memory
- **Use Case**: Groups memories by category that also share specific topics

### 7. Memory Type Relationships (Axerey-Specific)

**Episodic → Semantic: `generalizes` (Strength: 0.75, Confidence: 0.8)**
- **Source**: Episodic memories with semantic memories sharing 2+ meaningful tags
- **Logic**: Semantic memories consolidate/generalize episodic experiences
- **Use Case**: Shows how experiences become knowledge

**Episodic → Procedural: `derives` (Strength: 0.8, Confidence: 0.75)**
- **Source**: High-success episodic memories (score >0.7) with procedural rules
- **Logic**: Successful experiences derive procedural rules
- **Use Case**: Shows rule extraction from successful patterns

**Semantic → Procedural: `applies` (Strength: 0.7, Confidence: 0.7)**
- **Source**: Belief memories (semantic) with procedural rules
- **Logic**: Procedural rules apply semantic knowledge
- **Use Case**: Shows how knowledge becomes actionable procedures

### 8. Belief System Relationships (Strength: 0.6-0.85, Confidence: 0.7-0.85)

**Belief → Episodic: `supports`**
- **Source**: High-confidence belief memories supporting episodic memories
- **Logic**: Beliefs (semantic facts) support related experiences
- **Use Case**: Shows how knowledge supports experiences

**Belief ↔ Belief: `contradicts`**
- **Source**: Belief memories on same topic with confidence difference >0.3
- **Logic**: Contradicting beliefs on same topic
- **Use Case**: Identifies conflicting knowledge

### 9. Outcome-Based Relationships

**Success → Procedural: `exemplifies` (Strength: 0.8, Confidence: 0.8)**
- **Source**: High-success outcomes (score >0.7) with procedural rules
- **Logic**: Successful outcomes exemplify procedural rules
- **Use Case**: Shows which rules lead to success

**Failure → Procedural: `questions` (Strength: 0.6, Confidence: 0.7)**
- **Source**: Failure outcomes with procedural rules
- **Logic**: Failures question the effectiveness of rules
- **Use Case**: Identifies rules that may need revision

**High Performance → Related: `supports` (Strength: 0.8-0.9, Confidence: 0.8)**
- **Source**: High efficiency/score memories supporting related ones
- **Logic**: High-performance memories support related memories
- **Use Case**: Highlights successful patterns

### 10. Context-Based Relationships (Strength: 0.65, Confidence: 0.75)
- **Source**: Same `servedContextId` (contextual grouping)
- **Logic**: Memories that served the same context are related
- **Optimization**: Limits to 5 connections per memory
- **Use Case**: Groups memories by contextual usage

### 11. Helpful Feedback Relationships

**Helpful → Related: `supports` (Strength: 0.75, Confidence: 0.8)**
- **Source**: Memories with `helpful: true` supporting related memories
- **Logic**: Helpful memories support related ones
- **Use Case**: Highlights useful memories

**Unhelpful ↔ Helpful: `contradicts` (Strength: 0.65, Confidence: 0.7)**
- **Source**: Unhelpful memories contradicting helpful ones on same topic
- **Logic**: User feedback indicates contradiction
- **Use Case**: Identifies conflicting user experiences

### 12. Source Workflow Relationships

**Plan → Execution: `extends` (Strength: 0.7, Confidence: 0.75)**
- **Source**: Plan memories with execution memories (within 7 days)
- **Logic**: Execution extends/implements plans
- **Use Case**: Shows planning-to-implementation flow

**Execution → Account: `derives` (Strength: 0.75, Confidence: 0.8)**
- **Source**: Execution memories with account memories (within 30 days)
- **Logic**: Account derives from execution results
- **Use Case**: Shows action-to-result tracking

### 13. Confidence/Quality Relationships

**High Confidence → Low Confidence: `supports` (Strength: 0.8+, Confidence: 0.8)**
- **Source**: High confidence (>0.8) supporting low confidence (<0.6) on same topic
- **Logic**: High-confidence memories support uncertain ones
- **Use Case**: Strengthens uncertain memories with reliable knowledge

**High Importance → Related: `supports` (Strength: 0.8+, Confidence: 0.75)**
- **Source**: High importance (>0.8) memories supporting related ones
- **Logic**: Important memories support related content
- **Use Case**: Highlights critical knowledge connections

### 14. Features-Based Relationships (Strength: 0.65, Confidence: 0.7)
- **Source**: Same `features.reasoningType` or `features.reasoningSession`
- **Logic**: Memories with same reasoning type are related
- **Optimization**: Limits to 5 connections per memory
- **Use Case**: Groups memories by reasoning methodology

### 15. Trading-Specific Relationships (Strength: 0.6-0.8, Confidence: 0.65-0.85)

**Similar Trading Setups: `exemplifies` (Strength: 0.8, Confidence: 0.85)**
- **Source**: Trades with 2+ similar features (setup, entry, exit, indicator, strategy)
- **Logic**: Successful trades (score >0.7) with same setup exemplify each other
- **Use Case**: Identifies winning patterns in trading data (e.g., 87 SPY memories)

**Trades to Rules: `derives` (Strength: 0.75, Confidence: 0.7)**
- **Source**: Successful trades (score >0.7) with procedural rules
- **Logic**: Successful trades derive/validate procedural rules
- **Use Case**: Links trading executions to IF/THEN rules extracted via `extract_rules`

**Time-Based Trading: `extends` (Strength: 0.6, Confidence: 0.65)**
- **Source**: Trades executed on same day
- **Logic**: Trades on same day extend each other (trading session continuity)
- **Use Case**: Groups trades by trading sessions

**Win/Loss Analysis: `questions` (Strength: 0.7, Confidence: 0.75)**
- **Source**: Failed trades with same setup as successful trades
- **Logic**: Failed trades question successful trades with identical features
- **Use Case**: Identifies edge cases and setup failures

**Pattern-Based: `supports` (Strength: 0.8, Confidence: 0.85)**
- **Source**: Trades sharing successful feature patterns (via `extract_rules` logic)
- **Logic**: Trades that share patterns with >60% success rate support each other
- **Use Case**: Connects trades that follow proven patterns (e.g., "IF setup:X THEN success")

**Symbol Grouping**: Trades are automatically grouped by symbol (SPY, etc.) for focused analysis

## UI Enhancements

### List View
- **Mini Graph Component**: Shows up to 3 connections per memory card
- **Connection Badges**: Color-coded by connection type
- **Click to View**: Click a connection to see details

### Graph View
- **Full Graph**: Interactive canvas visualization
- **Mini List Sidebar**: Compact list of all memories with connection counts
- **Expandable Details**: Click memories to see their connections

## Connection Type Colors

- `supports`: Green (#28a745)
- `contradicts`: Red (#dc3545)
- `refines`: Cyan (#17a2b8)
- `derives`: Yellow (#ffc107)
- `associates`: Gray (#6c757d)
- `extends`: Purple (#6610f2)

## Example Output

```
Starting connection backfill...
Found 150 memories to process
Created 25 derives connections from mergedFrom
Created 180 associates connections from tags
Created 45 extends connections from sessions
Created 30 similarity-based connections
Total connections to create: 280
✅ Successfully created 280 connections
   - Derives: 25
   - Associates: 180
   - Extends: 45
   - Supports: 15
   - Refines: 15
```

## Optimization Features

### For Large Tag Sets (1444 tags, 620 memories)

1. **Tag Frequency Analysis**
   - Common tags (>15% of memories): Excluded from auto-connections
   - Medium tags (2-15%): Used for multi-tag connections
   - Rare tags (<2%): High-priority connections

2. **Connection Limits**
   - Max 3 similarity connections per memory
   - Max 3 type/source connections per memory
   - Only connects adjacent session memories (not all-to-all)
   - Limits embedding comparisons to 20 per memory

3. **Tag Combination Strategy**
   - Prioritizes rare 2-tag combinations (2-10 memories)
   - Requires 2+ shared meaningful tags for multi-tag connections
   - Single rare tags only connect 2-5 memories

4. **Performance Optimizations**
   - Removes duplicate connections (keeps highest strength)
   - Limits O(n²) operations with max comparison limits
   - Processes argument memories first (higher priority)

## Notes

- All connections created by the backfill are marked as `inferred: true`
- Connections are bidirectional (can be viewed from either memory)
- The script avoids duplicate connections using pair keys
- Strength values are calculated based on the relationship type and confidence
- Common tags (like "reasoning" with 165 memories) are excluded to prevent graph bloat
- You can manually edit or delete inferred connections through the UI

## Next Steps

After running the backfill:

1. **Review Connections**: Use the Graph View to visualize the connections
2. **Refine Connections**: Manually adjust connection types and strengths as needed
3. **Add New Connections**: Use the Connection Modal (🔗 button) to add explicit connections
4. **Filter by Type**: Use the connection type filter in Graph View to focus on specific relationships

