import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";

export type Memory = {
  id: string;
  text: string;
  tags: string[];
  importance: number; // 0..1
  pinned: boolean;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  expiresAt: number | null;
  sessionId: string | null;
  embedding: number[]; // store as JSON
  usage: number;
  type: 'episodic' | 'semantic' | 'procedural';
  confidence: number; // 0..1
  lastUsed: number; // epoch ms
  source: 'plan' | 'signal' | 'execution' | 'account';
  belief: boolean; // promoted semantic fact
  mergedFrom: string[]; // provenance
  decay: number; // decay rate
  merged?: boolean;
  archived?: boolean;
  triggers?: { kind: 'time' | 'score' | 'event'; spec: any }[];
  // New fields for advanced features
  outcome?: 'success' | 'failure' | 'neutral' | null;
  score?: number | null; // success score
  efficiency?: number | null; // efficiency metric
  notes?: string | null; // additional notes
  features?: { [key: string]: any }; // custom features
  helpful?: boolean | null; // user feedback
  servedContextId?: string | null; // for outcome tracking
};

export class MemoryStore {
  private db: Database.Database;

  static async init({ path }: { path: string }) {
    const inst = new MemoryStore(path);
    inst.setup();
    return inst;
  }

  private constructor(path: string) {
    this.db = new Database(path);
  }

  private setup() {
    // Create table if it doesn't exist
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
        usage INTEGER NOT NULL DEFAULT 0
      );
    `);

    // Check if we need to add new columns (migration)
    this.migrateSchema();

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_mem_created ON memories(created_at);
      CREATE INDEX IF NOT EXISTS idx_mem_tags ON memories(tags);
      CREATE INDEX IF NOT EXISTS idx_mem_session ON memories(session_id);
    `);
  }

  private migrateSchema() {
    const columns = this.db.prepare("PRAGMA table_info(memories)").all() as any[];
    const existingColumns = columns.map(col => col.name);

    // Add new columns if they don't exist
    const newColumns = [
      { name: 'type', sql: 'TEXT NOT NULL DEFAULT "episodic"' },
      { name: 'source', sql: 'TEXT NOT NULL DEFAULT "plan"' },
      { name: 'confidence', sql: 'REAL NOT NULL DEFAULT 1.0' },
      { name: 'last_used', sql: 'INTEGER NOT NULL DEFAULT 0' },
      { name: 'decay', sql: 'REAL NOT NULL DEFAULT 0.01' },
      { name: 'belief', sql: 'INTEGER NOT NULL DEFAULT 0' },
      { name: 'merged_from', sql: 'TEXT DEFAULT "[]"' },
      { name: 'outcome', sql: 'TEXT' },
      { name: 'score', sql: 'REAL' },
      { name: 'efficiency', sql: 'REAL' },
      { name: 'notes', sql: 'TEXT' },
      { name: 'features', sql: 'TEXT DEFAULT "{}"' },
      { name: 'helpful', sql: 'INTEGER' },
      { name: 'served_context_id', sql: 'TEXT' }
    ];

    for (const column of newColumns) {
      if (!existingColumns.includes(column.name)) {
        try {
          this.db.exec(`ALTER TABLE memories ADD COLUMN ${column.name} ${column.sql}`);
          console.error(`Added column: ${column.name}`);
        } catch (error) {
          console.error(`Column ${column.name} might already exist or error:`, error);
        }
      }
    }

    // Create additional indexes for new columns
    const newIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_mem_type ON memories(type)',
      'CREATE INDEX IF NOT EXISTS idx_mem_source ON memories(source)',
      'CREATE INDEX IF NOT EXISTS idx_mem_outcome ON memories(outcome)',
      'CREATE INDEX IF NOT EXISTS idx_mem_helpful ON memories(helpful)'
    ];

    for (const indexSql of newIndexes) {
      try {
        this.db.exec(indexSql);
      } catch (error) {
        console.error('Index creation error (might already exist):', error);
      }
    }

    // Create new tables for Smart-Thinking improvements
    this.createSmartThinkingTables();
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
    this.db.prepare(`INSERT INTO memories (id, text, tags, importance, pinned, created_at, updated_at, expires_at, session_id, embedding, usage, type, source, confidence, last_used, decay, belief, merged_from, outcome, score, efficiency, notes, features, helpful, served_context_id)
                     VALUES (@id, @text, @tags, @importance, @pinned, @createdAt, @updatedAt, @expiresAt, @sessionId, @embedding, @usage, @type, @source, @confidence, @lastUsed, @decay, @belief, @mergedFrom, @outcome, @score, @efficiency, @notes, @features, @helpful, @servedContextId)`) 
            .run({ 
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
    return mem;
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
    const mapped = rows.map((r: any) => ({
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
      belief: r.belief === 1 ? true : false,
      mergedFrom: JSON.parse(r.merged_from || '[]'),
      outcome: r.outcome ?? null,
      score: r.score ?? null,
      efficiency: r.efficiency ?? null,
      notes: r.notes ?? null,
      features: JSON.parse(r.features || '{}'),
      helpful: r.helpful === 1 ? true : r.helpful === 0 ? false : null,
      servedContextId: r.served_context_id ?? null
    } as Memory));
    return mapped;
  }

  async update(id: string, { text, embedding }: { text: string; embedding: number[] }) {
    const now = Date.now();
    this.db.prepare(`UPDATE memories SET text=?, embedding=?, updated_at=? WHERE id=?`).run(text, JSON.stringify(embedding), now, id);
    return this.get(id);
  }

  async pin(id: string, pinned: boolean) {
    this.db.prepare(`UPDATE memories SET pinned=? WHERE id=?`).run(pinned ? 1 : 0, id);
    return this.get(id);
  }

  async delete(id: string) {
    this.db.prepare(`DELETE FROM memories WHERE id=?`).run(id);
  }

  async get(id: string): Promise<Memory> {
    const r: any = this.db.prepare(`SELECT * FROM memories WHERE id=?`).get(id);
    if (!r) throw new Error(`Memory not found: ${id}`);
    return this.mapRowToMemory(r);
  }

  async consolidate({ tag, windowDays }: { tag: string; windowDays: number }) {
    const now = Date.now();
    const windowStart = now - windowDays * 24 * 60 * 60 * 1000;
    const memories = this.db.prepare(`SELECT * FROM memories WHERE tags LIKE ? AND created_at >= ?`).all(`%${tag}%`, windowStart);
    // Implement logic to consolidate memories
    // This could involve merging similar memories, deduplication, etc.
    // Update the database with consolidated memories
    // Example: Increase confidence, set belief=true, mark originals in mergedFrom
    return memories;
  }

  // New methods for advanced features
  async updateOutcome(id: string, outcome: 'success' | 'failure' | 'neutral', score?: number, efficiency?: number, notes?: string) {
    const now = Date.now();
    this.db.prepare(`UPDATE memories SET outcome=?, score=?, efficiency=?, notes=?, last_used=? WHERE id=?`)
      .run(outcome, score, efficiency, notes, now, id);
    return this.get(id);
  }

  async updateHelpful(id: string, helpful: boolean) {
    const now = Date.now();
    this.db.prepare(`UPDATE memories SET helpful=?, last_used=? WHERE id=?`).run(helpful ? 1 : 0, now, id);
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
    return this.get(id);
  }

  async incrementUsage(id: string) {
    const now = Date.now();
    this.db.prepare(`UPDATE memories SET usage=usage+1, last_used=? WHERE id=?`).run(now, id);
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
}
