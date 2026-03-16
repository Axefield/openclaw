/**
 * Backend Connection Service
 * 
 * Manages memory connections for the backend API
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import path from 'path';

export type ConnectionType =
  | 'supports'
  | 'contradicts'
  | 'refines'
  | 'derives'
  | 'exemplifies'
  | 'generalizes'
  | 'questions'
  | 'analyzes'
  | 'synthesizes'
  | 'associates'
  | 'extends'
  | 'applies';

export interface MemoryConnection {
  id: string;
  sourceId: string;
  targetId: string;
  connectionType: ConnectionType;
  strength: number;
  inferred: boolean;
  inferenceConfidence?: number;
  description?: string;
  createdAt: number;
}

export class BackendConnectionService {
  private db: Database.Database;
  private userId?: string;

  constructor(userId?: string) {
    // Use the same database as memories (pcm.db in project root)
    const dbPath = process.env.PCM_DB || path.join(process.cwd(), 'pcm.db');
    this.db = new Database(dbPath);
    this.userId = userId;
    
    // Ensure connection table exists
    this.ensureTableExists();
  }
  
  private ensureTableExists() {
    const tableName = this.getTableName('memory_connections');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
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
      
      CREATE INDEX IF NOT EXISTS idx_${tableName}_source ON ${tableName}(source_id);
      CREATE INDEX IF NOT EXISTS idx_${tableName}_target ON ${tableName}(target_id);
      CREATE INDEX IF NOT EXISTS idx_${tableName}_type ON ${tableName}(connection_type);
    `);
  }

  private getTableName(baseName: string): string {
    if (this.userId) {
      return `user_${this.userId}_${baseName}`;
    }
    return baseName;
  }

  async createConnection(
    sourceId: string,
    targetId: string,
    connectionType: ConnectionType,
    options: {
      strength?: number;
      description?: string;
      inferred?: boolean;
      inferenceConfidence?: number;
    } = {}
  ): Promise<MemoryConnection> {
    const id = randomUUID();
    const now = Date.now();
    const tableName = this.getTableName('memory_connections');

    const connection: MemoryConnection = {
      id,
      sourceId,
      targetId,
      connectionType,
      strength: options.strength ?? 0.5,
      inferred: options.inferred ?? false,
      inferenceConfidence: options.inferenceConfidence,
      description: options.description,
      createdAt: now,
    };

    this.db
      .prepare(
        `INSERT INTO ${tableName} 
         (id, source_id, target_id, connection_type, strength, inferred, inference_confidence, description, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        sourceId,
        targetId,
        connectionType,
        connection.strength,
        connection.inferred ? 1 : 0,
        connection.inferenceConfidence ?? null,
        connection.description ?? null,
        now
      );

    return connection;
  }

  getAllConnections(limit: number = 1000, offset: number = 0): MemoryConnection[] {
    const tableName = this.getTableName('memory_connections');
    const rows = this.db
      .prepare(
        `SELECT * FROM ${tableName} 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`
      )
      .all(limit, offset) as any[];

    return rows.map((r) => this.mapRowToConnection(r));
  }

  getConnections(memoryId: string): MemoryConnection[] {
    const tableName = this.getTableName('memory_connections');
    const rows = this.db
      .prepare(
        `SELECT * FROM ${tableName} 
         WHERE source_id = ? OR target_id = ?`
      )
      .all(memoryId, memoryId) as any[];

    return rows.map((r) => this.mapRowToConnection(r));
  }

  getConnection(connectionId: string): MemoryConnection | null {
    const tableName = this.getTableName('memory_connections');
    const row = this.db
      .prepare(`SELECT * FROM ${tableName} WHERE id = ?`)
      .get(connectionId) as any;

    if (!row) {
      return null;
    }

    return this.mapRowToConnection(row);
  }

  async updateConnection(
    connectionId: string,
    updates: Partial<Pick<MemoryConnection, 'strength' | 'description' | 'connectionType'>>
  ): Promise<MemoryConnection | null> {
    const connection = this.getConnection(connectionId);
    if (!connection) {
      return null;
    }

    const tableName = this.getTableName('memory_connections');
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.strength !== undefined) {
      fields.push('strength = ?');
      values.push(updates.strength);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.connectionType !== undefined) {
      fields.push('connection_type = ?');
      values.push(updates.connectionType);
    }

    if (fields.length === 0) {
      return connection;
    }

    values.push(connectionId);
    this.db
      .prepare(
        `UPDATE ${tableName} SET ${fields.join(', ')} WHERE id = ?`
      )
      .run(...values);

    return this.getConnection(connectionId);
  }

  deleteConnection(connectionId: string): boolean {
    const tableName = this.getTableName('memory_connections');
    const result = this.db
      .prepare(`DELETE FROM ${tableName} WHERE id = ?`)
      .run(connectionId);

    return result.changes > 0;
  }

  private mapRowToConnection(row: any): MemoryConnection {
    return {
      id: row.id,
      sourceId: row.source_id,
      targetId: row.target_id,
      connectionType: row.connection_type as ConnectionType,
      strength: row.strength,
      inferred: !!row.inferred,
      inferenceConfidence: row.inference_confidence ?? undefined,
      description: row.description ?? undefined,
      createdAt: row.created_at,
    };
  }
}

