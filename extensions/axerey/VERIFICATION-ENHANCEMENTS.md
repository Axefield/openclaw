# Verification Workflows Enhancement - Truth Adaptation & Memory-First Strategy

## Truth-Adaptation Semantics

### Axerey's Argumentation Philosophy

Axerey's argumentation tools (steelman/strawman) provide a philosophical framework for truth-seeking:

1. **Steelman** = Finding the strongest, most charitable version of a claim
   - Moves **toward truth** through charity
   - Assumes best intentions and strongest premises
   - Result: More verifiable, stronger claim

2. **Strawman** = Identifying distortions and fallacies
   - Identifies what moves **away from truth**
   - Detects exaggerations, oversimplifications, context stripping
   - Result: Recognition of falsehoods

3. **Pipeline (strawman→steelman)** = Transforming distorted claims back to truth
   - Recovers truth from distortion
   - Applies distortions then strengthens
   - Result: Truth recovery process

### Implications for Verification

**Verification should leverage truth-adaptation:**

1. **Pre-Verification Refinement:**
   - Apply steelman to find strongest version of claim before verifying
   - Stronger claims are more verifiable (clearer, more precise)
   - Example: "Some people think X" → "A significant portion of experts believe X under conditions Y"

2. **Contradiction Detection:**
   - Use strawman to identify potential distortions in claims
   - Contradictions detected via strawman can inform verification status
   - Example: If claim contains exaggeration, mark as "partially_verified" or "uncertain"

3. **Truth Recovery:**
   - Use pipeline to recover truth from distorted factual claims
   - Verify the recovered (steelmanned) version
   - Store both original and steelmanned versions in verification metadata

## Memory-First Verification Strategy

### Why Memory-First?

Axerey already has rich memory context via `reasoning_with_memory`. Verification should leverage this:

1. **Internal Knowledge Base:**
   - Memories contain verified facts from previous verifications
   - Memories can contradict or support new claims
   - Previous verification results stored in memory metadata

2. **Connection-Based Verification:**
   - Memory connections (`contradicts`, `supports`) provide verification signals
   - If memory A contradicts memory B, one may be false
   - Transitive verification: If A supports B and B supports C, A supports C

3. **Context-Aware Verification:**
   - Use `reasoning_with_memory` to gather relevant context
   - Verify claims against related memories
   - Consider memory confidence scores in verification

### Verification Flow

```
1. Memory Search (Primary)
   ├─ Search memories for similar claims (semantic search)
   ├─ Check memory connections for contradictions/support
   ├─ Use previous verification results from memory metadata
   └─ Gather context via reasoning_with_memory

2. Truth-Adaptation (Optional)
   ├─ Apply steelman to find strongest version
   ├─ Use strawman to identify distortions
   └─ Verify steelmanned version (if enabled)

3. Calculation Verification
   ├─ Detect mathematical expressions
   ├─ Execute and verify results
   └─ Check memory for similar verified calculations

4. External Verification (Secondary)
   ├─ Gon-Search (preferred, self-hosted)
   │  ├─ Hybrid keyword + semantic search
   │  ├─ RAG context builder for structured results
   │  └─ Index verified claims back to gon-search
   └─ Web Search APIs (fallback)
      └─ Only if gon-search unavailable
```

## Gon-Search Integration

### Why Gon-Search?

Gon-Search is a self-hosted web search service with:
- **Hybrid Search**: SQLite FTS5 keyword + vector semantic similarity
- **Local Embeddings**: @xenova/transformers (all-MiniLM-L6-v2) - zero API costs
- **RAG Context Builder**: Formats results for LLM consumption
- **On-Demand Indexing**: Stores searched content with deduplication
- **REST API**: `http://localhost:7991/api/search`

### Integration Architecture

**New Service:** `src/services/gonSearchService.ts`

```typescript
export class GonSearchService {
  /**
   * Search gon-search for factual claims
   * @param query - The claim or fact to verify
   * @param profile - Search profile (TECH_NEWS, RESEARCH, GENERIC, etc.)
   * @returns Verification results with sources
   */
  async searchForVerification(
    query: string, 
    profile: string = 'GENERIC'
  ): Promise<GonSearchVerificationResult>

  /**
   * Get RAG-formatted context for verification
   * @param query - The claim to verify
   * @returns Structured context for LLM verification
   */
  async getVerificationContext(query: string): Promise<string>

  /**
   * Index verified claim back into gon-search
   * @param claim - The verified claim
   * @param verificationResult - Verification metadata
   */
  async indexVerifiedClaim(
    claim: string,
    verificationResult: VerificationResult
  ): Promise<void>
}
```

**API Integration:**
- `GET /api/search?q={query}&profile={profile}` - Main search
- `POST /api/search/context` - RAG-formatted search
- `POST /api/index` - Index verified claims

**Benefits:**
- Self-hosted (no external API costs)
- Hybrid search (keyword + semantic)
- RAG context for structured verification
- Can index verified claims for future reference
- Local embeddings (privacy-preserving)

## Enhanced Verification Tool

### Updated Tool Schema

```typescript
{
  name: "verify_memory",
  description: "Verify factual claims and calculations using memory-first strategy, truth-adaptation, and gon-search",
  inputSchema: z.object({
    memoryId: z.string(),
    forceVerification: z.boolean().default(false),
    containsCalculations: z.boolean().default(false),
    useTruthAdaptation: z.boolean().default(true), // Use steelman/strawman
    checkMemoriesFirst: z.boolean().default(true), // Memory-first strategy
    useGonSearch: z.boolean().default(true), // Use gon-search for external verification
    gonSearchProfile: z.enum(['TECH_NEWS', 'PRODUCT_DEALS', 'RESEARCH', 'GENERIC']).default('GENERIC')
  })
}
```

### Enhanced Verification Result

```typescript
interface VerificationResult {
  status: 'verified' | 'partially_verified' | 'unverified' | 'contradicted' | 'uncertain';
  confidence: number;
  sources: VerificationSource[];
  verifiedCalculations?: CalculationVerificationResult[];
  
  // Truth-adaptation metadata
  truthAdaptation?: {
    originalClaim: string;
    steelmannedClaim?: string;
    distortions?: string[];
    verificationBasedOn: 'original' | 'steelmanned';
    steelmanConfidence?: number;
  };
  
  // Memory-based verification
  memoryMatches?: {
    memoryId: string;
    similarity: number;
    supports: boolean; // true if supports, false if contradicts
    connectionType?: 'supports' | 'contradicts' | 'refines' | 'derives';
  }[];
  
  // Gon-search results
  gonSearchResults?: {
    query: string;
    results: Array<{
      title: string;
      url: string;
      snippet: string;
      relevance: number;
    }>;
    ragContext?: string; // RAG-formatted context
  };
  
  timestamp: string;
}

interface VerificationSource {
  type: 'memory' | 'gon-search' | 'web-search' | 'api' | 'calculation' | 'steelman' | 'strawman';
  source: string; // Memory ID, URL, API name, etc.
  confidence: number;
  relevance: number;
  supports: boolean; // true if supports claim, false if contradicts
}
```

## Implementation Priority

### Phase 1: Memory-First Verification
1. Search memories for similar claims
2. Check memory connections for contradictions/support
3. Use previous verification results from memory metadata
4. Create memory connections for contradictions

### Phase 2: Truth-Adaptation Integration
5. Integrate steelman for claim refinement
6. Use strawman for distortion detection
7. Store truth-adaptation metadata in verification results

### Phase 3: Gon-Search Integration
8. Create gon-search service wrapper
9. Integrate gon-search API calls
10. Use RAG context builder for structured verification
11. Index verified claims back to gon-search

### Phase 4: External APIs (Fallback)
12. Web search APIs (only if gon-search unavailable)
13. Other external verification sources

## Configuration

Add to `.axerey.scientific`:

```json
{
  "verification": {
    "enabled": true,
    "checkCalculations": true,
    "checkFactualClaims": true,
    "threshold": 0.7,
    "memoryFirst": true,
    "useTruthAdaptation": true,
    "gonSearch": {
      "enabled": true,
      "url": "http://localhost:7991",
      "defaultProfile": "GENERIC",
      "indexVerifiedClaims": true
    },
    "externalAPIs": {
      "enabled": false,
      "fallbackOnly": true
    }
  }
}
```

## Benefits

1. **Memory-First**: Leverages existing knowledge base
2. **Truth-Adaptation**: Uses argumentation tools for claim refinement
3. **Gon-Search**: Self-hosted, cost-effective external verification
4. **Connection-Based**: Uses memory graph for contradiction detection
5. **Context-Aware**: Uses reasoning_with_memory for relevant context
6. **Structured Results**: RAG context builder for LLM consumption

