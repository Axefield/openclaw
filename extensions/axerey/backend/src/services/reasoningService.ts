/**
 * Backend Reasoning Service
 * 
 * Manages reasoning step tracking and state management
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { getDatabase } from './database.js';

export interface ReasoningStep {
  id: string;
  sessionId: string;
  stepId: string;
  kind: string;
  label?: string;
  description?: string;
  status: 'in_progress' | 'completed' | 'failed';
  startedAt: number;
  completedAt?: number;
  duration?: number;
  parents: string[];
  details: Record<string, any>;
  justifications: Array<{
    summary: string;
    heuristics?: any[];
    timestamp?: string;
  }>;
}

export interface ReasoningState {
  id: string;
  sessionId: string;
  stateData: {
    memories: any[];
    connections?: any[];
  };
  createdAt: number;
}

export class ReasoningService {
  private db: Database.Database;
  private userId?: string;

  constructor(userId?: string) {
    const dbService = getDatabase();
    this.db = (dbService as any).db;
    this.userId = userId;
  }

  private getTableName(baseName: string): string {
    if (this.userId) {
      return `user_${this.userId}_${baseName}`;
    }
    return baseName;
  }

  async startStep(
    sessionId: string,
    stepId: string,
    kind: string,
    label?: string,
    description?: string,
    parents?: string[]
  ): Promise<string> {
    const id = randomUUID();
    const now = Date.now();
    const tableName = this.getTableName('reasoning_steps');

    this.db.prepare(`
      INSERT INTO ${tableName} 
      (id, session_id, step_id, kind, label, description, status, started_at, parents, details, justifications)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      sessionId,
      stepId,
      kind,
      label || null,
      description || null,
      'in_progress',
      now,
      JSON.stringify(parents || []),
      JSON.stringify({}),
      JSON.stringify([])
    );

    return stepId;
  }

  async completeStep(
    stepId: string,
    sessionId: string,
    details?: Record<string, any>
  ): Promise<void> {
    const tableName = this.getTableName('reasoning_steps');
    const step = this.db
      .prepare(`SELECT * FROM ${tableName} WHERE step_id = ? AND session_id = ?`)
      .get(stepId, sessionId) as any;

    if (!step) {
      throw new Error(`Step not found: ${stepId}`);
    }

    const completedAt = Date.now();
    const duration = completedAt - step.started_at;

    this.db.prepare(`
      UPDATE ${tableName} 
      SET status = ?, completed_at = ?, duration = ?, details = ?
      WHERE step_id = ? AND session_id = ?
    `).run(
      'completed',
      completedAt,
      duration,
      JSON.stringify({ ...JSON.parse(step.details || '{}'), ...(details || {}) }),
      stepId,
      sessionId
    );
  }

  async failStep(
    stepId: string,
    sessionId: string,
    error: string
  ): Promise<void> {
    const tableName = this.getTableName('reasoning_steps');
    const step = this.db
      .prepare(`SELECT * FROM ${tableName} WHERE step_id = ? AND session_id = ?`)
      .get(stepId, sessionId) as any;

    if (!step) {
      throw new Error(`Step not found: ${stepId}`);
    }

    this.db.prepare(`
      UPDATE ${tableName} 
      SET status = ?, details = ?
      WHERE step_id = ? AND session_id = ?
    `).run(
      'failed',
      JSON.stringify({ ...JSON.parse(step.details || '{}'), error }),
      stepId,
      sessionId
    );
  }

  async getSteps(sessionId: string): Promise<ReasoningStep[]> {
    const tableName = this.getTableName('reasoning_steps');
    const rows = this.db
      .prepare(`SELECT * FROM ${tableName} WHERE session_id = ? ORDER BY started_at ASC`)
      .all(sessionId) as any[];

    return rows.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      stepId: r.step_id,
      kind: r.kind,
      label: r.label,
      description: r.description,
      status: r.status as 'in_progress' | 'completed' | 'failed',
      startedAt: r.started_at,
      completedAt: r.completed_at,
      duration: r.duration,
      parents: JSON.parse(r.parents || '[]'),
      details: JSON.parse(r.details || '{}'),
      justifications: JSON.parse(r.justifications || '[]')
    }));
  }

  async saveState(
    sessionId: string,
    stateData: { memories: any[]; connections?: any[] },
    includeConnections: boolean = true
  ): Promise<string> {
    const stateId = randomUUID();
    const tableName = this.getTableName('reasoning_states');

    const data = {
      memories: stateData.memories,
      ...(includeConnections && stateData.connections ? { connections: stateData.connections } : {})
    };

    this.db.prepare(`
      INSERT INTO ${tableName} (id, session_id, state_data, created_at)
      VALUES (?, ?, ?, ?)
    `).run(
      stateId,
      sessionId,
      JSON.stringify(data),
      Date.now()
    );

    return stateId;
  }

  async loadState(sessionId: string): Promise<ReasoningState | null> {
    const tableName = this.getTableName('reasoning_states');
    const row = this.db
      .prepare(`SELECT * FROM ${tableName} WHERE session_id = ? ORDER BY created_at DESC LIMIT 1`)
      .get(sessionId) as any;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      sessionId: row.session_id,
      stateData: JSON.parse(row.state_data),
      createdAt: row.created_at
    };
  }

  async getTrace(sessionId: string): Promise<{
    sessionId: string;
    timeline: ReasoningStep[];
    metrics: {
      totalSteps: number;
      completedSteps: number;
      failedSteps: number;
      averageDuration: number;
    };
    summary: string;
  }> {
    const steps = await this.getSteps(sessionId);

    const metrics = {
      totalSteps: steps.length,
      completedSteps: steps.filter(s => s.status === 'completed').length,
      failedSteps: steps.filter(s => s.status === 'failed').length,
      averageDuration: steps
        .filter(s => s.duration)
        .reduce((sum, s) => sum + (s.duration || 0), 0) / steps.filter(s => s.duration).length || 0
    };

    return {
      sessionId,
      timeline: steps,
      metrics,
      summary: `Reasoning trace with ${metrics.totalSteps} steps, ${metrics.completedSteps} completed`
    };
  }

  async suggestNextSteps(
    sessionId: string,
    limit: number = 3,
    context?: string
  ): Promise<string[]> {
    const suggestions: string[] = [];
    const steps = await this.getSteps(sessionId);

    // Identify incomplete steps
    const incomplete = steps.filter(s => s.status === 'in_progress');
    if (incomplete.length > 0) {
      suggestions.push(`Complete step: ${incomplete[0].label || incomplete[0].stepId}`);
    }

    // Identify failed steps
    const failed = steps.filter(s => s.status === 'failed');
    if (failed.length > 0) {
      suggestions.push(`Retry failed step: ${failed[0].label || failed[0].stepId}`);
    }

    // Generic suggestions
    if (suggestions.length === 0) {
      suggestions.push('Start a new reasoning step');
      suggestions.push('Review reasoning trace');
    }

    return suggestions.slice(0, limit);
  }
}

