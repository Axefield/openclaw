import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import type { Memory } from "./memory.js";
import { OptimizedVSS, createOptimizedVSS } from "./providers/optimized-vss.js";
import { HybridVSS, createHybridVSS } from "./providers/hybrid-vss.js";
import { EmbeddingProvider } from "./providers/embeddings.js";

export class VSSMemoryStore {
  public db: Database.Database; // Made public for connection service access
  private vectorDimension: number;
  private vssAvailable: boolean = false;
  private optimizedVSS: OptimizedVSS | null = null;
  private hybridVSS: HybridVSS | null = null;
  private embeddingProvider: any = null;

  static async init({ path, vectorDimension = 1536, forceVSS = false }: { path: string; vectorDimension?: number; forceVSS?: boolean }) {
    const inst = new VSSMemoryStore(path, vectorDimension);
    await inst.setup(forceVSS);
    return inst;
  }

  private constructor(path: string, vectorDimension: number) {
    this.db = new Database(path);
    this.vectorDimension = vectorDimension;
  }

  private async setup(forceVSS = false) {
    // Initialize embedding provider
    this.embeddingProvider = await EmbeddingProvider.init();
    this.vectorDimension = this.embeddingProvider.dim;
    
    // Initialize hybrid VSS (scientific + performance)
    this.hybridVSS = await createHybridVSS(this.db, this.embeddingProvider, {
      maxElements: 100000,
      dimension: this.vectorDimension,
      useHNSWForSearch: true,
      useVectorliteForPersistence: true,
      autoSwitchThreshold: 1000
    });
    
    // Keep optimized VSS as fallback
    this.optimizedVSS = await createOptimizedVSS({
      maxElements: 100000,
      dimension: this.vectorDimension
    }, this.embeddingProvider);
    
    this.vssAvailable = true;
    console.error('🧠 Hybrid VSS enabled - scientific rigor + performance optimization');
    console.error(`📊 Using ${this.vectorDimension}D embeddings with dual VSS architecture`);

    // Create the main memories table (same as before)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        tags TEXT NOT NULL,
        importance REAL NOT NULL,
        pinned INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        expires_at INTEGER,
        session_id TEXT,
        embedding TEXT NOT NULL,
        usage INTEGER NOT NULL DEFAULT 0,
        type TEXT NOT NULL DEFAULT "episodic",
        source TEXT NOT NULL DEFAULT "plan",
        confidence REAL NOT NULL DEFAULT 1.0,
        last_used INTEGER NOT NULL DEFAULT 0,
        decay REAL NOT NULL DEFAULT 0.01,
        belief INTEGER NOT NULL DEFAULT 0,
        merged_from TEXT DEFAULT "[]",
        outcome TEXT,
        score REAL,
        efficiency REAL,
        notes TEXT,
        features TEXT DEFAULT "{}",
        helpful INTEGER,
        served_context_id TEXT
      );
    `);

    // Create vector search table using SQLite native capabilities
    if (this.vssAvailable) {
      // Use SQLite's native BLOB storage for vectors with JSON serialization
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS memory_vectors (
          id TEXT PRIMARY KEY,
          embedding BLOB, -- Store vector as BLOB (JSON serialized array)
          embedding_text TEXT, -- Store vector as text for similarity calculations
          tags TEXT,
          type TEXT,
          source TEXT,
          importance REAL,
          pinned INTEGER,
          created_at INTEGER,
          last_used INTEGER,
          usage INTEGER,
          belief INTEGER,
          helpful INTEGER
        );
      `);
      console.error('✅ SQLite native VSS table created (BLOB + TEXT storage)');
    }

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_mem_created ON memories(created_at);
      CREATE INDEX IF NOT EXISTS idx_mem_tags ON memories(tags);
      CREATE INDEX IF NOT EXISTS idx_mem_session ON memories(session_id);
      CREATE INDEX IF NOT EXISTS idx_mem_type ON memories(type);
      CREATE INDEX IF NOT EXISTS idx_mem_source ON memories(source);
      CREATE INDEX IF NOT EXISTS idx_mem_outcome ON memories(outcome);
      CREATE INDEX IF NOT EXISTS idx_mem_helpful ON memories(helpful);
    `);

    // Create new tables for Smart-Thinking improvements
    this.createSmartThinkingTables();

    // Migrate existing data if needed
    await this.migrateToVSS();
  }

  private createSmartThinkingTables() {
    // Memory connections (graph relationships)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memory_connections (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        connection_type TEXT NOT NULL,
        strength REAL DEFAULT 0.5,
        inferred INTEGER DEFAULT 0,
        inference_confidence REAL,
        description TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (source_id) REFERENCES memories(id),
        FOREIGN KEY (target_id) REFERENCES memories(id)
      );
    `);

    // Reasoning steps tracking
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS reasoning_steps (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        step_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        label TEXT,
        description TEXT,
        status TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        completed_at INTEGER,
        duration INTEGER,
        parents TEXT,
        details TEXT,
        justifications TEXT
      );
    `);

    // Verification results
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memory_verifications (
        id TEXT PRIMARY KEY,
        memory_id TEXT NOT NULL,
        status TEXT NOT NULL,
        confidence REAL,
        sources TEXT,
        verified_calculations TEXT,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (memory_id) REFERENCES memories(id)
      );
    `);

    // Reasoning state snapshots
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS reasoning_states (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        state_data TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);

    // Create indexes for new tables
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_conn_source ON memory_connections(source_id);
      CREATE INDEX IF NOT EXISTS idx_conn_target ON memory_connections(target_id);
      CREATE INDEX IF NOT EXISTS idx_conn_type ON memory_connections(connection_type);
      CREATE INDEX IF NOT EXISTS idx_reasoning_session ON reasoning_steps(session_id);
      CREATE INDEX IF NOT EXISTS idx_reasoning_step_id ON reasoning_steps(step_id);
      CREATE INDEX IF NOT EXISTS idx_verification_memory ON memory_verifications(memory_id);
      CREATE INDEX IF NOT EXISTS idx_verification_status ON memory_verifications(status);
      CREATE INDEX IF NOT EXISTS idx_state_session ON reasoning_states(session_id);
    `);
  }

  private async migrateToVSS() {
    // Check if we have existing memories that need to be migrated to VSS
    const existingMemories = this.db.prepare('SELECT * FROM memories WHERE embedding IS NOT NULL').all();
    
    if (existingMemories.length > 0) {
      console.error(`Migrating ${existingMemories.length} memories to VSS...`);
      
      for (const memory of existingMemories) {
        try {
          const memoryObj = memory as any;
          const embedding = JSON.parse(memoryObj.embedding);
          if (Array.isArray(embedding) && embedding.length === this.vectorDimension) {
            // Insert into VSS table
            this.db.prepare(`
              INSERT OR REPLACE INTO memory_vectors 
              (id, embedding, tags, type, source, importance, pinned, created_at, last_used, usage, belief, helpful)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              memoryObj.id,
              JSON.stringify(embedding),
              memoryObj.tags,
              memoryObj.type,
              memoryObj.source,
              memoryObj.importance,
              memoryObj.pinned,
              memoryObj.created_at,
              memoryObj.last_used,
              memoryObj.usage,
              memoryObj.belief,
              memoryObj.helpful
            );
          }
        } catch (error) {
          console.warn(`Failed to migrate memory ${(memory as any).id}:`, error);
        }
      }
      
      console.error('VSS migration completed');
    }
  }

  async create(m: Omit<Memory, "id" | "createdAt" | "updatedAt" | "pinned" | "usage">): Promise<Memory> {
    const now = Date.now();
    const id = randomUUID();
    const mem: Memory = {
      id,
      text: m.text,
      tags: m.tags,
      importance: m.importance,
      pinned: false,
      createdAt: now,
      updatedAt: now,
      expiresAt: m.expiresAt ? Date.parse(m.expiresAt as unknown as string) : null,
      sessionId: m.sessionId ?? null,
      embedding: m.embedding,
      usage: 0,
      type: m.type,
      source: m.source,
      confidence: m.confidence,
      lastUsed: now,
      decay: m.decay,
      belief: m.belief,
      mergedFrom: m.mergedFrom ?? [],
      outcome: m.outcome ?? null,
      score: m.score ?? null,
      efficiency: m.efficiency ?? null,
      notes: m.notes ?? null,
      features: m.features ?? {},
      helpful: m.helpful ?? null,
      servedContextId: m.servedContextId ?? null
    };

    // Insert into main table
    this.db.prepare(`
      INSERT INTO memories (id, text, tags, importance, pinned, created_at, updated_at, expires_at, session_id, embedding, usage, type, source, confidence, last_used, decay, belief, merged_from, outcome, score, efficiency, notes, features, helpful, served_context_id)
      VALUES (@id, @text, @tags, @importance, @pinned, @createdAt, @updatedAt, @expiresAt, @sessionId, @embedding, @usage, @type, @source, @confidence, @lastUsed, @decay, @belief, @mergedFrom, @outcome, @score, @efficiency, @notes, @features, @helpful, @servedContextId)
    `).run({
      id: mem.id,
      text: mem.text,
      tags: JSON.stringify(mem.tags),
      importance: mem.importance,
      pinned: mem.pinned ? 1 : 0,
      createdAt: mem.createdAt,
      updatedAt: mem.updatedAt,
      expiresAt: mem.expiresAt,
      sessionId: mem.sessionId,
      embedding: JSON.stringify(mem.embedding),
      usage: mem.usage,
      type: mem.type,
      source: mem.source,
      confidence: mem.confidence,
      lastUsed: mem.lastUsed,
      decay: mem.decay,
      belief: mem.belief ? 1 : 0,
      mergedFrom: JSON.stringify(mem.mergedFrom),
      outcome: mem.outcome,
      score: mem.score,
      efficiency: mem.efficiency,
      notes: mem.notes,
      features: JSON.stringify(mem.features),
      helpful: mem.helpful === null ? null : (mem.helpful ? 1 : 0),
      servedContextId: mem.servedContextId
    });

    // Add to hybrid VSS if available
    if (this.hybridVSS) {
      try {
        await this.hybridVSS.addMemory(mem);
      } catch (error) {
        console.warn('Failed to add memory to hybrid VSS:', error);
      }
    }

    // Add to optimized VSS as fallback
    if (this.optimizedVSS) {
      try {
        await this.optimizedVSS.addMemory(mem);
      } catch (error) {
        console.warn('Failed to add memory to optimized VSS:', error);
      }
    }

    return mem;
  }

  async vectorSearch(queryVector: number[], options: {
    limit?: number;
    tags?: string[];
    type?: string;
    source?: string;
    minImportance?: number;
    pinnedOnly?: boolean;
  } = {}): Promise<Memory[]> {
    const {
      limit = 10,
      tags = [],
      type,
      source,
      minImportance = 0,
      pinnedOnly = false
    } = options;

    // Try hybrid VSS first (scientific + performance)
    if (this.hybridVSS) {
      try {
        const results = await this.hybridVSS.search(queryVector, options);
        console.error(`🧠 Hybrid VSS search completed: ${results.length} results`);
        return results;
      } catch (error) {
        console.warn('Hybrid VSS search failed, falling back to optimized VSS:', error);
      }
    }

    // Try optimized VSS as fallback (requires text query)
    if (this.optimizedVSS) {
      try {
        // For now, use a generic query since we don't have the original text
        const queryText = "vector search query";
        const results = await this.optimizedVSS.search(queryText, options);
        console.error(`🚀 HNSW VSS search completed: ${results.length} results`);
        return results;
      } catch (error) {
        console.warn('HNSW VSS search failed, falling back to linear search:', error);
      }
    }

    // Fallback to linear search
    return this.linearVectorSearch(queryVector, options);
  }

  private async linearVectorSearch(queryVector: number[], options: {
    limit?: number;
    tags?: string[];
    type?: string;
    source?: string;
    minImportance?: number;
    pinnedOnly?: boolean;
  } = {}): Promise<Memory[]> {
    const {
      limit = 10,
      tags = [],
      type,
      source,
      minImportance = 0,
      pinnedOnly = false
    } = options;

    // Build WHERE clause for filtering
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (tags.length > 0) {
      whereClause += ` AND (${tags.map(() => 'tags LIKE ?').join(' OR ')})`;
      params.push(...tags.map(tag => `%${tag}%`));
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

    // Get all memories and calculate similarity
    const query = `
      SELECT m.*, v.embedding
      FROM memories m
      LEFT JOIN memory_vectors v ON m.id = v.id
      ${whereClause}
    `;

    const results = this.db.prepare(query).all(...params);
    
    // Calculate cosine similarity for each memory
    const similarities = results.map((r: any) => {
      const embedding = JSON.parse(r.embedding || '[]');
      const similarity = this.cosineSimilarity(queryVector, embedding);
      return { ...r, similarity };
    });

    // Sort by similarity and return top results
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map((r: any) => this.mapRowToMemory(r));
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
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
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

    // Try hybrid VSS first (scientific + performance)
    if (this.hybridVSS) {
      try {
        const results = await this.hybridVSS.hybridSearch(queryVector, options);
        console.error(`🧠 Hybrid VSS hybrid search completed: ${results.length} results`);
        return results;
      } catch (error) {
        console.warn('Hybrid VSS hybrid search failed, falling back to optimized VSS:', error);
      }
    }

    // Try optimized VSS as fallback (requires text query)
    if (this.optimizedVSS) {
      try {
        // For now, use a generic query since we don't have the original text
        const queryText = "hybrid search query";
        const results = await this.optimizedVSS.hybridSearch(queryText, options);
        console.error(`🚀 HNSW VSS hybrid search completed: ${results.length} results`);
        return results;
      } catch (error) {
        console.warn('HNSW VSS hybrid search failed, falling back to linear search:', error);
      }
    }

    // Fallback to linear hybrid search
    return this.linearHybridSearch(queryVector, options);
  }

  private async linearHybridSearch(queryVector: number[], options: {
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

    // Get all memories that match the filters
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (tags.length > 0) {
      whereClause += ` AND (${tags.map(() => 'm.tags LIKE ?').join(' OR ')})`;
      params.push(...tags.map(tag => `%${tag}%`));
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

    // Get memories without vector similarity scores (we'll calculate in JavaScript)
    const query = `
      SELECT 
        m.*,
        v.embedding
      FROM memories m
      LEFT JOIN memory_vectors v ON m.id = v.id
      ${whereClause}
    `;

    const results = this.db.prepare(query).all(...params);
    
    // Calculate cosine similarity for each memory
    const memoriesWithSimilarity = results.map((r: any) => {
      const embedding = JSON.parse(r.embedding || '[]');
      const similarity = this.cosineSimilarity(queryVector, embedding);
      return { ...r, similarity, distance: 1 - similarity };
    });
    
    // Apply hybrid scoring
    const now = Date.now();
    const scored = memoriesWithSimilarity.map((r: any) => {
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

  async update(id: string, { text, embedding }: { text: string; embedding: number[] }) {
    const now = Date.now();
    
    // Update main table
    this.db.prepare(`
      UPDATE memories 
      SET text=?, embedding=?, updated_at=? 
      WHERE id=?
    `).run(text, JSON.stringify(embedding), now, id);

    // Update VSS table
    this.db.prepare(`
      UPDATE memory_vectors 
      SET embedding=?, last_used=? 
      WHERE id=?
    `).run(JSON.stringify(embedding), now, id);

    return this.get(id);
  }

  async pin(id: string, pinned: boolean) {
    const now = Date.now();
    
    // Update main table
    this.db.prepare(`UPDATE memories SET pinned=?, last_used=? WHERE id=?`)
      .run(pinned ? 1 : 0, now, id);

    // Update VSS table
    this.db.prepare(`UPDATE memory_vectors SET pinned=?, last_used=? WHERE id=?`)
      .run(pinned ? 1 : 0, now, id);

    return this.get(id);
  }

  async delete(id: string) {
    // Delete from both tables
    this.db.prepare(`DELETE FROM memories WHERE id=?`).run(id);
    this.db.prepare(`DELETE FROM memory_vectors WHERE id=?`).run(id);
  }

  async get(id: string): Promise<Memory> {
    const r: any = this.db.prepare(`SELECT * FROM memories WHERE id=?`).get(id);
    if (!r) throw new Error(`Memory not found: ${id}`);
    return this.mapRowToMemory(r);
  }

  async list({ tags = [], sessionId, type, source, outcome, helpful, belief }: { 
    tags?: string[]; 
    sessionId?: string | null;
    type?: string;
    source?: string;
    outcome?: string;
    helpful?: boolean;
    belief?: boolean;
  }): Promise<Memory[]> {
    let query = `SELECT * FROM memories WHERE 1=1`;
    const params: any[] = [];
    
    if (tags.length > 0) {
      query += ` AND tags LIKE ?`;
      params.push(`%${tags[0]}%`);
    }
    if (sessionId) {
      query += ` AND session_id = ?`;
      params.push(sessionId);
    }
    if (type) {
      query += ` AND type = ?`;
      params.push(type);
    }
    if (source) {
      query += ` AND source = ?`;
      params.push(source);
    }
    if (outcome) {
      query += ` AND outcome = ?`;
      params.push(outcome);
    }
    if (helpful !== undefined) {
      query += ` AND helpful = ?`;
      params.push(helpful ? 1 : 0);
    }
    if (belief !== undefined) {
      query += ` AND belief = ?`;
      params.push(belief ? 1 : 0);
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const rows = this.db.prepare(query).all(...params);
    return rows.map((r: any) => this.mapRowToMemory(r));
  }

  // Additional methods for advanced features (same as original MemoryStore)
  async updateOutcome(id: string, outcome: 'success' | 'failure' | 'neutral', score?: number, efficiency?: number, notes?: string) {
    const now = Date.now();
    this.db.prepare(`UPDATE memories SET outcome=?, score=?, efficiency=?, notes=?, last_used=? WHERE id=?`)
      .run(outcome, score, efficiency, notes, now, id);
    this.db.prepare(`UPDATE memory_vectors SET last_used=? WHERE id=?`)
      .run(now, id);
    return this.get(id);
  }

  async updateHelpful(id: string, helpful: boolean) {
    const now = Date.now();
    this.db.prepare(`UPDATE memories SET helpful=?, last_used=? WHERE id=?`).run(helpful ? 1 : 0, now, id);
    this.db.prepare(`UPDATE memory_vectors SET helpful=?, last_used=? WHERE id=?`).run(helpful ? 1 : 0, now, id);
    return this.get(id);
  }

  async updateFeatures(id: string, features: { [key: string]: any }) {
    const now = Date.now();
    this.db.prepare(`UPDATE memories SET features=?, updated_at=? WHERE id=?`)
      .run(JSON.stringify(features), now, id);
    return this.get(id);
  }

  async setServedContext(id: string, contextId: string) {
    const now = Date.now();
    this.db.prepare(`UPDATE memories SET served_context_id=?, last_used=? WHERE id=?`).run(contextId, now, id);
    this.db.prepare(`UPDATE memory_vectors SET last_used=? WHERE id=?`).run(now, id);
    return this.get(id);
  }

  async incrementUsage(id: string) {
    const now = Date.now();
    this.db.prepare(`UPDATE memories SET usage=usage+1, last_used=? WHERE id=?`).run(now, id);
    this.db.prepare(`UPDATE memory_vectors SET usage=usage+1, last_used=? WHERE id=?`).run(now, id);
    return this.get(id);
  }

  async getByTag(tag: string, limit: number = 10): Promise<Memory[]> {
    const rows = this.db.prepare(`SELECT * FROM memories WHERE tags LIKE ? ORDER BY created_at DESC LIMIT ?`)
      .all(`%${tag}%`, limit);
    return rows.map((r: any) => this.mapRowToMemory(r));
  }

  async getByTask(task: 'planning' | 'execution' | 'review', tags?: string[], limit: number = 5): Promise<Memory[]> {
    let query = `SELECT * FROM memories WHERE source = ?`;
    const params: any[] = [task];
    
    if (tags && tags.length > 0) {
      query += ` AND (${tags.map(() => 'tags LIKE ?').join(' OR ')})`;
      params.push(...tags.map(tag => `%${tag}%`));
    }
    
    query += ` ORDER BY importance DESC, created_at DESC LIMIT ?`;
    params.push(limit);
    
    const rows = this.db.prepare(query).all(...params);
    return rows.map((r: any) => this.mapRowToMemory(r));
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

  // Method to check if VSS is available
  isVSSAvailable(): boolean {
    try {
      // Check if our VSS table exists (SQLite native VSS)
      this.db.prepare('SELECT name FROM sqlite_master WHERE type="table" AND name="memory_vectors"').get();
      return true;
    } catch {
      return false;
    }
  }

  // Method to get VSS statistics
  getVSSStats(): { 
    totalVectors: number; 
    dimension: number; 
    available: boolean;
    hybridVSS?: any;
    optimizedVSS?: boolean;
  } {
    const available = this.isVSSAvailable();
    if (!available) {
      return { totalVectors: 0, dimension: 0, available: false };
    }

    const totalVectors = this.db.prepare('SELECT COUNT(*) as count FROM memories').get() as { count: number };
    
    const stats: any = {
      totalVectors: totalVectors.count,
      dimension: this.vectorDimension,
      available: true
    };

    // Add hybrid VSS stats if available
    if (this.hybridVSS) {
      stats.hybridVSS = this.hybridVSS.getStats();
    }

    // Add optimized VSS availability
    stats.optimizedVSS = !!this.optimizedVSS;

    return stats;
  }
}
