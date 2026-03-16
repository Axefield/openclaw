import type {
  ApiResponse,
  Memory,
  ThinkingSession,
  Decision,
  ArgumentAnalysis,
  Persona,
  PersonaConfig,
  MemoryConnection,
  ReasoningStep,
  VerificationResult,
  QualityMetrics,
} from "../types/index";

// Use relative URL when Vite proxy is configured, otherwise use full URL
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      // Check if response has content
      const contentType = response.headers.get("content-type");
      const hasJsonContent =
        contentType && contentType.includes("application/json");

      let data: any = {};
      if (hasJsonContent) {
        const text = await response.text();
        if (text) {
          try {
            data = JSON.parse(text);
          } catch (parseError) {
            return {
              success: false,
              error: `Invalid JSON response: ${text.substring(0, 100)}`,
            };
          }
        }
      }

      if (!response.ok) {
        return {
          success: false,
          error:
            data.message ||
            data.error ||
            `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      // Handle both direct data and wrapped responses
      if (data.success !== undefined) {
        return {
          success: data.success,
          data: data.data,
          error: data.error,
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  // Memory operations
  async getMemories(limit: number = 50): Promise<ApiResponse<Memory[]>> {
    return this.request<Memory[]>(`/memories?limit=${limit}`);
  }

  async getMemory(id: string): Promise<ApiResponse<Memory>> {
    return this.request<Memory>(`/memories/${id}`);
  }

  async createMemory(memory: Omit<Memory, "id">): Promise<ApiResponse<Memory>> {
    return this.request<Memory>("/memories", {
      method: "POST",
      body: JSON.stringify(memory),
    });
  }

  async updateMemory(
    id: string,
    updates: Partial<Memory>,
  ): Promise<ApiResponse<Memory>> {
    return this.request<Memory>(`/memories/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async searchMemories(
    query: string,
    limit: number = 10,
  ): Promise<ApiResponse<Memory[]>> {
    return this.request<Memory[]>("/memories/search", {
      method: "POST",
      body: JSON.stringify({ query, limit }),
    });
  }

  // Thinking sessions
  async getThinkingSessions(): Promise<ApiResponse<ThinkingSession[]>> {
    return this.request<ThinkingSession[]>("/thinking-sessions");
  }

  async createThinkingSession(
    session: Omit<ThinkingSession, "id">,
  ): Promise<ApiResponse<ThinkingSession>> {
    return this.request<ThinkingSession>("/thinking-sessions", {
      method: "POST",
      body: JSON.stringify(session),
    });
  }

  async updateThinkingSession(
    id: string,
    updates: Partial<ThinkingSession>,
  ): Promise<ApiResponse<ThinkingSession>> {
    return this.request<ThinkingSession>(`/thinking-sessions/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  // Decisions
  async getDecisions(): Promise<ApiResponse<Decision[]>> {
    return this.request<Decision[]>("/decisions");
  }

  async createDecision(
    decision: Omit<Decision, "id">,
  ): Promise<ApiResponse<Decision>> {
    return this.request<Decision>("/decisions", {
      method: "POST",
      body: JSON.stringify(decision),
    });
  }

  // Angel/Demon Balance
  async calculateAngelDemonBalance(
    topic: string,
    theta: number = 45,
    phi: number = 30,
    cosine: number = 0.5,
    tangent: number = 0.3,
    mode: string = "blend",
  ): Promise<ApiResponse<any>> {
    return this.request<any>("/reasoning/angel-demon-balance", {
      method: "POST",
      body: JSON.stringify({ topic, theta, phi, cosine, tangent, mode }),
    });
  }

  // Argument Analysis
  async analyzeArgument(
    claim: string,
    context?: string,
  ): Promise<ApiResponse<ArgumentAnalysis>> {
    return this.request<ArgumentAnalysis>("/reasoning/argument-analysis", {
      method: "POST",
      body: JSON.stringify({ claim, context }),
    });
  }

  async steelmanArgument(
    claim: string,
    assumptions?: string[],
  ): Promise<ApiResponse<ArgumentAnalysis>> {
    return this.request<ArgumentAnalysis>("/reasoning/steelman", {
      method: "POST",
      body: JSON.stringify({ claim, assumptions }),
    });
  }

  async strawmanArgument(
    claim: string,
  ): Promise<ApiResponse<ArgumentAnalysis>> {
    return this.request<ArgumentAnalysis>("/reasoning/strawman", {
      method: "POST",
      body: JSON.stringify({ claim }),
    });
  }

  // System Health
  async getSystemHealth(): Promise<ApiResponse<any>> {
    return this.request<any>("/health");
  }

  // Trading APIs removed - not part of this system

  // Ollama Integration
  async generateWithOllama(
    prompt: string,
    model?: string,
    options?: {
      temperature?: number;
      top_p?: number;
      top_k?: number;
      repeat_penalty?: number;
    },
  ): Promise<
    ApiResponse<{
      response: string;
      model: string;
      duration?: number;
      tokens?: number;
    }>
  > {
    return this.request<{
      response: string;
      model: string;
      duration?: number;
      tokens?: number;
    }>("/ollama/generate", {
      method: "POST",
      body: JSON.stringify({ prompt, model, options }),
    });
  }

  async generateEmbedding(
    text: string,
  ): Promise<ApiResponse<{ embedding: number[]; dimension?: number }>> {
    return this.request<{ embedding: number[]; dimension?: number }>(
      "/ollama/embedding",
      {
        method: "POST",
        body: JSON.stringify({ text }),
      },
    );
  }

  async chatWithOllama(
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    model?: string,
    options?: { think?: boolean | "low" | "medium" | "high" },
  ): Promise<
    ApiResponse<{
      response: string;
      model: string;
      thinking?: string;
      toolCalls?: any[];
    }>
  > {
    return this.request<{
      response: string;
      model: string;
      thinking?: string;
      toolCalls?: any[];
    }>("/ollama/chat", {
      method: "POST",
      body: JSON.stringify({ messages, model, think: options?.think }),
    });
  }

  async chatWithOllamaTools(
    message: string,
    options?: {
      model?: string;
      think?: boolean | "low" | "medium" | "high";
      temperature?: number;
      useMemoryTools?: boolean;
      useReasoningTools?: boolean;
    },
  ): Promise<
    ApiResponse<{
      response: string;
      thinking?: string;
      toolCalls?: any[];
      toolResults?: any[];
      model: string;
    }>
  > {
    return this.request<{
      response: string;
      thinking?: string;
      toolCalls?: any[];
      toolResults?: any[];
      model: string;
    }>("/ollama/chat-with-tools", {
      method: "POST",
      body: JSON.stringify({
        message,
        model: options?.model,
        think: options?.think,
        temperature: options?.temperature,
        useMemoryTools: options?.useMemoryTools ?? true,
        useReasoningTools: options?.useReasoningTools ?? true,
      }),
    });
  }

  async getOllamaTools(): Promise<
    ApiResponse<{
      all: any[];
      memory: any[];
      reasoning: any[];
      count: { total: number; memory: number; reasoning: number };
    }>
  > {
    return this.request<{
      all: any[];
      memory: any[];
      reasoning: any[];
      count: { total: number; memory: number; reasoning: number };
    }>("/ollama/tools");
  }

  async getOllamaHealth(): Promise<
    ApiResponse<{ healthy: boolean; models: string[]; error?: string }>
  > {
    return this.request<{ healthy: boolean; models: string[]; error?: string }>(
      "/ollama/health",
    );
  }

  async getOllamaModels(): Promise<
    ApiResponse<{
      models: string[];
      defaultModel: string;
      embeddingModel: string;
    }>
  > {
    return this.request<{
      models: string[];
      defaultModel: string;
      embeddingModel: string;
    }>("/ollama/models");
  }

  async checkModelAvailable(
    modelName: string,
  ): Promise<ApiResponse<{ model: string; available: boolean }>> {
    return this.request<{ model: string; available: boolean }>(
      `/ollama/models/${modelName}/available`,
    );
  }

  // Grammar endpoints
  async getGrammarList(): Promise<
    ApiResponse<{ grammars: string[]; count: number }>
  > {
    return this.request<{ grammars: string[]; count: number }>(
      "/ollama/grammar/list",
    );
  }

  async routeGrammar(
    message: string,
    options?: {
      model?: string;
      think?: boolean | "low" | "medium" | "high";
      temperature?: number;
    },
  ): Promise<
    ApiResponse<{
      targetGrammar: string;
      agentType: string;
      confidence: number;
      reasoning: string;
      extractedParams?: Record<string, any>;
    }>
  > {
    return this.request<{
      targetGrammar: string;
      agentType: string;
      confidence: number;
      reasoning: string;
      extractedParams?: Record<string, any>;
    }>("/ollama/grammar/route", {
      method: "POST",
      body: JSON.stringify({
        message,
        model: options?.model,
        think: options?.think,
        temperature: options?.temperature,
      }),
    });
  }

  async chatWithGrammar(
    message: string,
    grammar: string,
    options?: {
      model?: string;
      think?: boolean | "low" | "medium" | "high";
      temperature?: number;
    },
  ): Promise<
    ApiResponse<{
      output: any;
      raw: string;
      grammar: string;
      validated: boolean;
      validationErrors: string[];
      timing: { start: number; end: number; duration: number };
    }>
  > {
    return this.request<{
      output: any;
      raw: string;
      grammar: string;
      validated: boolean;
      validationErrors: string[];
      timing: { start: number; end: number; duration: number };
    }>("/ollama/grammar/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        grammar,
        model: options?.model,
        think: options?.think,
        temperature: options?.temperature,
      }),
    });
  }

  async validateGrammar(
    output: string,
    grammar: string,
  ): Promise<ApiResponse<{ valid: boolean; errors: string[]; parsed: any }>> {
    return this.request<{ valid: boolean; errors: string[]; parsed: any }>(
      "/ollama/grammar/validate",
      {
        method: "POST",
        body: JSON.stringify({ output, grammar }),
      },
    );
  }

  // Web Search
  async webSearch(
    query: string,
    limit: number = 5,
  ): Promise<
    ApiResponse<{
      results: Array<{ title: string; url: string; snippet: string }>;
      query: string;
      total?: number;
    }>
  > {
    return this.request<{
      results: Array<{ title: string; url: string; snippet: string }>;
      query: string;
      total?: number;
    }>("/ollama/web-search", {
      method: "POST",
      body: JSON.stringify({ query, limit }),
    });
  }

  async checkWebSearchAvailable(): Promise<
    ApiResponse<{ available: boolean; message: string }>
  > {
    return this.request<{ available: boolean; message: string }>(
      "/ollama/web-search/available",
    );
  }

  // Persona Management
  async getPersonas(): Promise<ApiResponse<Persona[]>> {
    return this.request<Persona[]>("/personas");
  }

  async getCurrentPersona(): Promise<ApiResponse<Persona>> {
    return this.request<Persona>("/personas/current");
  }

  async getPersona(id: string): Promise<ApiResponse<Persona>> {
    return this.request<Persona>(`/personas/${id}`);
  }

  async createPersona(
    persona: Persona | Omit<Persona, "id">,
  ): Promise<ApiResponse<Persona>> {
    return this.request<Persona>("/personas", {
      method: "POST",
      body: JSON.stringify(persona),
    });
  }

  async updatePersona(
    id: string,
    updates: Partial<Persona>,
  ): Promise<ApiResponse<Persona>> {
    return this.request<Persona>(`/personas/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async deletePersona(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/personas/${id}`, {
      method: "DELETE",
    });
  }

  async switchPersona(personaId: string): Promise<ApiResponse<Persona>> {
    return this.request<Persona>("/personas/switch", {
      method: "POST",
      body: JSON.stringify({ personaId }),
    });
  }

  async getPersonaConfig(): Promise<ApiResponse<PersonaConfig>> {
    return this.request<PersonaConfig>("/personas/config");
  }

  async reloadPersonaConfig(): Promise<ApiResponse<any>> {
    return this.request<any>("/personas/reload", {
      method: "POST",
    });
  }

  // User & API Key Management
  async getCurrentUser(apiKey?: string): Promise<ApiResponse<any>> {
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    return this.request<any>("/users/me", {
      headers,
    });
  }

  async getApiKeys(apiKey?: string): Promise<ApiResponse<any[]>> {
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    return this.request<any[]>("/api-keys", {
      headers,
    });
  }

  async createApiKey(
    data: { name: string; type: "api" | "mcp"; scopes?: string[] },
    apiKey?: string,
  ): Promise<ApiResponse<any>> {
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    return this.request<any>("/api-keys", {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
  }

  // Smart-Thinking improvements - Reasoning steps
  async startReasoningStep(data: {
    sessionId: string;
    stepId?: string;
    kind?: string;
    label?: string;
    description?: string;
    parents?: string[];
  }): Promise<ApiResponse<{ stepId: string }>> {
    return this.request<{ stepId: string }>("/reasoning/steps/start", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async completeReasoningStep(
    stepId: string,
    sessionId: string,
    details?: Record<string, any>,
  ): Promise<ApiResponse<void>> {
    return this.request<void>("/reasoning/steps/complete", {
      method: "POST",
      body: JSON.stringify({ stepId, sessionId, details }),
    });
  }

  async failReasoningStep(
    stepId: string,
    sessionId: string,
    error: string,
  ): Promise<ApiResponse<void>> {
    return this.request<void>("/reasoning/steps/fail", {
      method: "POST",
      body: JSON.stringify({ stepId, sessionId, error }),
    });
  }

  async getReasoningSteps(
    sessionId: string,
  ): Promise<ApiResponse<ReasoningStep[]>> {
    return this.request<ReasoningStep[]>(`/reasoning/steps/${sessionId}`);
  }

  // Memory connections
  async connectMemories(
    sourceId: string,
    targetId: string,
    connectionType: string,
    strength?: number,
    description?: string,
  ): Promise<ApiResponse<MemoryConnection>> {
    return this.request<MemoryConnection>("/memories/connect", {
      method: "POST",
      body: JSON.stringify({
        sourceId,
        targetId,
        connectionType,
        strength,
        description,
      }),
    });
  }

  async getAllConnections(
    limit?: number,
    offset?: number,
  ): Promise<ApiResponse<MemoryConnection[]>> {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());
    const query = params.toString();
    return this.request<MemoryConnection[]>(
      `/memories/connections${query ? `?${query}` : ""}`,
    );
  }

  async getMemoryConnections(
    memoryId: string,
  ): Promise<ApiResponse<MemoryConnection[]>> {
    return this.request<MemoryConnection[]>(
      `/memories/${memoryId}/connections`,
    );
  }

  async deleteConnection(connectionId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/memories/connections/${connectionId}`, {
      method: "DELETE",
    });
  }

  // Verification
  async verifyMemory(
    memoryId: string,
    options?: {
      forceVerification?: boolean;
      containsCalculations?: boolean;
      useTruthAdaptation?: boolean;
      checkMemoriesFirst?: boolean;
      useGonSearch?: boolean;
      gonSearchProfile?: string;
    },
  ): Promise<ApiResponse<VerificationResult>> {
    return this.request<VerificationResult>(`/memories/${memoryId}/verify`, {
      method: "POST",
      body: JSON.stringify(options || {}),
    });
  }

  async getVerification(
    memoryId: string,
  ): Promise<ApiResponse<VerificationResult>> {
    return this.request<VerificationResult>(
      `/memories/${memoryId}/verification`,
    );
  }

  // Quality evaluation
  async evaluateMemoryQuality(
    memoryId: string,
    context?: string,
  ): Promise<ApiResponse<QualityMetrics>> {
    return this.request<QualityMetrics>(
      `/memories/${memoryId}/evaluate-quality`,
      {
        method: "POST",
        body: JSON.stringify({ context }),
      },
    );
  }

  async getMemoryQuality(
    memoryId: string,
  ): Promise<ApiResponse<QualityMetrics>> {
    return this.request<QualityMetrics>(`/memories/${memoryId}/quality`);
  }

  // Reasoning state
  async saveReasoningState(
    sessionId: string,
    stateData: { memories: any[]; connections?: any[] },
    includeConnections?: boolean,
  ): Promise<ApiResponse<{ stateId: string; sessionId: string }>> {
    return this.request<{ stateId: string; sessionId: string }>(
      "/reasoning/state/save",
      {
        method: "POST",
        body: JSON.stringify({ sessionId, stateData, includeConnections }),
      },
    );
  }

  async loadReasoningState(
    sessionId: string,
  ): Promise<ApiResponse<{ stateData: any }>> {
    return this.request<{ stateData: any }>(`/reasoning/state/${sessionId}`);
  }

  // Next steps
  async getNextSteps(
    sessionId: string,
    limit?: number,
    context?: string,
  ): Promise<ApiResponse<{ suggestions: string[] }>> {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (context) params.append("context", context);
    return this.request<{ suggestions: string[] }>(
      `/reasoning/next-steps/${sessionId}?${params.toString()}`,
    );
  }

  // Reasoning trace
  async getReasoningTrace(sessionId: string): Promise<
    ApiResponse<{
      sessionId: string;
      timeline: ReasoningStep[];
      metrics: {
        totalSteps: number;
        completedSteps: number;
        failedSteps: number;
        averageDuration: number;
      };
      summary: string;
    }>
  > {
    return this.request(`/reasoning/trace/${sessionId}`);
  }
}

export const apiService = new ApiService();
export default apiService;
