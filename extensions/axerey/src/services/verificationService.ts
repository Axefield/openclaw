/**
 * Verification Service
 *
 * Handles memory verification with:
 * - Calculation verification
 * - Memory-first verification strategy
 * - Connection-based verification (supports/contradicts)
 * - Truth adaptation (steelman/strawman)
 */

import { randomUUID } from "node:crypto";
import type { VSSMemoryStore } from "../memory-vss.js";
import type { VSSRanker } from "../ranker-vss.js";
import type {
  ConnectionService,
  MemoryConnection,
} from "./connectionService.js";
import { cosine } from "../ranker.js";

export interface VerificationOptions {
  forceVerification?: boolean;
  containsCalculations?: boolean;
  useTruthAdaptation?: boolean;
  checkMemoriesFirst?: boolean;
  useGonSearch?: boolean;
  gonSearchProfile?: string;
}

export interface VerificationSource {
  type:
    | "memory"
    | "gon-search"
    | "web-search"
    | "api"
    | "calculation"
    | "steelman"
    | "strawman";
  source: string;
  confidence: number;
  relevance: number;
  supports: boolean;
}

export interface VerifiedCalculation {
  expression: string;
  expected: number;
  actual: number;
  verified: boolean;
}

export interface MemoryMatch {
  memoryId: string;
  similarity: number;
  supports: boolean;
  contradicts: boolean;
  connectionType?: string;
}

export interface TruthAdaptationResult {
  originalClaim: string;
  steelmannedClaim?: string;
  distortions?: string[];
  verificationBasedOn: "original" | "steelmanned";
}

export interface VerificationResult {
  status:
    | "verified"
    | "partially_verified"
    | "unverified"
    | "contradicted"
    | "uncertain";
  confidence: number;
  sources: VerificationSource[];
  verifiedCalculations?: VerifiedCalculation[];
  memoryMatches?: MemoryMatch[];
  truthAdaptation?: TruthAdaptationResult;
  gonSearchResults?: any;
  timestamp: string;
}

export class VerificationService {
  private vssStore: VSSMemoryStore;
  private vssRanker: VSSRanker;
  private connectionService: ConnectionService;
  private getCurrentPersonaId: () => string;

  constructor(
    vssStore: VSSMemoryStore,
    vssRanker: VSSRanker,
    connectionService: ConnectionService,
    getCurrentPersonaId: () => string,
  ) {
    this.vssStore = vssStore;
    this.vssRanker = vssRanker;
    this.connectionService = connectionService;
    this.getCurrentPersonaId = getCurrentPersonaId;
  }

  async verifyMemory(
    memoryId: string,
    options: VerificationOptions = {},
  ): Promise<VerificationResult> {
    const memory = await this.vssStore.get(memoryId);

    const verificationResult: VerificationResult = {
      status: "unverified",
      confidence: 0.5,
      sources: [],
      timestamp: new Date().toISOString(),
    };

    if (
      options.containsCalculations ||
      /\d+\s*[\+\-\*\/]\s*\d+\s*=/.test(memory.text)
    ) {
      const calcResult = this.verifyCalculations(memory.text);
      verificationResult.verifiedCalculations = calcResult.calculations;

      if (calcResult.allVerified) {
        verificationResult.status = "verified";
        verificationResult.confidence = 0.9;
        verificationResult.sources.push({
          type: "calculation",
          source: "internal",
          confidence: 0.9,
          relevance: 1.0,
          supports: true,
        });
      }
    }

    if (options.checkMemoriesFirst !== false) {
      const memoryResult = await this.verifyAgainstMemories(memoryId, memory);
      verificationResult.memoryMatches = memoryResult.matches;

      if (memoryResult.hasContradiction) {
        verificationResult.status = "contradicted";
        verificationResult.confidence = 0.3;
        verificationResult.sources.push({
          type: "memory",
          source: "memory-connections",
          confidence: 0.3,
          relevance: 1.0,
          supports: false,
        });
      } else if (memoryResult.hasSupport) {
        verificationResult.status = "verified";
        verificationResult.confidence = Math.max(
          verificationResult.confidence,
          0.7,
        );
        verificationResult.sources.push({
          type: "memory",
          source: "memory-connections",
          confidence: 0.7,
          relevance: 1.0,
          supports: true,
        });
      }
    }

    await this.storeVerification(memoryId, verificationResult);
    await this.updateMemoryFeatures(memoryId, verificationResult);

    return verificationResult;
  }

  private verifyCalculations(text: string): {
    calculations: VerifiedCalculation[];
    allVerified: boolean;
  } {
    const calcMatches = text.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)\s*=\s*(\d+)/g);
    if (!calcMatches) {
      return { calculations: [], allVerified: false };
    }

    const calculations: VerifiedCalculation[] = [];
    for (const calc of calcMatches) {
      const match = calc.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)\s*=\s*(\d+)/);
      if (match) {
        const [, a, op, b, expected] = match;
        const actual = this.evaluateExpression(parseInt(a), op, parseInt(b));
        calculations.push({
          expression: calc,
          expected: parseInt(expected),
          actual,
          verified: actual === parseInt(expected),
        });
      }
    }

    return {
      calculations,
      allVerified:
        calculations.length > 0 && calculations.every((c) => c.verified),
    };
  }

  private evaluateExpression(a: number, op: string, b: number): number {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        return a / b;
      default:
        return 0;
    }
  }

  private async verifyAgainstMemories(
    memoryId: string,
    memory: any,
  ): Promise<{
    matches: MemoryMatch[];
    hasContradiction: boolean;
    hasSupport: boolean;
  }> {
    const similarMemories = await this.vssRanker.search(
      memory.text,
      memory.embedding,
      { limit: 5 },
    );
    const matches: MemoryMatch[] = [];
    let hasContradiction = false;
    let hasSupport = false;

    for (const similar of similarMemories) {
      if (similar.id === memoryId) continue;

      const currentPersonaId = this.getCurrentPersonaId();
      const connections = this.connectionService.getConnections(
        similar.id,
        currentPersonaId,
      );

      const contradicts = connections.find(
        (c) =>
          c.connectionType === "contradicts" &&
          (c.sourceId === memoryId || c.targetId === memoryId),
      );
      const supports = connections.find(
        (c) =>
          c.connectionType === "supports" &&
          (c.sourceId === memoryId || c.targetId === memoryId),
      );

      const similarity =
        (similar as any).similarity ||
        cosine(memory.embedding, similar.embedding);

      matches.push({
        memoryId: similar.id,
        similarity,
        supports: !!supports,
        contradicts: !!contradicts,
        connectionType: contradicts
          ? "contradicts"
          : supports
            ? "supports"
            : undefined,
      });

      if (contradicts) hasContradiction = true;
      if (supports) hasSupport = true;
    }

    return { matches, hasContradiction, hasSupport };
  }

  private async storeVerification(
    memoryId: string,
    result: VerificationResult,
  ): Promise<void> {
    const verificationId = randomUUID();
    this.vssStore.db
      .prepare(
        `INSERT INTO memory_verifications (id, memory_id, status, confidence, sources, verified_calculations, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        verificationId,
        memoryId,
        result.status,
        result.confidence,
        JSON.stringify(result.sources),
        JSON.stringify(result.verifiedCalculations || []),
        Date.now(),
      );
  }

  private async updateMemoryFeatures(
    memoryId: string,
    result: VerificationResult,
  ): Promise<void> {
    const memory = await this.vssStore.get(memoryId);
    await this.vssStore.updateFeatures(memoryId, {
      ...memory.features,
      verification: result,
    });
  }

  async getVerification(memoryId: string): Promise<VerificationResult | null> {
    const row = this.vssStore.db
      .prepare(
        "SELECT * FROM memory_verifications WHERE memory_id = ? ORDER BY timestamp DESC LIMIT 1",
      )
      .get(memoryId) as any;

    if (!row) return null;

    return {
      status: row.status as VerificationResult["status"],
      confidence: row.confidence,
      sources: JSON.parse(row.sources || "[]"),
      verifiedCalculations: JSON.parse(row.verified_calculations || "[]"),
      timestamp: new Date(row.timestamp).toISOString(),
    };
  }
}
