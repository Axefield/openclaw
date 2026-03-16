import type { Memory } from "./memory.js";
import type { VSSMemoryStore } from "./memory-vss.js";
import type { AdaptiveRanker } from "./adaptive-ranker.js";

export function cosine(a: number[], b: number[]): number {
  const dot = a.reduce((s, v, i) => s + v * (b[i] || 0), 0);
  const na = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const nb = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return na && nb ? dot / (na * nb) : 0;
}

export function rankResults(items: Memory[], qVec: number[]) {
  const now = Date.now();
  return items
    .map(m => {
      const sim = cosine(m.embedding, qVec);
      const ageDays = (now - m.createdAt) / (1000 * 60 * 60 * 24);
      const recency = Math.exp(-ageDays / 30); // half-life ~20.8 days
      const importance = m.importance; // 0..1
      const usageBoost = Math.min(m.usage / 10, 0.2);
      const pinBoost = m.pinned ? 0.3 : 0;
      const score = 0.6 * sim + 0.2 * recency + 0.15 * importance + 0.05 * usageBoost + pinBoost;
      return { ...m, _score: score } as Memory & { _score: number };
    })
    .sort((a, b) => b._score - a._score);
}

export class VSSRanker {
  private adaptiveRanker?: AdaptiveRanker;
  private minSimilarityThreshold: number = 0.3; // Filter out results with similarity < 0.3

  constructor(
    private store: VSSMemoryStore,
    adaptiveRanker?: AdaptiveRanker
  ) {
    this.adaptiveRanker = adaptiveRanker;
  }

  // Set adaptive ranker (can be called after initialization)
  setAdaptiveRanker(ranker: AdaptiveRanker) {
    this.adaptiveRanker = ranker;
  }

  // Set minimum similarity threshold
  setMinSimilarityThreshold(threshold: number) {
    this.minSimilarityThreshold = Math.max(0, Math.min(1, threshold));
  }

  async rankResults(items: Memory[], qVec: number[], options: {
    limit?: number;
    tags?: string[];
    type?: string;
    source?: string;
    sessionId?: string;
    minImportance?: number;
    pinnedOnly?: boolean;
    useVSS?: boolean;
  } = {}): Promise<Memory[]> {
    const {
      limit = 10,
      tags = [],
      type,
      source,
      sessionId,
      minImportance = 0,
      pinnedOnly = false,
      useVSS = true
    } = options;

    // If VSS is available and requested, use it
    if (useVSS && this.store.isVSSAvailable()) {
      return await this.store.hybridSearch(qVec, {
        limit,
        tags,
        type,
        source,
        sessionId,
        minImportance,
        pinnedOnly
      });
    }

    // Fallback to original cosine similarity approach
    const filtered = items.filter(item => {
      if (tags.length > 0 && !tags.some(tag => item.tags.includes(tag))) return false;
      if (type && item.type !== type) return false;
      if (source && item.source !== source) return false;
      if (sessionId && item.sessionId !== sessionId) return false;
      if (minImportance > 0 && item.importance < minImportance) return false;
      if (pinnedOnly && !item.pinned) return false;
      return true;
    });

    return rankResults(filtered, qVec).slice(0, limit);
  }

  async search(query: string, qVec: number[], options: {
    limit?: number;
    tags?: string[];
    type?: string;
    source?: string;
    sessionId?: string;
    minImportance?: number;
    pinnedOnly?: boolean;
    useVSS?: boolean;
    task?: string;
    minSimilarity?: number;
  } = {}): Promise<Memory[]> {
    const {
      limit = 10,
      tags = [],
      type,
      source,
      sessionId,
      minImportance = 0,
      pinnedOnly = false,
      useVSS = true,
      task,
      minSimilarity = this.minSimilarityThreshold
    } = options;

    let results: Memory[];

    // If VSS is available and requested, use it
    if (useVSS && this.store.isVSSAvailable()) {
      // Get more candidates than needed for adaptive ranking
      const candidateLimit = this.adaptiveRanker ? Math.min(limit * 3, 50) : limit;
      results = await this.store.hybridSearch(qVec, {
        limit: candidateLimit,
        tags,
        type,
        source,
        sessionId,
        minImportance,
        pinnedOnly
      });
    } else {
      // Fallback: get all memories and filter/rank manually
      const allMemories = await this.store.list({ tags, type, source, sessionId });
      results = await this.rankResults(allMemories, qVec, { limit: limit * 3, minImportance, pinnedOnly, useVSS: false });
    }

    // Filter by minimum similarity threshold
    if (minSimilarity > 0) {
      results = results.filter(m => {
        const sim = cosine(m.embedding, qVec);
        return sim >= minSimilarity;
      });
    }

    // Apply adaptive ranking if available
    if (this.adaptiveRanker && results.length > 0) {
      results = await this.adaptiveRanker.rankResults(results, qVec, task);
    }

    // Return top results
    return results.slice(0, limit);
  }

  async recall(query: string, qVec: number[], options: {
    limit?: number;
    tags?: string[];
    type?: string;
    source?: string;
    sessionId?: string;
    minImportance?: number;
    pinnedOnly?: boolean;
    useVSS?: boolean;
    task?: string;
    minSimilarity?: number;
  } = {}): Promise<Memory[]> {
    const {
      limit = 10,
      tags = [],
      type,
      source,
      sessionId,
      minImportance = 0,
      pinnedOnly = false,
      useVSS = true,
      task,
      minSimilarity
    } = options;

    // If no query, return recent memories (with adaptive ranking if available)
    if (!query) {
      let memories = await this.store.list({ tags, type, source, sessionId });
      
      // Apply adaptive ranking if available
      if (this.adaptiveRanker && memories.length > 0) {
        // Create a neutral query vector (average of all embeddings) for ranking
        const avgVec = new Array(memories[0].embedding.length).fill(0);
        memories.forEach(m => {
          m.embedding.forEach((v, i) => avgVec[i] += v);
        });
        avgVec.forEach((_, i) => avgVec[i] /= memories.length);
        
        memories = await this.adaptiveRanker.rankResults(memories, avgVec, task);
      } else {
        // Fallback to simple sorting
        memories = memories.sort((a, b) => 
          (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt
        );
      }
      
      return memories.slice(0, limit);
    }

    // Use search with VSS or fallback
    return this.search(query, qVec, { ...options, task, minSimilarity });
  }

  // Get performance metrics for VSS vs fallback
  async getPerformanceMetrics(): Promise<{
    vssAvailable: boolean;
    vssStats: { totalVectors: number; dimension: number; available: boolean };
    fallbackUsed: boolean;
  }> {
    const vssStats = this.store.getVSSStats();
    return {
      vssAvailable: vssStats.available,
      vssStats,
      fallbackUsed: !vssStats.available
    };
  }
}
