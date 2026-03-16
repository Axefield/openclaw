export interface LlamaCppEmbeddingConfig {
  serverUrl?: string;
  apiPrefix?: string;
  modelName?: string;
  dimension?: number;
}

// Llama.cpp-based embedding provider using server API
export class LlamaCppEmbeddingProvider {
  private serverUrl: string;
  private apiPrefix: string;
  private modelName: string;
  private dimension: number;

  constructor(config: LlamaCppEmbeddingConfig = {}) {
    this.serverUrl = config.serverUrl || 'http://127.0.0.1:8080';
    this.apiPrefix = config.apiPrefix || '';
    this.modelName = config.modelName || 'default';
    this.dimension = config.dimension || 4096; // axis-default dimension, will be detected on first call
  }

  async init(): Promise<{ embed: (text: string) => Promise<number[]>; dim: number; modelName: string }> {
    try {
      console.error(`Initializing llama.cpp embedding provider with server: ${this.serverUrl}`);
      
      // Test connection and detect embedding dimension on first call
      // This will be done lazily on first embed() call
      
      return {
        dim: this.dimension,
        modelName: this.modelName,
        embed: this.embed.bind(this),
      };
    } catch (error) {
      console.error('Failed to initialize llama.cpp embedding provider:', error);
      throw new Error(`Llama.cpp initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async embed(text: string): Promise<number[]> {
    try {
      // Clean and prepare text
      const cleanText = this.preprocessText(text);
      
      // Try OpenAI-compatible endpoint first
      const endpoint = `${this.serverUrl}${this.apiPrefix}/v1/embeddings`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: cleanText,
          model: this.modelName,
        }),
      });

      if (!response.ok) {
        // Fallback to llama.cpp native endpoint
        return await this.embedLegacy(cleanText);
      }

      const data = await response.json() as { data: Array<{ embedding: number[] }> };
      
      if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
        throw new Error('Invalid response format from llama.cpp server');
      }

      let embedding = data.data[0].embedding;
      
      // Update dimension on first successful call
      if (this.dimension === 4096 && embedding.length !== 4096) {
        this.dimension = embedding.length;
        console.error(`Detected llama.cpp embedding dimension: ${this.dimension}`);
      }

      // Ensure we return a proper number array
      if (!Array.isArray(embedding)) {
        throw new Error('Embedding is not an array');
      }

      return embedding.map((x: any) => typeof x === 'number' ? x : parseFloat(x));
    } catch (error) {
      console.error('Error generating embedding with llama.cpp:', error);
      throw new Error(`Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async embedLegacy(text: string): Promise<number[]> {
    // Fallback to llama.cpp native /embed endpoint
    const endpoint = `${this.serverUrl}${this.apiPrefix}/embed`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Llama.cpp server error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json() as { embedding: number[] };
    
    if (!data.embedding || !Array.isArray(data.embedding)) {
      throw new Error('Invalid response format from llama.cpp server');
    }

    let embedding = data.embedding;
    
    // Update dimension on first successful call
    if (this.dimension === 4096 && embedding.length !== 4096) {
      this.dimension = embedding.length;
      console.error(`Detected llama.cpp embedding dimension: ${this.dimension}`);
    }

    return embedding.map((x: any) => typeof x === 'number' ? x : parseFloat(x));
  }

  private preprocessText(text: string): string {
    // Basic text preprocessing
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 8192); // Limit to reasonable length
  }

  // Method to get provider info
  getProviderInfo() {
    return {
      serverUrl: this.serverUrl,
      modelName: this.modelName,
      dimension: this.dimension,
      apiPrefix: this.apiPrefix,
    };
  }

  // Method to switch server/model configuration
  async switchConfig(config: LlamaCppEmbeddingConfig) {
    if (config.serverUrl) this.serverUrl = config.serverUrl;
    if (config.apiPrefix !== undefined) this.apiPrefix = config.apiPrefix;
    if (config.modelName) this.modelName = config.modelName;
    if (config.dimension) this.dimension = config.dimension;
  }
}

// Factory function for easy initialization
export const createLlamaCppEmbeddingProvider = async (
  config: LlamaCppEmbeddingConfig = {}
): Promise<{ embed: (text: string) => Promise<number[]>; dim: number; modelName: string }> => {
  const provider = new LlamaCppEmbeddingProvider(config);
  return await provider.init();
};

