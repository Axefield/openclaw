/**
 * Backend Verification Service
 * 
 * Handles verification workflows for memories
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { getDatabase } from './database.js';

export interface VerificationResult {
  status: 'verified' | 'partially_verified' | 'unverified' | 'contradicted' | 'uncertain';
  confidence: number;
  sources: Array<{
    type: 'memory' | 'gon-search' | 'web-search' | 'api' | 'calculation' | 'steelman' | 'strawman';
    source: string;
    confidence: number;
    relevance: number;
    supports: boolean;
  }>;
  verifiedCalculations?: Array<{
    expression: string;
    expected: number;
    actual: number;
    verified: boolean;
  }>;
  truthAdaptation?: {
    originalClaim: string;
    steelmannedClaim?: string;
    distortions?: string[];
    verificationBasedOn: 'original' | 'steelmanned';
  };
  memoryMatches?: Array<{
    memoryId: string;
    similarity: number;
    supports: boolean;
    connectionType?: string;
  }>;
  gonSearchResults?: {
    query: string;
    results: Array<{
      title: string;
      url: string;
      snippet: string;
      relevance: number;
    }>;
    ragContext?: string;
  };
  timestamp: string;
}

export class VerificationService {
  private db: Database.Database;
  private userId?: string;
  private gonSearchUrl: string;

  constructor(userId?: string) {
    const dbService = getDatabase();
    this.db = (dbService as any).db;
    this.userId = userId;
    this.gonSearchUrl = process.env.GON_SEARCH_URL || 'http://localhost:7991';
  }

  private getTableName(baseName: string): string {
    if (this.userId) {
      return `user_${this.userId}_${baseName}`;
    }
    return baseName;
  }

  async verifyMemory(
    memoryId: string,
    options: {
      forceVerification?: boolean;
      containsCalculations?: boolean;
      useTruthAdaptation?: boolean;
      checkMemoriesFirst?: boolean;
      useGonSearch?: boolean;
      gonSearchProfile?: string;
    } = {}
  ): Promise<VerificationResult> {
    // Get memory (would need memory service)
    // For now, return basic structure
    
    const verificationResult: VerificationResult = {
      status: 'unverified',
      confidence: 0.5,
      sources: [],
      timestamp: new Date().toISOString()
    };

    // Store verification
    const verificationId = randomUUID();
    const tableName = this.getTableName('memory_verifications');
    this.db.prepare(`
      INSERT INTO ${tableName} 
      (id, memory_id, status, confidence, sources, verified_calculations, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      verificationId,
      memoryId,
      verificationResult.status,
      verificationResult.confidence,
      JSON.stringify(verificationResult.sources),
      JSON.stringify(verificationResult.verifiedCalculations || []),
      Date.now()
    );

    return verificationResult;
  }

  async getVerification(memoryId: string): Promise<VerificationResult | null> {
    const tableName = this.getTableName('memory_verifications');
    const row = this.db
      .prepare(`SELECT * FROM ${tableName} WHERE memory_id = ? ORDER BY timestamp DESC LIMIT 1`)
      .get(memoryId) as any;

    if (!row) {
      return null;
    }

    return {
      status: row.status as VerificationResult['status'],
      confidence: row.confidence,
      sources: JSON.parse(row.sources || '[]'),
      verifiedCalculations: JSON.parse(row.verified_calculations || '[]'),
      timestamp: new Date(row.timestamp).toISOString()
    };
  }

  async searchGonSearch(query: string, profile: string = 'GENERIC'): Promise<any> {
    try {
      const response = await fetch(`${this.gonSearchUrl}/api/search?q=${encodeURIComponent(query)}&profile=${profile}`);
      if (!response.ok) {
        throw new Error(`Gon-Search API error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Gon-Search error:', error);
      return null;
    }
  }
}

