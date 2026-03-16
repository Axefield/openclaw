// Ouranigon AI Application Types

export interface Memory {
  id: string
  text: string
  tags: string[]
  importance: number
  type: 'episodic' | 'semantic' | 'procedural'
  source: string
  confidence: number
  embedding?: number[]
  lastUsed: number
  decay: number
  belief: boolean
  mergedFrom: string[]
  expiresAt?: number
  sessionId?: string
  features?: Record<string, any>
  pinned?: boolean
}

export type ConnectionType =
  | 'supports'
  | 'contradicts'
  | 'refines'
  | 'derives'
  | 'exemplifies'
  | 'generalizes'
  | 'questions'
  | 'analyzes'
  | 'synthesizes'
  | 'associates'
  | 'extends'
  | 'applies'

export interface MemoryConnection {
  id: string
  sourceId: string
  targetId: string
  connectionType: ConnectionType
  strength: number
  inferred: boolean
  inferenceConfidence?: number
  description?: string
  createdAt: number
}

export type ReasoningStepKind = 'context' | 'verification' | 'graph' | 'evaluation' | 'memory' | 'planning'

export interface ReasoningStep {
  id: string
  sessionId: string
  stepId: string
  kind: ReasoningStepKind
  label?: string
  description?: string
  status: 'in_progress' | 'completed' | 'failed'
  startedAt: number
  completedAt?: number
  duration?: number
  parents: string[]
  details: Record<string, any>
  justifications: Array<{
    summary: string
    heuristics?: any[]
    timestamp?: string
  }>
}

export interface VerificationResult {
  status: 'verified' | 'partially_verified' | 'unverified' | 'contradicted' | 'uncertain'
  confidence: number
  sources: Array<{
    type: 'memory' | 'gon-search' | 'web-search' | 'api' | 'calculation' | 'steelman' | 'strawman'
    source: string
    confidence: number
    relevance: number
    supports: boolean
  }>
  verifiedCalculations?: Array<{
    expression: string
    expected: number
    actual: number
    verified: boolean
  }>
  truthAdaptation?: {
    originalClaim: string
    steelmannedClaim?: string
    distortions?: string[]
    verificationBasedOn: 'original' | 'steelmanned'
  }
  memoryMatches?: Array<{
    memoryId: string
    similarity: number
    supports: boolean
    connectionType?: string
  }>
  gonSearchResults?: {
    query: string
    results: Array<{
      title: string
      url: string
      snippet: string
      relevance: number
    }>
    ragContext?: string
  }
  timestamp: string
}

export interface QualityMetrics {
  confidence: number
  relevance: number
  quality: number
  reliabilityScore: number
}

export interface CardItem {
  id: string
  title: string
  content: string
  type: string
  priority: 'high' | 'medium' | 'low'
  tags: string[]
  createdAt: number
  updatedAt: number
  columnId: string
  metadata?: Record<string, any>
}

export interface ThinkingSession {
  id: string
  title: string
  stage: 'problem-definition' | 'research' | 'analysis' | 'synthesis' | 'conclusion'
  progress: number
  thoughts: Thought[]
  axioms: string[]
  challengedAssumptions: string[]
  createdAt: number
  updatedAt: number
}

export interface Thought {
  id: string
  content: string
  stage: string
  tags: string[]
  timestamp: number
  metadata?: Record<string, any>
}

export interface Decision {
  id: string
  title: string
  type: 'angel-demon' | 'multi-criteria' | 'risk-assessment'
  options: DecisionOption[]
  angelScore: number
  demonScore: number
  confidence: number
  decision: string
  reasoning: string
  createdAt: number
}

export interface DecisionOption {
  id: string
  title: string
  description: string
  pros: string[]
  cons: string[]
  score: number
}

export interface ArgumentAnalysis {
  id: string
  originalClaim: string
  improvedClaim?: string
  premises: Premise[]
  objections: Objection[]
  confidence: number
  riskLevel: number
  uncertainty: number
  createdAt: number
}

export interface Premise {
  id: string
  content: string
  evidence: string[]
  strength: number
  source: string
  tags: string[]
}

export interface Objection {
  id: string
  content: string
  evidence: string[]
  strength: number
  source: string
  tags: string[]
}

export interface PhaseSpace {
  theta: number // Ethical grounding angle
  phi: number   // Urgency level angle
  angelSignal: number
  demonSignal: number
  blendedScore: number
  confidence: number
}

export interface SystemHealth {
  memoryOperations: {
    searchLatency: number
    indexSize: number
    memoryCount: number
  }
  reasoningOperations: {
    angelDemonBalance: number
    decisionSuccess: number
    abstentionRate: number
  }
  sequentialThinking: {
    activeSessions: number
    avgCompletion: number
    avgThoughtsPerSession: number
  }
  components: {
    hnswIndex: 'healthy' | 'warning' | 'error'
    vectorLite: 'healthy' | 'warning' | 'error'
    embeddingProvider: 'healthy' | 'warning' | 'error'
    database: 'healthy' | 'warning' | 'error'
    memoryStore: 'healthy' | 'warning' | 'error'
    reasoningEngine: 'healthy' | 'warning' | 'error'
  }
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface WebSocketMessage {
  type: 'memory_update' | 'thinking_update' | 'decision_update' | 'system_health'
  payload: any
  timestamp: number
}

export interface Persona {
  id: string
  name: string
  description: string
  memoryIsolation: boolean
  reasoningStyle: 'balanced' | 'analytical' | 'divergent'
  preferences?: Record<string, any>
  isActive?: boolean
}

export interface PersonaConfig {
  personas: Record<string, Persona>
  currentPersonaId?: string
}