import { MemoryStore } from '../../../dist/memory.js'
import { VSSMemoryStore } from '../../../dist/memory-vss.js'
import { EmbeddingProvider } from '../../../dist/providers/embeddings.js'
import { MindBalanceTool } from '../../../dist/reasoning/mind-balance.js'
import { SteelmanTool, StrawmanTool } from '../../../dist/reasoning/argumentation.js'
import { Server as SocketServer } from 'socket.io'

declare global {
  namespace Express {
    interface Request {
      ouranigon: {
        memoryStore: MemoryStore
        vssStore: VSSMemoryStore
        embeddingProvider: EmbeddingProvider
        mindBalanceTool: MindBalanceTool
        steelmanTool: SteelmanTool
        strawmanTool: StrawmanTool
        io: SocketServer
      }
    }
  }
}
