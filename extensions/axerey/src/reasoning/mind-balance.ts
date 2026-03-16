/**
 * MCP Mind Balance Tool - Angel/Demon Advisory System
 * 
 * This tool implements the conceptual model from the "MCP Mind Balance White Paper":
 * - Phase-Sensitive Modeling: Theta and phi angles encode cognitive rhythm and timing
 * - Nonlinear Dynamics: Tangent growth captures escalating urgency or emotional pull
 * - Clamp Control: Safety mechanisms prevent infinite or runaway values
 * - Explainability: Returns angel/demon signals and blended score with rationale
 * - Transport-Agnostic: Fully compatible with MCP tools/call over JSON-RPC 2.0
 * 
 * The cosine term represents stable, harmonizing, or ethically grounded advice,
 * while the tangent term captures destabilizing, urgent, or risky impulses.
 * Together, they form a weighted vector field that produces a blended decision score.
 */

import { MCPCommand, MCPTool } from '../core/mcp-command.js';
import { secureConfigManager } from '../config/secure-manager.js';

// ---- Angel/Demon Model Domain (per White Paper) ----
export type AdvisoryMode = 'angel' | 'demon' | 'blend' | 'probabilistic';

/**
 * Advisor Weights - Parametric Advisory Model
 * The cosine term represents stable, harmonizing, or ethically grounded advice
 * The tangent term captures destabilizing, urgent, or risky impulses
 */
export interface AdvisorWeights {
  /** Angel influence ∝ cos(theta). Range [-1, 1] for stable, harmonizing advice. */
  cosine: number;
  /** Demon influence ∝ tan(phi). Captures escalating urgency or emotional pull. */
  tangent: number;
}

/**
 * Phase-Sensitive Modeling - Cognitive Rhythm and Timing
 * Theta and phi angles encode the cognitive rhythm and timing of decision-making
 */
export interface PhaseInputs {
  /** Angel phase angle (radians) for cos component - stable, ethical grounding. */
  theta: number;
  /** Demon phase angle (radians) for tan component - urgent, risky impulses (avoid ±π/2). */
  phi: number;
}

/**
 * Mental Context - Decision Space Context
 * Free-form context and tags to steer interpretation of the advisory forces
 */
export interface MentalContext {
  /** Free-form context (prompt) for the decision - the core question or situation. */
  topic: string;
  /** Optional tags to steer interpretation (risk, ethics, speed, creativity, etc.). */
  tags?: string[];
}

/**
 * Scoring Configuration - Proper Scoring Rules and Abstention
 */
export interface ScoringConfig {
  /** Scoring rules to apply (brier, log) */
  rules?: ('brier' | 'log')[];
  /** Abstention threshold [0,1] - confidence below this triggers abstention */
  abstainThreshold?: number;
  /** Score for abstention (null = no score) */
  abstentionScore?: number | null;
}

/**
 * Mind Balance Arguments - Weighted Vector Field Input
 * Forms a parametric advisory model where two primary forces influence decision space
 */
export interface MindBalanceArgs extends AdvisorWeights, PhaseInputs, MentalContext {
  /** How to combine advisors - angel-only, demon-only, blended, or probabilistic decision. */
  mode: AdvisoryMode;
  /** Clamp Control: Safety clamp for tan() to prevent infinite or runaway values. */
  tanClamp?: number;
  /** Optional normalization across signals for consistent scaling. */
  normalize?: boolean;
  /** Scoring configuration for probabilistic mode */
  scoring?: ScoringConfig;
}

/**
 * Mind Balance Advice - Explainable Decision Output
 * Returns angel/demon signals and blended score with rationale for explainability
 */
export interface MindBalanceAdvice {
  /** The original decision context */
  topic: string;
  /** Angel signal: evaluated cos(theta) * cosine - stable, ethical advice */
  angelSignal: number;
  /** Demon signal: clamped tan(phi) * tangent - urgent, risky impulses */
  demonSignal: number;
  /** Advisory mode used for combination */
  mode: AdvisoryMode;
  /** Probability of positive decision (for probabilistic mode) */
  pPositive: number;
  /** Probability of negative decision (for probabilistic mode) */
  pNegative: number;
  /** Decision: positive, negative, or abstain */
  decision: 'positive' | 'negative' | 'abstain';
  /** Confidence level (max of pPositive, pNegative) */
  confidence: number;
  /** Proper scoring results (brier, log) */
  scores?: { brier?: number; log?: number };
  /** Explainable rationale string describing the decision process */
  rationale: string;
  /** Complete metadata for reproducibility and analysis */
  metadata: {
    theta: number;
    phi: number;
    cosine: number;
    tangent: number;
    tanClamp: number;
    normalized: boolean;
  };
}

/**
 * JSON Schema - Phase-Sensitive Modeling with Clamp Control
 * Implements the white paper's conceptual model with strong typing and safety mechanisms
 */
export const MindBalanceSchema = {
  type: 'object',
  required: ['topic', 'theta', 'phi', 'cosine', 'tangent', 'mode'],
  properties: {
    topic: { 
      type: 'string', 
      minLength: 1, 
      description: 'Decision context - the core question or situation requiring advisory input' 
    },
    tags: { 
      type: 'array', 
      items: { type: 'string' },
      description: 'Optional tags to steer interpretation (risk, ethics, speed, creativity, etc.)'
    },
    theta: { 
      type: 'number', 
      description: 'Angel phase angle (radians) for cos() - stable, ethical grounding',
      minimum: -Math.PI,
      maximum: Math.PI
    },
    phi: {
      type: 'number',
      description: 'Demon phase angle (radians) for tan() - urgent, risky impulses (avoid ±π/2)',
      minimum: -Math.PI/2 + 0.1,
      maximum: Math.PI/2 - 0.1
    },
    cosine: {
      type: 'number',
      minimum: -1,
      maximum: 1,
      description: 'Angel weight [-1, 1] - stable, harmonizing, ethically grounded advice',
    },
    tangent: {
      type: 'number',
      description: 'Demon weight - captures destabilizing, urgent, or risky impulses',
    },
    mode: { 
      type: 'string', 
      enum: ['angel', 'demon', 'blend', 'probabilistic'],
      description: 'Advisory combination mode - angel-only, demon-only, blended, or probabilistic decision'
    },
    tanClamp: {
      type: 'number',
      default: 3.0,
      minimum: 0.1,
      maximum: 10.0,
      description: 'Clamp Control: Safety clamp for |tan(phi)| to prevent infinite or runaway values',
    },
    normalize: {
      type: 'boolean',
      default: true,
      description: 'Normalize angel/demon signals before blending for consistent scaling',
    },
    scoring: {
      type: 'object',
      properties: {
        rules: { 
          type: 'array', 
          items: { type: 'string', enum: ['brier', 'log'] },
          description: 'Scoring rules to apply (brier, log)'
        },
        abstainThreshold: { 
          type: 'number', 
          minimum: 0, 
          maximum: 1, 
          default: 0.70,
          description: 'Abstention threshold [0,1] - confidence below this triggers abstention'
        },
        abstentionScore: { 
          type: ['number', 'null'],
          description: 'Score for abstention (null = no score)'
        }
      },
      additionalProperties: false,
      description: 'Scoring configuration for probabilistic mode'
    },
  },
  additionalProperties: false,
} as const;

/**
 * Mind Balance Command - Client-side tool for building requests
 */
export class MindBalanceCommand extends MCPCommand<MindBalanceArgs, MindBalanceAdvice> {
  static override readonly name = 'mind.balance';

  // Expose the tool definition you'd register on an MCP server
  static toolDefinition = {
    name: MindBalanceCommand.name,
    description:
      "Balances 'angel (cosine)' and 'demon (tangent)' advisors; returns calibrated probabilities with abstention.",
    inputSchema: MindBalanceSchema,
  };

  constructor() {
    super(MindBalanceCommand.name);
  }
}

/**
 * Mind Balance Tool - Server-side implementation
 */
export class MindBalanceTool extends MCPTool<MindBalanceArgs, MindBalanceAdvice> {
  readonly name = 'mind.balance';
  readonly description =
    "Balances 'angel (cosine)' and 'demon (tangent)' advisors; returns calibrated probabilities with abstention.";
  readonly inputSchema = MindBalanceSchema;

  async execute(args: MindBalanceArgs): Promise<MindBalanceAdvice> {
    const {
      topic,
      tags = [],
      theta,
      phi,
      cosine,
      tangent,
      mode,
      tanClamp,
      normalize,
      scoring,
    } = args;

    // Get configuration values with secure precision
    const mindBalanceConfig = secureConfigManager.getMindBalanceConfig();
    const finalTanClamp = tanClamp ?? mindBalanceConfig.tanClamp ?? 3.0;
    const finalNormalize = normalize ?? mindBalanceConfig.normalize ?? true;
    const finalScoring = scoring ?? mindBalanceConfig.scoring;

    // Validate inputs
    this.validateInputs(args);

    // Calculate angel signal: cos(theta) * cosine
    const cosVal = Math.cos(theta) * cosine;

    // Calculate demon signal: clamped tan(phi) * tangent
    const tanVal = this.clampMag(Math.tan(phi), finalTanClamp) * tangent;

    // Calculate raw score with optional normalization
    const raw = finalNormalize ? this.zBlend(cosVal, tanVal) : (cosVal - tanVal);
    const pPositive = this.logistic(raw);
    const pNegative = 1 - pPositive;

    // Determine abstention threshold
    const defaultT = mindBalanceConfig.abstainThreshold ?? 0.70;
    const abstainThreshold = (finalScoring as any)?.abstainThreshold ?? (mode === 'probabilistic' ? defaultT : 1.01);
    const confidence = Math.max(pPositive, pNegative);
    const abstain = confidence < abstainThreshold;

    // Make decision
    const decision = abstain ? 'abstain' : (pPositive >= 0.5 ? 'positive' : 'negative');

    // Calculate proper scores if requested
    const want = finalScoring?.rules ?? ['brier', 'log'];
    const scores: { brier?: number; log?: number } = {};
    if (want.includes('brier')) {
      scores.brier = abstain ? (finalScoring?.abstentionScore ?? 0.0) : 0.0;
    }
    if (want.includes('log')) {
      scores.log = abstain ? (finalScoring?.abstentionScore ?? 0.0) : 0.0;
    }

    // Generate rationale
    const rationale = this.generateRationale({
      topic,
      tags,
      angelSignal: cosVal,
      demonSignal: tanVal,
      mode,
      pPositive,
      pNegative,
      decision,
      confidence,
      abstainThreshold,
      theta,
      phi,
      tanClamp: finalTanClamp,
      normalize: finalNormalize,
    });

    const result: MindBalanceAdvice = {
      topic,
      angelSignal: cosVal,
      demonSignal: tanVal,
      mode,
      pPositive,
      pNegative,
      decision,
      confidence,
      rationale,
      metadata: {
        theta,
        phi,
        cosine,
        tangent,
        tanClamp: finalTanClamp,
        normalized: finalNormalize,
      },
    };

    if (Object.keys(scores).length > 0) {
      result.scores = scores;
    }

    return result;
  }

  private validateInputs(args: MindBalanceArgs): void {
    if (Math.abs(args.cosine) > 1) {
      throw new Error('Cosine weight must be in range [-1, 1]');
    }

    if (Math.abs(args.phi) >= Math.PI / 2) {
      throw new Error('Phi must be in range (-π/2, π/2) to avoid tan() singularities');
    }

    if (args.tanClamp && args.tanClamp <= 0) {
      throw new Error('tanClamp must be positive');
    }
  }

  /**
   * Clamp magnitude to prevent infinite or runaway values
   */
  private clampMag(x: number, m: number): number {
    return Math.sign(x) * Math.min(Math.abs(x), m);
  }

  /**
   * Logistic function for probability conversion
   */
  private logistic(z: number): number {
    return 1 / (1 + Math.exp(-z));
  }

  /**
   * Z-score blending for normalization
   */
  private zBlend(a: number, b: number): number {
    const μ = (Math.abs(a) + Math.abs(b)) / 2 || 1e-9;
    return (a - b) / (μ * 2);
  }

  /**
   * Generate Explainable Rationale - White Paper Conceptual Model
   * Provides detailed explanation of the weighted vector field decision process
   */
  private generateRationale(params: {
    topic: string;
    tags: string[];
    angelSignal: number;
    demonSignal: number;
    mode: AdvisoryMode;
    pPositive: number;
    pNegative: number;
    decision: 'positive' | 'negative' | 'abstain';
    confidence: number;
    abstainThreshold: number;
    theta: number;
    phi: number;
    tanClamp: number;
    normalize: boolean;
  }): string {
    const { 
      topic, tags, angelSignal, demonSignal, mode, pPositive, pNegative, 
      decision, confidence, abstainThreshold, theta, phi, tanClamp, normalize 
    } = params;

    const angelStrength = Math.abs(angelSignal);
    const demonStrength = Math.abs(demonSignal);
    const angelDirection = angelSignal > 0 ? 'positive' : 'negative';
    const demonDirection = demonSignal > 0 ? 'positive' : 'negative';

    let rationale = `Mind Balance Analysis for "${topic}": `;

    // Angel Analysis - Stable, Harmonizing, Ethically Grounded
    const angelSig = typeof angelSignal === 'number' ? angelSignal : 0;
    const thetaVal = typeof theta === 'number' ? theta : 0;
    
    if (angelStrength > 0.7) {
      rationale += `The angel advisor strongly advocates ${angelDirection} action (${angelSig.toFixed(3)}) - this represents stable, ethically grounded guidance from phase angle ${thetaVal.toFixed(2)}. `;
    } else if (angelStrength > 0.4) {
      rationale += `The angel advisor moderately favors ${angelDirection} action (${angelSig.toFixed(3)}) - harmonizing influence from stable cosine dynamics. `;
    } else if (angelStrength > 0.1) {
      rationale += `The angel advisor shows mild ${angelDirection} lean (${angelSig.toFixed(3)}) - subtle ethical grounding. `;
    } else {
      rationale += `The angel advisor is neutral (${angelSig.toFixed(3)}) - no strong ethical pull in either direction. `;
    }

    // Demon Analysis - Destabilizing, Urgent, Risky Impulses
    const demonSig = typeof demonSignal === 'number' ? demonSignal : 0;
    const phiVal = typeof phi === 'number' ? phi : 0;
    
    if (demonStrength > 0.7) {
      rationale += `The demon advisor strongly urges ${demonDirection} action (${demonSig.toFixed(3)}) - escalating urgency and emotional pull from phase ${phiVal.toFixed(2)}. `;
    } else if (demonStrength > 0.4) {
      rationale += `The demon advisor pushes moderately toward ${demonDirection} action (${demonSig.toFixed(3)}) - notable risky impulse. `;
    } else if (demonStrength > 0.1) {
      rationale += `The demon advisor shows mild ${demonDirection} pressure (${demonSig.toFixed(3)}) - subtle destabilizing influence. `;
    } else {
      rationale += `The demon advisor is subdued (${demonSig.toFixed(3)}) - minimal risky or urgent impulses. `;
    }

    // Probabilistic Analysis
    if (mode === 'probabilistic') {
      const pPos = typeof pPositive === 'number' ? pPositive : 0;
      const pNeg = typeof pNegative === 'number' ? pNegative : 0;
      const conf = typeof confidence === 'number' ? confidence : 0;
      const abstainThresh = typeof abstainThreshold === 'number' ? abstainThreshold : 0.7;
      
      rationale += `Probabilistic mode: p(positive)=${pPos.toFixed(3)}, p(negative)=${pNeg.toFixed(3)}, confidence=${conf.toFixed(3)}. `;
      if (decision === 'abstain') {
        rationale += `Abstaining due to low confidence (${conf.toFixed(3)} < ${abstainThresh.toFixed(3)}). `;
      } else {
        rationale += `Decision: ${decision} based on probability threshold. `;
      }
    } else {
      // Legacy mode analysis
      const blendedScore = mode === 'angel' ? angelSig : 
                          mode === 'demon' ? demonSig : 
                          (angelSig + demonSig) / 2;
      
      switch (mode) {
        case 'angel':
          rationale += `Angel-only mode prioritizes stable, ethical guidance: ${blendedScore > 0 ? 'Proceed with ethical grounding' : 'Hold for more stable conditions'}.`;
          break;
        case 'demon':
          rationale += `Demon-only mode follows urgent impulses: ${blendedScore > 0 ? 'Act on immediate pressure' : 'Wait despite urgency'}.`;
          break;
        case 'blend':
        default:
          const blendedScoreVal = typeof blendedScore === 'number' ? blendedScore : 0;
          const decision = Math.abs(blendedScoreVal) > 0.4 
            ? (blendedScoreVal > 0 ? 'Proceed with balanced guidance' : 'Hold with balanced caution')
            : 'Consider further - balanced forces create ambivalence';
          rationale += `Blended decision from weighted vector field: ${decision} (combined score: ${blendedScoreVal.toFixed(3)}).`;
          break;
      }
    }

    // Technical details
    const tanClampVal = typeof tanClamp === 'number' ? tanClamp : 3;
    const normalizeVal = typeof normalize === 'boolean' ? normalize : true;
    rationale += ` Technical: angel=cos(${thetaVal.toFixed(3)})*${angelSig.toFixed(3)}, demon=clamp(tan(${phiVal.toFixed(3)}),${tanClampVal})*${demonSig.toFixed(3)}, normalize=${normalizeVal}.`;

    // Add Context Tags for Interpretation
    if (tags.length > 0) {
      rationale += ` Contextual factors: ${tags.join(', ')}.`;
    }

    // Add Conceptual Model Note
    rationale += ` This represents the parametric advisory model where cosine provides stable grounding and tangent captures escalating urgency.`;

    return rationale;
  }
}
