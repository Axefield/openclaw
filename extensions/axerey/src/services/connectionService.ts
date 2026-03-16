/**
 * Connection Service
 * 
 * Manages memory connections (graph relationships) with CRUD operations,
 * auto-inference, and graph traversal utilities.
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { Memory } from '../memory.js';

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
  strength: number; // 0-1
  inferred: boolean;
  inferenceConfidence?: number;
  description?: string;
  createdAt: number;
}

export class ConnectionService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Create a new connection between memories
   */
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
        `INSERT INTO memory_connections 
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

  /**
   * Get all connections for a memory
   * Optionally filter by persona (strict isolation)
   */
  getConnections(memoryId: string, personaId?: string): MemoryConnection[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM memory_connections 
         WHERE source_id = ? OR target_id = ?`
      )
      .all(memoryId, memoryId) as any[];

    const connections = rows.map((r) => this.mapRowToConnection(r));

    // If personaId provided, filter by persona (strict isolation)
    if (personaId) {
      const personaTag = `persona:${personaId}`;
      return connections.filter((conn) => {
        // Get both memories to check persona tags
        const sourceMem = this.db.prepare('SELECT tags FROM memories WHERE id = ?').get(conn.sourceId) as any;
        const targetMem = this.db.prepare('SELECT tags FROM memories WHERE id = ?').get(conn.targetId) as any;
        
        if (!sourceMem || !targetMem) return false;
        
        let sourceTags: string[] = [];
        let targetTags: string[] = [];
        try {
          sourceTags = JSON.parse(sourceMem.tags || '[]');
          targetTags = JSON.parse(targetMem.tags || '[]');
        } catch {
          return false;
        }
        
        // Both memories must have the persona tag
        return sourceTags.includes(personaTag) && targetTags.includes(personaTag);
      });
    }

    return connections;
  }

  /**
   * Get outgoing connections from a memory
   */
  getOutgoingConnections(memoryId: string): MemoryConnection[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM memory_connections 
         WHERE source_id = ?`
      )
      .all(memoryId) as any[];

    return rows.map((r) => this.mapRowToConnection(r));
  }

  /**
   * Get incoming connections to a memory
   */
  getIncomingConnections(memoryId: string): MemoryConnection[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM memory_connections 
         WHERE target_id = ?`
      )
      .all(memoryId) as any[];

    return rows.map((r) => this.mapRowToConnection(r));
  }

  /**
   * Get connections by type
   */
  getConnectionsByType(
    memoryId: string,
    connectionType: ConnectionType
  ): MemoryConnection[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM memory_connections 
         WHERE (source_id = ? OR target_id = ?) AND connection_type = ?`
      )
      .all(memoryId, memoryId, connectionType) as any[];

    return rows.map((r) => this.mapRowToConnection(r));
  }

  /**
   * Update connection
   */
  async updateConnection(
    connectionId: string,
    updates: Partial<Pick<MemoryConnection, 'strength' | 'description' | 'connectionType'>>
  ): Promise<MemoryConnection | null> {
    const connection = this.getConnection(connectionId);
    if (!connection) {
      return null;
    }

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
        `UPDATE memory_connections SET ${fields.join(', ')} WHERE id = ?`
      )
      .run(...values);

    return this.getConnection(connectionId);
  }

  /**
   * Delete connection
   */
  deleteConnection(connectionId: string): boolean {
    const result = this.db
      .prepare('DELETE FROM memory_connections WHERE id = ?')
      .run(connectionId);

    return result.changes > 0;
  }

  /**
   * Get connection by ID
   */
  getConnection(connectionId: string): MemoryConnection | null {
    const row = this.db
      .prepare('SELECT * FROM memory_connections WHERE id = ?')
      .get(connectionId) as any;

    if (!row) {
      return null;
    }

    return this.mapRowToConnection(row);
  }

  /**
   * Get related memories through connections (for context expansion)
   * Returns memories connected to the given memory, optionally filtered by connection type and strength
   */
  getRelatedMemories(
    memoryId: string,
    options: {
      connectionTypes?: ConnectionType[];
      minStrength?: number;
      maxResults?: number;
    } = {}
  ): string[] {
    const { connectionTypes, minStrength = 0, maxResults = 10 } = options;
    
    let query = `
      SELECT DISTINCT 
        CASE 
          WHEN source_id = ? THEN target_id 
          ELSE source_id 
        END as related_id,
        connection_type,
        strength
      FROM memory_connections
      WHERE (source_id = ? OR target_id = ?)
    `;
    
    const params: any[] = [memoryId, memoryId, memoryId];
    
    if (connectionTypes && connectionTypes.length > 0) {
      query += ` AND connection_type IN (${connectionTypes.map(() => '?').join(',')})`;
      params.push(...connectionTypes);
    }
    
    if (minStrength > 0) {
      query += ` AND strength >= ?`;
      params.push(minStrength);
    }
    
    query += ` ORDER BY strength DESC LIMIT ?`;
    params.push(maxResults);
    
    const rows = this.db.prepare(query).all(...params) as any[];
    return rows.map(r => r.related_id);
  }

  /**
   * Infer connection type based on content analysis
   */
  inferConnectionType(
    memory1: Memory,
    memory2: Memory,
    similarity: number
  ): ConnectionType {
    const text1 = memory1.text.toLowerCase();
    const text2 = memory2.text.toLowerCase();

    // Check for contradiction markers
    if (
      (text1.includes('not ') && text2.includes('is ')) ||
      (text1.includes('false') && text2.includes('true')) ||
      (text1.includes('never') && text2.includes('always'))
    ) {
      return 'contradicts';
    }

    // Check for support markers
    if (
      text1.includes('because') ||
      text1.includes('supports') ||
      text1.includes('evidence')
    ) {
      return 'supports';
    }

    // Check for derivation
    if (
      text2.includes('therefore') ||
      text2.includes('thus') ||
      text2.includes('conclusion')
    ) {
      return 'derives';
    }

    // Check for refinement
    if (
      text2.length > text1.length * 1.5 ||
      text2.includes('more specifically') ||
      text2.includes('in detail')
    ) {
      return 'refines';
    }

    // Check for generalization
    if (
      text1.length > text2.length * 1.5 ||
      text1.includes('in general') ||
      text1.includes('typically')
    ) {
      return 'generalizes';
    }

    // High similarity -> associates or supports
    if (similarity > 0.8) {
      return 'associates';
    }

    // Default to associates
    return 'associates';
  }

  /**
   * Auto-infer connections for a memory
   */
  async inferConnections(
    memoryId: string,
    similarMemories: Array<{ memory: Memory; similarity: number }>,
    threshold: number = 0.7
  ): Promise<MemoryConnection[]> {
    const connections: MemoryConnection[] = [];

    for (const { memory, similarity } of similarMemories) {
      if (similarity >= threshold) {
        const connectionType = this.inferConnectionType(
          { id: memoryId } as Memory,
          memory,
          similarity
        );

        const connection = await this.createConnection(
          memoryId,
          memory.id,
          connectionType,
          {
            strength: similarity,
            inferred: true,
            inferenceConfidence: similarity,
          }
        );

        connections.push(connection);
      }
    }

    return connections;
  }

  /**
   * Apply transitivity rules
   * If A supports B and B supports C, infer A supports C
   */
  async applyTransitivity(
    memoryId: string,
    transitivityRules: {
      supports: ConnectionType[];
      contradicts: ConnectionType[];
    } = {
      supports: ['supports', 'derives', 'extends'],
      contradicts: ['contradicts'],
    }
  ): Promise<MemoryConnection[]> {
    const inferred: MemoryConnection[] = [];
    const outgoing = this.getOutgoingConnections(memoryId);

    for (const conn of outgoing) {
      if (transitivityRules.supports.includes(conn.connectionType)) {
        const targetOutgoing = this.getOutgoingConnections(conn.targetId);
        for (const targetConn of targetOutgoing) {
          if (transitivityRules.supports.includes(targetConn.connectionType)) {
            // Check if connection already exists
            const existing = this.db
              .prepare(
                `SELECT * FROM memory_connections 
                 WHERE source_id = ? AND target_id = ?`
              )
              .get(memoryId, targetConn.targetId);

            if (!existing) {
              const newConn = await this.createConnection(
                memoryId,
                targetConn.targetId,
                conn.connectionType, // Inherit type from first connection
                {
                  strength: Math.min(conn.strength, targetConn.strength),
                  inferred: true,
                  inferenceConfidence: (conn.inferenceConfidence ?? 0.5) * (targetConn.inferenceConfidence ?? 0.5),
                  description: `Transitive: ${conn.connectionType} via ${conn.targetId}`,
                }
              );
              inferred.push(newConn);
            }
          }
        }
      }
    }

    return inferred;
  }

  /**
   * Get memory graph (all connected memories)
   */
  getMemoryGraph(memoryId: string, maxDepth: number = 3): {
    memories: Memory[];
    connections: MemoryConnection[];
  } {
    const visited = new Set<string>();
    const memories: Memory[] = [];
    const connections: MemoryConnection[] = [];

    const traverse = (id: string, depth: number) => {
      if (depth > maxDepth || visited.has(id)) {
        return;
      }

      visited.add(id);
      const conns = this.getConnections(id);
      connections.push(...conns);

      for (const conn of conns) {
        const nextId = conn.sourceId === id ? conn.targetId : conn.sourceId;
        if (!visited.has(nextId)) {
          traverse(nextId, depth + 1);
        }
      }
    };

    traverse(memoryId, 0);

    // Get memory objects (would need memory store reference)
    // For now, return IDs
    return { memories, connections };
  }

  /**
   * Map database row to Connection object
   */
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

