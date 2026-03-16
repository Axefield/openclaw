/**
 * TF-IDF Similarity Engine
 * 
 * Provides local, deterministic similarity calculation without external dependencies.
 * Used as fallback when embeddings are unavailable or for offline operation.
 */

import type { Memory } from '../memory.js';

interface TermFrequency {
  [term: string]: number;
}

interface DocumentVector {
  [term: string]: number;
}

export class TFIDFSimilarityEngine {
  private idfCache: Map<string, number> = new Map();
  private documentCount: number = 0;
  private termDocumentFrequency: Map<string, number> = new Map();

  /**
   * Tokenize text into terms
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 0);
  }

  /**
   * Calculate term frequency for a document
   */
  private calculateTF(terms: string[]): TermFrequency {
    const tf: TermFrequency = {};
    const totalTerms = terms.length;

    for (const term of terms) {
      tf[term] = (tf[term] || 0) + 1;
    }

    // Normalize by document length
    for (const term in tf) {
      tf[term] = tf[term] / totalTerms;
    }

    return tf;
  }

  /**
   * Calculate inverse document frequency for a term
   */
  private calculateIDF(term: string, documentFrequency: number): number {
    if (this.idfCache.has(term)) {
      return this.idfCache.get(term)!;
    }

    if (documentFrequency === 0 || this.documentCount === 0) {
      return 0;
    }

    const idf = Math.log(this.documentCount / documentFrequency);
    this.idfCache.set(term, idf);
    return idf;
  }

  /**
   * Build document vector with TF-IDF weights
   */
  private buildDocumentVector(terms: string[], allTerms: Set<string>): DocumentVector {
    const tf = this.calculateTF(terms);
    const vector: DocumentVector = {};

    for (const term of allTerms) {
      const termFreq = tf[term] || 0;
      const docFreq = this.termDocumentFrequency.get(term) || 0;
      const idf = this.calculateIDF(term, docFreq);
      vector[term] = termFreq * idf;
    }

    return vector;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: DocumentVector, vec2: DocumentVector): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    const allTerms = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);

    for (const term of allTerms) {
      const val1 = vec1[term] || 0;
      const val2 = vec2[term] || 0;
      dotProduct += val1 * val2;
      norm1 += val1 * val1;
      norm2 += val2 * val2;
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    if (denominator === 0) {
      return 0;
    }

    return dotProduct / denominator;
  }

  /**
   * Build corpus statistics from memories
   */
  private buildCorpus(memories: Memory[]): void {
    this.documentCount = memories.length;
    this.termDocumentFrequency.clear();
    this.idfCache.clear();

    // Count document frequency for each term
    for (const memory of memories) {
      const terms = this.tokenize(memory.text);
      const uniqueTerms = new Set(terms);

      for (const term of uniqueTerms) {
        this.termDocumentFrequency.set(
          term,
          (this.termDocumentFrequency.get(term) || 0) + 1
        );
      }
    }
  }

  /**
   * Compute similarity between two texts
   */
  computeSimilarity(text1: string, text2: string): number {
    const terms1 = this.tokenize(text1);
    const terms2 = this.tokenize(text2);

    if (terms1.length === 0 || terms2.length === 0) {
      return 0;
    }

    const allTerms = new Set([...terms1, ...terms2]);
    
    // Build vectors with simple TF (no IDF for single comparison)
    const tf1 = this.calculateTF(terms1);
    const tf2 = this.calculateTF(terms2);

    const vec1: DocumentVector = {};
    const vec2: DocumentVector = {};

    for (const term of allTerms) {
      vec1[term] = tf1[term] || 0;
      vec2[term] = tf2[term] || 0;
    }

    return this.cosineSimilarity(vec1, vec2);
  }

  /**
   * Find similar memories using TF-IDF
   */
  findSimilar(memories: Memory[], query: string, threshold: number = 0.3): Memory[] {
    if (memories.length === 0) {
      return [];
    }

    // Build corpus statistics
    this.buildCorpus(memories);

    const queryTerms = this.tokenize(query);
    const allTerms = new Set<string>();

    // Collect all terms from query and memories
    queryTerms.forEach(term => allTerms.add(term));
    memories.forEach(memory => {
      this.tokenize(memory.text).forEach(term => allTerms.add(term));
    });

    // Build query vector
    const queryVector = this.buildDocumentVector(queryTerms, allTerms);

    // Calculate similarity for each memory
    const results: Array<{ memory: Memory; similarity: number }> = [];

    for (const memory of memories) {
      const memoryTerms = this.tokenize(memory.text);
      const memoryVector = this.buildDocumentVector(memoryTerms, allTerms);
      const similarity = this.cosineSimilarity(queryVector, memoryVector);

      if (similarity >= threshold) {
        results.push({ memory, similarity });
      }
    }

    // Sort by similarity (descending)
    results.sort((a, b) => b.similarity - a.similarity);

    return results.map(r => r.memory);
  }

  /**
   * Clear cache (useful when corpus changes significantly)
   */
  clearCache(): void {
    this.idfCache.clear();
    this.termDocumentFrequency.clear();
    this.documentCount = 0;
  }
}

