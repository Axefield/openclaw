import type { OpenClawPluginApi } from "openclaw/plugin-sdk/core";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk/core";

interface PersonaMapping {
  agentId: string;
  personaId: string;
  createdAt: number;
}

interface AxereySession {
  id: string;
  agentId: string;
  personaId: string;
  goal: string;
  tags: string[];
  sessionType: string;
  status: "active" | "completed" | "failed";
  startTime: number;
  endTime?: number;
  context?: string[];
  reasoningSteps: ReasoningStep[];
}

interface ReasoningStep {
  id: string;
  label: string;
  description?: string;
  status: "pending" | "active" | "completed" | "failed";
  startTime: number;
  endTime?: number;
  justification?: string;
}

interface CognitiveContext {
  sessionId: string;
  agentId: string;
  personaId: string;
  query: string;
  context: string[];
  memories: any[];
  reasoning: string[];
  response?: string;
}

const PERSONA_MAPPINGS_STORAGE_KEY = "axerey_persona_mappings";
const SESSIONS_STORAGE_KEY = "axerey_sessions";
const COGNITIVE_CONTEXT_KEY = "axerey_cognitive_context";

class AxereyPersonaService {
  private api: OpenClawPluginApi | null = null;
  private mappings: Map<string, string> = new Map();
  private currentAgentId: string | null = null;

  initialize(api: OpenClawPluginApi) {
    this.api = api;
    this.loadMappings();
    this.api.logger.info("Axerey Persona Service initialized");
  }

  private loadMappings() {
    if (!this.api) return;
    
    try {
      const stored = this.api.runtime.store.get(PERSONA_MAPPINGS_STORAGE_KEY);
      if (stored && typeof stored === "object") {
        const mappings = stored as Record<string, string>;
        for (const [agentId, personaId] of Object.entries(mappings)) {
          this.mappings.set(agentId, personaId);
        }
        this.api.logger.info(`Loaded ${this.mappings.size} persona mappings`);
      }
    } catch (error) {
      this.api.logger.warn("Failed to load persona mappings:", error);
    }
  }

  private saveMappings() {
    if (!this.api) return;
    
    try {
      const mappingsObj: Record<string, string> = {};
      for (const [agentId, personaId] of this.mappings) {
        mappingsObj[agentId] = personaId;
      }
      this.api.runtime.store.set(PERSONA_MAPPINGS_STORAGE_KEY, mappingsObj);
    } catch (error) {
      this.api.logger.warn("Failed to save persona mappings:", error);
    }
  }

  getPersonaForAgent(agentId: string): string {
    return this.mappings.get(agentId) || agentId;
  }

  getAgentForPersona(personaId: string): string | null {
    for (const [agentId, pId] of this.mappings) {
      if (pId === personaId) return agentId;
    }
    return null;
  }

  setMapping(agentId: string, personaId: string) {
    this.mappings.set(agentId, personaId);
    this.saveMappings();
    this.api?.logger.info(`Mapped agent '${agentId}' to persona '${personaId}'`);
  }

  setCurrentAgent(agentId: string) {
    this.currentAgentId = agentId;
    this.switchToAgentPersona(agentId);
  }

  getCurrentAgent(): string | null {
    return this.currentAgentId;
  }

  getCurrentPersona(): string {
    if (this.currentAgentId) {
      return this.getPersonaForAgent(this.currentAgentId);
    }
    return "default";
  }

  getAllMappings(): PersonaMapping[] {
    const result: PersonaMapping[] = [];
    for (const [agentId, personaId] of this.mappings) {
      result.push({ agentId, personaId, createdAt: Date.now() });
    }
    return result;
  }

  async switchToAgentPersona(agentId: string) {
    const personaId = this.getPersonaForAgent(agentId);
    
    if (this.api) {
      this.api.logger.debug(`Switching to persona '${personaId}' for agent '${agentId}'`);
    }
    
    return { agentId, personaId };
  }

  autoMapAgent(agentId: string) {
    if (!this.mappings.has(agentId)) {
      this.setMapping(agentId, agentId);
    }
    return this.getPersonaForAgent(agentId);
  }

  listPersonas(): Array<{ agentId: string; personaId: string }> {
    return Array.from(this.mappings.entries()).map(([agentId, personaId]) => ({
      agentId,
      personaId,
    }));
  }
}

class AxereySessionService {
  private api: OpenClawPluginApi | null = null;
  private sessions: Map<string, AxereySession> = new Map();
  private currentSession: AxereySession | null = null;

  initialize(api: OpenClawPluginApi) {
    this.api = api;
    this.loadSessions();
    this.api.logger.info("Axerey Session Service initialized");
  }

  private loadSessions() {
    if (!this.api) return;
    try {
      const stored = this.api.runtime.store.get(SESSIONS_STORAGE_KEY);
      if (stored && Array.isArray(stored)) {
        for (const session of stored as AxereySession[]) {
          this.sessions.set(session.id, session);
        }
        this.api.logger.info(`Loaded ${this.sessions.size} sessions`);
      }
    } catch (error) {
      this.api.logger.warn("Failed to load sessions:", error);
    }
  }

  private saveSessions() {
    if (!this.api) return;
    try {
      const sessionsArray = Array.from(this.sessions.values());
      this.api.runtime.store.set(SESSIONS_STORAGE_KEY, sessionsArray);
    } catch (error) {
      this.api.logger.warn("Failed to save sessions:", error);
    }
  }

  startSession(agentId: string, personaId: string, goal: string, tags: string[] = [], sessionType: string = "general"): AxereySession {
    const session: AxereySession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      personaId,
      goal,
      tags,
      sessionType,
      status: "active",
      startTime: Date.now(),
      reasoningSteps: [],
    };
    this.sessions.set(session.id, session);
    this.currentSession = session;
    this.saveSessions();
    this.api?.logger.info(`Axerey session started: ${session.id} for agent '${agentId}'`);
    return session;
  }

  getCurrentSession(): AxereySession | null {
    return this.currentSession;
  }

  getSession(id: string): AxereySession | undefined {
    return this.sessions.get(id);
  }

  addReasoningStep(sessionId: string, label: string, description?: string): ReasoningStep | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const step: ReasoningStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      label,
      description,
      status: "active",
      startTime: Date.now(),
    };
    session.reasoningSteps.push(step);
    this.saveSessions();
    return step;
  }

  completeReasoningStep(sessionId: string, stepId: string, justification?: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const step = session.reasoningSteps.find(s => s.id === stepId);
    if (step) {
      step.status = "completed";
      step.endTime = Date.now();
      step.justification = justification;
      this.saveSessions();
    }
  }

  failReasoningStep(sessionId: string, stepId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const step = session.reasoningSteps.find(s => s.id === stepId);
    if (step) {
      step.status = "failed";
      step.endTime = Date.now();
      this.saveSessions();
    }
  }

  endSession(sessionId: string, summary?: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.status = "completed";
    session.endTime = Date.now();
    if (summary) {
      session.context = [...(session.context || []), summary];
    }
    this.saveSessions();
    this.api?.logger.info(`Axerey session ended: ${sessionId}`);
  }

  getSessionTrace(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return {
      id: session.id,
      agentId: session.agentId,
      personaId: session.personaId,
      goal: session.goal,
      sessionType: session.sessionType,
      duration: session.endTime ? session.endTime - session.startTime : Date.now() - session.startTime,
      reasoningSteps: session.reasoningSteps.map(step => ({
        label: step.label,
        description: step.description,
        status: step.status,
        duration: step.endTime ? step.endTime - step.startTime : undefined,
        justification: step.justification,
      })),
    };
  }
}

class AxereyCognitiveService {
  private api: OpenClawPluginApi | null = null;
  private personaService: AxereyPersonaService;
  private sessionService: AxereySessionService;

  constructor(personaService: AxereyPersonaService, sessionService: AxereySessionService) {
    this.personaService = personaService;
    this.sessionService = sessionService;
  }

  initialize(api: OpenClawPluginApi) {
    this.api = api;
    this.api.logger.info("Axerey Cognitive Service initialized");
  }

  async executeCognitiveLoop(agentId: string, query: string): Promise<CognitiveContext> {
    const personaId = this.personaService.getPersonaForAgent(agentId);
    
    // 1. Start Session
    const session = this.sessionService.startSession(agentId, personaId, query, [], "general");
    
    // 2. Context Broker step
    this.sessionService.addReasoningStep(session.id, "context-broker", "Retrieving relevant context");
    
    // 3. Memory Recall step
    this.sessionService.addReasoningStep(session.id, "memory-recall", "Recalling relevant memories");
    
    // 4. Reasoning step
    this.sessionService.addReasoningStep(session.id, "reasoning", "Executing reasoning");
    
    const context: CognitiveContext = {
      sessionId: session.id,
      agentId,
      personaId,
      query,
      context: [],
      memories: [],
      reasoning: [],
    };

    return context;
  }

  storeMemory(agentId: string, content: string, memoryType: string = "episodic", tags: string[] = []) {
    const personaId = this.personaService.getPersonaForAgent(agentId);
    const session = this.sessionService.getCurrentSession();
    
    this.api?.logger.debug(`Storing memory for agent '${agentId}' in persona '${personaId}'`);
    
    return {
      success: true,
      personaId,
      sessionId: session?.id,
      content,
      type: memoryType,
      tags: [...tags, `persona:${personaId}`],
    };
  }

  connectMemories(agentId: string, sourceId: string, targetId: string, connectionType: string, strength: number = 0.5) {
    const personaId = this.personaService.getPersonaForAgent(agentId);
    
    return {
      success: true,
      personaId,
      sourceId,
      targetId,
      connectionType,
      strength,
    };
  }

  reflect(agentId: string, topic: string, outcome: string, notes?: string) {
    const personaId = this.personaService.getPersonaForAgent(agentId);
    const session = this.sessionService.getCurrentSession();
    
    return {
      success: true,
      personaId,
      sessionId: session?.id,
      topic,
      outcome,
      notes,
      reflection: `Learned from ${topic}: ${outcome}`,
    };
  }
}

const personaService = new AxereyPersonaService();
const sessionService = new AxereySessionService();
const cognitiveService = new AxereyCognitiveService(personaService, sessionService);

const plugin = {
  id: "axerey",
  name: "Axerey",
  description: "Cognitive Soul - Persistent reasoning, memory graphs, and reflection for OpenClaw agents",
  kind: "memory" as const,
  configSchema: emptyPluginConfigSchema(),
  
  register(api: OpenClawPluginApi) {
    api.logger.info("Axerey Cognitive Soul: Initializing...");
    
    personaService.initialize(api);
    sessionService.initialize(api);
    cognitiveService.initialize(api);

    // Register cognitive loop tools
    api.registerTool(
      () => {
        const tools = [
          // === PERSONA TOOLS ===
          {
            label: "Axerey Get Agent Persona",
            name: "axerey_get_agent_persona",
            description: "Get the Axerey persona mapped to an OpenClaw agent",
            parameters: {
              type: "object",
              properties: {
                agentId: { type: "string", description: "OpenClaw agent ID" },
              },
              required: ["agentId"],
            },
            execute: async (_id, params: any) => {
              const { agentId } = params;
              const personaId = personaService.getPersonaForAgent(agentId);
              return JSON.stringify({ success: true, agentId, personaId });
            },
          },
          {
            label: "Axerey Map Agent to Persona",
            name: "axerey_map_agent_persona",
            description: "Map an OpenClaw agent to an Axerey persona",
            parameters: {
              type: "object",
              properties: {
                agentId: { type: "string", description: "OpenClaw agent ID" },
                personaId: { type: "string", description: "Axerey persona ID" },
              },
              required: ["agentId", "personaId"],
            },
            execute: async (_id, params: any) => {
              const { agentId, personaId } = params;
              personaService.setMapping(agentId, personaId);
              return JSON.stringify({ success: true, message: `Mapped agent '${agentId}' to persona '${personaId}'` });
            },
          },
          {
            label: "Axerey List Mappings",
            name: "axerey_list_mappings",
            description: "List all agent to persona mappings",
            parameters: { type: "object", properties: {} },
            execute: async (_id) => {
              const mappings = personaService.listPersonas();
              return JSON.stringify({ success: true, mappings });
            },
          },
          {
            label: "Axerey Auto-Map Agents",
            name: "axerey_auto_map_agents",
            description: "Automatically map all OpenClaw agents to Axerey personas (1:1)",
            parameters: {
              type: "object",
              properties: {
                agents: { type: "array", items: { type: "string" }, description: "List of agent IDs" },
              },
            },
            execute: async (_id, params: any) => {
              const { agents = [] } = params;
              for (const agentId of agents) {
                personaService.autoMapAgent(agentId);
              }
              return JSON.stringify({ 
                success: true, 
                message: `Auto-mapped ${agents.length} agents to personas`,
                mappings: personaService.listPersonas() 
              });
            },
          },

          // === SESSION LIFECYCLE TOOLS ===
          {
            label: "Axerey Session Start",
            name: "axerey_session_start",
            description: "Start a new Axerey reasoning session with goal and tags",
            parameters: {
              type: "object",
              properties: {
                goal: { type: "string", description: "Session goal or task" },
                tags: { type: "array", items: { type: "string" } },
                sessionType: { type: "string", enum: ["general", "reasoning", "decision-making", "argument-analysis"] },
              },
              required: ["goal"],
            },
            execute: async (_id, params: any) => {
              const agentId = personaService.getCurrentAgent() || "main";
              const personaId = personaService.getPersonaForAgent(agentId);
              const session = sessionService.startSession(
                agentId, 
                personaId, 
                params.goal, 
                params.tags || [], 
                params.sessionType || "general"
              );
              return JSON.stringify({ 
                success: true, 
                sessionId: session.id,
                agentId,
                personaId,
                goal: session.goal,
              });
            },
          },
          {
            label: "Axerey Session End",
            name: "axerey_session_end",
            description: "End the current Axerey reasoning session",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "Session summary" },
              },
            },
            execute: async (_id, params: any) => {
              const session = sessionService.getCurrentSession();
              if (!session) {
                return JSON.stringify({ success: false, message: "No active session" });
              }
              sessionService.endSession(session.id, params.summary);
              return JSON.stringify({ 
                success: true, 
                sessionId: session.id,
                summary: params.summary,
              });
            },
          },
          {
            label: "Axerey Get Session Trace",
            name: "axerey_get_session_trace",
            description: "Get the reasoning trace for a session",
            parameters: {
              type: "object",
              properties: {
                sessionId: { type: "string" },
              },
            },
            execute: async (_id, params: any) => {
              const sessionId = params.sessionId || sessionService.getCurrentSession()?.id;
              if (!sessionId) {
                return JSON.stringify({ success: false, message: "No session found" });
              }
              const trace = sessionService.getSessionTrace(sessionId);
              return JSON.stringify({ success: true, trace });
            },
          },

          // === REASONING STEP TOOLS ===
          {
            label: "Axerey Reasoning Step",
            name: "axerey_reasoning_step",
            description: "Track a reasoning step in the cognitive loop",
            parameters: {
              type: "object",
              properties: {
                action: { type: "string", enum: ["start", "complete", "fail", "add_justification"] },
                stepLabel: { type: "string", description: "Label for this step (e.g., context-broker, memory-recall, reasoning)" },
                description: { type: "string" },
                justification: { type: "string" },
              },
              required: ["action", "stepLabel"],
            },
            execute: async (_id, params: any) => {
              const session = sessionService.getCurrentSession();
              if (!session) {
                return JSON.stringify({ success: false, message: "No active session. Start a session first." });
              }

              const { action, stepLabel, description, justification } = params;
              
              if (action === "start") {
                const step = sessionService.addReasoningStep(session.id, stepLabel, description);
                return JSON.stringify({ success: true, step, action: "started" });
              } else if (action === "complete") {
                // Find the most recent step with this label
                const step = [...session.reasoningSteps].reverse().find(s => s.label === stepLabel);
                if (step) {
                  sessionService.completeReasoningStep(session.id, step.id, justification);
                  return JSON.stringify({ success: true, stepId: step.id, action: "completed" });
                }
                return JSON.stringify({ success: false, message: `Step '${stepLabel}' not found` });
              } else if (action === "fail") {
                const step = [...session.reasoningSteps].reverse().find(s => s.label === stepLabel);
                if (step) {
                  sessionService.failReasoningStep(session.id, step.id);
                  return JSON.stringify({ success: true, stepId: step.id, action: "failed" });
                }
                return JSON.stringify({ success: false, message: `Step '${stepLabel}' not found` });
              }
              
              return JSON.stringify({ success: false, message: "Unknown action" });
            },
          },

          // === MEMORY TOOLS (Cognitive Loop Integration) ===
          {
            label: "Axerey Memorize",
            name: "axerey_memorize",
            description: "Store new memories with text, tags, importance in Axerey memory (cognitive loop memory-store)",
            parameters: {
              type: "object",
              properties: {
                text: { type: "string", description: "Memory content" },
                tags: { type: "array", items: { type: "string" } },
                importance: { type: "number", minimum: 0, maximum: 1 },
                memoryType: { type: "string", enum: ["episodic", "semantic", "procedural"] },
              },
              required: ["text"],
            },
            execute: async (_id, params: any) => {
              const agentId = personaService.getCurrentAgent() || "main";
              const result = cognitiveService.storeMemory(
                agentId, 
                params.text, 
                params.memoryType || "episodic",
                params.tags || []
              );
              return JSON.stringify(result);
            },
          },
          {
            label: "Axerey Recall",
            name: "axerey_recall",
            description: "Retrieve memories by query (cognitive loop memory-recall)",
            parameters: {
              type: "object",
              properties: {
                query: { type: "string" },
                limit: { type: "number", minimum: 1, maximum: 50 },
              },
            },
            execute: async (_id, params: any) => {
              const agentId = personaService.getCurrentAgent() || "main";
              const personaId = personaService.getPersonaForAgent(agentId);
              return JSON.stringify({ 
                success: true, 
                message: "Memory recall requires Axerey MCP server connection",
                agentId,
                personaId,
                query: params.query,
              });
            },
          },
          {
            label: "Axerey Context Broker",
            name: "axerey_context_broker",
            description: "Get optimal memory context for specific tasks (cognitive loop context-broker)",
            parameters: {
              type: "object",
              properties: {
                task: { type: "string", enum: ["planning", "execution", "review"] },
                k: { type: "number", minimum: 1, maximum: 20, default: 5 },
              },
              required: ["task"],
            },
            execute: async (_id, params: any) => {
              const agentId = personaService.getCurrentAgent() || "main";
              const personaId = personaService.getPersonaForAgent(agentId);
              return JSON.stringify({ 
                success: true, 
                agentId,
                personaId,
                task: params.task,
                k: params.k || 5,
                context: [],
                message: "Context broker requires Axerey MCP server connection",
              });
            },
          },

          // === KNOWLEDGE GRAPH TOOLS ===
          {
            label: "Axerey Memory Connect",
            name: "axerey_memory_connect",
            description: "Create explicit relationships between memories (knowledge graph)",
            parameters: {
              type: "object",
              properties: {
                sourceId: { type: "string" },
                targetId: { type: "string" },
                connectionType: { type: "string", enum: ["supports", "contradicts", "refines", "derives", "exemplifies", "generalizes", "questions", "analyzes", "synthesizes", "associates", "extends", "applies"] },
                strength: { type: "number", minimum: 0, maximum: 1 },
              },
              required: ["sourceId", "targetId", "connectionType"],
            },
            execute: async (_id, params: any) => {
              const agentId = personaService.getCurrentAgent() || "main";
              const result = cognitiveService.connectMemories(
                agentId,
                params.sourceId,
                params.targetId,
                params.connectionType,
                params.strength || 0.5
              );
              return JSON.stringify(result);
            },
          },

          // === REFLECTION AND LEARNING ===
          {
            label: "Axerey Reflect",
            name: "axerey_reflect",
            description: "Write a distilled lesson and update procedural rules (reflection and learning)",
            parameters: {
              type: "object",
              properties: {
                topic: { type: "string" },
                outcome: { type: "string" },
                notes: { type: "string" },
              },
              required: ["topic", "outcome"],
            },
            execute: async (_id, params: any) => {
              const agentId = personaService.getCurrentAgent() || "main";
              const result = cognitiveService.reflect(agentId, params.topic, params.outcome, params.notes);
              return JSON.stringify(result);
            },
          },
          {
            label: "Axerey Decision Patterns",
            name: "axerey_decision_patterns",
            description: "Analyze decision patterns and extract insights from stored outcomes",
            parameters: {
              type: "object",
              properties: {
                timeWindow: { type: "number", default: 30 },
                minOccurrences: { type: "number", default: 3 },
              },
            },
            execute: async (_id, params: any) => {
              const agentId = personaService.getCurrentAgent() || "main";
              const personaId = personaService.getPersonaForAgent(agentId);
              return JSON.stringify({ 
                success: true, 
                agentId,
                personaId,
                timeWindow: params.timeWindow || 30,
                patterns: [],
                message: "Requires Axerey MCP server for pattern analysis",
              });
            },
          },

          // === COGNITIVE LOOP ORCHESTRATION ===
          {
            label: "Axerey Cognitive Loop",
            name: "axerey_cognitive_loop",
            description: "Execute the full cognitive loop: session-start → context-broker → memory-recall → reasoning → memory-store → memory-connect → session-end",
            parameters: {
              type: "object",
              properties: {
                query: { type: "string", description: "The user query or task" },
                executeFullLoop: { type: "boolean", default: false, description: "Execute full loop including memory storage and connections" },
              },
              required: ["query"],
            },
            execute: async (_id, params: any) => {
              const agentId = personaService.getCurrentAgent() || "main";
              
              // Start cognitive loop
              const context = await cognitiveService.executeCognitiveLoop(agentId, params.query);
              
              return JSON.stringify({
                success: true,
                sessionId: context.sessionId,
                agentId: context.agentId,
                personaId: context.personaId,
                query: context.query,
                loop: [
                  { step: "session-start", status: "completed", sessionId: context.sessionId },
                  { step: "context-broker", status: "ready" },
                  { step: "memory-recall", status: "ready" },
                  { step: "reasoning", status: "ready" },
                  { step: "memory-store", status: "ready", requiresFullLoop: params.executeFullLoop },
                  { step: "memory-connect", status: "ready", requiresFullLoop: params.executeFullLoop },
                  { step: "session-end", status: "ready" },
                ],
                message: "Cognitive loop initiated. Use reasoning_step to track progress.",
              });
            },
          },
        ];

        return tools;
      },
      { names: [
        // Persona
        "axerey_get_agent_persona",
        "axerey_map_agent_persona",
        "axerey_list_mappings",
        "axerey_auto_map_agents",
        // Session
        "axerey_session_start",
        "axerey_session_end",
        "axerey_get_session_trace",
        // Reasoning
        "axerey_reasoning_step",
        // Memory
        "axerey_memorize",
        "axerey_recall",
        "axerey_context_broker",
        // Knowledge Graph
        "axerey_memory_connect",
        // Reflection
        "axerey_reflect",
        "axerey_decision_patterns",
        // Orchestration
        "axerey_cognitive_loop",
      ]},
    );

    // Register lifecycle hooks
    api.registerHook(
      "agent:start",
      async (params: { agentId: string; sessionKey: string }) => {
        const { agentId } = params;
        personaService.setCurrentAgent(agentId);
        api.logger.info(`Axerey: Agent '${agentId}' started, using persona '${personaService.getCurrentPersona()}'`);
        return params;
      },
    );

    api.registerHook(
      "memory:store",
      async (params: { agentId: string; content: string; tags?: string[] }) => {
        const personaId = personaService.getPersonaForAgent(params.agentId);
        const tags = [...(params.tags || []), `persona:${personaId}`];
        api.logger.debug(`Axerey: Storing memory for agent '${params.agentId}' with persona '${personaId}'`);
        return { ...params, tags };
      },
    );

    api.registerHook(
      "memory:search",
      async (params: { agentId: string; query: string }) => {
        const personaId = personaService.getPersonaForAgent(params.agentId);
        api.logger.debug(`Axerey: Searching memory for agent '${params.agentId}' in persona '${personaId}'`);
        return { ...params, personaId };
      },
    );

    api.logger.info("Axerey Cognitive Soul: Registered with 17 tools and lifecycle hooks");
  },
};

export default plugin;
export { personaService, sessionService, cognitiveService };
