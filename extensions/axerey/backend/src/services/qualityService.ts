/**
 * Backend Quality Service
 * 
 * Evaluates memory quality using heuristics
 */

import Database from 'better-sqlite3';
import path from 'path';

export interface QualityMetrics {
  confidence: number;
  relevance: number;
  quality: number;
  reliabilityScore: number;
}

export class QualityService {
  private db: Database.Database;
  private userId?: string;

  constructor(userId?: string) {
    // Use the same database as memories (pcm.db in project root)
    const dbPath = process.env.PCM_DB || path.join(process.cwd(), 'pcm.db');
    this.db = new Database(dbPath);
    this.userId = userId;
  }

  async evaluateMemoryQuality(
    memoryId: string,
    context?: string
  ): Promise<QualityMetrics> {
    // Get memory from database
    const memory = this.db
      .prepare('SELECT * FROM memories WHERE id = ?')
      .get(memoryId) as any;

    if (!memory) {
      throw new Error('Memory not found');
    }

    // Parse features to get quality metrics if they exist
    let features: any = {};
    try {
      features = JSON.parse(memory.features || '{}');
    } catch {
      features = {};
    }

    // If quality metrics exist in features, return them
    if (features.quality) {
      return features.quality;
    }

    // Otherwise, calculate quality metrics from memory properties
    const confidence = memory.confidence || 0.5;
    const importance = memory.importance || 0.5;
    const usage = Math.min(memory.usage / 10, 1); // Normalize usage
    const pinned = memory.pinned ? 1 : 0;
    
    // Calculate quality metrics
    const quality = (confidence + importance) / 2;
    const relevance = importance;
    const reliabilityScore = (confidence * 0.6 + (pinned ? 0.2 : 0) + (usage * 0.2));
    
    return {
      confidence,
      relevance,
      quality,
      reliabilityScore
    };
  }

  async getMemoryQuality(memoryId: string): Promise<QualityMetrics | null> {
    try {
      console.log(`[QualityService] Getting quality for memory: ${memoryId}`)
      const result = await this.evaluateMemoryQuality(memoryId);
      console.log(`[QualityService] Quality result:`, result)
      return result;
    } catch (error) {
      console.error('[QualityService] Error getting memory quality:', error);
      return null;
    }
  }
}

