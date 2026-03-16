import { HNSWVectorSearch, createHNSWSearch } from './hnsw-search.js';
import { EmbeddingProvider } from './embeddings.js';

export interface OptimizedVSSConfig {
  maxElements?: number;
  M?: number;
  efConstruction?: number;
  ef?: number;
  space?: 'cosine' | 'ip' | 'l2';
  dimension?: number;
}

export class OptimizedVSS {
  private hnswIndex: HNSWVectorSearch | null = null;
  private embeddingProvider: any;
  private memoryMap: Map<number, any> = new Map(); // Maps HNSW ID to memory data
  private idCounter: number = 0;
  private dimension: number;

  constructor(config: OptimizedVSSConfig = {}) {
    this.dimension = config.dimension || 1536;
  }

  async init(embeddingProvider?: any, config: OptimizedVSSConfig = {}): Promise<void> {
    try {
      console.error('Initializing Optimized VSS with HNSW...');
      
      // Use provided embedding provider or create default
      this.embeddingProvider = embeddingProvider || await EmbeddingProvider.init();
      this.dimension = this.embeddingProvider.dim;
      
      // Initialize HNSW index
      this.hnswIndex = await createHNSWSearch(this.dimension, {
        maxElements: config.maxElements || 100000,
        M: config.M || 16,
        efConstruction: config.efConstruction || 200,
        ef: config.ef || 100,
        space: config.space || 'cosine'
      });
      
      console.error(`Optimized VSS initialized with ${this.dimension}D embeddings`);
    } catch (error) {
      console.error('Failed to initialize Optimized VSS:', error);
      throw error;
    }
  }

  async addMemory(memory: any): Promise<number> {
    if (!this.hnswIndex) {
      throw new Error('Optimized VSS not initialized');
    }

    try {
      // Generate embedding if not provided
      let embedding = memory.embedding;
      if (!embedding) {
        embedding = await this.embeddingProvider.embed(memory.text);
      }

      // Add to HNSW index
      const hnswId = this.idCounter++;
      this.hnswIndex.addPoint(embedding, hnswId);
      
      // Store memory data
      this.memoryMap.set(hnswId, {
        ...memory,
        hnswId,
        embedding
      });

      return hnswId;
    } catch (error) {
      console.error('Failed to add memory:', error);
      throw error;
    }
  }

  async search(query: string, options: {
    limit?: number;
    tags?: string[];
    type?: string;
    source?: string;
    minImportance?: number;
    pinnedOnly?: boolean;
  } = {}): Promise<any[]> {
    if (!this.hnswIndex) {
      throw new Error('Optimized VSS not initialized');
    }

    const {
      limit = 10,
      tags = [],
      type,
      source,
      minImportance = 0,
      pinnedOnly = false
    } = options;

    try {
      // Generate query embedding
      const queryEmbedding = await this.embeddingProvider.embed(query);
      
      // Search HNSW index
      const hnswResults = this.hnswIndex.searchKnn(queryEmbedding, Math.min(limit * 3, 100)); // Get more results for filtering
      
      // Convert HNSW results to memories and apply filters
      const results: Array<{distance: number; similarity: number} & Record<string, any>> = [];
      for (let i = 0; i < hnswResults.neighbors.length; i++) {
        const hnswId = hnswResults.neighbors[i];
        const distance = hnswResults.distances[i];
        const memory = this.memoryMap.get(hnswId);
        
        if (!memory) continue;
        
        // Apply filters
        if (tags.length > 0 && !tags.some(tag => memory.tags?.includes(tag))) continue;
        if (type && memory.type !== type) continue;
        if (source && memory.source !== source) continue;
        if (memory.importance < minImportance) continue;
        if (pinnedOnly && !memory.pinned) continue;
        
        results.push({
          ...memory,
          distance,
          similarity: 1 - distance // Convert distance to similarity
        });
        
        if (results.length >= limit) break;
      }
      
      return results;
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  async hybridSearch(query: string, options: {
    limit?: number;
    tags?: string[];
    type?: string;
    source?: string;
    sessionId?: string;
    minImportance?: number;
    pinnedOnly?: boolean;
    semanticWeight?: number;
    recencyWeight?: number;
    importanceWeight?: number;
    usageWeight?: number;
    pinWeight?: number;
  } = {}): Promise<any[]> {
    const {
      limit = 10,
      tags = [],
      type,
      source,
      sessionId,
      minImportance = 0,
      pinnedOnly = false,
      semanticWeight = 0.6,
      recencyWeight = 0.2,
      importanceWeight = 0.15,
      usageWeight = 0.05,
      pinWeight = 0.3
    } = options;

    try {
      // Get semantic results
      const semanticResults = await this.search(query, {
        limit: limit * 2, // Get more for hybrid scoring
        tags,
        type,
        source,
        minImportance,
        pinnedOnly
      });

      // Apply hybrid scoring
      const now = Date.now();
      const scoredResults = semanticResults.map(memory => {
        // Semantic score (already calculated as similarity)
        const semanticScore = memory.similarity || (1 - memory.distance);
        
        // Recency score (exponential decay with ~20.8 day half-life)
        const ageDays = (now - memory.createdAt) / (1000 * 60 * 60 * 24);
        const recencyScore = Math.exp(-ageDays * 0.033); // ~20.8 day half-life
        
        // Importance score
        const importanceScore = memory.importance || 0;
        
        // Usage score (capped at 0.2)
        const usageScore = Math.min((memory.usage || 0) * 0.1, 0.2);
        
        // Pin boost
        const pinBoost = memory.pinned ? pinWeight : 0;
        
        // Helpful boost (if available)
        const helpfulBoost = memory.helpful ? 0.1 : 0;
        
        // Calculate final score
        const finalScore = 
          semanticScore * semanticWeight +
          recencyScore * recencyWeight +
          importanceScore * importanceWeight +
          usageScore * usageWeight +
          pinBoost +
          helpfulBoost;

        return {
          ...memory,
          finalScore,
          semanticScore,
          recencyScore,
          importanceScore,
          usageScore,
          pinBoost,
          helpfulBoost
        };
      });

      // Sort by final score and return top results
      return scoredResults
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, limit);
        
    } catch (error) {
      console.error('Hybrid search failed:', error);
      throw error;
    }
  }

  // Batch operations for efficiency
  async addMemories(memories: any[]): Promise<number[]> {
    const ids: number[] = [];
    
    for (const memory of memories) {
      try {
        const id = await this.addMemory(memory);
        ids.push(id);
      } catch (error) {
        console.error(`Failed to add memory: ${memory.text?.substring(0, 50)}...`, error);
      }
    }
    
    return ids;
  }

  // Get statistics
  getStats() {
    if (!this.hnswIndex) {
      return { initialized: false };
    }
    
    return {
      initialized: true,
      dimension: this.dimension,
      memoryCount: this.memoryMap.size,
      hnswStats: this.hnswIndex.getStats()
    };
  }

  // Clear all data
  async clear(): Promise<void> {
    this.memoryMap.clear();
    this.idCounter = 0;
    if (this.hnswIndex) {
      // Reinitialize HNSW index
      const config = this.hnswIndex.getStats();
      this.hnswIndex = await createHNSWSearch(this.dimension, {
        maxElements: config.maxElements,
        M: config.M,
        efConstruction: config.efConstruction,
        ef: config.ef,
        space: config.space as any
      });
    }
  }

  // Update memory
  async updateMemory(hnswId: number, updates: Partial<any>): Promise<void> {
    const memory = this.memoryMap.get(hnswId);
    if (!memory) {
      throw new Error(`Memory with ID ${hnswId} not found`);
    }
    
    // Update memory data
    const updatedMemory = { ...memory, ...updates };
    this.memoryMap.set(hnswId, updatedMemory);
  }

  // Remove memory
  async removeMemory(hnswId: number): Promise<void> {
    this.memoryMap.delete(hnswId);
    // Note: HNSW doesn't support removal, so we mark as deleted in memory map
  }
}

// Factory function
export const createOptimizedVSS = async (
  config: OptimizedVSSConfig = {},
  embeddingProvider?: any
): Promise<OptimizedVSS> => {
  const vss = new OptimizedVSS(config);
  await vss.init(embeddingProvider, config);
  return vss;
};
