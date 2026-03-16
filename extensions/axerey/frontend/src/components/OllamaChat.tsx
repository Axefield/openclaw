import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Row,
  Col,
  Badge,
  Spinner,
  Alert,
  Button,
  Input,
  FormGroup,
  Label,
  Form,
} from "reactstrap";
import { apiService } from "../services/api";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

interface OllamaHealth {
  healthy: boolean;
  models: string[];
  error?: string;
}

interface OllamaModels {
  models: string[];
  defaultModel: string;
  embeddingModel: string;
}

interface AxereyToolsInfo {
  all: any[];
  memory: any[];
  reasoning: any[];
  count: {
    total: number;
    memory: number;
    reasoning: number;
  };
}

const OllamaChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [health, setHealth] = useState<OllamaHealth | null>(null);
  const [models, setModels] = useState<OllamaModels | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"chat" | "generate" | "embedding">("chat");
  const [generationOptions, setGenerationOptions] = useState({
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    repeat_penalty: 1.1,
  });
  const [thinkingTrace, setThinkingTrace] = useState<string>("");
  const [showThinking, setShowThinking] = useState(true);
  const [toolCalls, setToolCalls] = useState<any[]>([]);
  const [toolResults, setToolResults] = useState<any[]>([]);
  const [enableThinking, setEnableThinking] = useState(true);
  const [useAxereyTools, setUseAxereyTools] = useState(false);
  const [useMemoryTools, setUseMemoryTools] = useState(true);
  const [useReasoningTools, setUseReasoningTools] = useState(true);
  const [toolsInfo, setToolsInfo] = useState<AxereyToolsInfo | null>(null);
  const [toolsError, setToolsError] = useState<string | null>(null);
  const [isLoadingTools, setIsLoadingTools] = useState(false);
  const [useGrammarMode, setUseGrammarMode] = useState(false);
  const [selectedGrammar, setSelectedGrammar] =
    useState<string>("memory/recall");
  const [grammarList, setGrammarList] = useState<string[]>([]);
  const [isLoadingGrammars, setIsLoadingGrammars] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkHealth();
    loadModels();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkHealth = async () => {
    try {
      const response = await apiService.getOllamaHealth();
      if (response.success && response.data) {
        setHealth(response.data);
        if (
          response.data.healthy &&
          response.data.models.length > 0 &&
          !selectedModel
        ) {
          setSelectedModel(response.data.models[0]);
        }
        setError(null);
      } else {
        setError(
          response.error ||
            "Failed to check Ollama health. Make sure the backend server is running on port 3122.",
        );
      }
    } catch (error) {
      setError(
        "Network error: Unable to connect to backend server. Please ensure the backend is running on http://localhost:3122",
      );
      setHealth({ healthy: false, models: [], error: "Connection failed" });
    }
  };

  const loadModels = async () => {
    try {
      const response = await apiService.getOllamaModels();
      if (response.success && response.data) {
        setModels(response.data);
        if (!selectedModel) {
          setSelectedModel(response.data.defaultModel);
        }
      } else {
        console.error("Failed to load models:", response.error);
      }
    } catch (error) {
      console.error("Failed to load models:", error);
      // Don't set error state here as checkHealth will handle connection errors
    }
  };

  const loadAxereyTools = async (force: boolean = false) => {
    if (!useAxereyTools) return;
    if (toolsInfo && !force) return;
    setIsLoadingTools(true);
    try {
      const response = await apiService.getOllamaTools();
      if (response.success && response.data) {
        setToolsInfo(response.data);
        setToolsError(null);
      } else {
        setToolsError(response.error || "Unable to load Axerey tools");
      }
    } catch (error) {
      setToolsError(
        error instanceof Error ? error.message : "Failed to load Axerey tools",
      );
    } finally {
      setIsLoadingTools(false);
    }
  };

  useEffect(() => {
    if (useAxereyTools) {
      loadAxereyTools();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useAxereyTools]);

  useEffect(() => {
    if (useGrammarMode) {
      loadGrammarList();
    }
  }, [useGrammarMode]);

  const loadGrammarList = async () => {
    setIsLoadingGrammars(true);
    try {
      const response = await apiService.getGrammarList();
      if (response.success && response.data) {
        setGrammarList(response.data.grammars);
      }
    } catch (error) {
      console.error("Failed to load grammar list:", error);
    } finally {
      setIsLoadingGrammars(false);
    }
  };

  const buildConversationPrompt = (history: Message[]): string => {
    return history
      .map((message) => {
        const label =
          message.role === "assistant"
            ? "Assistant"
            : message.role === "user"
              ? "User"
              : "System";
        return `${label}: ${message.content}`;
      })
      .join("\n");
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const currentInput = inputMessage;

    const userMessage: Message = {
      role: "user",
      content: currentInput,
      timestamp: Date.now(),
    };

    const messageHistory = [...messages, userMessage];

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setError(null);
    if (mode !== "chat") {
      setThinkingTrace("");
      setToolCalls([]);
      setToolResults([]);
    }

    try {
      if (mode === "chat") {
        if (useGrammarMode) {
          // Grammar-enforced mode - deterministic, structured output
          const response = await apiService.chatWithGrammar(
            currentInput,
            selectedGrammar,
            {
              model: selectedModel || undefined,
              think: enableThinking ? true : undefined,
              temperature: 0.1, // Low temp for deterministic output
            },
          );

          if (response.success && response.data) {
            let displayContent = "";

            if (response.data.validated && response.data.output) {
              // Show the MCP action that was generated
              displayContent =
                `✅ Validated Output\n\n` +
                `Tool: ${response.data.output.name}\n` +
                `Arguments: ${JSON.stringify(response.data.output.arguments, null, 2)}\n\n` +
                `Timing: ${response.data.timing.duration}ms`;
            } else {
              displayContent =
                `⚠️ Validation Failed\n\n` +
                `Errors: ${response.data.validationErrors.join(", ")}\n\n` +
                `Raw: ${response.data.raw}`;
            }

            const assistantMessage: Message = {
              role: "assistant",
              content: displayContent,
              timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
          } else {
            setError(response.error || "Grammar chat failed");
            setMessages((prev) => prev.slice(0, -1));
          }
        } else if (useAxereyTools) {
          const conversationPrompt = buildConversationPrompt(messageHistory);
          const response = await apiService.chatWithOllamaTools(
            conversationPrompt,
            {
              model: selectedModel || undefined,
              think: enableThinking ? true : undefined,
              temperature: generationOptions.temperature,
              useMemoryTools,
              useReasoningTools,
            },
          );

          if (response.success && response.data) {
            const assistantMessage: Message = {
              role: "assistant",
              content: response.data.response,
              timestamp: Date.now(),
            };
            setThinkingTrace(response.data.thinking || "");
            setToolCalls(response.data.toolCalls || []);
            setToolResults(response.data.toolResults || []);
            setMessages((prev) => [...prev, assistantMessage]);
          } else {
            setError(response.error || "Failed to get response");
            setMessages((prev) => prev.slice(0, -1));
            setThinkingTrace("");
            setToolCalls([]);
            setToolResults([]);
          }
        } else {
          const chatMessages = messageHistory.map((m) => ({
            role: m.role,
            content: m.content,
          }));

          const response = await apiService.chatWithOllama(
            chatMessages,
            selectedModel || undefined,
            { think: enableThinking ? true : undefined },
          );

          if (response.success && response.data) {
            const assistantMessage: Message = {
              role: "assistant",
              content: response.data.response,
              timestamp: Date.now(),
            };
            setThinkingTrace(response.data.thinking || "");
            setToolCalls(response.data.toolCalls || []);
            setToolResults([]);
            setMessages((prev) => [...prev, assistantMessage]);
          } else {
            setError(response.error || "Failed to get response");
            setMessages((prev) => prev.slice(0, -1));
            setThinkingTrace("");
            setToolCalls([]);
            setToolResults([]);
          }
        }
      } else if (mode === "generate") {
        const response = await apiService.generateWithOllama(
          currentInput,
          selectedModel || undefined,
          generationOptions,
        );

        if (response.success && response.data) {
          const assistantMessage: Message = {
            role: "assistant",
            content: response.data.response,
            timestamp: Date.now(),
          };
          setThinkingTrace("");
          setToolCalls([]);
          setToolResults([]);
          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          setError(response.error || "Failed to generate");
          setMessages((prev) => prev.slice(0, -1));
        }
      } else if (mode === "embedding") {
        const response = await apiService.generateEmbedding(currentInput);

        if (response.success && response.data) {
          const embeddingInfo = `Embedding generated: ${response.data.dimension || response.data.embedding.length} dimensions`;
          const assistantMessage: Message = {
            role: "assistant",
            content:
              embeddingInfo +
              "\n\nFirst 10 values: " +
              response.data.embedding.slice(0, 10).join(", "),
            timestamp: Date.now(),
          };
          setThinkingTrace("");
          setToolCalls([]);
          setToolResults([]);
          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          setError(response.error || "Failed to generate embedding");
          setMessages((prev) => prev.slice(0, -1));
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
    setThinkingTrace("");
    setToolCalls([]);
    setToolResults([]);
  };

  return (
    <div>
      <Row className="mb-4">
        <Col>
          <h2 className="text-celestial mb-3">🤖 Ollama Chat Interface</h2>
          <p className="text-starlight mb-4">
            Interact with local AI models through Ollama. Chat, generate text,
            or create embeddings.
          </p>
        </Col>
      </Row>

      {/* Health Status */}
      {health && (
        <Row className="mb-4">
          <Col md={6}>
            <Card className="card-cosmos">
              <CardHeader
                className={`bg-${health.healthy ? "success" : "danger"} text-white`}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    {health.healthy ? "✅" : "❌"} Ollama Status
                  </h6>
                  <Badge color="light" className="text-dark">
                    {health.healthy ? "HEALTHY" : "UNHEALTHY"}
                  </Badge>
                </div>
              </CardHeader>
              <CardBody>
                <div className="mb-2">
                  <strong className="text-celestial">Available Models:</strong>
                  <br />
                  <span className="text-starlight">
                    {health.models.length > 0
                      ? health.models.join(", ")
                      : "No models found"}
                  </span>
                </div>
                {health.error && (
                  <Alert color="warning" className="mt-2 mb-0" fade={false}>
                    <small>{health.error}</small>
                  </Alert>
                )}
                <Button
                  color="outline-light"
                  size="sm"
                  onClick={checkHealth}
                  className="mt-2 w-100"
                >
                  🔄 Refresh Status
                </Button>
              </CardBody>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="card-cosmos">
              <CardHeader className="bg-info text-white">
                <h6 className="mb-0">⚙️ Configuration</h6>
              </CardHeader>
              <CardBody>
                <FormGroup>
                  <Label className="text-celestial">Mode</Label>
                  <Input
                    type="select"
                    value={mode}
                    onChange={(e) =>
                      setMode(
                        e.target.value as "chat" | "generate" | "embedding",
                      )
                    }
                  >
                    <option value="chat">Chat</option>
                    <option value="generate">Generate</option>
                    <option value="embedding">Embedding</option>
                  </Input>
                </FormGroup>
                <FormGroup>
                  <Label className="text-celestial">Model</Label>
                  <Input
                    type="select"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={!models || models.models.length === 0}
                  >
                    {models?.models.map((model) => (
                      <option key={model} value={model}>
                        {model}{" "}
                        {model === models.defaultModel ? "(default)" : ""}
                        {model === models.embeddingModel ? " (embedding)" : ""}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
                {mode === "generate" && (
                  <div>
                    <FormGroup>
                      <Label className="text-celestial">
                        Temperature: {generationOptions.temperature}
                      </Label>
                      <Input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={generationOptions.temperature}
                        onChange={(e) =>
                          setGenerationOptions((prev) => ({
                            ...prev,
                            temperature: parseFloat(e.target.value),
                          }))
                        }
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label className="text-celestial">
                        Top P: {generationOptions.top_p}
                      </Label>
                      <Input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={generationOptions.top_p}
                        onChange={(e) =>
                          setGenerationOptions((prev) => ({
                            ...prev,
                            top_p: parseFloat(e.target.value),
                          }))
                        }
                      />
                    </FormGroup>
                  </div>
                )}
                {mode === "chat" && (
                  <div className="mt-3">
                    <FormGroup check className="mb-2">
                      <Label check className="text-celestial">
                        <Input
                          type="checkbox"
                          checked={enableThinking}
                          onChange={(e) => setEnableThinking(e.target.checked)}
                        />{" "}
                        Enable thinking trace
                      </Label>
                    </FormGroup>
                    <FormGroup check className="mb-2">
                      <Label check className="text-celestial">
                        <Input
                          type="checkbox"
                          checked={showThinking}
                          onChange={(e) => setShowThinking(e.target.checked)}
                        />{" "}
                        Show thinking panel
                      </Label>
                    </FormGroup>
                    <FormGroup check className="mb-2">
                      <Label check className="text-celestial">
                        <Input
                          type="checkbox"
                          checked={useGrammarMode}
                          onChange={(e) => {
                            setUseGrammarMode(e.target.checked);
                            if (e.target.checked) setUseAxereyTools(false);
                          }}
                        />{" "}
                        🔒 Grammar Mode (Structured)
                      </Label>
                      <small className="text-muted d-block ms-3">
                        Deterministic output with GBNF enforcement
                      </small>
                    </FormGroup>
                    {useGrammarMode && (
                      <div className="ms-3 mb-3">
                        <Label className="text-celestial">Grammar:</Label>
                        <Input
                          type="select"
                          value={selectedGrammar}
                          onChange={(e) => setSelectedGrammar(e.target.value)}
                          disabled={isLoadingGrammars}
                        >
                          {grammarList.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </Input>
                        {isLoadingGrammars && (
                          <small className="text-muted">Loading...</small>
                        )}
                      </div>
                    )}
                    <FormGroup check className="mb-2">
                      <Label check className="text-celestial">
                        <Input
                          type="checkbox"
                          checked={useAxereyTools}
                          onChange={(e) => setUseAxereyTools(e.target.checked)}
                        />{" "}
                        Use Axerey tools
                      </Label>
                    </FormGroup>
                    {useAxereyTools && (
                      <div className="ms-3">
                        <FormGroup check className="mb-2">
                          <Label check className="text-celestial">
                            <Input
                              type="checkbox"
                              checked={useMemoryTools}
                              onChange={(e) =>
                                setUseMemoryTools(e.target.checked)
                              }
                            />{" "}
                            Memory tools
                          </Label>
                        </FormGroup>
                        <FormGroup check className="mb-2">
                          <Label check className="text-celestial">
                            <Input
                              type="checkbox"
                              checked={useReasoningTools}
                              onChange={(e) =>
                                setUseReasoningTools(e.target.checked)
                              }
                            />{" "}
                            Reasoning tools
                          </Label>
                        </FormGroup>
                        <Button
                          color="outline-info"
                          size="sm"
                          onClick={() => loadAxereyTools(true)}
                          disabled={isLoadingTools}
                        >
                          {isLoadingTools
                            ? "Loading tools..."
                            : "Refresh tools"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      )}

      {/* Error Display */}
      {error && (
        <Row className="mb-4">
          <Col>
            <Alert color="danger" toggle={() => setError(null)} fade={false}>
              <strong>Error:</strong> {error}
            </Alert>
          </Col>
        </Row>
      )}

      {mode === "chat" && showThinking && thinkingTrace && (
        <Row className="mb-4">
          <Col>
            <Card className="card-cosmos">
              <CardHeader className="bg-secondary text-white d-flex justify-content-between align-items-center">
                <h6 className="mb-0">🧠 Thinking Trace</h6>
                <Button
                  color="outline-light"
                  size="sm"
                  onClick={() => setThinkingTrace("")}
                >
                  Clear
                </Button>
              </CardHeader>
              <CardBody>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    fontSize: "0.9em",
                    maxHeight: "250px",
                    overflowY: "auto",
                  }}
                >
                  {thinkingTrace}
                </pre>
              </CardBody>
            </Card>
          </Col>
        </Row>
      )}

      {mode === "chat" && useAxereyTools && (
        <Row className="mb-4">
          <Col md={6}>
            <Card className="card-cosmos h-100">
              <CardHeader className="bg-info text-white d-flex justify-content-between align-items-center">
                <h6 className="mb-0">🛠️ Axerey Tools</h6>
                <Button
                  color="outline-light"
                  size="sm"
                  onClick={() => loadAxereyTools(true)}
                  disabled={isLoadingTools}
                >
                  Refresh
                </Button>
              </CardHeader>
              <CardBody>
                {toolsError && (
                  <Alert
                    color="warning"
                    toggle={() => setToolsError(null)}
                    fade={false}
                  >
                    {toolsError}
                  </Alert>
                )}
                {isLoadingTools && (
                  <div className="text-center py-3">
                    <Spinner size="sm" className="me-2" />
                    Loading…
                  </div>
                )}
                {!isLoadingTools && toolsInfo && (
                  <>
                    <p className="text-starlight mb-2">
                      <strong>Total tools:</strong> {toolsInfo.count.total}{" "}
                      (Memory: {toolsInfo.count.memory}, Reasoning:{" "}
                      {toolsInfo.count.reasoning})
                    </p>
                    <div className="mb-2">
                      <strong className="text-celestial">Memory tools:</strong>
                      <div className="small text-starlight">
                        {(toolsInfo.memory || [])
                          .slice(0, 5)
                          .map((tool) => tool.function?.name || tool.type)
                          .join(", ") || "N/A"}
                        {toolsInfo.count.memory > 5 && "…"}
                      </div>
                    </div>
                    <div>
                      <strong className="text-celestial">
                        Reasoning tools:
                      </strong>
                      <div className="small text-starlight">
                        {(toolsInfo.reasoning || [])
                          .slice(0, 5)
                          .map((tool) => tool.function?.name || tool.type)
                          .join(", ") || "N/A"}
                        {toolsInfo.count.reasoning > 5 && "…"}
                      </div>
                    </div>
                  </>
                )}
                {!isLoadingTools && !toolsInfo && !toolsError && (
                  <small className="text-muted">
                    Enable Axerey tools to load capabilities.
                  </small>
                )}
              </CardBody>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="card-cosmos h-100">
              <CardHeader className="bg-warning text-dark">
                <h6 className="mb-0">🔍 Tool Activity</h6>
              </CardHeader>
              <CardBody style={{ maxHeight: "320px", overflowY: "auto" }}>
                {toolCalls.length === 0 && toolResults.length === 0 ? (
                  <p className="text-muted mb-0">
                    No tool calls yet. Send a chat message with tools enabled.
                  </p>
                ) : (
                  <>
                    {toolCalls.length > 0 && (
                      <div className="mb-3">
                        <h6 className="text-celestial">Tool Calls</h6>
                        {toolCalls.map((call, index) => (
                          <div
                            key={`call-${index}`}
                            className="mb-2 p-2 border border-secondary rounded"
                          >
                            <Badge color="dark" className="mb-2">
                              {call?.function?.name || "tool.call"}
                            </Badge>
                            <pre
                              style={{
                                whiteSpace: "pre-wrap",
                                fontSize: "0.8em",
                              }}
                            >
                              {JSON.stringify(
                                call?.function?.arguments,
                                null,
                                2,
                              )}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                    {toolResults.length > 0 && (
                      <div>
                        <h6 className="text-celestial">Tool Results</h6>
                        {toolResults.map((result, index) => (
                          <div
                            key={`result-${index}`}
                            className="mb-2 p-2 border border-secondary rounded"
                          >
                            <Badge color="success" className="mb-2">
                              {result.toolName}
                            </Badge>
                            <pre
                              style={{
                                whiteSpace: "pre-wrap",
                                fontSize: "0.8em",
                              }}
                            >
                              {result.result}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      )}

      {/* Chat Interface */}
      <Row>
        <Col>
          <Card className="card-cosmos">
            <CardHeader className="bg-primary text-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0">💬 Chat</h6>
              <Button color="outline-light" size="sm" onClick={clearChat}>
                🗑️ Clear
              </Button>
            </CardHeader>
            <CardBody
              style={{
                height: "500px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", marginBottom: "1rem" }}>
                {messages.length === 0 ? (
                  <div className="text-center text-muted mt-5">
                    <p>No messages yet. Start a conversation!</p>
                    <small>
                      Select a mode and model, then type your message.
                    </small>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`mb-3 ${message.role === "user" ? "text-end" : "text-start"}`}
                    >
                      <Badge
                        color={message.role === "user" ? "primary" : "success"}
                        className="mb-1"
                      >
                        {message.role === "user" ? "👤 You" : "🤖 Assistant"}
                      </Badge>
                      <div
                        className={`p-3 rounded ${
                          message.role === "user"
                            ? "bg-primary text-white"
                            : "bg-secondary text-white"
                        }`}
                        style={{
                          display: "inline-block",
                          maxWidth: "80%",
                          wordWrap: "break-word",
                        }}
                      >
                        <div style={{ whiteSpace: "pre-wrap" }}>
                          {message.content}
                        </div>
                        <small className="d-block mt-2 opacity-75">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </small>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="text-center">
                    <Spinner color="primary" size="sm" className="me-2" />
                    <span className="text-starlight">Thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <Form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <FormGroup>
                  <Input
                    type="textarea"
                    rows={3}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Type your ${mode === "chat" ? "message" : mode === "generate" ? "prompt" : "text for embedding"}...`}
                    disabled={isLoading || !health?.healthy}
                  />
                </FormGroup>
                <Button
                  color="primary"
                  type="submit"
                  disabled={
                    isLoading || !inputMessage.trim() || !health?.healthy
                  }
                  className="w-100"
                >
                  {isLoading ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Processing...
                    </>
                  ) : (
                    <>📤 Send</>
                  )}
                </Button>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OllamaChat;
