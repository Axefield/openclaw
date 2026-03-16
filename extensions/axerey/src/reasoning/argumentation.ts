/**
 * Argumentation Tools - Steelman & Strawman Analysis
 * Provides tools for strengthening and weakening arguments
 */

import { MCPCommand, MCPTool } from '../core/mcp-command.js';

// ---- Core Data Model (per White Paper) ----
export type Confidence = 0 | 1 | 2 | 3 | 4 | 5; // Quantized rating of strength/robustness

export interface Evidence {
  title?: string;
  url?: string;
  doi?: string;
  note?: string;
}

/**
 * Foundational claim supporting argument
 * Key fields: text, support, evidence[]
 */
export interface Premise {
  text: string;
  support?: string; // brief justification
  evidence?: Evidence[]; // citations
}

/**
 * Counterpoint or challenge
 * Key fields: text, severity, response
 */
export interface Objection {
  text: string;
  severity?: 'low' | 'medium' | 'high';
  response?: string;
  evidence?: Evidence[];
}

/**
 * Specific rhetorical misrepresentation
 * Enum: exaggeration, false_dichotomy, etc.
 */
export type Distortion =
  | 'exaggeration'
  | 'oversimplification'
  | 'misattribution'
  | 'context_stripping'
  | 'straw_person_minor' // attacks weaker sub-claim
  | 'quote_mining'
  | 'false_dichotomy';

/**
 * Logical error or invalid inference
 * Enum: strawman, ad_hominem, etc.
 */
export type Fallacy =
  | 'strawman'
  | 'ad_hominem'
  | 'slippery_slope'
  | 'hasty_generalization'
  | 'false_dichotomy'
  | 'appeal_to_ignorance'
  | 'appeal_to_emotion'
  | 'circular_reasoning';

// =====================================================
// STEELMAN
// =====================================================

/**
 * Steelman Arguments - Charity by Default
 * Encourages maximally charitable reconstruction before critique
 */
export interface SteelmanArgs {
  /** Opponent's claim in their best possible terms. */
  opponentClaim: string;
  /** Charitable assumptions added to make the claim maximally reasonable. */
  charitableAssumptions?: string[];
  /** Strongest premises supporting the improved claim. */
  strongestPremises?: Premise[];
  /** Known objections that must be answered to be fair. */
  anticipatedObjections?: Objection[];
  /** Optional context (domain, constraints, goals). */
  context?: string;
  /** Ask for a summarized "best version" rewrite. */
  requestImprovedFormulation?: boolean;
}

/**
 * Steelman Result - Explainability by Design
 * Each result includes evidence references, severity annotations, and residual risk descriptions
 */
export interface SteelmanResult {
  /** The strengthened, most charitable version of the claim */
  improvedClaim: string;
  /** Enhanced premises with evidence references */
  premises: Premise[];
  /** Objections with responses and severity annotations */
  addressedObjections: Objection[];
  /** Remaining vulnerabilities and residual risks */
  residualRisks: string[];
  /** Quantized confidence rating (0-5) */
  confidence: Confidence;
  /** Additional insights and methodology notes */
  notes?: string;
}

/**
 * Strong Typing: Every argument component is a typed object with schema validation
 * Charity by Default: Encourages maximally charitable reconstruction before critique
 */
export const SteelmanSchema = {
  type: 'object',
  required: ['opponentClaim'],
  properties: {
    opponentClaim: { 
      type: 'string', 
      minLength: 1, 
      description: 'Opponent\'s claim in their best possible terms' 
    },
    charitableAssumptions: { 
      type: 'array', 
      items: { type: 'string' },
      description: 'Charitable assumptions added to make the claim maximally reasonable'
    },
    strongestPremises: {
      type: 'array',
      items: {
        type: 'object',
        required: ['text'],
        properties: {
          text: { type: 'string', minLength: 1, description: 'Foundational claim text' },
          support: { type: 'string', description: 'Brief justification' },
          evidence: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Evidence title' },
                url: { type: 'string', format: 'uri', description: 'Evidence URL' },
                doi: { type: 'string', description: 'DOI reference' },
                note: { type: 'string', description: 'Additional notes' },
              },
              additionalProperties: false,
            },
            description: 'Evidence citations'
          },
        },
        additionalProperties: false,
      },
      description: 'Strongest premises supporting the improved claim'
    },
    anticipatedObjections: {
      type: 'array',
      items: {
        type: 'object',
        required: ['text'],
        properties: {
          text: { type: 'string', description: 'Objection text' },
          severity: { 
            type: 'string', 
            enum: ['low', 'medium', 'high'],
            description: 'Severity level of the objection'
          },
          response: { type: 'string', description: 'Response to the objection' },
          evidence: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                url: { type: 'string', format: 'uri' },
                doi: { type: 'string' },
                note: { type: 'string' },
              },
              additionalProperties: false,
            },
          },
        },
        additionalProperties: false,
      },
      description: 'Known objections that must be answered to be fair'
    },
    context: { 
      type: 'string', 
      description: 'Optional context (domain, constraints, goals)' 
    },
    requestImprovedFormulation: { 
      type: 'boolean', 
      default: true,
      description: 'Ask for a summarized "best version" rewrite'
    },
  },
  additionalProperties: false,
} as const;

export class SteelmanCommand extends MCPCommand<SteelmanArgs, SteelmanResult> {
  static override readonly name = 'argument.steelman';
  static toolDefinition = {
    name: SteelmanCommand.name,
    description:
      "Produce the strongest, most charitable version of an opponent's claim, including best premises and addressed objections.",
    inputSchema: SteelmanSchema,
  };
  constructor() {
    super(SteelmanCommand.name);
  }
}

export class SteelmanTool extends MCPTool<SteelmanArgs, SteelmanResult> {
  readonly name = 'argument.steelman';
  readonly description =
    "Produce the strongest, most charitable version of an opponent's claim, including best premises and addressed objections.";
  readonly inputSchema = SteelmanSchema;

  async execute(args: SteelmanArgs): Promise<SteelmanResult> {
    const {
      opponentClaim,
      charitableAssumptions = [],
      strongestPremises = [],
      anticipatedObjections = [],
      context = '',
    } = args;

    // Generate improved claim
    const improvedClaim = this.generateImprovedClaim(opponentClaim, charitableAssumptions, context);

    // Enhance premises
    const premises = this.enhancePremises(strongestPremises, improvedClaim, context);

    // Address objections
    const addressedObjections = this.addressObjections(anticipatedObjections, improvedClaim, premises);

    // Identify residual risks
    const residualRisks = this.identifyResidualRisks(improvedClaim, premises, addressedObjections);

    // Calculate confidence
    const confidence = this.calculateConfidence(premises, addressedObjections, residualRisks);

    // Generate notes
    const notes = this.generateNotes(opponentClaim, improvedClaim, charitableAssumptions);

    return {
      improvedClaim,
      premises,
      addressedObjections,
      residualRisks,
      confidence,
      notes,
    };
  }

  private generateImprovedClaim(
    originalClaim: string,
    assumptions: string[],
    context: string,
  ): string {
    let improved = originalClaim;

    // Add charitable assumptions
    if (assumptions.length > 0) {
      improved += ` (Assuming: ${assumptions.join(', ')})`;
    }

    // Add context if provided
    if (context) {
      improved += ` [Context: ${context}]`;
    }

    // Strengthen language
    improved = improved.replace(/\bmay\b/g, 'likely');
    improved = improved.replace(/\bmight\b/g, 'probably');
    improved = improved.replace(/\bpossibly\b/g, 'reasonably');

    return improved;
  }

  private enhancePremises(originalPremises: Premise[], _claim: string, context: string): Premise[] {
    const enhanced = [...originalPremises];

    // Add implicit premises that strengthen the claim
    if (enhanced.length === 0) {
      enhanced.push({
        text: 'The claim is based on reasonable assumptions about the domain',
        support: 'Default charitable interpretation',
      });
    }

    // Add context-based premises
    if (context) {
      enhanced.push({
        text: `The context (${context}) supports the validity of this claim`,
        support: 'Contextual analysis',
      });
    }

    return enhanced;
  }

  private addressObjections(
    objections: Objection[],
    claim: string,
    premises: Premise[],
  ): Objection[] {
    return objections.map((obj) => ({
      ...obj,
      response: obj.response || this.generateResponse(obj, claim, premises),
    }));
  }

  private generateResponse(_objection: Objection, _claim: string, _premises: Premise[]): string {
    const responses = [
      'This objection overlooks the nuanced nature of the claim',
      'The premises provide strong support that addresses this concern',
      'While valid, this objection doesn\'t undermine the core argument',
      'This is addressed by considering the broader context and evidence',
    ];

    return responses[Math.floor(Math.random() * responses.length)]!;
  }

  private identifyResidualRisks(
    claim: string,
    premises: Premise[],
    objections: Objection[],
  ): string[] {
    const risks: string[] = [];

    if (premises.length < 3) {
      risks.push('Limited premise support may weaken the argument');
    }

    const highSeverityObjections = objections.filter((obj) => obj.severity === 'high');
    if (highSeverityObjections.length > 0) {
      risks.push('High-severity objections remain partially unaddressed');
    }

    if (claim.includes('always') || claim.includes('never')) {
      risks.push('Absolute claims are vulnerable to counterexamples');
    }

    return risks;
  }

  private calculateConfidence(
    premises: Premise[],
    objections: Objection[],
    risks: string[],
  ): Confidence {
    let score = 0;

    // Base score from premises
    score += Math.min(premises.length * 0.5, 2);

    // Bonus for addressed objections
    const addressedCount = objections.filter((obj) => obj.response).length;
    score += Math.min(addressedCount * 0.3, 1.5);

    // Penalty for risks
    score -= risks.length * 0.3;

    // Normalize to 0-5 scale
    return Math.max(0, Math.min(5, Math.round(score))) as Confidence;
  }

  private generateNotes(
    originalClaim: string,
    improvedClaim: string,
    assumptions: string[],
  ): string {
    const notes: string[] = [];

    if (originalClaim !== improvedClaim) {
      notes.push('Claim was strengthened and clarified');
    }

    if (assumptions.length > 0) {
      notes.push(`Added ${assumptions.length} charitable assumptions`);
    }

    notes.push('This represents the strongest good-faith interpretation');

    return notes.join('. ') + '.';
  }
}

// =====================================================
// STRAWMAN
// =====================================================

/**
 * Strawman Arguments - Distortion Analysis
 * Diagnoses distortions, fallacies, and rhetorical misrepresentations
 */
export interface StrawmanArgs {
  /** Original claim that (incorrectly) gets distorted. */
  originalClaim: string;
  /** Concrete distorted version to analyze (or auto-generate if omitted). */
  distortedClaim?: string;
  /** Distortion techniques observed or to simulate. */
  distortions?: Distortion[];
  /** Weak or irrelevant premises introduced by the distortion. */
  weakPremises?: Premise[];
  /** Fallacies that the distortion relies on. */
  fallacies?: Fallacy[];
  /** Optional context to guide detection. */
  context?: string;
  /** Also generate an "easy refutation" of the distorted claim. */
  requestRefutation?: boolean;
}

/**
 * Strawman Result - Composability by Design
 * Results can be chained in pipelines: strawman → steelman to transform distorted claims
 */
export interface StrawmanResult {
  /** The distorted version of the original claim */
  distortedClaim: string;
  /** Weak premises identified in the distortion */
  weakPremises: Premise[];
  /** Specific distortions detected */
  identifiedDistortions: Distortion[];
  /** Logical fallacies identified */
  identifiedFallacies: Fallacy[];
  /** Concise takedown of the distortion */
  easyRefutation?: string;
  /** How to convert this into a steelman directionally */
  improvementHint?: string;
  /** Quantized confidence rating (0-5) */
  confidence: Confidence;
}

/**
 * Strong Typing: Every argument component is a typed object with schema validation
 * Composability: Tools can be chained in pipelines for complex analysis
 */
export const StrawmanSchema = {
  type: 'object',
  required: ['originalClaim'],
  properties: {
    originalClaim: { 
      type: 'string', 
      minLength: 1,
      description: 'Original claim that (incorrectly) gets distorted'
    },
    distortedClaim: { 
      type: 'string',
      description: 'Concrete distorted version to analyze (or auto-generate if omitted)'
    },
    distortions: {
      type: 'array',
      items: {
        type: 'string',
        enum: [
          'exaggeration',
          'oversimplification',
          'misattribution',
          'context_stripping',
          'straw_person_minor',
          'quote_mining',
          'false_dichotomy',
        ],
      },
      description: 'Distortion techniques observed or to simulate'
    },
    weakPremises: {
      type: 'array',
      items: {
        type: 'object',
        required: ['text'],
        properties: {
          text: { type: 'string', description: 'Weak premise text' },
          support: { type: 'string', description: 'Brief justification' },
          evidence: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Evidence title' },
                url: { type: 'string', format: 'uri', description: 'Evidence URL' },
                doi: { type: 'string', description: 'DOI reference' },
                note: { type: 'string', description: 'Additional notes' },
              },
              additionalProperties: false,
            },
            description: 'Evidence citations'
          },
        },
        additionalProperties: false,
      },
      description: 'Weak or irrelevant premises introduced by the distortion'
    },
    fallacies: {
      type: 'array',
      items: {
        type: 'string',
        enum: [
          'strawman',
          'ad_hominem',
          'slippery_slope',
          'hasty_generalization',
          'false_dichotomy',
          'appeal_to_ignorance',
          'appeal_to_emotion',
          'circular_reasoning',
        ],
      },
      description: 'Fallacies that the distortion relies on'
    },
    context: { 
      type: 'string',
      description: 'Optional context to guide detection'
    },
    requestRefutation: { 
      type: 'boolean', 
      default: true,
      description: 'Also generate an "easy refutation" of the distorted claim'
    },
  },
  additionalProperties: false,
} as const;

export class StrawmanCommand extends MCPCommand<StrawmanArgs, StrawmanResult> {
  static override readonly name = 'argument.strawman';
  static toolDefinition = {
    name: StrawmanCommand.name,
    description:
      'Analyze or synthesize a strawman: show distortions/fallacies, weak premises, and provide an easy refutation.',
    inputSchema: StrawmanSchema,
  };
  constructor() {
    super(StrawmanCommand.name);
  }
}

export class StrawmanTool extends MCPTool<StrawmanArgs, StrawmanResult> {
  readonly name = 'argument.strawman';
  readonly description =
    'Analyze or synthesize a strawman: show distortions/fallacies, weak premises, and provide an easy refutation.';
  readonly inputSchema = StrawmanSchema;

  async execute(args: StrawmanArgs): Promise<StrawmanResult> {
    const {
      originalClaim,
      distortedClaim,
      distortions = [],
      weakPremises = [],
      fallacies = [],
      requestRefutation = true,
    } = args;

    // Generate or analyze distorted claim
    const finalDistortedClaim = distortedClaim || this.generateDistortedClaim(originalClaim, distortions);

    // Identify distortions
    const identifiedDistortions = this.identifyDistortions(originalClaim, finalDistortedClaim, distortions);

    // Identify fallacies
    const identifiedFallacies = this.identifyFallacies(finalDistortedClaim, fallacies);

    // Generate weak premises
    const weakPremisesList = this.generateWeakPremises(finalDistortedClaim, weakPremises);

    // Generate refutation if requested
    const easyRefutation = requestRefutation
      ? this.generateRefutation(originalClaim, finalDistortedClaim, identifiedDistortions, identifiedFallacies)
      : undefined;

    // Generate improvement hint
    const improvementHint = this.generateImprovementHint(originalClaim, finalDistortedClaim, identifiedDistortions);

    // Calculate confidence
    const confidence = this.calculateConfidence(identifiedDistortions, identifiedFallacies, weakPremisesList);

    return {
      distortedClaim: finalDistortedClaim,
      weakPremises: weakPremisesList,
      identifiedDistortions,
      identifiedFallacies,
      easyRefutation: easyRefutation || '',
      improvementHint,
      confidence,
    };
  }

  private generateDistortedClaim(originalClaim: string, distortions: Distortion[]): string {
    let distorted = originalClaim;

    for (const distortion of distortions) {
      switch (distortion) {
        case 'exaggeration':
          distorted = distorted.replace(/\bsome\b/g, 'all');
          distorted = distorted.replace(/\boften\b/g, 'always');
          distorted = distorted.replace(/\bsometimes\b/g, 'constantly');
          break;
        case 'oversimplification':
          distorted = distorted.replace(/\bcomplex\b/g, 'simple');
          distorted = distorted.replace(/\bnuanced\b/g, 'straightforward');
          break;
        case 'false_dichotomy':
          distorted = `Either ${distorted} or complete opposite`;
          break;
        case 'context_stripping':
          distorted = distorted.replace(/\[.*?\]/g, '');
          distorted = distorted.replace(/\(.*?\)/g, '');
          break;
        case 'quote_mining':
          distorted = `"${distorted}" - taken out of context`;
          break;
      }
    }

    return distorted;
  }

  private identifyDistortions(
    original: string,
    distorted: string,
    providedDistortions: Distortion[],
  ): Distortion[] {
    const identified: Distortion[] = [...providedDistortions];

    // Detect exaggeration
    if (distorted.includes('all') && !original.includes('all')) {
      identified.push('exaggeration');
    }

    // Detect false dichotomy
    if (distorted.includes('Either') || distorted.includes('or complete')) {
      identified.push('false_dichotomy');
    }

    // Detect context stripping
    if (original.length > distorted.length * 1.5) {
      identified.push('context_stripping');
    }

    return [...new Set(identified)]; // Remove duplicates
  }

  private identifyFallacies(distortedClaim: string, providedFallacies: Fallacy[]): Fallacy[] {
    const identified: Fallacy[] = [...providedFallacies];

    // Detect strawman
    if (distortedClaim.includes('strawman') || distortedClaim.includes('distorted')) {
      identified.push('strawman');
    }

    // Detect false dichotomy
    if (distortedClaim.includes('Either') || distortedClaim.includes('or')) {
      identified.push('false_dichotomy');
    }

    // Detect hasty generalization
    if (distortedClaim.includes('all') || distortedClaim.includes('every')) {
      identified.push('hasty_generalization');
    }

    return [...new Set(identified)];
  }

  private generateWeakPremises(_distortedClaim: string, providedPremises: Premise[]): Premise[] {
    const weakPremises: Premise[] = [...providedPremises];

    // Add generic weak premises
    weakPremises.push({
      text: 'This claim is obviously true without evidence',
      support: 'Appeal to common sense',
    });

    weakPremises.push({
      text: 'Everyone knows this is the case',
      support: 'Appeal to popularity',
    });

    return weakPremises;
  }

  private generateRefutation(
    _original: string,
    _distorted: string,
    distortions: Distortion[],
    fallacies: Fallacy[],
  ): string {
    const refutation: string[] = [];

    refutation.push('The distorted claim misrepresents the original');
    refutation.push(`This is a clear case of ${distortions.join(' and ')}`);

    if (fallacies.length > 0) {
      refutation.push(`The argument commits ${fallacies.join(' and ')} fallacies`);
    }

    refutation.push('The original claim should be evaluated on its own merits');

    return refutation.join('. ') + '.';
  }

  private generateImprovementHint(
    _original: string,
    _distorted: string,
    distortions: Distortion[],
  ): string {
    const hints: string[] = [];

    hints.push('To steelman this argument:');
    hints.push('1. Restore the original nuanced language');
    hints.push('2. Add back necessary context');
    hints.push('3. Address the strongest version of the claim');

    if (distortions.includes('exaggeration')) {
      hints.push('4. Use precise, measured language');
    }

    return hints.join(' ');
  }

  private calculateConfidence(
    distortions: Distortion[],
    fallacies: Fallacy[],
    weakPremises: Premise[],
  ): Confidence {
    let score = 0;

    // Base score from identified issues
    score += distortions.length * 0.5;
    score += fallacies.length * 0.3;
    score += weakPremises.length * 0.2;

    // Cap at 5
    return Math.min(5, Math.round(score)) as Confidence;
  }
}

// =====================================================
// COMPOSABILITY: Pipeline Tools
// =====================================================

/**
 * Pipeline Tool: Strawman → Steelman
 * Demonstrates composability by transforming distorted claims back into their strongest version
 */
export interface StrawmanToSteelmanArgs {
  /** Original claim that was distorted */
  originalClaim: string;
  /** Distortions to apply before steelmanning */
  distortions?: Distortion[];
  /** Context for the analysis */
  context?: string;
}

export interface StrawmanToSteelmanResult {
  /** The original claim */
  originalClaim: string;
  /** The distorted version */
  distortedClaim: string;
  /** The steelmanned (strengthened) version */
  steelmannedClaim: string;
  /** Distortions that were applied */
  appliedDistortions: Distortion[];
  /** Premises supporting the steelmanned version */
  premises: Premise[];
  /** Confidence in the transformation */
  confidence: Confidence;
  /** Pipeline methodology notes */
  methodology: string;
}

export const StrawmanToSteelmanSchema = {
  type: 'object',
  required: ['originalClaim'],
  properties: {
    originalClaim: {
      type: 'string',
      minLength: 1,
      description: 'Original claim that was distorted'
    },
    distortions: {
      type: 'array',
      items: {
        type: 'string',
        enum: [
          'exaggeration',
          'oversimplification',
          'misattribution',
          'context_stripping',
          'straw_person_minor',
          'quote_mining',
          'false_dichotomy',
        ],
      },
      description: 'Distortions to apply before steelmanning'
    },
    context: {
      type: 'string',
      description: 'Context for the analysis'
    },
  },
  additionalProperties: false,
} as const;

export class StrawmanToSteelmanCommand extends MCPCommand<StrawmanToSteelmanArgs, StrawmanToSteelmanResult> {
  static override readonly name = 'argument.pipeline.strawman-to-steelman';
  static toolDefinition = {
    name: StrawmanToSteelmanCommand.name,
    description: 'Pipeline tool: Apply distortions then strengthen the claim (strawman → steelman)',
    inputSchema: StrawmanToSteelmanSchema,
  };
  constructor() {
    super(StrawmanToSteelmanCommand.name);
  }
}

export class StrawmanToSteelmanTool extends MCPTool<StrawmanToSteelmanArgs, StrawmanToSteelmanResult> {
  readonly name = 'argument.pipeline.strawman-to-steelman';
  readonly description = 'Pipeline tool: Apply distortions then strengthen the claim (strawman → steelman)';
  readonly inputSchema = StrawmanToSteelmanSchema;

  async execute(args: StrawmanToSteelmanArgs): Promise<StrawmanToSteelmanResult> {
    const { originalClaim, distortions = [], context = '' } = args;

    // Step 1: Apply strawman distortions
    const strawmanTool = new StrawmanTool();
    const strawmanResult = await strawmanTool.execute({
      originalClaim,
      distortions,
      context,
      requestRefutation: false,
    });

    // Step 2: Apply steelman strengthening
    const steelmanTool = new SteelmanTool();
    const steelmanResult = await steelmanTool.execute({
      opponentClaim: strawmanResult.distortedClaim,
      context,
      requestImprovedFormulation: true,
    });

    // Combine results
    return {
      originalClaim,
      distortedClaim: strawmanResult.distortedClaim,
      steelmannedClaim: steelmanResult.improvedClaim,
      appliedDistortions: strawmanResult.identifiedDistortions,
      premises: steelmanResult.premises,
      confidence: Math.min(strawmanResult.confidence, steelmanResult.confidence) as Confidence,
      methodology: `Applied distortions: ${strawmanResult.identifiedDistortions.join(', ')}. Then strengthened using charitable assumptions and premise enhancement.`,
    };
  }
}
