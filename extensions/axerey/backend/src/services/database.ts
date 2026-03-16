import Database from 'better-sqlite3'
import path from 'path'
import { randomBytes, createHash } from 'crypto'

export interface User {
  id: string
  username: string
  email: string
  passwordHash: string
  role: 'admin' | 'user'
  createdAt: number
  updatedAt: number
  isActive: boolean
  externalId?: string // ID from parent domain
  externalSource?: string // Source identifier (e.g., 'parent-domain')
  metadata?: string // JSON string for additional data
}

export interface ApiKey {
  id: string
  userId: string
  keyHash: string
  keyPrefix: string // First 8 chars for display
  name: string
  type: 'api' | 'mcp'
  scopes: string[] // JSON array
  lastUsedAt: number | null
  expiresAt: number | null
  createdAt: number
  isActive: boolean
}

class DatabaseService {
  private db: Database.Database
  private dbPath: string

  constructor(dbPath?: string) {
    // Use provided path or default to pcm.db in project root
    this.dbPath = dbPath || path.join(process.cwd(), 'pcm.db')
    this.db = new Database(this.dbPath)
    this.setup()
  }

  private setup() {
    // Create users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1
      );
    `)

    // Migrate existing table to add sync columns if they don't exist
    this.migrateUserTable()

    // Add indexes for external sync
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_external_id ON users(external_id);
      CREATE INDEX IF NOT EXISTS idx_users_external_source ON users(external_source);
    `)

    // Create API keys table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        key_hash TEXT NOT NULL,
        key_prefix TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        scopes TEXT NOT NULL,
        last_used_at INTEGER,
        expires_at INTEGER,
        created_at INTEGER NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `)

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
      CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
      CREATE INDEX IF NOT EXISTS idx_api_keys_type ON api_keys(type);
    `)
  }

  private migrateUserTable() {
    // Check if external_id column exists
    const columns = this.db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>
    const columnNames = columns.map(col => col.name)

    if (!columnNames.includes('external_id')) {
      console.log('Migrating users table: adding sync columns...')
      this.db.exec(`
        ALTER TABLE users ADD COLUMN external_id TEXT;
        ALTER TABLE users ADD COLUMN external_source TEXT;
        ALTER TABLE users ADD COLUMN metadata TEXT;
      `)
      console.log('✅ Users table migration complete')
    }
  }

  // User methods
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const id = randomBytes(16).toString('hex')
    const now = Date.now()
    
    const stmt = this.db.prepare(`
      INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at, is_active, external_id, external_source, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    stmt.run(
      id,
      user.username,
      user.email,
      user.passwordHash,
      user.role,
      now,
      now,
      user.isActive ? 1 : 0,
      user.externalId || null,
      user.externalSource || null,
      user.metadata ? JSON.stringify(user.metadata) : null
    )

    // Initialize user-specific tables
    this.initializeUserTables(id)

    return this.getUserById(id)!
  }

  getUserById(id: string): User | null {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any
    if (!row) return null

    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role as 'admin' | 'user',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isActive: row.is_active === 1,
      externalId: row.external_id || undefined,
      externalSource: row.external_source || undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    }
  }

  getUserByExternalId(externalId: string, source: string = 'parent-domain'): User | null {
    const row = this.db.prepare('SELECT * FROM users WHERE external_id = ? AND external_source = ?').get(externalId, source) as any
    if (!row) return null

    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role as 'admin' | 'user',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isActive: row.is_active === 1,
      externalId: row.external_id || undefined,
      externalSource: row.external_source || undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    }
  }

  getUserByUsername(username: string): User | null {
    const row = this.db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any
    if (!row) return null

    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role as 'admin' | 'user',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isActive: row.is_active === 1,
      externalId: row.external_id || undefined,
      externalSource: row.external_source || undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    }
  }

  getUserByEmail(email: string): User | null {
    const row = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any
    if (!row) return null

    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role as 'admin' | 'user',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isActive: row.is_active === 1,
      externalId: row.external_id || undefined,
      externalSource: row.external_source || undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    }
  }

  getAllUsers(): User[] {
    const rows = this.db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as any[]
    return rows.map(row => ({
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role as 'admin' | 'user',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isActive: row.is_active === 1,
      externalId: row.external_id || undefined,
      externalSource: row.external_source || undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    }))
  }

  updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): User | null {
    const user = this.getUserById(id)
    if (!user) return null

    const fields: string[] = []
    const values: any[] = []

    if (updates.username !== undefined) {
      fields.push('username = ?')
      values.push(updates.username)
    }
    if (updates.email !== undefined) {
      fields.push('email = ?')
      values.push(updates.email)
    }
    if (updates.passwordHash !== undefined) {
      fields.push('password_hash = ?')
      values.push(updates.passwordHash)
    }
    if (updates.role !== undefined) {
      fields.push('role = ?')
      values.push(updates.role)
    }
    if (updates.isActive !== undefined) {
      fields.push('is_active = ?')
      values.push(updates.isActive ? 1 : 0)
    }
    if (updates.externalId !== undefined) {
      fields.push('external_id = ?')
      values.push(updates.externalId || null)
    }
    if (updates.externalSource !== undefined) {
      fields.push('external_source = ?')
      values.push(updates.externalSource || null)
    }
    if (updates.metadata !== undefined) {
      fields.push('metadata = ?')
      values.push(updates.metadata ? JSON.stringify(updates.metadata) : null)
    }

    if (fields.length === 0) return user

    fields.push('updated_at = ?')
    values.push(Date.now())
    values.push(id)

    const stmt = this.db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`)
    stmt.run(...values)

    return this.getUserById(id)!
  }

  // API Key methods
  createApiKey(key: Omit<ApiKey, 'id' | 'createdAt'>): { apiKey: ApiKey; plainKey: string } {
    const id = randomBytes(16).toString('hex')
    const plainKey = `axerey_${randomBytes(32).toString('base64url')}`
    const keyHash = createHash('sha256').update(plainKey).digest('hex')
    const keyPrefix = plainKey.substring(0, 8)
    const now = Date.now()

    const stmt = this.db.prepare(`
      INSERT INTO api_keys (id, user_id, key_hash, key_prefix, name, type, scopes, last_used_at, expires_at, created_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      key.userId,
      keyHash,
      keyPrefix,
      key.name,
      key.type,
      JSON.stringify(key.scopes),
      key.lastUsedAt || null,
      key.expiresAt || null,
      now,
      key.isActive ? 1 : 0
    )

    const apiKey = this.getApiKeyById(id)!
    return { apiKey, plainKey }
  }

  getApiKeyById(id: string): ApiKey | null {
    const row = this.db.prepare('SELECT * FROM api_keys WHERE id = ?').get(id) as any
    if (!row) return null

    return {
      id: row.id,
      userId: row.user_id,
      keyHash: row.key_hash,
      keyPrefix: row.key_prefix,
      name: row.name,
      type: row.type as 'api' | 'mcp',
      scopes: JSON.parse(row.scopes),
      lastUsedAt: row.last_used_at,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      isActive: row.is_active === 1
    }
  }

  getApiKeyByHash(keyHash: string): ApiKey | null {
    const row = this.db.prepare('SELECT * FROM api_keys WHERE key_hash = ? AND is_active = 1').get(keyHash) as any
    if (!row) return null

    return {
      id: row.id,
      userId: row.user_id,
      keyHash: row.key_hash,
      keyPrefix: row.key_prefix,
      name: row.name,
      type: row.type as 'api' | 'mcp',
      scopes: JSON.parse(row.scopes),
      lastUsedAt: row.last_used_at,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      isActive: row.is_active === 1
    }
  }

  getApiKeysByUserId(userId: string): ApiKey[] {
    const rows = this.db.prepare('SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC').all(userId) as any[]
    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      keyHash: row.key_hash,
      keyPrefix: row.key_prefix,
      name: row.name,
      type: row.type as 'api' | 'mcp',
      scopes: JSON.parse(row.scopes),
      lastUsedAt: row.last_used_at,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      isActive: row.is_active === 1
    }))
  }

  updateApiKeyLastUsed(id: string): void {
    this.db.prepare('UPDATE api_keys SET last_used_at = ? WHERE id = ?').run(Date.now(), id)
  }

  revokeApiKey(id: string): boolean {
    const result = this.db.prepare('UPDATE api_keys SET is_active = 0 WHERE id = ?').run(id)
    return result.changes > 0
  }

  deleteApiKey(id: string): boolean {
    const result = this.db.prepare('DELETE FROM api_keys WHERE id = ?').run(id)
    return result.changes > 0
  }

  /**
   * Create a per-user table for data isolation
   * @param userId - The user ID
   * @param tableName - Base name for the table (will be prefixed with user_<userId>_)
   * @param schema - SQL schema definition for the table
   */
  createUserTable(userId: string, tableName: string, schema: string): void {
    const fullTableName = `user_${userId}_${tableName}`
    
    // Sanitize table name to prevent SQL injection
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new Error('Invalid table name')
    }
    
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ${fullTableName} (
        ${schema}
      );
    `)
    
    // Create index on user_id if schema includes it
    if (schema.includes('user_id')) {
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_${fullTableName}_user_id 
        ON ${fullTableName}(user_id);
      `)
    }
  }

  /**
   * Drop a per-user table
   */
  dropUserTable(userId: string, tableName: string): void {
    const fullTableName = `user_${userId}_${tableName}`
    
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new Error('Invalid table name')
    }
    
    this.db.exec(`DROP TABLE IF EXISTS ${fullTableName};`)
  }

  /**
   * Get all tables for a specific user
   */
  getUserTables(userId: string): string[] {
    const tables = this.db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name LIKE ?
    `).all(`user_${userId}_%`) as Array<{ name: string }>
    
    return tables.map(t => t.name)
  }

  /**
   * Initialize default tables for a new user
   * This creates user-specific memory tables and other isolated data stores
   */
  initializeUserTables(userId: string): void {
    // Create user-specific memories table
    this.createUserTable(userId, 'memories', `
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
    `)
    
    // Create user-specific Smart-Thinking tables
    this.createUserTable(userId, 'memory_connections', `
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      connection_type TEXT NOT NULL,
      strength REAL DEFAULT 0.5,
      inferred INTEGER DEFAULT 0,
      inference_confidence REAL,
      description TEXT,
      created_at INTEGER NOT NULL
    `)

    this.createUserTable(userId, 'reasoning_steps', `
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
    `)

    this.createUserTable(userId, 'memory_verifications', `
      id TEXT PRIMARY KEY,
      memory_id TEXT NOT NULL,
      status TEXT NOT NULL,
      confidence REAL,
      sources TEXT,
      verified_calculations TEXT,
      timestamp INTEGER NOT NULL
    `)

    this.createUserTable(userId, 'reasoning_states', `
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      state_data TEXT NOT NULL,
      created_at INTEGER NOT NULL
    `)
    
    // Create indexes for user memories
    const fullTableName = `user_${userId}_memories`
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_${fullTableName}_created 
      ON ${fullTableName}(created_at);
      CREATE INDEX IF NOT EXISTS idx_${fullTableName}_tags 
      ON ${fullTableName}(tags);
      CREATE INDEX IF NOT EXISTS idx_${fullTableName}_session 
      ON ${fullTableName}(session_id);
    `)

    // Create indexes for user Smart-Thinking tables
    const connTableName = `user_${userId}_memory_connections`
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_${connTableName}_source 
      ON ${connTableName}(source_id);
      CREATE INDEX IF NOT EXISTS idx_${connTableName}_target 
      ON ${connTableName}(target_id);
      CREATE INDEX IF NOT EXISTS idx_${connTableName}_type 
      ON ${connTableName}(connection_type);
    `)

    const reasoningTableName = `user_${userId}_reasoning_steps`
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_${reasoningTableName}_session 
      ON ${reasoningTableName}(session_id);
      CREATE INDEX IF NOT EXISTS idx_${reasoningTableName}_step_id 
      ON ${reasoningTableName}(step_id);
    `)

    const verificationTableName = `user_${userId}_memory_verifications`
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_${verificationTableName}_memory 
      ON ${verificationTableName}(memory_id);
      CREATE INDEX IF NOT EXISTS idx_${verificationTableName}_status 
      ON ${verificationTableName}(status);
    `)

    const stateTableName = `user_${userId}_reasoning_states`
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_${stateTableName}_session 
      ON ${stateTableName}(session_id);
    `)
  }

  close() {
    this.db.close()
  }
}

// Singleton instance
let dbInstance: DatabaseService | null = null

export function getDatabase(dbPath?: string): DatabaseService {
  if (!dbInstance) {
    dbInstance = new DatabaseService(dbPath)
  }
  return dbInstance
}

export default DatabaseService

