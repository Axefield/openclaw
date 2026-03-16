import express from "express";
import { ollamaService } from "../services/ollamaService.js";
import { ollamaAxereyAgent } from "../services/ollamaAxereyAgent.js";
import { axereyToolBridge } from "../services/axereyToolBridge.js";
import {
  grammarLoader,
  grammarValidator,
  GrammarName,
} from "../grammar/index.js";
import { GrammarAgent, RouterAgent } from "../grammar/agents/index.js";
import { z } from "zod";
import cors from "cors";

const router = express.Router();

// Enable CORS for Ollama routes
router.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

// Validation schemas
const GenerateSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  model: z.string().optional(),
  options: z
    .object({
      temperature: z.number().min(0).max(2).optional(),
      top_p: z.number().min(0).max(1).optional(),
      top_k: z.number().min(1).optional(),
      repeat_penalty: z.number().min(0).optional(),
    })
    .optional(),
});

const EmbeddingSchema = z.object({
  text: z.string().min(1, "Text is required"),
});

const ChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      }),
    )
    .min(1, "At least one message is required"),
  model: z.string().optional(),
  think: z.union([z.boolean(), z.enum(["low", "medium", "high"])]).optional(),
});

const ChatWithToolsSchema = z.object({
  message: z.string().min(1, "Message is required"),
  model: z.string().optional(),
  think: z.union([z.boolean(), z.enum(["low", "medium", "high"])]).optional(),
  temperature: z.number().min(0).max(2).optional(),
  useMemoryTools: z.boolean().default(true),
  useReasoningTools: z.boolean().default(true),
});

const GrammarRouteSchema = z.object({
  message: z.string().min(1, "Message is required"),
  model: z.string().optional(),
  think: z.union([z.boolean(), z.enum(["low", "medium", "high"])]).optional(),
  temperature: z.number().min(0).max(2).optional(),
});

const GrammarChatSchema = z.object({
  message: z.string().min(1, "Message is required"),
  grammar: z.string().min(1, "Grammar is required"),
  model: z.string().optional(),
  think: z.union([z.boolean(), z.enum(["low", "medium", "high"])]).optional(),
  temperature: z.number().min(0).max(2).optional(),
});

const GrammarValidateSchema = z.object({
  output: z.string().min(1, "Output is required"),
  grammar: z.string().min(1, "Grammar is required"),
});

const validGrammars: GrammarName[] = [
  "strict_json",
  "mcp_action",
  "memory/memorize",
  "memory/recall",
  "memory/search",
  "memory/update",
  "memory/forget",
  "memory/pin",
  "reasoning/mind_balance",
  "reasoning/steelman",
  "reasoning/strawman",
  "reasoning/strawman_to_steelman",
  "reasoning/reasoning_step",
  "reasoning/memory_connect",
];

// Generate text with Ollama
router.post("/generate", async (req, res) => {
  try {
    const validatedData = GenerateSchema.parse(req.body);

    const result = await ollamaService.generate({
      model: validatedData.model,
      prompt: validatedData.prompt,
      options: validatedData.options,
    });

    res.json({
      success: true,
      data: {
        response: result.response,
        model: result.model,
        duration: result.total_duration,
        tokens: result.eval_count,
      },
    });
  } catch (error) {
    console.error("Generate error:", error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate text",
    });
  }
});

// Generate embedding
router.post("/embedding", async (req, res) => {
  try {
    const validatedData = EmbeddingSchema.parse(req.body);

    const embedding = await ollamaService.generateEmbedding(validatedData.text);

    res.json({
      success: true,
      data: {
        embedding,
        dimension: embedding.length,
      },
    });
  } catch (error) {
    console.error("Embedding error:", error);
    res.status(400).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate embedding",
    });
  }
});

// Chat with Ollama
router.post("/chat", async (req, res) => {
  try {
    const validatedData = ChatSchema.parse(req.body);

    const response = await ollamaService.chat(
      validatedData.messages as Array<{ role: string; content: string }>,
      validatedData.model,
      {
        think: validatedData.think,
      },
    );

    res.json({
      success: true,
      data: {
        response: response.content,
        thinking: response.thinking,
        toolCalls: response.toolCalls,
        model: validatedData.model || "qwen3",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to chat",
    });
  }
});

// Chat with Axerey tools
router.post("/chat-with-tools", async (req, res) => {
  try {
    const validatedData = ChatWithToolsSchema.parse(req.body);

    const response = await ollamaAxereyAgent.chatWithTools(
      validatedData.message,
      validatedData.model || "qwen3",
      {
        think: validatedData.think ?? true,
        temperature: validatedData.temperature,
        useMemoryTools: validatedData.useMemoryTools,
        useReasoningTools: validatedData.useReasoningTools,
      },
    );

    res.json({
      success: true,
      data: {
        response: response.content,
        thinking: response.thinking,
        toolCalls: response.toolCalls,
        toolResults: response.toolResults,
        model: validatedData.model || "qwen3",
      },
    });
  } catch (error) {
    console.error("Chat with tools error:", error);
    res.status(400).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to chat with tools",
    });
  }
});

// Stream chat with tools
router.post("/chat-stream", async (req, res) => {
  try {
    const validatedData = ChatWithToolsSchema.parse(req.body);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    for await (const chunk of ollamaAxereyAgent.chatStreamWithTools(
      validatedData.message,
      validatedData.model || "qwen3",
      {
        think: validatedData.think ?? true,
        temperature: validatedData.temperature,
        useMemoryTools: validatedData.useMemoryTools,
        useReasoningTools: validatedData.useReasoningTools,
      },
    )) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.end();
  } catch (error) {
    console.error("Chat stream error:", error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Streaming failed",
    });
  }
});

// Get available Axerey tools
router.get("/tools", async (req, res) => {
  try {
    const tools = axereyToolBridge.getAllOllamaTools();
    const memoryTools = axereyToolBridge.getMemoryTools();
    const reasoningTools = axereyToolBridge.getReasoningTools();

    res.json({
      success: true,
      data: {
        all: tools,
        memory: memoryTools,
        reasoning: reasoningTools,
        count: {
          total: tools.length,
          memory: memoryTools.length,
          reasoning: reasoningTools.length,
        },
      },
    });
  } catch (error) {
    console.error("Get tools error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get tools",
    });
  }
});

// Health check endpoint
router.get("/health", async (req, res) => {
  try {
    const health = await ollamaService.startupProbe(1, 1000); // Single quick check

    res.json({
      success: true,
      data: {
        healthy: health.healthy,
        models: health.models,
        error: health.error,
      },
    });
  } catch (error) {
    console.error("Ollama health check error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Health check failed",
      data: {
        healthy: false,
        models: [],
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});

// Get available models (thinking-capable only by default)
router.get("/models", async (req, res) => {
  try {
    // Default to thinking-only models, but allow query param to get all
    const thinkingOnly = req.query.thinkingOnly !== "false";
    const models = await ollamaService.getAvailableModels(thinkingOnly);
    const defaultModel = process.env.OLLAMA_DEFAULT_MODEL || "qwen2.5:1.5b";

    res.json({
      success: true,
      data: {
        models,
        defaultModel,
        embeddingModel: process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text",
        thinkingOnly: thinkingOnly,
      },
    });
  } catch (error) {
    console.error("Models error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get models",
      data: {
        models: [],
        defaultModel: process.env.OLLAMA_DEFAULT_MODEL || "qwen3",
        embeddingModel: process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text",
        thinkingOnly: true,
      },
    });
  }
});

// Check if specific model is available
router.get("/models/:modelName/available", async (req, res) => {
  try {
    const { modelName } = req.params;
    const isAvailable = await ollamaService.isModelAvailable(modelName);

    res.json({
      success: true,
      data: {
        model: modelName,
        available: isAvailable,
      },
    });
  } catch (error) {
    console.error("Model availability error:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to check model availability",
    });
  }
});

// Web search endpoint
router.post("/web-search", async (req, res) => {
  try {
    const { query, limit } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        success: false,
        error: "Query is required and must be a string",
      });
    }

    const results = await ollamaService.webSearch(query, limit || 5);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Web search error:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to perform web search",
    });
  }
});

// Check if web search is available
router.get("/web-search/available", async (req, res) => {
  try {
    const isAvailable = ollamaService.isWebSearchAvailable();

    res.json({
      success: true,
      data: {
        available: isAvailable,
        message: isAvailable
          ? "Web search is configured and ready"
          : "Web search requires OLLAMA_WEB_SEARCH_API_KEY. Get your API key from https://ollama.com",
      },
    });
  } catch (error) {
    console.error("Web search availability check error:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to check web search availability",
    });
  }
});

// Grammar: List available grammars
router.get("/grammar/list", async (req, res) => {
  try {
    const grammars = grammarLoader.listAvailable();

    res.json({
      success: true,
      data: {
        grammars,
        count: grammars.length,
      },
    });
  } catch (error) {
    console.error("Grammar list error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to list grammars",
    });
  }
});

// Grammar: Route intent to grammar
router.post("/grammar/route", async (req, res) => {
  try {
    const validatedData = GrammarRouteSchema.parse(req.body);

    const router = new RouterAgent({
      model: validatedData.model,
      think: validatedData.think,
    });

    const decision = await router.route(validatedData.message);

    res.json({
      success: true,
      data: decision,
    });
  } catch (error) {
    console.error("Grammar route error:", error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to route",
    });
  }
});

// Grammar: Chat with grammar enforcement
router.post("/grammar/chat", async (req, res) => {
  try {
    const validatedData = GrammarChatSchema.parse(req.body);

    if (!validGrammars.includes(validatedData.grammar as GrammarName)) {
      return res.status(400).json({
        success: false,
        error: `Invalid grammar: ${validatedData.grammar}. Use /grammar/list to see available grammars.`,
      });
    }

    const agent = new GrammarAgent(validatedData.grammar as GrammarName, {
      model: validatedData.model,
      temperature: validatedData.temperature,
      think: validatedData.think,
    });

    const result = await agent.execute(validatedData.message);

    res.json({
      success: true,
      data: {
        output: result.output,
        raw: result.raw,
        grammar: result.grammar,
        validated: result.validated,
        validationErrors: result.validationErrors,
        timing: result.timing,
      },
    });
  } catch (error) {
    console.error("Grammar chat error:", error);
    res.status(400).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Grammar-enforced chat failed",
    });
  }
});

// Grammar: Validate output against grammar
router.post("/grammar/validate", async (req, res) => {
  try {
    const validatedData = GrammarValidateSchema.parse(req.body);

    if (!validGrammars.includes(validatedData.grammar as GrammarName)) {
      return res.status(400).json({
        success: false,
        error: `Invalid grammar: ${validatedData.grammar}`,
      });
    }

    const result = await grammarValidator.validateStrict(
      validatedData.grammar as GrammarName,
      validatedData.output,
    );

    res.json({
      success: true,
      data: {
        valid: result.valid,
        errors: result.errors,
        parsed: result.parsed,
      },
    });
  } catch (error) {
    console.error("Grammar validate error:", error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Validation failed",
    });
  }
});

export default router;
