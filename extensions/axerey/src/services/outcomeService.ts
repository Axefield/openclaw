/**
 * Unified Outcome Service
 * 
 * Centralizes outcome tracking across memories, connections, reasoning steps, and context.
 * Supports persona-aware outcome tracking with strict isolation.
 */

import type { Memory } from '../memory.js';
import type { AdaptiveRanker } from '../adaptive-ranker.js';
import type { ConnectionService } from './connectionService.js';
import type { VSSMemoryStore } from '../memory-vss.js';

export interface OutcomeDetails {
  personaId: string;  // REQUIRED - persona for outcome tracking
  memoryIds: string[];
  reasoningStepIds?: string[];
  score?: number;
  helpful?: boolean;
}

export type GetPersonaRankerFn = (personaId: string) => AdaptiveRanker;

export class OutcomeService {
  private getPersonaRanker: GetPersonaRankerFn;
  private connectionService: ConnectionService;
  private vssStore: VSSMemoryStore;

  constructor(
    getPersonaRanker: GetPersonaRankerFn,
    connectionService: ConnectionService,
    vssStore: VSSMemoryStore
  ) {
    this.getPersonaRanker = getPersonaRanker;
    this.connectionService = connectionService;
    this.vssStore = vssStore;
  }

  /**
   * Record outcome for a context, updating all related systems
   */
  async recordOutcome(
    contextId: string,
    outcome: 'win' | 'loss' | 'breakeven',
    details: OutcomeDetails
  ): Promise<void> {
    // 1. Update persona-specific AdaptiveRanker
    const personaRanker = this.getPersonaRanker(details.personaId);
    personaRanker.updateOutcome(contextId, outcome, details.helpful);

    // 2. Update memory outcomes
    for (const memId of details.memoryIds) {
      const mem = await this.vssStore.get(memId);
      if (mem) {
        const outcomeValue: 'success' | 'failure' | 'neutral' = 
          outcome === 'win' ? 'success' : outcome === 'loss' ? 'failure' : 'neutral';
        
        // Update outcome and score
        await this.vssStore.updateOutcome(memId, outcomeValue, details.score);
        
        // Update helpful if provided
        if (details.helpful !== undefined) {
          await this.vssStore.updateHelpful(memId, details.helpful);
        }
      }
    }

    // 3. Propagate to connected memories (within persona)
    await this.propagateOutcomeToConnections(details.memoryIds, outcome, details.personaId);

    // 4. Update reasoning steps (if provided)
    if (details.reasoningStepIds && details.reasoningStepIds.length > 0) {
      await this.updateReasoningStepOutcomes(details.reasoningStepIds, outcome);
    }
  }

  /**
   * Propagate outcome boosts to connected memories
   * Only propagates within the same persona (strict isolation)
   */
  private async propagateOutcomeToConnections(
    memoryIds: string[],
    outcome: 'win' | 'loss' | 'breakeven',
    personaId: string
  ): Promise<void> {
    const personaTag = `persona:${personaId}`;

    for (const memId of memoryIds) {
      // Get connections for this memory (will be filtered by persona in connectionService)
      const connections = this.connectionService.getConnections(memId);

      for (const conn of connections) {
        const connectedId = conn.sourceId === memId ? conn.targetId : conn.sourceId;
        const connectedMem = await this.vssStore.get(connectedId);

        // Verify persona isolation - both memories must have the persona tag
        if (!connectedMem) continue;
        if (!connectedMem.tags.includes(personaTag)) continue;

        // Calculate connection-based boost
        const boost = this.calculateConnectionBoost(conn, outcome);

        // Update the connected memory's outcome boost via persona-specific adaptive ranker
        // This is done by tracking the outcome for the connected memory
        if (boost !== 0) {
          // Create a synthetic context ID for the connected memory
          const connectedContextId = `connected_${memId}_${connectedId}`;
          const connectedOutcome: 'win' | 'loss' | 'breakeven' = 
            boost > 0 ? 'win' : boost < 0 ? 'loss' : 'breakeven';
          
          // Track this as a connected outcome using persona-specific ranker
          const personaRanker = this.getPersonaRanker(personaId);
          personaRanker.trackContext(connectedContextId, [connectedId]);
          personaRanker.updateOutcome(connectedContextId, connectedOutcome);
        }
      }
    }
  }

  /**
   * Calculate connection-based boost based on connection type and outcome
   */
  private calculateConnectionBoost(
    connection: { connectionType: string; strength: number },
    outcome: 'win' | 'loss' | 'breakeven'
  ): number {
    const { connectionType, strength } = connection;
    const baseBoost = outcome === 'win' ? 0.1 : outcome === 'loss' ? -0.05 : 0;

    // Connection type determines boost direction and magnitude
    const typeMultipliers: Record<string, number> = {
      'supports': 1.0,      // Full propagation
      'derives': 0.9,       // Strong propagation
      'exemplifies': 0.8,   // Good propagation
      'extends': 0.8,       // Good propagation
      'applies': 0.7,       // Moderate propagation
      'associates': 0.6,    // Moderate propagation
      'refines': 0.5,       // Limited propagation
      'generalizes': 0.5,   // Limited propagation
      'analyzes': 0.4,      // Limited propagation
      'synthesizes': 0.4,    // Limited propagation
      'contradicts': -0.3,  // Negative propagation (contradiction is valuable context)
      'questions': 0.2      // Minimal propagation
    };

    const multiplier = typeMultipliers[connectionType] || 0.5;
    return baseBoost * multiplier * strength; // Scale by connection strength
  }

  /**
   * Update reasoning step outcomes
   */
  private async updateReasoningStepOutcomes(
    reasoningStepIds: string[],
    outcome: 'win' | 'loss' | 'breakeven'
  ): Promise<void> {
    // Reasoning steps are stored in the database
    // We'll need to update them via the reasoning service
    // For now, this is a placeholder - will be implemented when reasoning service is integrated
    // The reasoning steps should be updated to reflect the outcome
    console.error(`Updating reasoning steps ${reasoningStepIds.join(', ')} with outcome: ${outcome}`);
  }
}


