// Stickygon - Agnostic Persistent Memory Server
// ---------------------------------------------------------------
// Implements an MCP server that gives any LLM host long‑term memory:
//  - Tools: memorize, recall, search, update, forget, pin
//  - Resources: memory indexes you can pull into context (today, pinned, recent)
//  - Prompts: summarize-selected (to compress large recalls into a short context)
// Storage is SQLite (local‑first). Embeddings are pluggable; default is a simple
// cosine search with your provider of choice. For larger scale, swap in sqlite-vss.
// ---------------------------------------------------------------

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  CallToolRequestSchema,
  CallToolResultSchema,
  ListToolsRequestSchema,
  ListToolsResultSchema,
  ToolSchema,
  ReadResourceRequestSchema,
  ReadResourceResultSchema,
  ListResourcesRequestSchema,
  ListResourcesResultSchema,
  ListResourceTemplatesRequestSchema,
  ListResourceTemplatesResultSchema,
  ResourceSchema,
  ResourceTemplateSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { MemoryStore, type Memory } from "./memory.js";
import { VSSMemoryStore } from "./memory-vss.js";
import { EmbeddingProvider } from "./providers/embeddings.js";
import { rankResults, cosine } from "./ranker.js";
import { VSSRanker } from "./ranker-vss.js";
import { AdaptiveRanker } from "./adaptive-ranker.js";
import KMeans from "kmeans-js";
import { randomUUID } from "node:crypto";
// Reasoning tools imports
import { MindBalanceTool } from "./reasoning/mind-balance.js";
import {
  SteelmanTool,
  StrawmanTool,
  StrawmanToSteelmanTool,
} from "./reasoning/argumentation.js";
// Smart-Thinking improvements
import { ConnectionService } from "./services/connectionService.js";
import { VerificationService } from "./services/verificationService.js";
import { TFIDFSimilarityEngine } from "./similarity/tfidf.js";
// Removed VagogonSecureConfigManager - using only Axerey configuration

// Add this at the top of the file or in a separate declaration file
declare module "kmeans-js";

// Import fs for config loading
import * as fs from "fs";

// ---- Configure storage + embeddings ----
const store = await MemoryStore.init({
  path: process.env.PCM_DB || "./pcm.db",
});
// Load Axerey scientific configuration
let config: any = {};
try {
  // Default configuration
  const defaultConfig = {
    memory: {
      vssEnabled: true,
      vectorDimension: 1536,
      hybridVSS: {
        useHNSWForSearch: true,
        useVectorliteForPersistence: true,
        autoSwitchThreshold: 1000,
        maxElements: 100000,
        M: 16,
        efConstruction: 200,
        ef: 100,
        space: "cosine",
      },
    },
  };

  // Load Axerey scientific configuration
  const axereyPath = ".axerey.scientific";
  if (fs.existsSync(axereyPath)) {
    const axereyData = fs.readFileSync(axereyPath, "utf-8");
    const axereyConfig = JSON.parse(axereyData);
    config = { ...defaultConfig, ...axereyConfig };
    console.error("✅ Axerey scientific configuration loaded successfully");
  } else {
    console.warn(
      "⚠️ Axerey scientific configuration file not found, using defaults",
    );
    config = defaultConfig;
  }
} catch (error) {
  console.warn("Warning: Configuration loading failed, using defaults:", error);
  config = {
    memory: {
      vssEnabled: true,
      vectorDimension: 1536,
      hybridVSS: {
        useHNSWForSearch: true,
        useVectorliteForPersistence: true,
        autoSwitchThreshold: 1000,
        maxElements: 100000,
        M: 16,
        efConstruction: 200,
        ef: 100,
        space: "cosine",
      },
    },
  };
}

const vssStore = await VSSMemoryStore.init({
  path: process.env.PCM_DB || "./pcm.db",
  vectorDimension: config.memory?.vectorDimension || 1536,
  forceVSS: config.memory?.vssEnabled || false,
});

// Log VSS configuration
console.error("🧠 VSS Configuration:");
console.error(
  `   📊 Vector dimension: ${config.memory?.vectorDimension || 1536}`,
);
console.error(`   🚀 VSS enabled: ${config.memory?.vssEnabled || false}`);
console.error(
  `   🔄 Hybrid VSS: ${config.memory?.hybridVSS ? "Enabled" : "Disabled"}`,
);
if (config.memory?.hybridVSS) {
  console.error(
    `   📈 Auto-switch threshold: ${config.memory.hybridVSS.autoSwitchThreshold || 1000}`,
  );
  console.error(
    `   🎯 Search strategy: ${config.memory.hybridVSS.useHNSWForSearch ? "HNSW" : "Vectorlite"}`,
  );
  console.error(
    `   💾 Persistence: ${config.memory.hybridVSS.useVectorliteForPersistence ? "Vectorlite" : "HNSW"}`,
  );
}
console.error(`   🔧 Configuration source: Axerey Scientific`);
const embeddings: EmbeddingProvider = await EmbeddingProvider.init();

// Persona-scoped adaptive rankers
const personaRankers = new Map<string, AdaptiveRanker>();

/**
 * Get or create persona-specific adaptive ranker
 */
function getPersonaRanker(personaId: string): AdaptiveRanker {
  if (!personaRankers.has(personaId)) {
    const ranker = new AdaptiveRanker();

    // Load persona-specific weights from config if available
    try {
      const axereyPath = ".axerey.scientific";
      if (fs.existsSync(axereyPath)) {
        const axereyData = fs.readFileSync(axereyPath, "utf-8");
        const axereyConfig = JSON.parse(axereyData);
        const personaConfig = axereyConfig.personas?.[personaId];

        if (personaConfig?.adaptiveLearning?.weights) {
          ranker.setWeights(personaConfig.adaptiveLearning.weights);
        }
        if (personaConfig?.adaptiveLearning?.taskKValues) {
          ranker.setTaskKValues(personaConfig.adaptiveLearning.taskKValues);
        }
      }
    } catch (error) {
      console.warn(`Failed to load persona config for ${personaId}:`, error);
    }

    personaRankers.set(personaId, ranker);
  }
  return personaRankers.get(personaId)!;
}

// Default adaptive ranker (for backward compatibility)
const adaptiveRanker = getPersonaRanker("default");

// Create VSSRanker with default adaptive ranker
const vssRanker = new VSSRanker(vssStore, adaptiveRanker);

// Smart-Thinking services
const connectionService = new ConnectionService(vssStore.db);
const verificationService = new VerificationService(
  vssStore,
  vssRanker,
  connectionService,
  getCurrentPersonaId,
);
const tfidfEngine = new TFIDFSimilarityEngine();

// Unified outcome service
import { OutcomeService } from "./services/outcomeService.js";
const outcomeService = new OutcomeService(
  getPersonaRanker,
  connectionService,
  vssStore,
);

// Set up adaptive rankers with services
import { QualityService } from "./services/qualityService.js";
const qualityService = new QualityService(vssStore);

// Configure all persona rankers with services
function configurePersonaRanker(personaId: string) {
  const ranker = getPersonaRanker(personaId);
  ranker.setServices(connectionService, qualityService, personaId);
}

// Configure default ranker
configurePersonaRanker("default");

// Update VSSRanker when persona changes (will be called dynamically)
function updateVSSRankerForPersona(personaId: string) {
  const personaRanker = getPersonaRanker(personaId);
  configurePersonaRanker(personaId);
  vssRanker.setAdaptiveRanker(personaRanker);
}

// Configuration already initialized above

// ---- Create MCP server ----
const server = new Server(
  { name: "Vagogon", version: "0.1.0" },
  {
    capabilities: {
      tools: {
        listChanged: true,
      },
      resources: {
        listChanged: true,
        watch: false,
      },
      prompts: {
        listChanged: true,
      },
    },
  },
);

// ---- Tool Definitions ----
const tools = [
  {
    name: "memorize",
    description:
      "Store new memories with text, tags, importance, and optional expiration",
    inputSchema: z.object({
      text: z.string().min(1),
      tags: z.array(z.string()).default([]),
      importance: z.number().min(0).max(1).default(0.5),
      expiresAt: z.string().datetime().optional(),
      sessionId: z.string().optional(),
      type: z.enum(["episodic", "semantic", "procedural"]).default("episodic"),
      source: z
        .enum(["plan", "signal", "execution", "account"])
        .default("plan"),
      confidence: z.number().min(0).max(1).default(1.0),
      features: z.record(z.any()).optional(),
    }),
  },
  {
    name: "recall",
    description: "Retrieve memories by query or get recent ones",
    inputSchema: z.object({
      query: z.string().default(""),
      limit: z.number().int().min(1).max(50).default(1),
      tags: z.array(z.string()).default([]),
      sessionId: z.string().optional(),
    }),
  },
  {
    name: "search",
    description: "Semantic search through stored memories",
    inputSchema: z.object({
      query: z.string().min(1),
      limit: z.number().int().min(1).max(50).default(1),
      tags: z.array(z.string()).default([]),
      sessionId: z.string().optional(),
    }),
  },
  {
    name: "update",
    description: "Modify existing memory text",
    inputSchema: z.object({
      id: z.string(),
      text: z.string().min(1),
    }),
  },
  {
    name: "forget",
    description: "Delete a memory by ID",
    inputSchema: z.object({
      id: z.string(),
    }),
  },
  {
    name: "pin",
    description: "Pin/unpin memories for quick access",
    inputSchema: z.object({
      id: z.string(),
      pinned: z.boolean().default(true),
    }),
  },
  {
    name: "decay",
    description: "Maintain memory scores and delete/archive stale items",
    inputSchema: z.object({
      maxItemsPerTag: z.number().int().min(1).optional(),
      minImportance: z.number().min(0).max(1).optional(),
      decayHalfLifeDays: z.number().int().min(1).optional(),
    }),
  },
  {
    name: "reflect",
    description: "Write a distilled lesson and update procedural rules",
    inputSchema: z.object({
      topic: z.string().min(1),
      outcome: z.string().min(1),
      notes: z.string().optional(),
    }),
  },
  // New advanced tools
  {
    name: "consolidate",
    description: "Cluster memories and produce semantic beliefs",
    inputSchema: z.object({
      tag: z.string().optional(),
      windowDays: z.number().int().min(1).default(7),
    }),
  },
  {
    name: "extract_rules",
    description: "Pattern mine executions vs outcomes to emit procedural rules",
    inputSchema: z.object({
      tag: z.string().optional(),
      minSupport: z.number().int().min(1).default(3),
    }),
  },
  {
    name: "summarize_day",
    description:
      "Create a one-pager: key activities, outcomes, rule breaches, new beliefs",
    inputSchema: z.object({
      date: z.string().optional(), // YYYY-MM-DD format
      tags: z.array(z.string()).default([]),
    }),
  },
  {
    name: "context_broker",
    description: "Returns exact set of memories for specific tasks",
    inputSchema: z.object({
      task: z.enum(["planning", "execution", "review"]),
      tags: z.array(z.string()).default([]),
      k: z.number().int().min(1).max(20).default(5),
    }),
  },
  {
    name: "grade_context",
    description: "Provide feedback on context helpfulness for adaptive ranking",
    inputSchema: z.object({
      helpful: z.boolean(),
      ids: z.array(z.string()),
    }),
  },
  {
    name: "label_outcome",
    description: "Label execution outcomes with success metrics",
    inputSchema: z.object({
      execId: z.string(),
      outcome: z.enum(["success", "failure", "neutral"]),
      score: z.number().optional(),
      efficiency: z.number().min(0).max(1).optional(),
      notes: z.string().optional(),
    }),
  },
  {
    name: "pin_set",
    description: "Create curated memory sets for quick access",
    inputSchema: z.object({
      name: z.string(),
      ids: z.array(z.string()),
    }),
  },
  {
    name: "session_start",
    description: "Start a new session with goal and tags",
    inputSchema: z.object({
      goal: z.string(),
      tags: z.array(z.string()).default([]),
      sessionType: z
        .enum(["general", "reasoning", "decision-making", "argument-analysis"])
        .optional()
        .default("general"),
    }),
  },
  {
    name: "session_end",
    description: "End session and generate summary",
    inputSchema: z.object({
      sessionId: z.string(),
      summary: z.string().optional(),
    }),
  },
  {
    name: "why_this_context",
    description: "Explain why specific memories were chosen for context",
    inputSchema: z.object({
      ids: z.array(z.string()),
    }),
  },
  {
    name: "track_context_outcome",
    description: "Track the outcome of a context for adaptive learning",
    inputSchema: z.object({
      contextId: z.string(),
      outcome: z.enum(["success", "failure", "neutral"]),
      helpful: z.boolean().optional(),
    }),
  },
  {
    name: "get_performance_metrics",
    description: "Get adaptive ranker performance metrics and weights",
    inputSchema: z.object({}),
  },
  {
    name: "retrain_ranker",
    description: "Manually trigger ranker weight retraining",
    inputSchema: z.object({}),
  },
  {
    name: "vss_status",
    description:
      "Get VSS (Vector Similarity Search) status and performance metrics",
    inputSchema: z.object({}),
  },
  // Reasoning tools
  {
    name: "mind.balance",
    description:
      "Probabilistic decision-making with abstention-aware scoring using angel/demon advisory system",
    inputSchema: z.object({
      topic: z.string().min(1),
      theta: z.number(),
      phi: z.number(),
      cosine: z.number().min(-1).max(1),
      tangent: z.number(),
      mode: z.enum(["angel", "demon", "blend", "probabilistic"]),
      tanClamp: z.number().optional().default(3.0),
      normalize: z.boolean().optional().default(true),
      scoring: z
        .object({
          rules: z
            .array(z.enum(["brier", "log", "quadratic", "spherical"]))
            .optional(),
          abstainThreshold: z.number().min(0).max(1).optional(),
          abstentionScore: z.number().optional(),
        })
        .optional(),
    }),
  },
  {
    name: "argument.steelman",
    description:
      "Strengthen arguments by finding their most charitable, strongest version",
    inputSchema: z.object({
      opponentClaim: z.string().min(1),
      charitableAssumptions: z.array(z.string()).optional(),
      strongestPremises: z
        .array(
          z.object({
            text: z.string(),
            support: z.string().optional(),
            evidence: z
              .array(
                z.object({
                  title: z.string().optional(),
                  url: z.string().optional(),
                  doi: z.string().optional(),
                  note: z.string().optional(),
                }),
              )
              .optional(),
          }),
        )
        .optional(),
      anticipatedObjections: z
        .array(
          z.object({
            text: z.string(),
            severity: z.enum(["low", "medium", "high"]).optional(),
            response: z.string().optional(),
            evidence: z
              .array(
                z.object({
                  title: z.string().optional(),
                  url: z.string().optional(),
                  doi: z.string().optional(),
                  note: z.string().optional(),
                }),
              )
              .optional(),
          }),
        )
        .optional(),
      context: z.string().optional(),
    }),
  },
  {
    name: "argument.strawman",
    description:
      "Analyze arguments to identify distortions, fallacies, and weak points",
    inputSchema: z.object({
      originalClaim: z.string().min(1),
      distortions: z
        .array(
          z.enum([
            "exaggeration",
            "oversimplification",
            "misattribution",
            "context_stripping",
            "straw_person_minor",
            "quote_mining",
            "false_dichotomy",
          ]),
        )
        .optional(),
      fallacies: z
        .array(
          z.enum([
            "strawman",
            "ad_hominem",
            "false_dichotomy",
            "slippery_slope",
            "appeal_to_authority",
            "circular_reasoning",
          ]),
        )
        .optional(),
      requestRefutation: z.boolean().optional().default(false),
      context: z.string().optional(),
    }),
  },
  {
    name: "argument.pipeline.strawman-to-steelman",
    description:
      "Transform distorted claims back to their strongest form through systematic analysis",
    inputSchema: z.object({
      originalClaim: z.string().min(1),
      distortions: z
        .array(
          z.enum([
            "exaggeration",
            "oversimplification",
            "misattribution",
            "context_stripping",
            "straw_person_minor",
            "quote_mining",
            "false_dichotomy",
          ]),
        )
        .optional(),
      context: z.string().optional(),
    }),
  },
  // Advanced reasoning tools
  {
    name: "reasoning.with_memory",
    description: "Perform reasoning tasks with relevant memory context",
    inputSchema: z.object({
      task: z.enum(["decision-making", "argument-analysis", "problem-solving"]),
      query: z.string().min(1),
      memoryTags: z.array(z.string()).optional(),
      reasoningType: z
        .enum(["mind-balance", "steelman", "strawman", "pipeline"])
        .optional(),
      useMemoryContext: z.boolean().optional().default(true),
      memoryLimit: z.number().int().min(1).max(20).optional().default(5),
    }),
  },
  {
    name: "decision_patterns",
    description:
      "Analyze decision patterns and extract insights from stored outcomes",
    inputSchema: z.object({
      timeWindow: z.number().int().min(1).optional().default(30), // days
      minOccurrences: z.number().int().min(2).optional().default(3),
      patternType: z
        .enum(["success", "failure", "confidence", "topics"])
        .optional()
        .default("success"),
    }),
  },
  // Smart-Thinking improvements
  {
    name: "reasoning_step",
    description:
      "Track reasoning steps with status, duration, and justifications",
    inputSchema: z.object({
      action: z.enum(["start", "complete", "fail", "add_justification"]),
      stepId: z.string().optional(),
      kind: z
        .enum([
          "context",
          "verification",
          "graph",
          "evaluation",
          "memory",
          "planning",
        ])
        .optional(),
      label: z.string().optional(),
      description: z.string().optional(),
      parents: z.array(z.string()).optional(),
      details: z.record(z.any()).optional(),
      justification: z
        .object({
          summary: z.string(),
          heuristics: z.array(z.string()).optional(),
          timestamp: z.string().optional(),
        })
        .optional(),
      sessionId: z.string().optional(),
    }),
  },
  {
    name: "memory_connect",
    description: "Create explicit relationships between memories",
    inputSchema: z.object({
      sourceId: z.string(),
      targetId: z.string(),
      connectionType: z.enum([
        "supports",
        "contradicts",
        "refines",
        "derives",
        "exemplifies",
        "generalizes",
        "questions",
        "analyzes",
        "synthesizes",
        "associates",
        "extends",
        "applies",
      ]),
      strength: z.number().min(0).max(1).default(0.5),
      description: z.string().optional(),
      inferred: z.boolean().default(false),
      inferenceConfidence: z.number().min(0).max(1).optional(),
    }),
  },
  {
    name: "verify_memory",
    description:
      "Verify factual claims and calculations in memories using memory-first strategy and truth-adaptation",
    inputSchema: z.object({
      memoryId: z.string(),
      forceVerification: z.boolean().default(false),
      containsCalculations: z.boolean().default(false),
      useTruthAdaptation: z.boolean().default(true),
      checkMemoriesFirst: z.boolean().default(true),
      useGonSearch: z.boolean().default(true),
      gonSearchProfile: z
        .enum(["TECH_NEWS", "PRODUCT_DEALS", "RESEARCH", "GENERIC"])
        .default("GENERIC"),
    }),
  },
  {
    name: "evaluate_memory_quality",
    description: "Evaluate memory quality using heuristics",
    inputSchema: z.object({
      memoryId: z.string(),
      context: z.string().optional(),
    }),
  },
  {
    name: "save_reasoning_state",
    description: "Save complete reasoning state for a session",
    inputSchema: z.object({
      sessionId: z.string(),
      includeConnections: z.boolean().default(true),
    }),
  },
  {
    name: "load_reasoning_state",
    description: "Load reasoning state from a previous session",
    inputSchema: z.object({
      sessionId: z.string(),
    }),
  },
  {
    name: "suggest_next_steps",
    description: "Suggest next reasoning steps based on current state",
    inputSchema: z.object({
      sessionId: z.string().optional(),
      limit: z.number().min(1).max(10).default(3),
      context: z.string().optional(),
    }),
  },
  {
    name: "get_reasoning_trace",
    description: "Get complete reasoning trace for a session",
    inputSchema: z.object({
      sessionId: z.string(),
    }),
  },
  // ---- Persona Tools ----
  {
    name: "list_personas",
    description: "List all available personas with their configurations",
    inputSchema: z.object({}),
  },
  {
    name: "get_current_persona",
    description: "Get the currently active persona configuration",
    inputSchema: z.object({}),
  },
  {
    name: "switch_persona",
    description: "Switch to a different persona",
    inputSchema: z.object({
      personaId: z.string().min(1),
    }),
  },
  {
    name: "get_persona",
    description: "Get a specific persona by ID",
    inputSchema: z.object({
      personaId: z.string().min(1),
    }),
  },
];

// ---- Consolidation Tool ----
async function consolidate({
  tag,
  windowDays,
}: {
  tag: string;
  windowDays: number;
}) {
  const now = Date.now();
  const windowStart = now - windowDays * 24 * 60 * 60 * 1000;
  const memories = await vssStore.list({ tags: [tag] });
  const recentMemories = memories.filter((m) => m.createdAt >= windowStart);

  // Extract embeddings for clustering
  const embeddings = recentMemories.map((m) => m.embedding);

  // Perform clustering
  const kmeans = new KMeans();
  const clusters = kmeans.cluster(embeddings, 5);

  // Produce semantic beliefs
  clusters.forEach((cluster: number[], index: number) => {
    const clusterMemories = recentMemories.filter(
      (_, i) => clusters.indexes[i] === index,
    );
    const summary = clusterMemories.map((m) => m.text).join(" ");
    const belief = {
      text: summary,
      confidence: 0.9,
      type: "semantic" as const,
      tags: [tag],
      importance: 0.5,
      embedding: [],
      decay: 0,
      lastUsed: now,
      source: "plan" as "plan" | "signal" | "execution" | "account",
      belief: true,
      mergedFrom: clusterMemories.map((m) => m.id),
      expiresAt: null,
      sessionId: null,
    };
    vssStore.create(belief);

    // Mark originals as merged
    clusterMemories.forEach((m) => {
      m.mergedFrom = belief.mergedFrom;
      m.belief = true;
      m.confidence += 0.1;
      vssStore.update(m.id, { text: m.text, embedding: m.embedding });
    });
  });
}

// ---- Decay/Garbage-Collect Tool ----
async function maintain({
  maxItemsPerTag,
  minImportance,
  decayHalfLifeDays,
}: {
  maxItemsPerTag: number;
  minImportance: number;
  decayHalfLifeDays: number;
}) {
  const memories = await vssStore.list({});
  const now = Date.now();
  memories.forEach((memory) => {
    const ageDays = (now - memory.lastUsed) / (1000 * 60 * 60 * 24);
    const decayFactor = Math.exp(-ageDays / decayHalfLifeDays);
    memory.importance *= decayFactor;
    if (memory.importance < minImportance) {
      // Handle archiving logic separately
      memory.archived = true;
      vssStore.update(memory.id, {
        text: memory.text,
        embedding: memory.embedding,
      });
    }
  });
}

// ---- Reflection Tool ----
async function reflect_session({
  topic,
  outcome,
  notes,
}: {
  topic: string;
  outcome: string;
  notes: string;
}) {
  const now = Date.now();
  const lesson = `Lesson for ${topic}: ${outcome} - ${notes}`;
  const existingRule = await vssStore.list({ tags: [topic, "rule"] });
  if (existingRule.length > 0) {
    // Update the existing rule
    const vector = await embeddings.embed(lesson);
    vssStore.update(existingRule[0].id, { text: lesson, embedding: vector });
  } else {
    // Create a new procedural rule
    const vector = await embeddings.embed(lesson);
    vssStore.create({
      text: lesson,
      tags: [topic, "rule"],
      type: "procedural",
      confidence: 0.8,
      importance: 0.5,
      embedding: vector,
      decay: 0,
      lastUsed: now,
      source: "plan",
      belief: false,
      expiresAt: null,
      sessionId: null,
      mergedFrom: [],
    });
  }
}

/**
 * Get current persona ID from config
 */
function getCurrentPersonaId(): string {
  try {
    const axereyPath = ".axerey.scientific";
    if (fs.existsSync(axereyPath)) {
      const axereyData = fs.readFileSync(axereyPath, "utf-8");
      const axereyConfig = JSON.parse(axereyData);
      // Check if there's a currentPersonaId stored, otherwise default to 'default'
      return axereyConfig.currentPersonaId || "default";
    }
  } catch (error) {
    console.warn("Failed to get current persona ID:", error);
  }
  return "default";
}

/**
 * Get persona config
 */
function getPersonaConfig(personaId: string): any {
  try {
    const axereyPath = ".axerey.scientific";
    if (fs.existsSync(axereyPath)) {
      const axereyData = fs.readFileSync(axereyPath, "utf-8");
      const axereyConfig = JSON.parse(axereyData);
      return axereyConfig.personas?.[personaId] || null;
    }
  } catch (error) {
    console.warn(`Failed to get persona config for ${personaId}:`, error);
  }
  return null;
}

/**
 * Get all personas as a list
 */
function getPersonaConfigList(): any[] {
  try {
    const axereyPath = ".axerey.scientific";
    if (fs.existsSync(axereyPath)) {
      const axereyData = fs.readFileSync(axereyPath, "utf-8");
      const axereyConfig = JSON.parse(axereyData);
      const personas = axereyConfig.personas || {};
      const currentId = getCurrentPersonaId();
      return Object.entries(personas).map(([id, persona]: [string, any]) => ({
        id,
        ...persona,
        isActive: id === currentId,
      }));
    }
  } catch (error) {
    console.warn("Failed to get persona list:", error);
  }
  return [];
}

/**
 * Set current persona ID
 */
function setCurrentPersonaId(personaId: string): void {
  try {
    const axereyPath = ".axerey.scientific";
    if (fs.existsSync(axereyPath)) {
      const axereyData = fs.readFileSync(axereyPath, "utf-8");
      const axereyConfig = JSON.parse(axereyData);
      axereyConfig.currentPersonaId = personaId;
      fs.writeFileSync(axereyPath, JSON.stringify(axereyConfig, null, 2));
    }
  } catch (error) {
    console.warn(`Failed to set current persona ID to ${personaId}:`, error);
  }
}

// ---- Context Broker ----
async function context_broker({
  task,
  tags,
  k,
}: {
  task: string;
  tags: string[];
  k: number;
}) {
  const context: Memory[] = [];
  const contextId = randomUUID();
  const contextMemoryIds = new Set<string>(); // Track IDs to avoid duplicates

  // Get current persona and persona-specific ranker
  const personaId = getCurrentPersonaId();
  const personaConfig = getPersonaConfig(personaId);
  const personaRankerInstance = getPersonaRanker(personaId);

  // Get persona-specific k value
  const optimalK =
    k ||
    personaRankerInstance.getOptimalK(task) ||
    personaConfig?.preferences?.defaultK?.[task] ||
    5;

  // Helper to add memory to context (with deduplication)
  const addToContext = (mem: Memory) => {
    if (!contextMemoryIds.has(mem.id)) {
      context.push(mem);
      contextMemoryIds.add(mem.id);
    }
  };

  // Get latest plan
  const plans = await vssStore.list({
    source: "plan",
    tags: tags.length > 0 ? tags : [],
  });
  if (plans.length > 0) {
    addToContext(plans[0]); // Most recent plan

    // Expand via connections: get memories connected to the plan (persona-aware)
    const personaIdForContext = getCurrentPersonaId();
    const planConnections = connectionService.getConnections(
      plans[0].id,
      personaIdForContext,
    );
    for (const conn of planConnections.slice(0, 3)) {
      if (conn.strength > 0.6) {
        // Only strong connections
        const connectedId =
          conn.sourceId === plans[0].id ? conn.targetId : conn.sourceId;
        const connectedMem = await vssStore.get(connectedId);
        if (connectedMem) addToContext(connectedMem);
      }
    }
  }

  // Get last 3 executions
  const executions = await vssStore.list({
    source: "execution",
    tags: tags.length > 0 ? tags : [],
  });
  for (const exec of executions.slice(0, 3)) {
    addToContext(exec);

    // Expand via connections: get related executions
    const relatedExecIds = connectionService.getRelatedMemories(exec.id, {
      connectionTypes: ["supports", "exemplifies"],
      minStrength: 0.7,
      maxResults: 2,
    });
    for (const relatedId of relatedExecIds) {
      const connectedMem = await vssStore.get(relatedId);
      if (connectedMem && connectedMem.source === "execution")
        addToContext(connectedMem);
    }
  }

  // Get active beliefs
  const beliefs = await vssStore.list({
    belief: true,
    tags: tags.length > 0 ? tags : [],
  });
  for (const belief of beliefs.slice(0, 2)) {
    addToContext(belief);

    // Expand via connections: get memories that support or are supported by beliefs
    const relatedBeliefIds = connectionService.getRelatedMemories(belief.id, {
      connectionTypes: ["supports", "generalizes"],
      minStrength: 0.6,
      maxResults: 2,
    });
    for (const relatedId of relatedBeliefIds) {
      const connectedMem = await vssStore.get(relatedId);
      if (connectedMem) addToContext(connectedMem);
    }
  }

  // Get relevant rules
  const rules = await vssStore.list({
    type: "procedural",
    tags: tags.length > 0 ? tags : [],
  });
  for (const rule of rules.slice(0, 2)) {
    addToContext(rule);

    // Expand via connections: get executions that derive from or exemplify rules
    const relatedRuleIds = connectionService.getRelatedMemories(rule.id, {
      connectionTypes: ["derives", "exemplifies"],
      minStrength: 0.6,
      maxResults: 3,
    });
    for (const relatedId of relatedRuleIds) {
      const connectedMem = await vssStore.get(relatedId);
      if (connectedMem && connectedMem.outcome === "success")
        addToContext(connectedMem);
    }
  }

  // Get important memories (memories tagged with 'important')
  const importantMemories = await vssStore.list({ tags: ["important"] });
  if (importantMemories.length > 0) {
    addToContext(importantMemories[0]);
  }

  // Enhanced context for reasoning tasks
  if (
    task === "reasoning" ||
    task === "decision-making" ||
    task === "argument-analysis"
  ) {
    // Get reasoning-specific memories
    const reasoningMemories = await vssStore.list({
      tags: [
        "reasoning",
        "decision",
        "argument",
        "mind-balance",
        "steelman",
        "strawman",
      ],
    });
    for (const mem of reasoningMemories.slice(0, 3)) {
      addToContext(mem);

      // Expand via connections: get related argument memories
      const relatedArgIds = connectionService.getRelatedMemories(mem.id, {
        connectionTypes: ["refines", "contradicts", "supports"],
        minStrength: 0.6,
        maxResults: 2,
      });
      for (const relatedId of relatedArgIds) {
        const connectedMem = await vssStore.get(relatedId);
        if (connectedMem) addToContext(connectedMem);
      }
    }

    // Get recent decision outcomes
    const decisionOutcomes = await vssStore.list({
      source: "execution",
      tags: ["decision", "reasoning"],
    });
    for (const outcome of decisionOutcomes.slice(0, 2)) {
      addToContext(outcome);
    }
  }

  // Trading-specific context expansion (if trading tags present)
  const tradingTags = [
    "SPY",
    "trading",
    "trade",
    "stock",
    "option",
    "forex",
    "crypto",
  ];
  const hasTradingTags = tags.some((t) =>
    tradingTags.some((tt) => t.toLowerCase().includes(tt.toLowerCase())),
  );

  if (hasTradingTags) {
    // Get trading memories with successful patterns
    const tradingExecutions = await vssStore.list({
      source: "execution",
      tags: tags.length > 0 ? tags : [],
      outcome: "success",
    });

    // Use extract_rules logic to find successful patterns
    const featurePatterns = new Map<
      string,
      { successes: number; failures: number; trades: Memory[] }
    >();
    for (const trade of tradingExecutions) {
      if (trade.features && trade.outcome) {
        for (const [feature, value] of Object.entries(trade.features)) {
          if (feature === "symbol" || feature === "timestamp") continue;
          const patternKey = `${feature}:${value}`;

          if (!featurePatterns.has(patternKey)) {
            featurePatterns.set(patternKey, {
              successes: 0,
              failures: 0,
              trades: [],
            });
          }

          const pattern = featurePatterns.get(patternKey)!;
          pattern.trades.push(trade);

          if (trade.outcome === "success") pattern.successes++;
          else if (trade.outcome === "failure") pattern.failures++;
        }
      }
    }

    // Add trades that share successful patterns (>60% success rate, min 3 occurrences)
    for (const [patternKey, pattern] of featurePatterns.entries()) {
      if (
        pattern.trades.length >= 3 &&
        pattern.successes / pattern.trades.length > 0.6
      ) {
        // This is a successful pattern - add top trades
        const successfulTrades = pattern.trades
          .filter((t) => t.outcome === "success" && t.score && t.score > 0.7)
          .sort((a, b) => (b.score || 0) - (a.score || 0))
          .slice(0, 2);

        for (const trade of successfulTrades) {
          addToContext(trade);

          // Expand via connections: get trades with similar setups
          const relatedTradeIds = connectionService.getRelatedMemories(
            trade.id,
            {
              connectionTypes: ["exemplifies", "supports"],
              minStrength: 0.7,
              maxResults: 2,
            },
          );
          for (const relatedId of relatedTradeIds) {
            const connectedMem = await vssStore.get(relatedId);
            if (connectedMem && connectedMem.outcome === "success")
              addToContext(connectedMem);
          }
        }
      }
    }

    // Get procedural rules derived from successful trades
    const tradingRules = await vssStore.list({
      type: "procedural",
      tags: tags.length > 0 ? tags : [],
    });
    for (const rule of tradingRules.slice(0, 2)) {
      // Check if rule has connections to successful trades
      const relatedRuleIds = connectionService.getRelatedMemories(rule.id, {
        connectionTypes: ["derives"],
        minStrength: 0.7,
        maxResults: 1,
      });
      const hasSuccessfulTrades = relatedRuleIds.length > 0;

      if (hasSuccessfulTrades) {
        addToContext(rule);
      }
    }
  }

  // Apply persona-specific quality filters before ranking
  const qualityThreshold = personaConfig?.preferences?.qualityThreshold || 0.3;
  const verificationRequired =
    personaConfig?.preferences?.verificationRequired || false;
  const minReliability = personaConfig?.preferences?.minReliability || 0.3;

  // Import quality service for filtering
  const { QualityService } = await import("./services/qualityService.js");
  const qualityService = new QualityService(vssStore);

  // Filter by persona-specific quality standards
  const qualityFiltered: Memory[] = [];
  for (const mem of context) {
    const quality = await qualityService.getMemoryQuality(mem.id);

    // Apply persona-specific verification requirement
    if (verificationRequired) {
      const verification = mem.features?.verification;
      if (
        !verification ||
        (verification.status !== "verified" &&
          verification.status !== "partially_verified")
      ) {
        continue; // Skip unverified memories if verification required
      }
    }

    // Apply persona-specific reliability threshold
    if (quality && quality.reliabilityScore >= minReliability) {
      qualityFiltered.push(mem);
    } else if (!quality) {
      // If quality can't be calculated, include it (backward compatibility)
      qualityFiltered.push(mem);
    }
  }

  // Set services for enhanced ranking (connections, quality)
  personaRankerInstance.setServices(
    connectionService,
    qualityService,
    personaId,
  );

  // Use persona-specific ranker for ranking (now async)
  const queryVector = await embeddings.embed(`${task} ${tags.join(" ")}`);
  const rankedContext = await personaRankerInstance.rankResults(
    qualityFiltered,
    queryVector,
    task,
  );

  // Boost memories with strong connections to already-selected context (persona-aware)
  const connectionExpansion = {
    supports: 1.0, // Full expansion
    derives: 0.9, // Strong expansion
    exemplifies: 0.8, // Good expansion
    associates: 0.6, // Moderate expansion
    contradicts: 0.3, // Limited expansion (for completeness)
    questions: 0.4, // Limited expansion
  };

  const boostedContext = rankedContext.map((mem: any) => {
    // Get connections filtered by persona
    const connections = connectionService.getConnections(mem.id, personaId);
    const strongConnections = connections.filter((c) => c.strength > 0.7);

    // Boost if memory has strong connections to other context memories
    // Weight by connection type
    let connectionBoost = 0;
    for (const conn of strongConnections) {
      const connectedId =
        conn.sourceId === mem.id ? conn.targetId : conn.sourceId;
      if (contextMemoryIds.has(connectedId)) {
        const expansionWeight =
          connectionExpansion[
            conn.connectionType as keyof typeof connectionExpansion
          ] || 0.5;
        connectionBoost += 0.1 * expansionWeight; // Weighted boost
      }
    }

    return {
      ...mem,
      _score: mem._score + Math.min(connectionBoost, 0.3), // Cap boost at 0.3
    };
  });

  // Re-sort by boosted score
  boostedContext.sort((a: any, b: any) => b._score - a._score);

  // Track this context for persona-specific outcome learning
  const finalContext = boostedContext.slice(0, optimalK);
  personaRankerInstance.trackContext(
    contextId,
    finalContext.map((m: any) => m.id),
  );

  // Set served context ID for outcome tracking
  for (const mem of finalContext) {
    await vssStore.setServedContext(mem.id, contextId);
  }

  return {
    contextId,
    memories: finalContext,
    task,
    tags,
    k: optimalK,
    expandedViaConnections: context.length - finalContext.length, // How many were considered via connections
    connectionBoostApplied: true,
  };
}

// ---- Extract Rules ----
async function extract_rules({
  tag,
  minSupport,
}: {
  tag?: string;
  minSupport: number;
}) {
  const filter = tag ? { tags: [tag] } : {};
  const executions = await vssStore.list({ ...filter, source: "execution" });

  // Simple pattern mining - in production, use more sophisticated algorithms
  const patterns: any[] = [];
  const featureCounts: {
    [key: string]: { successes: number; failures: number; total: number };
  } = {};

  for (const exec of executions) {
    if (exec.features && exec.outcome) {
      for (const [feature, value] of Object.entries(exec.features)) {
        const key = `${feature}:${value}`;
        if (!featureCounts[key]) {
          featureCounts[key] = { successes: 0, failures: 0, total: 0 };
        }
        featureCounts[key].total++;

        if (exec.outcome === "success") featureCounts[key].successes++;
        else if (exec.outcome === "failure") featureCounts[key].failures++;
      }
    }
  }

  // Generate rules for patterns with sufficient support
  for (const [pattern, counts] of Object.entries(featureCounts)) {
    if (counts.total >= minSupport) {
      const successRate = counts.successes / counts.total;
      const confidence =
        Math.max(counts.successes, counts.failures) / counts.total;

      if (confidence > 0.6) {
        // Only rules with >60% confidence
        patterns.push({
          pattern,
          support: counts.total,
          confidence,
          successRate,
          rule: `IF ${pattern} THEN ${successRate > 0.5 ? "SUCCESS" : "FAILURE"} (confidence: ${(confidence * 100).toFixed(1)}%)`,
        });
      }
    }
  }

  return patterns.sort((a, b) => b.confidence - a.confidence);
}

// ---- Summarize Day ----
async function summarize_day({
  date,
  tags,
}: {
  date?: string;
  tags: string[];
}) {
  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const dayMemories = await vssStore.list({});
  const dayFiltered = dayMemories.filter(
    (m) =>
      m.createdAt >= startOfDay.getTime() && m.createdAt <= endOfDay.getTime(),
  );

  const executions = dayFiltered.filter((m) => m.source === "execution");
  const plans = dayFiltered.filter((m) => m.source === "plan");
  const signals = dayFiltered.filter((m) => m.source === "signal");
  const beliefs = dayFiltered.filter((m) => m.belief);

  const totalScore = executions.reduce((sum, e) => {
    if (e.score) return sum + e.score;
    return sum;
  }, 0);

  const successRate =
    executions.filter((e) => e.outcome === "success").length /
    Math.max(executions.length, 1);

  return {
    date: targetDate.toISOString().split("T")[0],
    summary: {
      executions: executions.length,
      plans: plans.length,
      signals: signals.length,
      newBeliefs: beliefs.length,
      totalScore: totalScore.toFixed(2),
      successRate: (successRate * 100).toFixed(1) + "%",
      keyExecutions: executions.slice(0, 5).map((e) => ({
        text: e.text,
        outcome: e.outcome,
        score: e.score,
      })),
      ruleBreaches: executions.filter((e) => e.features?.ruleBreach).length,
      topBeliefs: beliefs.slice(0, 3).map((b) => b.text),
    },
  };
}

// ---- Triggers ----
async function add_trigger(
  memoryId: string,
  { kind, spec }: { kind: "time" | "score" | "event"; spec: any },
) {
  const memory = await store.get(memoryId);
  memory.triggers = memory.triggers || [];
  memory.triggers.push({ kind, spec });
  store.update(memoryId, memory);
}

async function fire_triggers() {
  const memories = await store.list({});
  memories.forEach((memory: Memory) => {
    if (memory.triggers) {
      memory.triggers.forEach(
        (trigger: { kind: "time" | "score" | "event"; spec: any }) => {
          // Check trigger conditions and push context if met
          // Implementation details go here
        },
      );
    }
  });
}

// ---- Tool Handlers ----
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "memorize": {
        const {
          text,
          tags,
          importance,
          expiresAt,
          sessionId,
          type,
          source,
          confidence,
          features,
        } = args as any;
        const vector = await embeddings.embed(text);
        const mem: Memory = await vssStore.create({
          text,
          tags,
          importance,
          expiresAt: expiresAt ?? null,
          sessionId: sessionId ?? null,
          embedding: vector,
          type: type ?? "episodic",
          source: source ?? "plan",
          confidence: confidence ?? 1.0,
          lastUsed: Date.now(),
          decay: 0.01,
          belief: false,
          mergedFrom: [],
          features: features ?? {},
        });

        // Auto-infer connections if enabled (background, non-blocking)
        const config = (global as any).axereyConfig || {};
        if (config.connections?.autoInference !== false) {
          // Find similar memories
          const similarMemories = await vssRanker.search(text, vector, {
            limit: 5,
          });

          if (similarMemories.length > 0) {
            const threshold = config.connections?.inferenceThreshold || 0.7;
            const similarWithScores = similarMemories
              .filter((m) => {
                const sim =
                  (m as any).similarity || cosine(vector, m.embedding);
                return m.id !== mem.id && sim >= threshold;
              })
              .map((m) => {
                const sim =
                  (m as any).similarity || cosine(vector, m.embedding);
                return { memory: m, similarity: sim };
              });

            if (similarWithScores.length > 0) {
              // Infer connections in background
              connectionService
                .inferConnections(mem.id, similarWithScores, threshold)
                .catch((err) => {
                  console.error("Connection inference failed:", err);
                });
            }
          }
        }

        // Background verification if enabled (non-blocking)
        const verificationConfig = config.verification || {};
        if (verificationConfig.enabled !== false) {
          // Trigger verification in background
          // This would call the verify_memory tool internally
          // For now, just log that it should be verified
          if (
            verificationConfig.checkCalculations &&
            /\d+\s*[\+\-\*\/]\s*\d+\s*=/.test(text)
          ) {
            // Has calculations, should verify
            console.error(
              `[Background] Memory ${mem.id} contains calculations and should be verified`,
            );
          }
        }

        return {
          content: [{ type: "text", text: JSON.stringify(mem, null, 2) }],
        };
      }

      case "recall": {
        const { query, limit, tags, sessionId, task } = args as any;

        // Get current persona's adaptive ranker and update VSSRanker
        const currentPersonaId = getCurrentPersonaId();
        const personaRanker = getPersonaRanker(currentPersonaId);
        configurePersonaRanker(currentPersonaId);
        vssRanker.setAdaptiveRanker(personaRanker);

        if (!query) {
          const base = await store.list({ tags, sessionId });
          // Use adaptive ranking for empty query too
          if (base.length > 0) {
            const avgVec = new Array(base[0].embedding.length).fill(0);
            base.forEach((m) => {
              m.embedding.forEach((v, i) => (avgVec[i] += v));
            });
            avgVec.forEach((_, i) => (avgVec[i] /= base.length));
            const ranked = await personaRanker.rankResults(base, avgVec, task);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(ranked.slice(0, limit), null, 2),
                },
              ],
            };
          }
          const sorted = base.sort(
            (a, b) =>
              (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) ||
              b.createdAt - a.createdAt,
          );
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(sorted.slice(0, limit), null, 2),
              },
            ],
          };
        }
        const qVec = await embeddings.embed(query);
        const scored = await vssRanker.recall(query, qVec, {
          limit,
          tags,
          sessionId,
          task,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(scored, null, 2) }],
        };
      }

      case "search": {
        const { query, limit, tags, sessionId, task } = args as any;

        // Get current persona's adaptive ranker and update VSSRanker
        const currentPersonaId = getCurrentPersonaId();
        const personaRanker = getPersonaRanker(currentPersonaId);
        configurePersonaRanker(currentPersonaId);
        vssRanker.setAdaptiveRanker(personaRanker);

        const qVec = await embeddings.embed(query);
        const scored = await vssRanker.search(query, qVec, {
          limit,
          tags,
          sessionId,
          task,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(scored, null, 2) }],
        };
      }

      case "update": {
        const { id, text } = args as any;
        const vector = await embeddings.embed(text);
        const updated = await vssStore.update(id, { text, embedding: vector });
        return {
          content: [{ type: "text", text: JSON.stringify(updated, null, 2) }],
        };
      }

      case "forget": {
        const { id } = args as any;
        await vssStore.delete(id);
        return { content: [{ type: "text", text: `deleted: ${id}` }] };
      }

      case "pin": {
        const { id, pinned } = args as any;
        const m = await vssStore.pin(id, pinned);
        return {
          content: [{ type: "text", text: JSON.stringify(m, null, 2) }],
        };
      }

      case "decay": {
        const { maxItemsPerTag, minImportance, decayHalfLifeDays } =
          args as any;
        await maintain({ maxItemsPerTag, minImportance, decayHalfLifeDays });
        return {
          content: [
            {
              type: "text",
              text: "Memory decay and garbage collection completed.",
            },
          ],
        };
      }

      case "reflect": {
        const { topic, outcome, notes } = args as any;
        await reflect_session({ topic, outcome, notes });
        return {
          content: [
            { type: "text", text: `Reflection session recorded for ${topic}.` },
          ],
        };
      }

      case "consolidate": {
        const { tag, windowDays } = args as any;
        if (!tag) throw new Error("Tag must be provided");
        await consolidate({ tag, windowDays });
        return {
          content: [
            {
              type: "text",
              text: `Consolidated memories for ${tag} over ${windowDays} days.`,
            },
          ],
        };
      }

      case "extract_rules": {
        const { tag, minSupport } = args as any;
        const rules = await extract_rules({ tag, minSupport });
        return {
          content: [{ type: "text", text: JSON.stringify(rules, null, 2) }],
        };
      }

      case "summarize_day": {
        const { date, tags } = args as any;
        const summary = await summarize_day({ date, tags });
        return {
          content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
        };
      }

      case "context_broker": {
        const { task, tags, k } = args as any;
        const context = await context_broker({ task, tags, k });
        return {
          content: [{ type: "text", text: JSON.stringify(context, null, 2) }],
        };
      }

      case "grade_context": {
        const { helpful, ids } = args as any;
        for (const id of ids) {
          await vssStore.updateHelpful(id, helpful);
        }
        return {
          content: [
            {
              type: "text",
              text: `Updated helpfulness for ${ids.length} memories.`,
            },
          ],
        };
      }

      case "label_outcome": {
        const { execId, outcome, score, efficiency, notes } = args as any;
        const currentPersonaId = getCurrentPersonaId();

        // Update memory outcome
        await vssStore.updateOutcome(execId, outcome, score, efficiency, notes);

        // Use unified outcome service to track outcome with persona awareness
        const memory = await vssStore.get(execId);
        if (memory && memory.servedContextId) {
          const outcomeType: "win" | "loss" | "breakeven" =
            outcome === "success"
              ? "win"
              : outcome === "failure"
                ? "loss"
                : "breakeven";

          await outcomeService.recordOutcome(
            memory.servedContextId,
            outcomeType,
            {
              personaId: currentPersonaId,
              memoryIds: [execId],
              score: score,
              helpful: outcome === "success",
            },
          );
        }

        return {
          content: [
            { type: "text", text: `Labeled outcome for execution ${execId}.` },
          ],
        };
      }

      case "pin_set": {
        const { name, ids } = args as any;
        // Store pin set as a special memory
        const pinSetMem = await vssStore.create({
          text: `Pin set: ${name}`,
          tags: ["pin_set", name],
          importance: 0.8,
          type: "procedural",
          source: "plan",
          confidence: 1.0,
          embedding: await embeddings.embed(`Pin set: ${name}`),
          belief: false,
          mergedFrom: [],
          features: { pinSetIds: ids },
          expiresAt: null,
          sessionId: null,
          lastUsed: Date.now(),
          decay: 0.01,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(pinSetMem, null, 2) }],
        };
      }

      case "session_start": {
        const { goal, tags, sessionType } = args as any;
        const sessionId = randomUUID();
        const sessionTags = ["session", "start", ...tags];
        if (sessionType && sessionType !== "general") {
          sessionTags.push(`session-${sessionType}`);
        }

        const sessionMem = await vssStore.create({
          text: `Session started: ${goal}`,
          tags: sessionTags,
          importance: 0.7,
          type: "episodic",
          source: "plan",
          confidence: 1.0,
          embedding: await embeddings.embed(`Session: ${goal}`),
          belief: false,
          mergedFrom: [],
          features: {
            goal,
            tags,
            sessionId,
            sessionType: sessionType || "general",
            reasoningSession:
              sessionType === "reasoning" ||
              sessionType === "decision-making" ||
              sessionType === "argument-analysis",
          },
          expiresAt: null,
          sessionId: sessionId,
          lastUsed: Date.now(),
          decay: 0.01,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ sessionId, memory: sessionMem }, null, 2),
            },
          ],
        };
      }

      case "session_end": {
        const { sessionId, summary } = args as any;
        const sessionMem = await vssStore.create({
          text: `Session ended: ${summary || "No summary provided"}`,
          tags: ["session", "end"],
          importance: 0.6,
          type: "episodic",
          source: "account",
          confidence: 1.0,
          embedding: await embeddings.embed(`Session ended: ${summary || ""}`),
          belief: false,
          mergedFrom: [],
          features: { sessionId, summary },
          expiresAt: null,
          sessionId: sessionId,
          lastUsed: Date.now(),
          decay: 0.01,
        });
        return {
          content: [
            { type: "text", text: JSON.stringify(sessionMem, null, 2) },
          ],
        };
      }

      case "why_this_context": {
        const { ids } = args as any;
        const explanations: Array<{id: string; text: string; reasons: Record<string, string>}> = [];
        for (const id of ids) {
          const mem = await vssStore.get(id);
          const explanation = {
            id,
            text: mem.text,
            reasons: {
              similarity: mem.embedding
                ? "High semantic similarity"
                : "No embedding",
              recency: `Created ${Math.round((Date.now() - mem.createdAt) / (1000 * 60 * 60 * 24))} days ago`,
              importance: `Importance: ${mem.importance}`,
              pinned: mem.pinned ? "Pinned for quick access" : "Not pinned",
              helpful:
                mem.helpful !== null
                  ? `User rated: ${mem.helpful ? "helpful" : "not helpful"}`
                  : "No user feedback",
              usage: `Used ${mem.usage} times`,
            },
          };
          explanations.push(explanation);
        }
        return {
          content: [
            { type: "text", text: JSON.stringify(explanations, null, 2) },
          ],
        };
      }

      case "track_context_outcome": {
        const { contextId, outcome, helpful } = args as any;
        const currentPersonaId = getCurrentPersonaId();

        // Get persona-specific ranker
        const personaRanker = getPersonaRanker(currentPersonaId);
        personaRanker.updateOutcome(contextId, outcome, helpful);

        // Use unified outcome service for comprehensive tracking
        // Get memory IDs from the context that was served
        const contextMemories = await vssStore.list({});
        const contextMemoryIds = contextMemories
          .filter((m) => m.servedContextId === contextId)
          .map((m) => m.id);

        if (contextMemoryIds.length > 0) {
          await outcomeService.recordOutcome(contextId, outcome, {
            personaId: currentPersonaId,
            memoryIds: contextMemoryIds,
            helpful: helpful,
          });
        }

        return {
          content: [
            {
              type: "text",
              text: `Tracked outcome for context ${contextId}: ${outcome}`,
            },
          ],
        };
      }

      case "get_performance_metrics": {
        const metrics = adaptiveRanker.getPerformanceMetrics();
        const weights = adaptiveRanker.getWeights();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ metrics, weights }, null, 2),
            },
          ],
        };
      }

      case "retrain_ranker": {
        adaptiveRanker.retrainWeights();
        const metrics = adaptiveRanker.getPerformanceMetrics();
        return {
          content: [
            {
              type: "text",
              text: `Ranker retrained. Current metrics: ${JSON.stringify(metrics, null, 2)}`,
            },
          ],
        };
      }

      case "vss_status": {
        const vssStats = vssStore.getVSSStats();
        const performanceMetrics = await vssRanker.getPerformanceMetrics();
        const status = {
          vss: vssStats,
          performance: performanceMetrics,
          embedding: {
            provider: process.env.OPENAI_API_KEY
              ? "OpenAI"
              : "Hash-based fallback",
            dimension: embeddings.dim,
          },
          recommendations: vssStats.available
            ? "VSS is active and providing optimized vector search"
            : "VSS not available - using fallback cosine similarity. Consider installing vectorlite extension.",
        };
        return {
          content: [{ type: "text", text: JSON.stringify(status, null, 2) }],
        };
      }

      // Reasoning tools
      case "mind.balance": {
        const mindBalanceTool = new MindBalanceTool();
        const result = await mindBalanceTool.execute(args as any);

        // Store decision outcome in memory
        const decisionArgs = args || {};
        const decisionMemory = await vssStore.create({
          text: `Decision: ${decisionArgs.topic || "Unknown topic"} - Result: ${result.decision || "Unknown"} - Confidence: ${result.confidence || 0}`,
          tags: ["decision", "mind-balance", "reasoning"],
          importance: 0.8,
          type: "episodic",
          source: "execution",
          confidence: result.confidence || 0.5,
          embedding: await embeddings.embed(
            `Decision: ${decisionArgs.topic || "Unknown topic"} - Result: ${result.decision || "Unknown"}`,
          ),
          lastUsed: Date.now(),
          decay: 0.01,
          belief: false,
          mergedFrom: [],
          expiresAt: null,
          sessionId: null,
          features: {
            decisionType: "mind-balance",
            topic: decisionArgs.topic,
            result: result.decision,
            confidence: result.confidence,
            mode: decisionArgs.mode,
            theta: decisionArgs.theta,
            phi: decisionArgs.phi,
          },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { result, memoryId: decisionMemory.id },
                null,
                2,
              ),
            },
          ],
        };
      }

      case "argument.steelman": {
        const steelmanTool = new SteelmanTool();
        const result = await steelmanTool.execute(args as any);

        // Store argument analysis outcome in memory
        const steelmanArgs = args || {};
        const argumentMemory = await vssStore.create({
          text: `Steelman Analysis: ${steelmanArgs.opponentClaim || "Unknown claim"} - Improved: ${result.improvedClaim || "Unknown"}`,
          tags: ["argument", "steelman", "reasoning"],
          importance: 0.7,
          type: "episodic",
          source: "execution",
          confidence: result.confidence || 0.5,
          embedding: await embeddings.embed(
            `Steelman Analysis: ${steelmanArgs.opponentClaim || "Unknown claim"}`,
          ),
          lastUsed: Date.now(),
          decay: 0.01,
          belief: false,
          mergedFrom: [],
          expiresAt: null,
          sessionId: null,
          features: {
            argumentType: "steelman",
            originalClaim: steelmanArgs.opponentClaim,
            improvedClaim: result.improvedClaim,
            confidence: result.confidence,
            premisesCount: result.premises?.length || 0,
          },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { result, memoryId: argumentMemory.id },
                null,
                2,
              ),
            },
          ],
        };
      }

      case "argument.strawman": {
        const strawmanTool = new StrawmanTool();
        const result = await strawmanTool.execute(args as any);

        // Store strawman analysis outcome in memory
        const strawmanArgs = args || {};
        const strawmanMemory = await vssStore.create({
          text: `Strawman Analysis: ${strawmanArgs.originalClaim || "Unknown claim"} - Distortions: ${result.identifiedDistortions?.join(", ") || "None"}`,
          tags: ["argument", "strawman", "reasoning"],
          importance: 0.7,
          type: "episodic",
          source: "execution",
          confidence: result.confidence || 0.5,
          embedding: await embeddings.embed(
            `Strawman Analysis: ${strawmanArgs.originalClaim || "Unknown claim"}`,
          ),
          lastUsed: Date.now(),
          decay: 0.01,
          belief: false,
          mergedFrom: [],
          expiresAt: null,
          sessionId: null,
          features: {
            argumentType: "strawman",
            originalClaim: strawmanArgs.originalClaim,
            distortions: result.identifiedDistortions,
            fallacies: result.identifiedFallacies,
            confidence: result.confidence,
          },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { result, memoryId: strawmanMemory.id },
                null,
                2,
              ),
            },
          ],
        };
      }

      case "argument.pipeline.strawman-to-steelman": {
        const pipelineTool = new StrawmanToSteelmanTool();
        const result = await pipelineTool.execute(args as any);

        // Store pipeline analysis outcome in memory
        const pipelineArgs = args || {};
        const pipelineMemory = await vssStore.create({
          text: `Pipeline Analysis: ${pipelineArgs.originalClaim || "Unknown claim"} - Final: ${result.steelmannedClaim || "Unknown"}`,
          tags: ["argument", "pipeline", "reasoning"],
          importance: 0.8,
          type: "episodic",
          source: "execution",
          confidence: result.confidence || 0.5,
          embedding: await embeddings.embed(
            `Pipeline Analysis: ${pipelineArgs.originalClaim || "Unknown claim"}`,
          ),
          lastUsed: Date.now(),
          decay: 0.01,
          belief: false,
          mergedFrom: [],
          expiresAt: null,
          sessionId: null,
          features: {
            argumentType: "pipeline",
            originalClaim: pipelineArgs.originalClaim,
            distortedClaim: result.distortedClaim,
            steelmannedClaim: result.steelmannedClaim,
            methodology: result.methodology,
            confidence: result.confidence,
            appliedDistortions: result.appliedDistortions,
          },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { result, memoryId: pipelineMemory.id },
                null,
                2,
              ),
            },
          ],
        };
      }

      // Advanced reasoning tools
      case "reasoning.with_memory": {
        const {
          task,
          query,
          memoryTags,
          reasoningType,
          useMemoryContext,
          memoryLimit,
        } = args as any;

        let memoryContext: any[] = [];
        if (useMemoryContext) {
          // Get relevant memories for context
          const queryVector = await embeddings.embed(query);
          const relevantMemories = await vssRanker.search(query, queryVector, {
            limit: memoryLimit,
            tags: memoryTags || ["reasoning", "decision", "argument"],
            sessionId: undefined,
          });
          memoryContext = relevantMemories;
        }

        // Perform reasoning based on type
        let reasoningResult;
        try {
          switch (reasoningType) {
            case "mind-balance":
              const mindBalanceTool = new MindBalanceTool();
              // Create proper mind balance arguments
              const mindBalanceArgs = {
                topic: query,
                theta: 0.7,
                phi: 0.3,
                cosine: 0.4,
                tangent: 0.6,
                mode: "blend" as const,
                tanClamp: 3.0,
                normalize: true,
              };
              reasoningResult = await mindBalanceTool.execute(mindBalanceArgs);
              break;
            case "steelman":
              const steelmanTool = new SteelmanTool();
              reasoningResult = await steelmanTool.execute(args as any);
              break;
            case "strawman":
              const strawmanTool = new StrawmanTool();
              reasoningResult = await strawmanTool.execute(args as any);
              break;
            case "pipeline":
              const pipelineTool = new StrawmanToSteelmanTool();
              reasoningResult = await pipelineTool.execute(args as any);
              break;
            default:
              // Default to mind-balance for decision-making
              const defaultTool = new MindBalanceTool();
              reasoningResult = await defaultTool.execute(args as any);
          }
        } catch (error) {
          console.error("Reasoning tool execution failed:", error);
          // Return a fallback result
          reasoningResult = {
            error: error instanceof Error ? error.message : "Unknown error",
            confidence: 0.0,
            result: "error",
          };
        }

        // Store the memory-aware reasoning result
        const confidence =
          reasoningResult && typeof reasoningResult.confidence === "number"
            ? reasoningResult.confidence
            : 0.5;

        const memoryAwareMemory = await vssStore.create({
          text: `Memory-Aware ${reasoningType || "reasoning"}: ${query} - Context: ${memoryContext.length} memories`,
          tags: ["reasoning", "memory-aware", reasoningType || "general"],
          importance: 0.8,
          type: "episodic",
          source: "execution",
          confidence: confidence,
          embedding: await embeddings.embed(
            `Memory-Aware ${reasoningType || "reasoning"}: ${query}`,
          ),
          lastUsed: Date.now(),
          decay: 0.01,
          belief: false,
          mergedFrom: [],
          expiresAt: null,
          sessionId: null,
          features: {
            reasoningType: reasoningType || "general",
            task,
            query,
            memoryContextCount: memoryContext.length,
            reasoningResult: reasoningResult,
          },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  reasoningResult,
                  memoryContext,
                  memoryId: memoryAwareMemory.id,
                  contextCount: memoryContext.length,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      case "decision_patterns": {
        const { timeWindow, minOccurrences, patternType } = args as any;
        const now = Date.now();
        const windowStart = now - timeWindow * 24 * 60 * 60 * 1000;

        // Get decision memories within time window
        const decisionMemories = await vssStore.list({
          tags: ["decision", "reasoning"],
          source: "execution",
        });

        const recentDecisions = decisionMemories.filter(
          (m) => m.createdAt >= windowStart,
        );

        // Analyze patterns based on type
        let patterns: any = {};

        switch (patternType) {
          case "success":
            patterns = analyzeSuccessPatterns(recentDecisions, minOccurrences);
            break;
          case "confidence":
            patterns = analyzeConfidencePatterns(recentDecisions);
            break;
          case "topics":
            patterns = analyzeTopicPatterns(recentDecisions);
            break;
          default:
            patterns = analyzeGeneralPatterns(recentDecisions, minOccurrences);
        }

        // Store pattern analysis
        const patternMemory = await vssStore.create({
          text: `Decision Pattern Analysis (${patternType}): ${Object.keys(patterns).length} patterns found`,
          tags: ["pattern-analysis", "decision", "insights"],
          importance: 0.9,
          type: "semantic",
          source: "execution",
          confidence: 0.8,
          embedding: await embeddings.embed(
            `Decision Pattern Analysis: ${patternType}`,
          ),
          lastUsed: Date.now(),
          decay: 0.005,
          belief: true,
          mergedFrom: [],
          expiresAt: null,
          sessionId: null,
          features: {
            patternType,
            timeWindow,
            totalDecisions: recentDecisions.length,
            patterns,
          },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  patterns,
                  analysis: {
                    timeWindow,
                    totalDecisions: recentDecisions.length,
                    patternType,
                  },
                  memoryId: patternMemory.id,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      // Smart-Thinking improvements
      case "reasoning_step": {
        const {
          action,
          stepId,
          kind,
          label,
          description,
          parents,
          details,
          justification,
          sessionId,
        } = args as any;
        const now = Date.now();
        const stepIdValue = stepId || randomUUID();
        const sessionIdValue = sessionId || "default";

        if (action === "start") {
          const id = randomUUID();
          vssStore.db
            .prepare(
              `
            INSERT INTO reasoning_steps 
            (id, session_id, step_id, kind, label, description, status, started_at, parents, details, justifications)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
            )
            .run(
              id,
              sessionIdValue,
              stepIdValue,
              kind || "general",
              label || null,
              description || null,
              "in_progress",
              now,
              JSON.stringify(parents || []),
              JSON.stringify(details || {}),
              JSON.stringify([]),
            );

          // Store as episodic memory
          const stepMemory = await vssStore.create({
            text: `Reasoning Step: ${label || stepIdValue} - ${description || "No description"}`,
            tags: ["reasoning", "step", kind || "general"],
            importance: 0.6,
            type: "episodic",
            source: "execution",
            confidence: 1.0,
            embedding: await embeddings.embed(
              `Reasoning Step: ${label || stepIdValue}`,
            ),
            lastUsed: now,
            decay: 0.01,
            belief: false,
            mergedFrom: [],
            expiresAt: null,
            sessionId: sessionIdValue,
            features: {
              reasoningStepId: stepIdValue,
              kind: kind || "general",
              status: "in_progress",
              parents: parents || [],
            },
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    stepId: stepIdValue,
                    status: "started",
                    memoryId: stepMemory.id,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        } else if (action === "complete") {
          const step = vssStore.db
            .prepare(
              "SELECT * FROM reasoning_steps WHERE step_id = ? AND session_id = ?",
            )
            .get(stepIdValue, sessionIdValue) as any;
          if (!step) {
            throw new Error(`Step not found: ${stepIdValue}`);
          }

          const completedAt = now;
          const duration = completedAt - step.started_at;

          vssStore.db
            .prepare(
              `
            UPDATE reasoning_steps 
            SET status = ?, completed_at = ?, duration = ?, details = ?
            WHERE step_id = ? AND session_id = ?
          `,
            )
            .run(
              "completed",
              completedAt,
              duration,
              JSON.stringify({
                ...JSON.parse(step.details || "{}"),
                ...(details || {}),
              }),
              stepIdValue,
              sessionIdValue,
            );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  { stepId: stepIdValue, status: "completed", duration },
                  null,
                  2,
                ),
              },
            ],
          };
        } else if (action === "fail") {
          const step = vssStore.db
            .prepare(
              "SELECT * FROM reasoning_steps WHERE step_id = ? AND session_id = ?",
            )
            .get(stepIdValue, sessionIdValue) as any;
          if (!step) {
            throw new Error(`Step not found: ${stepIdValue}`);
          }

          vssStore.db
            .prepare(
              `
            UPDATE reasoning_steps 
            SET status = ?, details = ?
            WHERE step_id = ? AND session_id = ?
          `,
            )
            .run(
              "failed",
              JSON.stringify({
                ...JSON.parse(step.details || "{}"),
                error: details?.error || "Unknown error",
              }),
              stepIdValue,
              sessionIdValue,
            );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  { stepId: stepIdValue, status: "failed" },
                  null,
                  2,
                ),
              },
            ],
          };
        } else if (action === "add_justification") {
          const step = vssStore.db
            .prepare(
              "SELECT * FROM reasoning_steps WHERE step_id = ? AND session_id = ?",
            )
            .get(stepIdValue, sessionIdValue) as any;
          if (!step) {
            throw new Error(`Step not found: ${stepIdValue}`);
          }

          const justifications = JSON.parse(step.justifications || "[]");
          justifications.push({
            summary: justification?.summary || "",
            heuristics: justification?.heuristics || [],
            timestamp: justification?.timestamp || new Date().toISOString(),
          });

          vssStore.db
            .prepare(
              `
            UPDATE reasoning_steps 
            SET justifications = ?
            WHERE step_id = ? AND session_id = ?
          `,
            )
            .run(JSON.stringify(justifications), stepIdValue, sessionIdValue);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  { stepId: stepIdValue, justificationAdded: true },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        throw new Error(`Unknown action: ${action}`);
      }

      case "memory_connect": {
        const {
          sourceId,
          targetId,
          connectionType,
          strength,
          description,
          inferred,
          inferenceConfidence,
        } = args as any;
        const connection = await connectionService.createConnection(
          sourceId,
          targetId,
          connectionType,
          { strength, description, inferred, inferenceConfidence },
        );

        return {
          content: [
            { type: "text", text: JSON.stringify(connection, null, 2) },
          ],
        };
      }

      case "verify_memory": {
        const {
          memoryId,
          forceVerification,
          containsCalculations,
          useTruthAdaptation,
          checkMemoriesFirst,
          useGonSearch,
          gonSearchProfile,
        } = args as any;

        const verificationResult = await verificationService.verifyMemory(
          memoryId,
          {
            forceVerification,
            containsCalculations,
            useTruthAdaptation,
            checkMemoriesFirst,
            useGonSearch,
            gonSearchProfile,
          },
        );

        return {
          content: [
            { type: "text", text: JSON.stringify(verificationResult, null, 2) },
          ],
        };
      }

      case "evaluate_memory_quality": {
        const { memoryId, context } = args as any;
        const memory = await vssStore.get(memoryId);

        // Heuristic quality evaluation
        let confidence = memory.confidence || 0.5;
        let relevance = 0.5;
        let quality = 0.5;

        // Confidence: based on certainty markers, factual claims, sources
        if (
          memory.text.includes("definitely") ||
          memory.text.includes("certainly")
        ) {
          confidence = Math.min(1.0, confidence + 0.2);
        }
        if (memory.features?.verification?.status === "verified") {
          confidence = Math.min(1.0, confidence + 0.3);
        }

        // Relevance: based on semantic similarity to context
        if (context) {
          const contextVec = await embeddings.embed(context);
          const similarity = cosine(memory.embedding, contextVec);
          relevance = similarity;
        } else {
          relevance = 0.5;
        }

        // Quality: based on structure, clarity, completeness
        const textLength = memory.text.length;
        if (textLength > 50 && textLength < 500) {
          quality = 0.7;
        } else if (textLength >= 500) {
          quality = 0.9;
        } else {
          quality = 0.4;
        }

        const reliabilityScore = (confidence + relevance + quality) / 3;

        const qualityMetrics = {
          confidence,
          relevance,
          quality,
          reliabilityScore,
        };

        // Update memory features
        await vssStore.updateFeatures(memoryId, {
          ...memory.features,
          quality: qualityMetrics,
        });

        return {
          content: [
            { type: "text", text: JSON.stringify(qualityMetrics, null, 2) },
          ],
        };
      }

      case "save_reasoning_state": {
        const { sessionId, includeConnections } = args as any;

        // Get all memories for session
        const memories = await vssStore.list({ sessionId });

        const stateData: any = {
          memories: memories.map((m) => ({
            id: m.id,
            text: m.text,
            tags: m.tags,
            features: m.features,
          })),
        };

        if (includeConnections) {
          const currentPersonaId = getCurrentPersonaId();
          const allConnections: any[] = [];
          for (const memory of memories) {
            const connections = connectionService.getConnections(
              memory.id,
              currentPersonaId,
            );
            allConnections.push(...connections);
          }
          stateData.connections = allConnections;
        }

        const stateId = randomUUID();
        vssStore.db
          .prepare(
            `
          INSERT INTO reasoning_states (id, session_id, state_data, created_at)
          VALUES (?, ?, ?, ?)
        `,
          )
          .run(stateId, sessionId, JSON.stringify(stateData), Date.now());

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { stateId, sessionId, saved: true },
                null,
                2,
              ),
            },
          ],
        };
      }

      case "load_reasoning_state": {
        const { sessionId } = args as any;

        const state = vssStore.db
          .prepare(
            `
          SELECT * FROM reasoning_states 
          WHERE session_id = ? 
          ORDER BY created_at DESC 
          LIMIT 1
        `,
          )
          .get(sessionId) as any;

        if (!state) {
          throw new Error(`No reasoning state found for session: ${sessionId}`);
        }

        const stateData = JSON.parse(state.state_data);

        return {
          content: [{ type: "text", text: JSON.stringify(stateData, null, 2) }],
        };
      }

      case "suggest_next_steps": {
        const { sessionId, limit, context } = args as any;
        const suggestions: string[] = [];

        // Get recent memories and connections
        const currentPersonaId = getCurrentPersonaId();
        const recentMemories = await vssStore.list({ sessionId });
        const recentConnections = connectionService.getConnections(
          recentMemories[0]?.id || "",
          currentPersonaId,
        );

        // Identify open questions
        const openQuestions = recentMemories.filter(
          (m) =>
            m.text.includes("?") || m.text.toLowerCase().includes("question"),
        );
        if (openQuestions.length > 0) {
          suggestions.push(
            `Answer the open question: "${openQuestions[0].text.substring(0, 50)}..."`,
          );
        }

        // Identify contradictions
        const contradictions = recentConnections.filter(
          (c) => c.connectionType === "contradicts",
        );
        if (contradictions.length > 0) {
          suggestions.push(
            `Resolve contradiction between memories ${contradictions[0].sourceId} and ${contradictions[0].targetId}`,
          );
        }

        // Identify unverified claims
        const unverified = recentMemories.filter(
          (m) =>
            !m.features?.verification ||
            m.features.verification.status === "unverified",
        );
        if (unverified.length > 0) {
          suggestions.push(`Verify the claim in memory ${unverified[0].id}`);
        }

        // Identify missing connections
        if (recentMemories.length >= 2) {
          const mem1 = recentMemories[0];
          const mem2 = recentMemories[1];
          const existing = connectionService
            .getConnections(mem1.id, currentPersonaId)
            .find((c) => c.sourceId === mem2.id || c.targetId === mem2.id);
          if (!existing) {
            suggestions.push(
              `Connect related memories ${mem1.id} and ${mem2.id}`,
            );
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { suggestions: suggestions.slice(0, limit || 3) },
                null,
                2,
              ),
            },
          ],
        };
      }

      case "get_reasoning_trace": {
        const { sessionId } = args as any;

        const steps = vssStore.db
          .prepare(
            `
          SELECT * FROM reasoning_steps 
          WHERE session_id = ? 
          ORDER BY started_at ASC
        `,
          )
          .all(sessionId) as any[];

        const timeline = steps.map((step) => ({
          stepId: step.step_id,
          kind: step.kind,
          label: step.label,
          status: step.status,
          startedAt: step.started_at,
          completedAt: step.completed_at,
          duration: step.duration,
          parents: JSON.parse(step.parents || "[]"),
          justifications: JSON.parse(step.justifications || "[]"),
        }));

        const metrics = {
          totalSteps: steps.length,
          completedSteps: steps.filter((s) => s.status === "completed").length,
          failedSteps: steps.filter((s) => s.status === "failed").length,
          averageDuration:
            steps
              .filter((s) => s.duration)
              .reduce((sum, s) => sum + s.duration, 0) /
              steps.filter((s) => s.duration).length || 0,
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  sessionId,
                  timeline,
                  metrics,
                  summary: `Reasoning trace with ${metrics.totalSteps} steps, ${metrics.completedSteps} completed`,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      // ---- Persona Tools ----
      case "list_personas": {
        const personas = getPersonaConfigList();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(personas, null, 2),
            },
          ],
        };
      }

      case "get_current_persona": {
        const currentId = getCurrentPersonaId();
        const persona = getPersonaConfig(currentId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ id: currentId, ...persona }, null, 2),
            },
          ],
        };
      }

      case "switch_persona": {
        const { personaId } = args as any;
        const personas = getPersonaConfigList();
        const exists = personas.some((p: any) => p.id === personaId);
        if (!exists) {
          throw new Error(`Persona not found: ${personaId}`);
        }
        setCurrentPersonaId(personaId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { success: true, currentPersonaId: personaId },
                null,
                2,
              ),
            },
          ],
        };
      }

      case "get_persona": {
        const { personaId } = args as any;
        const persona = getPersonaConfig(personaId);
        if (!persona) {
          throw new Error(`Persona not found: ${personaId}`);
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ id: personaId, ...persona }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    throw new Error(
      `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
});

// ---- Tool Listing ----
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodToJsonSchema(tool.inputSchema),
    })),
  };
});

// ---- Resource Definitions ----
const resources = [
  {
    uri: "memory:today",
    name: "Today's Memories",
    description: "All notes from today (pinned first)",
    mimeType: "application/json",
  },
];

const resourceTemplates = [
  {
    uriTemplate: "memory:tag/{tag}",
    name: "Tagged Memories",
    description: "Notes under a specific tag (pinned first)",
    mimeType: "application/json",
  },
];

// ---- Resource Handlers ----
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return { resources };
});

server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
  return { resourceTemplates };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === "memory:today") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const items = (await vssStore.list({})).filter(
      (m) => m.createdAt >= +today,
    );
    const sorted = items.sort(
      (a, b) =>
        (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt,
    );
    return {
      contents: [{ type: "text", text: JSON.stringify(sorted, null, 2) }],
    };
  }

  if (uri.startsWith("memory:tag/")) {
    const tag = uri.replace("memory:tag/", "");
    const items = await vssStore.list({ tags: [tag] });
    const sorted = items.sort(
      (a, b) =>
        (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt,
    );
    return {
      contents: [{ type: "text", text: JSON.stringify(sorted, null, 2) }],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

// ---- Pattern Analysis Functions ----
function analyzeSuccessPatterns(
  memories: Memory[],
  minOccurrences: number,
): any {
  const patterns: any = {};

  // Group by topic/decision type
  const topicGroups: { [key: string]: Memory[] } = {};
  memories.forEach((mem) => {
    const topic = mem.features?.topic || "unknown";
    if (!topicGroups[topic]) topicGroups[topic] = [];
    topicGroups[topic].push(mem);
  });

  // Analyze success patterns
  Object.entries(topicGroups).forEach(([topic, decisions]) => {
    if (decisions.length >= minOccurrences) {
      const avgConfidence =
        decisions.reduce((sum, d) => sum + (d.confidence || 0), 0) /
        decisions.length;
      const successRate =
        decisions.filter((d) =>
          (d.features?.result || "").toLowerCase().includes("success"),
        ).length / decisions.length;

      patterns[topic] = {
        totalDecisions: decisions.length,
        averageConfidence: avgConfidence,
        successRate: successRate,
        commonModes: [
          ...new Set(decisions.map((d) => d.features?.mode).filter(Boolean)),
        ],
        recentTrend: decisions
          .slice(-3)
          .map((d) => d.features?.result)
          .filter(Boolean),
      };
    }
  });

  return patterns;
}

function analyzeConfidencePatterns(memories: Memory[]): any {
  const confidenceRanges = {
    high: memories.filter((m) => (m.confidence || 0) >= 0.8).length,
    medium: memories.filter(
      (m) => (m.confidence || 0) >= 0.5 && (m.confidence || 0) < 0.8,
    ).length,
    low: memories.filter((m) => (m.confidence || 0) < 0.5).length,
  };

  const avgConfidence =
    memories.reduce((sum, m) => sum + (m.confidence || 0), 0) / memories.length;
  const confidenceByType: { [key: string]: number[] } = {};

  memories.forEach((mem) => {
    const type = mem.features?.decisionType || "unknown";
    if (!confidenceByType[type]) confidenceByType[type] = [];
    confidenceByType[type].push(mem.confidence || 0);
  });

  const avgConfidenceByType: { [key: string]: number } = {};
  Object.entries(confidenceByType).forEach(([type, confidences]) => {
    avgConfidenceByType[type] =
      confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
  });

  return {
    overallAverage: avgConfidence,
    distribution: confidenceRanges,
    byType: avgConfidenceByType,
    trend: memories
      .slice(-10)
      .map((m) => m.confidence)
      .filter(Boolean),
  };
}

function analyzeTopicPatterns(memories: Memory[]): any {
  const topicCounts: { [key: string]: number } = {};
  const topicConfidence: { [key: string]: number[] } = {};

  memories.forEach((mem) => {
    const topic = mem.features?.topic || "unknown";
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    if (!topicConfidence[topic]) topicConfidence[topic] = [];
    topicConfidence[topic].push(mem.confidence || 0);
  });

  const topicAnalysis: { [key: string]: any } = {};
  Object.entries(topicCounts).forEach(([topic, count]) => {
    const confidences = topicConfidence[topic];
    topicAnalysis[topic] = {
      frequency: count,
      averageConfidence:
        confidences.reduce((sum, c) => sum + c, 0) / confidences.length,
      confidenceRange: {
        min: Math.min(...confidences),
        max: Math.max(...confidences),
      },
    };
  });

  return {
    mostFrequent: Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5),
    analysis: topicAnalysis,
    totalUniqueTopics: Object.keys(topicCounts).length,
  };
}

function analyzeGeneralPatterns(
  memories: Memory[],
  minOccurrences: number,
): any {
  return {
    totalDecisions: memories.length,
    timeSpan:
      memories.length > 0
        ? {
            earliest: new Date(
              Math.min(...memories.map((m) => m.createdAt)),
            ).toISOString(),
            latest: new Date(
              Math.max(...memories.map((m) => m.createdAt)),
            ).toISOString(),
          }
        : null,
    averageConfidence:
      memories.reduce((sum, m) => sum + (m.confidence || 0), 0) /
      memories.length,
    decisionTypes: [
      ...new Set(memories.map((m) => m.features?.decisionType).filter(Boolean)),
    ],
    sourceDistribution: memories.reduce(
      (acc, m) => {
        acc[m.source] = (acc[m.source] || 0) + 1;
        return acc;
      },
      {} as { [key: string]: number },
    ),
  };
}

// ---- Connect transport ----
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[MCP] axerey server running via stdio");
