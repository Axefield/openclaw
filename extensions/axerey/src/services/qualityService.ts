/**
 * Quality Service (MCP Server)
 * 
 * Evaluates memory quality using heuristics
 * This is the MCP server version (src/services), backend version is in backend/src/services
 */

import type { Memory } from '../memory.js';
import type { VSSMemoryStore } from '../memory-vss.js';

export interface QualityMetrics {
  confidence: number;
  relevance: number;
  quality: number;
  reliabilityScore: number;
}

export interface VerificationResult {
  status: 'verified' | 'partially_verified' | 'unverified' | 'contradicted' | 'uncertain';
  confidence?: number;
  sources?: string[];
  timestamp?: number;
}

export class QualityService {
  private vssStore: VSSMemoryStore;

  constructor(vssStore: VSSMemoryStore) {
    this.vssStore = vssStore;
  }

  async evaluateMemoryQuality(
    memoryId: string,
    context?: string
  ): Promise<QualityMetrics> {
    // Get memory
    const memory = await this.vssStore.get(memoryId);
    if (!memory) {
      throw new Error('Memory not found');
    }

    // Parse features to get quality metrics if they exist
    const features = memory.features || {};

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
      return await this.evaluateMemoryQuality(memoryId);
    } catch (error) {
      console.error('[QualityService] Error getting memory quality:', error);
      return null;
    }
  }

  /**
   * Get verification status from memory features
   */
  getVerificationStatus(memory: Memory): VerificationResult | null {
    const verification = memory.features?.verification;
    if (!verification) {
      return null;
    }
    return verification as VerificationResult;
  }
}

