/**
 * Backend TF-IDF Service
 * 
 * Provides TF-IDF similarity as fallback
 * This is a placeholder - the actual TF-IDF engine is in the core package
 * and should be accessed via the MCP server or API calls
 */

import type { Memory } from '../../../dist/memory.js';

export class TFIDFService {
  // Placeholder implementation
  // In production, this would call the core TF-IDF engine via API or shared module
  
  computeSimilarity(text1: string, text2: string): number {
    // Simple token-based similarity as fallback
    const tokens1 = new Set(text1.toLowerCase().match(/\b\w+\b/g) || []);
    const tokens2 = new Set(text2.toLowerCase().match(/\b\w+\b/g) || []);
    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  findSimilar(memories: Memory[], query: string, threshold: number = 0.3): Memory[] {
    return memories
      .map(mem => ({ memory: mem, similarity: this.computeSimilarity(mem.text, query) }))
      .filter(result => result.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .map(result => result.memory);
  }

  clearCache(): void {
    // No-op for now
  }
}

