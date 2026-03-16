/**
 * Core MCP (Model Context Protocol) types
 * Based on JSON-RPC 2.0 specification
 */

// ---- Core JSON-RPC types ----
export interface JsonRpcRequest<TParams = unknown> {
  jsonrpc: '2.0';
  id: string | number;
  method: string; // e.g., "tools/call", "tools/list"
  params?: TParams;
}

export interface JsonRpcSuccess<TResult = unknown> {
  jsonrpc: '2.0';
  id: string | number;
  result: TResult;
}

export interface JsonRpcError {
  jsonrpc: '2.0';
  id: string | number | null;
  error: { code: number; message: string; data?: unknown };
}

export type JsonRpcResponse<TResult = unknown> =
  | JsonRpcSuccess<TResult>
  | JsonRpcError;

// ---- MCP tool invocation shapes ----
export interface ToolsCallParams<TArgs> {
  name: string; // tool name (server-registered)
  arguments: TArgs; // tool arguments (validated against JSON Schema)
}

export interface ToolsCallResult<TResult> {
  contentType: 'application/json' | 'text/plain' | string;
  content: TResult; // tool-defined payload
  // Some servers also return usage/diagnostics; keep open for extension
  [k: string]: unknown;
}

// ---- MCP tool definition ----
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>; // JSON Schema
}

// ---- MCP server capabilities ----
export interface ServerCapabilities {
  tools?: {
    listChanged?: boolean;
  };
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
  };
  prompts?: {
    listChanged?: boolean;
  };
}

// ---- MCP initialization ----
export interface InitializeParams {
  protocolVersion: string;
  capabilities: Record<string, unknown>;
  clientInfo: {
    name: string;
    version: string;
  };
}

export interface InitializeResult {
  protocolVersion: string;
  capabilities: ServerCapabilities;
  serverInfo: {
    name: string;
    version: string;
  };
}

// ---- Error codes ----
export const MCP_ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  // Custom MCP errors
  TOOL_NOT_FOUND: -32001,
  TOOL_EXECUTION_ERROR: -32002,
  INVALID_ARGUMENTS: -32003,
} as const;

export type McpErrorCode = typeof MCP_ERROR_CODES[keyof typeof MCP_ERROR_CODES];
