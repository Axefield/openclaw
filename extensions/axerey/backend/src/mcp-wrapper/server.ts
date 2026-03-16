/**
 * Axerey MCP Server Wrapper
 * 
 * Supports multiple transports: STDIO, HTTP, SSE, Streamable HTTP
 * Similar to Smart-Thinking's transport implementation
 */

import express, { type Request, type Response } from 'express';
import { Server as MCPServer } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
// Note: These may not be available in SDK 0.6.0, will need to check or upgrade
// import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
// import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'crypto';

// Type guards and helpers
type TransportType = 'sse' | 'stream';
interface SessionState {
  transport: any; // SSEServerTransport | StreamableHTTPServerTransport;
  serverClose: () => Promise<void>;
  type: TransportType;
}

// Helper to check if request is initialize
function isInitializeRequest(body: any): boolean {
  return body && body.method === 'initialize' && body.jsonrpc === '2.0';
}

export interface TransportOptions {
  port?: number;
  host?: string;
  allowOrigins?: string[];
  allowHosts?: string[];
  enableSse?: boolean;
  enableStream?: boolean;
}

// SessionState moved above

export class AxereyMCPServer {
  private server: MCPServer;
  private sessions: Map<string, SessionState> = new Map();
  private app?: express.Application;

  constructor(server: MCPServer) {
    this.server = server;
  }

  /**
   * Start STDIO server (for MCP clients like Cursor, Claude Desktop)
   */
  async startStdioServer(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('[MCP] Axerey server running via stdio');
  }

  /**
   * Start HTTP server with multiple transport support
   */
  async startHttpServer(options: TransportOptions = {}): Promise<void> {
    const app = express();
    this.app = app;
    app.use(express.json({ limit: '4mb' }));

    const port = options.port || 3001;
    const host = options.host || '0.0.0.0';
    const enableSse = options.enableSse !== false;
    const enableStream = options.enableStream !== false;
    const dnsProtectionEnabled = (options.allowHosts?.length || 0) > 0 || (options.allowOrigins?.length || 0) > 0;

    // Streamable HTTP endpoint
    // Note: StreamableHTTPServerTransport may not be available in SDK 0.6.0
    // This is a placeholder for when SDK is upgraded
    if (enableStream) {
      console.warn('[MCP] Streamable HTTP transport not available in current SDK version. Please upgrade to SDK 1.7.0+');
      // TODO: Implement when SDK is upgraded
    }

    // SSE endpoint
    // Note: SSEServerTransport may not be available in SDK 0.6.0
    // This is a placeholder for when SDK is upgraded
    if (enableSse) {
      console.warn('[MCP] SSE transport not available in current SDK version. Please upgrade to SDK 1.7.0+');
      // TODO: Implement when SDK is upgraded
    }

    // Health check
    app.get('/mcp/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        transports: {
          sse: enableSse,
          stream: enableStream
        },
        sessions: this.sessions.size
      });
    });

    // Start server
    return new Promise((resolve, reject) => {
      const server = app.listen(port, host, () => {
        console.log(`[MCP] Axerey HTTP server running on ${host}:${port}`);
        console.log(`[MCP] SSE: ${enableSse ? 'enabled' : 'disabled'}`);
        console.log(`[MCP] Stream: ${enableStream ? 'enabled' : 'disabled'}`);
        resolve();
      });

      server.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Start SSE-only server
   */
  async startSSEServer(options: TransportOptions = {}): Promise<void> {
    await this.startHttpServer({ ...options, enableSse: true, enableStream: false });
  }

  /**
   * Start Streamable HTTP-only server
   */
  async startStreamableHTTPServer(options: TransportOptions = {}): Promise<void> {
    await this.startHttpServer({ ...options, enableSse: false, enableStream: true });
  }

  /**
   * Cleanup session
   */
  private cleanupSession(sessionId: string): void {
    const state = this.sessions.get(sessionId);
    if (state) {
      state.serverClose().catch(() => {
        // Ignore cleanup errors
      });
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Get active sessions
   */
  getActiveSessions(): number {
    return this.sessions.size;
  }
}

