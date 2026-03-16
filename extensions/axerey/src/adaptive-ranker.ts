import type { Memory } from "./memory.js";
import { cosine } from "./ranker.js";
import type { ConnectionService } from "./services/connectionService.js";
import type { QualityService } from "./services/qualityService.js";

export interface RankingWeights {
  similarity: number;
  recency: number;
  importance: number;
  usage: number;
  pin: number;
  helpful: number;
}

export interface ContextOutcome {
  contextId: string;
  memoryIds: string[];
  outcome: 'win' | 'loss' | 'breakeven' | null;
  helpful: boolean | null;
  timestamp: number;
}

export class AdaptiveRanker {
  private weights: RankingWeights = {
    similarity: 0.6,
    recency: 0.2,
    importance: 0.15,
    usage: 0.05,
    pin: 0.3,
    helpful: 0.1
  };
  
  private contextOutcomes: ContextOutcome[] = [];
  private taskKValues: { [key: string]: number } = {
    'planning': 5,
    'execution': 3,
    'review': 4
  };
  
  // Optional services for enhanced ranking
  private connectionService?: ConnectionService;
  private qualityService?: QualityService;
  private personaId?: string;
  
  setServices(connectionService?: ConnectionService, qualityService?: QualityService, personaId?: string) {
    this.connectionService = connectionService;
    this.qualityService = qualityService;
    this.personaId = personaId;
  }

  // Track context served and outcomes
  trackContext(contextId: string, memoryIds: string[]) {
    this.contextOutcomes.push({
      contextId,
      memoryIds,
      outcome: null,
      helpful: null,
      timestamp: Date.now()
    });
  }

  // Update outcome for a context
  updateOutcome(contextId: string, outcome: 'win' | 'loss' | 'breakeven', helpful?: boolean) {
    const context = this.contextOutcomes.find(c => c.contextId === contextId);
    if (context) {
      context.outcome = outcome;
      if (helpful !== undefined) {
        context.helpful = helpful;
      }
    }
  }

  // Adaptive ranking with outcome-based learning, connections, verification, and quality
  async rankResults(items: Memory[], qVec: number[], task?: string): Promise<Memory[]> {
    const now = Date.now();
    
    const scoredItems = await Promise.all(items.map(async (m) => {
      const sim = cosine(m.embedding, qVec);
      const ageDays = (now - m.createdAt) / (1000 * 60 * 60 * 24);
      const recency = Math.exp(-ageDays / 30); // half-life ~20.8 days
      const importance = m.importance;
      const usageBoost = Math.min(m.usage / 10, 0.2);
      const pinBoost = m.pinned ? this.weights.pin : 0;
      const helpfulBoost = m.helpful === true ? this.weights.helpful : 
                           m.helpful === false ? -this.weights.helpful : 0;

      // Calculate outcome-based boost
      const outcomeBoost = this.calculateOutcomeBoost(m.id);
      
      // Calculate connection-based boost (if connection service available)
      const connectionBoost = await this.calculateConnectionBoost(m.id);
      
      // Calculate verification and quality boosts (if quality service available)
      const verificationBoost = this.getVerificationBoost(m);
      const qualityBoost = await this.getQualityBoost(m);

      const score = 
        this.weights.similarity * sim + 
        this.weights.recency * recency + 
        this.weights.importance * importance + 
        this.weights.usage * usageBoost + 
        pinBoost + 
        helpfulBoost +
        outcomeBoost +
        connectionBoost +
        verificationBoost +
        qualityBoost;

      return { ...m, _score: score } as any;
    }));
    
    return scoredItems.sort((a, b) => b._score - a._score);
  }
  
  // Calculate connection-based boost
  private async calculateConnectionBoost(memoryId: string): Promise<number> {
    if (!this.connectionService || !this.personaId) return 0;
    
    // Get connections for this memory (persona-filtered)
    const connections = this.connectionService.getConnections(memoryId, this.personaId);
    if (connections.length === 0) return 0;
    
    // Calculate boost based on connected memories' outcome history
    let totalBoost = 0;
    for (const conn of connections) {
      const connectedId = conn.sourceId === memoryId ? conn.targetId : conn.sourceId;
      const connectedBoost = this.calculateOutcomeBoost(connectedId);
      
      // Scale by connection strength and type
      const typeMultipliers: Record<string, number> = {
        'supports': 0.8,
        'derives': 0.7,
        'exemplifies': 0.6,
        'associates': 0.4,
        'contradicts': -0.2, // Contradictions provide context but reduce confidence
        'questions': 0.2
      };
      
      const multiplier = typeMultipliers[conn.connectionType] || 0.5;
      totalBoost += connectedBoost * multiplier * conn.strength;
    }
    
    // Normalize by number of connections (cap at 0.2)
    return Math.min(totalBoost / Math.max(connections.length, 1), 0.2);
  }
  
  // Get verification boost
  private getVerificationBoost(memory: Memory): number {
    const verification = memory.features?.verification;
    if (!verification) return 0;
    
    const status = verification.status;
    if (status === 'verified') return 0.15;
    if (status === 'partially_verified') return 0.08;
    if (status === 'contradicted') return -0.1;
    return 0;
  }
  
  // Get quality boost
  private async getQualityBoost(memory: Memory): Promise<number> {
    if (!this.qualityService) return 0;
    
    try {
      const quality = await this.qualityService.getMemoryQuality(memory.id);
      if (!quality) return 0;
      
      if (quality.reliabilityScore > 0.8) return 0.1;
      if (quality.reliabilityScore < 0.4) return -0.05;
      return 0;
    } catch {
      return 0;
    }
  }

  // Calculate boost based on historical outcomes
  private calculateOutcomeBoost(memoryId: string): number {
    const relevantContexts = this.contextOutcomes.filter(c => 
      c.memoryIds.includes(memoryId) && c.outcome !== null
    );

    if (relevantContexts.length === 0) return 0;

    const wins = relevantContexts.filter(c => c.outcome === 'win').length;
    const losses = relevantContexts.filter(c => c.outcome === 'loss').length;
    const total = relevantContexts.length;

    if (total < 2) return 0; // Need at least 2 data points

    const winRate = wins / total;
    const confidence = Math.max(wins, losses) / total;

    // Boost memories that consistently lead to wins
    if (winRate > 0.6 && confidence > 0.7) {
      return 0.2; // Strong positive boost
    } else if (winRate > 0.5 && confidence > 0.6) {
      return 0.1; // Moderate positive boost
    } else if (winRate < 0.4 && confidence > 0.7) {
      return -0.1; // Negative boost for consistently bad outcomes
    }

    return 0;
  }

  // Learn optimal k values for each task using multi-armed bandit
  learnOptimalK(task: string, k: number, outcome: 'win' | 'loss' | 'breakeven') {
    const currentK = this.taskKValues[task] || 5;
    
    // Simple epsilon-greedy approach
    const epsilon = 0.1;
    if (Math.random() < epsilon) {
      // Explore: try different k values
      this.taskKValues[task] = Math.max(1, Math.min(20, k + (Math.random() - 0.5) * 2));
    } else {
      // Exploit: adjust based on outcome
      if (outcome === 'win') {
        // If we won, maybe we need more context (increase k)
        this.taskKValues[task] = Math.min(20, currentK + 1);
      } else if (outcome === 'loss') {
        // If we lost, maybe we had too much noise (decrease k)
        this.taskKValues[task] = Math.max(1, currentK - 1);
      }
    }
  }

  // Periodically retrain weights based on outcomes
  retrainWeights() {
    if (this.contextOutcomes.length < 10) return; // Need sufficient data

    const recentOutcomes = this.contextOutcomes
      .filter(c => c.outcome !== null && Date.now() - c.timestamp < 30 * 24 * 60 * 60 * 1000) // Last 30 days
      .slice(-100); // Last 100 outcomes

    if (recentOutcomes.length < 20) return;

    // Simple logistic regression-inspired weight adjustment
    const wins = recentOutcomes.filter(c => c.outcome === 'win').length;
    const winRate = wins / recentOutcomes.length;

    // Adjust weights based on overall performance
    if (winRate > 0.6) {
      // We're doing well, increase importance of similarity and helpfulness
      this.weights.similarity = Math.min(0.8, this.weights.similarity + 0.05);
      this.weights.helpful = Math.min(0.2, this.weights.helpful + 0.02);
    } else if (winRate < 0.4) {
      // We're struggling, increase importance of recency and importance
      this.weights.recency = Math.min(0.3, this.weights.recency + 0.05);
      this.weights.importance = Math.min(0.25, this.weights.importance + 0.05);
    }

    // Normalize weights
    const total = Object.values(this.weights).reduce((sum, w) => sum + w, 0);
    Object.keys(this.weights).forEach(key => {
      this.weights[key as keyof RankingWeights] /= total;
    });
  }

  // Get optimal k for a task
  getOptimalK(task: string): number {
    return this.taskKValues[task] || 5;
  }

  // Get current weights for debugging
  getWeights(): RankingWeights {
    return { ...this.weights };
  }

  // Set weights (for persona-specific configuration)
  setWeights(weights: Partial<RankingWeights>): void {
    this.weights = { ...this.weights, ...weights };
  }

  // Set task k values (for persona-specific configuration)
  setTaskKValues(taskKValues: { [key: string]: number }): void {
    this.taskKValues = { ...this.taskKValues, ...taskKValues };
  }

  // Get performance metrics
  getPerformanceMetrics() {
    const recentOutcomes = this.contextOutcomes
      .filter(c => c.outcome !== null && Date.now() - c.timestamp < 7 * 24 * 60 * 60 * 1000) // Last 7 days
      .slice(-50); // Last 50 outcomes

    if (recentOutcomes.length === 0) {
      return { winRate: 0, totalContexts: 0, avgHelpfulness: 0 };
    }

    const wins = recentOutcomes.filter(c => c.outcome === 'win').length;
    const helpful = recentOutcomes.filter(c => c.helpful === true).length;
    const totalHelpful = recentOutcomes.filter(c => c.helpful !== null).length;

    return {
      winRate: wins / recentOutcomes.length,
      totalContexts: recentOutcomes.length,
      avgHelpfulness: totalHelpful > 0 ? helpful / totalHelpful : 0,
      taskKValues: { ...this.taskKValues }
    };
  }

  // Clean up old context outcomes
  cleanup() {
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000; // 90 days
    this.contextOutcomes = this.contextOutcomes.filter(c => c.timestamp > cutoff);
  }
}
