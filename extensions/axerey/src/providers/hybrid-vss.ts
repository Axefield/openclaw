import Database from "better-sqlite3";
import { createHNSWSearch, HNSWVectorSearch } from "./hnsw-search.js";
import { EmbeddingProvider } from "./embeddings.js";
import type { Memory } from "../memory.js";

// Import vectorlite with proper typing
import { vectorlitePath } from 'vectorlite';

export interface HybridVSSConfig {
  maxElements?: number;
  dimension?: number;
  // HNSW specific
  M?: number;
  efConstruction?: number;
  ef?: number;
  space?: 'cosine' | 'l2' | 'ip';
  // Hybrid behavior
  useHNSWForSearch?: boolean;
  useVectorliteForPersistence?: boolean;
  autoSwitchThreshold?: number; // Switch to HNSW when memory count exceeds this
}

export class HybridVSS {
  private db: Database.Database;
  private hnswIndex: HNSWVectorSearch | null = null;
  private embeddingProvider: any;
  private dimension: number;
  private config: HybridVSSConfig;
  private vssAvailable: boolean = false;
  private memoryCount: number = 0;
  private idMapping: Map<number, string> = new Map(); // Maps numeric IDs to string IDs

  constructor(db: Database.Database, config: HybridVSSConfig = {}) {
    this.db = db;
    this.config = {
      maxElements: 100000,
      dimension: 1536,
      M: 16,
      efConstruction: 200,
      ef: 100,
      space: 'cosine',
      useHNSWForSearch: true,
      useVectorliteForPersistence: true,
      autoSwitchThreshold: 1000,
      ...config
    };
    this.dimension = this.config.dimension!;
  }

  async init(embeddingProvider: any): Promise<void> {
    this.embeddingProvider = embeddingProvider;
    this.dimension = this.embeddingProvider.dim;

    // Initialize vectorlite VSS (scientific approach)
    await this.initVectorliteVSS();

    // Initialize HNSW (performance approach)
    await this.initHNSWVSS();

    // Check current memory count to determine optimal strategy
    this.memoryCount = await this.getMemoryCount();
    this.vssAvailable = true;

    console.error(`🧠 Hybrid VSS initialized:`);
    console.error(`   📊 Vectorlite VSS: ${this.isVectorliteAvailable() ? '✅ Available' : '❌ Unavailable'}`);
    console.error(`   🚀 HNSW VSS: ${this.hnswIndex ? '✅ Available' : '❌ Unavailable'}`);
    console.error(`   📈 Memory count: ${this.memoryCount}`);
    console.error(`   🎯 Optimal strategy: ${this.getOptimalStrategy()}`);
  }

  private async initVectorliteVSS(): Promise<void> {
    try {
      // Load vectorlite extension using the proper path
      const extensionPath = vectorlitePath();
      
      // Try different extension formats based on platform
      const extensions = ['.dll', '.so', '.dylib'];
      let loaded = false;
      
      for (const ext of extensions) {
        try {
          const fullPath = extensionPath + ext;
          this.db.loadExtension(fullPath);
          console.error(`✅ Vectorlite extension loaded successfully: ${fullPath}`);
          loaded = true;
          break;
        } catch (extError) {
          // Try next extension
          continue;
        }
      }
      
      if (!loaded) {
        // Try loading without extension (in case it's already included)
        try {
          this.db.loadExtension(extensionPath);
          console.error(`✅ Vectorlite extension loaded successfully: ${extensionPath}`);
          loaded = true;
        } catch (noExtError) {
          throw new Error(`Failed to load vectorlite extension with any format`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Vectorlite extension not available:', error);
    }

    // Create vector search virtual table if vectorlite is available
    if (this.isVectorliteAvailable()) {
      try {
        // Create a proper vectorlite virtual table with correct syntax
        // Syntax: embedding float32[dimension], hnsw(max_elements=N)
        // rowid is automatically handled by SQLite, no need to specify id column
        const maxElements = this.config.maxElements || 100000;
        const dimension = this.dimension;
        
        this.db.exec(`
          CREATE VIRTUAL TABLE IF NOT EXISTS memory_vectors USING vectorlite(
            embedding float32[${dimension}], 
            hnsw(max_elements=${maxElements})
          );
        `);
        console.error(`✅ Vectorlite virtual table created with dimension ${dimension} and max_elements ${maxElements}`);
      } catch (error) {
        console.warn('⚠️ Failed to create vectorlite virtual table:', error);
        // Fallback: create a regular table for vector storage
        try {
          this.db.exec(`
            CREATE TABLE IF NOT EXISTS memory_vectors_fallback (
              id TEXT PRIMARY KEY,
              embedding TEXT,
              created_at INTEGER
            );
          `);
          console.error('✅ Fallback vector table created');
        } catch (fallbackError) {
          console.warn('⚠️ Failed to create fallback vector table:', fallbackError);
        }
      }
    }
  }

  private async initHNSWVSS(): Promise<void> {
    try {
      this.hnswIndex = await createHNSWSearch(this.dimension, {
        maxElements: this.config.maxElements!,
        M: this.config.M!,
        efConstruction: this.config.efConstruction!,
        ef: this.config.ef!,
        space: this.config.space!
      });
      console.error('✅ HNSW index initialized');
    } catch (error) {
      console.error('❌ Failed to initialize HNSW index:', error);
      this.hnswIndex = null;
    }
  }

  private isVectorliteAvailable(): boolean {
    try {
      // Check if we can query the database
      this.db.prepare('SELECT 1').get();
      
      // Try to access vectorlite-specific functions
      // Check if vectorlite_info function exists (this is a vectorlite-specific function)
      try {
        this.db.prepare('SELECT vectorlite_info()').get();
        return true;
      } catch {
        // If vectorlite_info doesn't exist, try checking if we can create a vectorlite table
        try {
          this.db.exec('CREATE TEMP TABLE IF NOT EXISTS test_vectorlite USING vectorlite(embedding float32[3], hnsw(max_elements=10))');
          this.db.exec('DROP TABLE IF EXISTS test_vectorlite');
          return true;
        } catch {
          return false;
        }
      }
    } catch (error) {
      // Log the specific error for debugging
      console.debug('Vectorlite availability check failed:', error);
      return false;
    }
  }

  private async getMemoryCount(): Promise<number> {
    try {
      const result = this.db.prepare('SELECT COUNT(*) as count FROM memories').get() as { count: number };
      return result.count;
    } catch {
      return 0;
    }
  }

  private getOptimalStrategy(): string {
    if (this.memoryCount > this.config.autoSwitchThreshold! && this.hnswIndex) {
      return 'HNSW (performance optimized)';
    } else if (this.isVectorliteAvailable()) {
      return 'Vectorlite (scientific)';
    } else if (this.hnswIndex) {
      return 'HNSW (fallback)';
    } else {
      return 'Linear search (fallback)';
    }
  }

  async addMemory(memory: Memory): Promise<number> {
    const embedding = memory.embedding;
    const id = memory.id;

    // Always persist to vectorlite if available (scientific approach)
    // Vectorlite virtual tables only store the vector, using rowid for identification
    // We'll create a mapping table to link rowid to memory id
    if (this.isVectorliteAvailable()) {
      try {
        // Create mapping table if it doesn't exist
        // This table maps memory_id (string) to rowid (integer) in the vectorlite table
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS memory_vectors_mapping (
            memory_id TEXT PRIMARY KEY,
            vector_rowid INTEGER NOT NULL UNIQUE
          );
        `);
        
        // Convert embedding to Float32Array buffer for vectorlite
        const embeddingBuffer = Buffer.from(Float32Array.from(embedding).buffer);
        
        // Insert or replace the vector (vectorlite uses rowid automatically)
        // First, check if this memory_id already exists in mapping
        const existing = this.db.prepare('SELECT vector_rowid FROM memory_vectors_mapping WHERE memory_id=?').get(id) as { vector_rowid: number } | undefined;
        
        if (existing) {
          // Update existing vector using rowid
          this.db.prepare('UPDATE memory_vectors SET embedding=? WHERE rowid=?').run(embeddingBuffer, existing.vector_rowid);
        } else {
          // Insert new vector (let SQLite auto-generate rowid)
          this.db.prepare('INSERT INTO memory_vectors(embedding) VALUES (?)').run(embeddingBuffer);
          const inserted = this.db.prepare('SELECT last_insert_rowid() as rowid').get() as { rowid: number };
          // Store mapping: memory_id -> vector_rowid
          this.db.prepare('INSERT INTO memory_vectors_mapping(memory_id, vector_rowid) VALUES (?, ?)').run(id, inserted.rowid);
        }
      } catch (error) {
        console.warn('Failed to add memory to vectorlite:', error);
      }
    }

    // Add to HNSW if available (performance approach)
    if (this.hnswIndex) {
      try {
        // Convert string ID to number for HNSW (use hash of string)
        const numericId = this.stringToNumber(id);
        this.hnswIndex.addPoint(embedding, numericId);
        this.idMapping.set(numericId, id); // Store mapping
        this.memoryCount++;
        return this.memoryCount;
      } catch (error) {
        console.warn('Failed to add memory to HNSW:', error);
        return -1;
      }
    }

    return -1;
  }

  async search(queryVector: number[], options: {
    limit?: number;
    tags?: string[];
    type?: string;
    source?: string;
    minImportance?: number;
    pinnedOnly?: boolean;
  } = {}): Promise<Memory[]> {
    const { limit = 10 } = options;

    // Choose optimal search strategy
    if (this.memoryCount > this.config.autoSwitchThreshold! && this.hnswIndex) {
      return this.searchHNSW(queryVector, options);
    } else if (this.isVectorliteAvailable()) {
      return this.searchVectorlite(queryVector, options);
    } else if (this.hnswIndex) {
      return this.searchHNSW(queryVector, options);
    } else {
      return this.searchLinear(queryVector, options);
    }
  }

  async hybridSearch(queryVector: number[], options: {
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
  } = {}): Promise<Memory[]> {
    const { limit = 10 } = options;

    // Choose optimal search strategy
    if (this.memoryCount > this.config.autoSwitchThreshold! && this.hnswIndex) {
      return this.hybridSearchHNSW(queryVector, options);
    } else if (this.isVectorliteAvailable()) {
      return this.hybridSearchVectorlite(queryVector, options);
    } else if (this.hnswIndex) {
      return this.hybridSearchHNSW(queryVector, options);
    } else {
      return this.hybridSearchLinear(queryVector, options);
    }
  }

  private async searchVectorlite(queryVector: number[], options: any): Promise<Memory[]> {
    const { limit = 10, tags = [], type, source, minImportance = 0, pinnedOnly = false } = options;

    // Build WHERE clause for filtering
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (tags.length > 0) {
      whereClause += ` AND (${tags.map(() => 'tags LIKE ?').join(' OR ')})`;
      params.push(...tags.map((tag: string) => `%${tag}%`));
    }

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    if (source) {
      whereClause += ' AND source = ?';
      params.push(source);
    }

    if (minImportance > 0) {
      whereClause += ' AND importance >= ?';
      params.push(minImportance);
    }

    if (pinnedOnly) {
      whereClause += ' AND pinned = 1';
    }

    // For now, use linear search with vectorlite for persistence
    // TODO: Implement proper vectorlite search when we understand the API better
    const query = `
      SELECT m.*
      FROM memories m
      JOIN memory_vectors_mapping map ON m.id = map.memory_id
      JOIN memory_vectors v ON map.vector_rowid = v.rowid
      ${whereClause}
      ORDER BY m.importance DESC, m.created_at DESC
      LIMIT ?
    `;

    const results = this.db.prepare(query).all(...params, limit);
    
    return results.map((r: any) => this.mapRowToMemory(r));
  }

  private async searchHNSW(queryVector: number[], options: any): Promise<Memory[]> {
    if (!this.hnswIndex) {
      return this.searchLinear(queryVector, options);
    }

    const { limit = 10 } = options;
    const searchResults = await this.hnswIndex.searchKnn(queryVector, limit);
    
    // Get full memory objects from database
    const memories: Memory[] = [];
    for (let i = 0; i < searchResults.neighbors.length; i++) {
      const numericId = searchResults.neighbors[i];
      const stringId = this.idMapping.get(numericId);
      if (stringId) {
        try {
          const memory = this.db.prepare('SELECT * FROM memories WHERE id = ?').get(stringId) as any;
          if (memory) {
            memories.push(this.mapRowToMemory(memory));
          }
        } catch (error) {
          console.warn(`Failed to retrieve memory ${stringId}:`, error);
        }
      }
    }

    return memories;
  }

  private async searchLinear(queryVector: number[], options: any): Promise<Memory[]> {
    const { limit = 10 } = options;
    
    // Get all memories and calculate cosine similarity
    const memories = this.db.prepare('SELECT * FROM memories').all() as any[];
    
    const scored = memories.map(memory => {
      const embedding = JSON.parse(memory.embedding);
      const similarity = this.cosineSimilarity(queryVector, embedding);
      return { ...this.mapRowToMemory(memory), _similarity: similarity };
    });

    return scored
      .sort((a, b) => b._similarity - a._similarity)
      .slice(0, limit);
  }

  private async hybridSearchVectorlite(queryVector: number[], options: any): Promise<Memory[]> {
    const { limit = 10, tags = [], type, source, sessionId, minImportance = 0, pinnedOnly = false,
            semanticWeight = 0.6, recencyWeight = 0.2, importanceWeight = 0.15, 
            usageWeight = 0.05, pinWeight = 0.3 } = options;

    // Get all memories that match the filters
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (tags.length > 0) {
      whereClause += ` AND (${tags.map(() => 'm.tags LIKE ?').join(' OR ')})`;
      params.push(...tags.map((tag: string) => `%${tag}%`));
    }

    if (type) {
      whereClause += ' AND m.type = ?';
      params.push(type);
    }

    if (source) {
      whereClause += ' AND m.source = ?';
      params.push(source);
    }

    if (sessionId) {
      whereClause += ' AND m.session_id = ?';
      params.push(sessionId);
    }

    if (minImportance > 0) {
      whereClause += ' AND m.importance >= ?';
      params.push(minImportance);
    }

    if (pinnedOnly) {
      whereClause += ' AND m.pinned = 1';
    }

    // For now, use linear search with vectorlite for persistence
    // TODO: Implement proper vectorlite search when we understand the API better
    const query = `
      SELECT m.*
      FROM memories m
      JOIN memory_vectors_mapping map ON m.id = map.memory_id
      JOIN memory_vectors v ON map.vector_rowid = v.rowid
      ${whereClause}
    `;

    const results = this.db.prepare(query).all(...params);
    
    // Apply hybrid scoring
    const now = Date.now();
    const scored = results.map((r: any) => {
      const memory = this.mapRowToMemory(r);
      const similarity = r.similarity;
      const ageDays = (now - memory.createdAt) / (1000 * 60 * 60 * 24);
      const recency = Math.exp(-ageDays / 30); // half-life ~20.8 days
      const importance = memory.importance;
      const usageBoost = Math.min(memory.usage / 10, 0.2);
      const pinBoost = memory.pinned ? pinWeight : 0;
      
      const score = 
        semanticWeight * similarity +
        recencyWeight * recency +
        importanceWeight * importance +
        usageWeight * usageBoost +
        pinBoost;

      return { ...memory, _score: score };
    });

    // Sort by score and return top results
    return scored
      .sort((a, b) => b._score - a._score)
      .slice(0, limit);
  }

  private async hybridSearchHNSW(queryVector: number[], options: any): Promise<Memory[]> {
    // For HNSW hybrid search, we'll use the linear approach with HNSW pre-filtering
    const { limit = 10 } = options;
    
    // Get candidate memories using HNSW
    const candidates = await this.searchHNSW(queryVector, { limit: limit * 2 });
    
    // Apply hybrid scoring to candidates
    const now = Date.now();
    const { semanticWeight = 0.6, recencyWeight = 0.2, importanceWeight = 0.15, 
            usageWeight = 0.05, pinWeight = 0.3 } = options;

    const scored = candidates.map(memory => {
      const similarity = this.cosineSimilarity(queryVector, memory.embedding);
      const ageDays = (now - memory.createdAt) / (1000 * 60 * 60 * 24);
      const recency = Math.exp(-ageDays / 30);
      const importance = memory.importance;
      const usageBoost = Math.min(memory.usage / 10, 0.2);
      const pinBoost = memory.pinned ? pinWeight : 0;
      
      const score = 
        semanticWeight * similarity +
        recencyWeight * recency +
        importanceWeight * importance +
        usageWeight * usageBoost +
        pinBoost;

      return { ...memory, _score: score };
    });

    return scored
      .sort((a, b) => b._score - a._score)
      .slice(0, limit);
  }

  private async hybridSearchLinear(queryVector: number[], options: any): Promise<Memory[]> {
    // Fallback to linear search with hybrid scoring
    const memories = await this.searchLinear(queryVector, options);
    return this.hybridSearchHNSW(queryVector, { ...options, limit: memories.length });
  }

  private stringToNumber(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private mapRowToMemory(r: any): Memory {
    return {
      id: r.id,
      text: r.text,
      tags: JSON.parse(r.tags),
      importance: r.importance,
      pinned: !!r.pinned,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      expiresAt: r.expires_at ?? null,
      sessionId: r.session_id ?? null,
      embedding: JSON.parse(r.embedding),
      usage: r.usage,
      type: r.type,
      source: r.source,
      confidence: r.confidence,
      lastUsed: r.last_used,
      decay: r.decay,
      belief: !!r.belief,
      mergedFrom: JSON.parse(r.merged_from || '[]'),
      outcome: r.outcome ?? null,
      score: r.score ?? null,
      efficiency: r.efficiency ?? null,
      notes: r.notes ?? null,
      features: JSON.parse(r.features || '{}'),
      helpful: r.helpful === 1 ? true : r.helpful === 0 ? false : null,
      servedContextId: r.served_context_id ?? null
    };
  }

  async removeMemory(id: string): Promise<void> {
    // Remove from vectorlite if available
    if (this.isVectorliteAvailable()) {
      try {
        // Get the vector_rowid from mapping
        const mapping = this.db.prepare('SELECT vector_rowid FROM memory_vectors_mapping WHERE memory_id=?').get(id) as { vector_rowid: number } | undefined;
        if (mapping) {
          // Delete from vectorlite using rowid
          this.db.prepare('DELETE FROM memory_vectors WHERE rowid=?').run(mapping.vector_rowid);
          // Delete from mapping
          this.db.prepare('DELETE FROM memory_vectors_mapping WHERE memory_id=?').run(id);
        }
      } catch (error) {
        console.warn('Failed to remove memory from vectorlite:', error);
      }
    }

    // Note: HNSW doesn't support removal, so we'll rely on vectorlite for persistence
    this.memoryCount = Math.max(0, this.memoryCount - 1);
  }

  getStats(): {
    vectorliteAvailable: boolean;
    hnswAvailable: boolean;
    memoryCount: number;
    optimalStrategy: string;
    config: HybridVSSConfig;
  } {
    return {
      vectorliteAvailable: this.isVectorliteAvailable(),
      hnswAvailable: !!this.hnswIndex,
      memoryCount: this.memoryCount,
      optimalStrategy: this.getOptimalStrategy(),
      config: this.config
    };
  }
}

export const createHybridVSS = async (
  db: Database.Database,
  embeddingProvider: any,
  config: HybridVSSConfig = {}
): Promise<HybridVSS> => {
  const hybridVSS = new HybridVSS(db, config);
  await hybridVSS.init(embeddingProvider);
  return hybridVSS;
};
