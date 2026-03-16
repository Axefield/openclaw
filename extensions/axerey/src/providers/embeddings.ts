import { createHash, createHmac } from 'node:crypto';

import { TransformersEmbeddingProvider, createTransformersEmbeddingProvider, TransformersEmbeddingConfig } from './transformers-embeddings.js';

import { LlamaCppEmbeddingProvider, createLlamaCppEmbeddingProvider, LlamaCppEmbeddingConfig } from './llama-cpp-embeddings.js';

export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  dim: number;
}

export type EmbeddingProviderType = 'hash' | 'transformers' | 'llamacpp';

export interface EmbeddingConfig {
  type: EmbeddingProviderType;
  dimension?: number;
  transformersConfig?: TransformersEmbeddingConfig;
  llamacppConfig?: LlamaCppEmbeddingConfig;
}

// Advanced hash-based embedding system with multiple algorithms
class AdvancedHashEmbedding {
  private dimension: number;
  private algorithms: string[];

  constructor(dimension: number = 1536) {
    this.dimension = dimension;
    this.algorithms = ['sha256', 'sha512', 'md5', 'sha1', 'blake2b256', 'blake2b512'];
  }

  // Multi-algorithm hash-based embedding
  async embed(text: string): Promise<number[]> {
    const normalizedText = this.normalizeText(text);
    const embeddings: number[][] = [];

    // Generate embeddings using different hash algorithms
    for (const algorithm of this.algorithms) {
      const hash = this.generateHash(normalizedText, algorithm);
      const embedding = this.hashToVector(hash, this.dimension / this.algorithms.length);
      embeddings.push(embedding);
    }

    // Combine all algorithm embeddings
    const combined = embeddings.flat();
    
    // Ensure we have exactly the target dimension
    if (combined.length > this.dimension) {
      return combined.slice(0, this.dimension);
    } else if (combined.length < this.dimension) {
      // Pad with additional hash-based features
      const padding = this.generatePadding(normalizedText, this.dimension - combined.length);
      return [...combined, ...padding];
    }

    return combined;
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private generateHash(text: string, algorithm: string): string {
    try {
      if (algorithm.startsWith('blake2b')) {
        const bits = algorithm === 'blake2b256' ? 256 : 512;
        return createHash('blake2b' + bits).update(text).digest('hex');
      } else {
        return createHash(algorithm).update(text).digest('hex');
      }
    } catch {
      // Fallback to sha256 if algorithm not supported
      return createHash('sha256').update(text).digest('hex');
    }
  }

  private hashToVector(hash: string, targetLength: number): number[] {
    const vector = new Array(targetLength).fill(0);
    const hashBytes = this.hexToBytes(hash);
    
    // Distribute hash bytes across vector dimensions
    for (let i = 0; i < hashBytes.length; i++) {
      const index = i % targetLength;
      vector[index] += hashBytes[i] / 255.0;
    }

    // Apply additional transformations for better distribution
    for (let i = 0; i < targetLength; i++) {
      // Use position-based weighting
      const positionWeight = Math.sin(i * Math.PI / targetLength);
      vector[i] *= (1 + positionWeight * 0.1);
      
      // Apply sigmoid-like function for better distribution
      vector[i] = 2 / (1 + Math.exp(-vector[i] * 4)) - 1;
    }

    return vector;
  }

  private hexToBytes(hex: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return bytes;
  }

  private generatePadding(text: string, paddingLength: number): number[] {
    const padding = new Array(paddingLength).fill(0);
    
    // Use character frequency analysis for padding
    const charFreq = new Map<string, number>();
    for (const char of text) {
      charFreq.set(char, (charFreq.get(char) || 0) + 1);
    }

    // Generate padding based on character frequencies
    let paddingIndex = 0;
    for (const [char, freq] of charFreq) {
      if (paddingIndex >= paddingLength) break;
      const charCode = char.charCodeAt(0);
      const normalizedFreq = freq / text.length;
      padding[paddingIndex] = (charCode / 255.0) * normalizedFreq;
      paddingIndex++;
    }

    // Fill remaining padding with text length and word count features
    const wordCount = text.split(/\s+/).length;
    const textLength = text.length;
    
    for (let i = paddingIndex; i < paddingLength; i++) {
      if (i - paddingIndex < 3) {
        // Text length features
        padding[i] = (textLength % 100) / 100.0;
      } else if (i - paddingIndex < 6) {
        // Word count features
        padding[i] = (wordCount % 50) / 50.0;
      } else {
        // Character diversity features
        const uniqueChars = new Set(text).size;
        padding[i] = (uniqueChars % 26) / 26.0;
      }
    }

    return padding;
  }

  // Generate context-aware embeddings using n-grams
  async embedWithNgrams(text: string, ngrams: number[] = [1, 2, 3]): Promise<number[]> {
    const normalizedText = this.normalizeText(text);
    const embeddings: number[][] = [];

    for (const n of ngrams) {
      const ngramEmbedding = await this.embedNgrams(normalizedText, n);
      embeddings.push(ngramEmbedding);
    }

    // Combine n-gram embeddings
    const combined = embeddings.flat();
    return this.normalizeVector(combined.slice(0, this.dimension));
  }

  private async embedNgrams(text: string, n: number): Promise<number[]> {
    const words = text.split(/\s+/);
    const ngrams: string[] = [];
    
    for (let i = 0; i <= words.length - n; i++) {
      ngrams.push(words.slice(i, i + n).join(' '));
    }

    const ngramText = ngrams.join(' ');
    return this.embed(ngramText);
  }

  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return vector;
    return vector.map(val => val / magnitude);
  }
}

export const EmbeddingProvider = {
  async init(config?: EmbeddingConfig): Promise<EmbeddingProvider> {
    // Determine provider type from config or environment
    const providerType = config?.type || (process.env.EMBEDDING_PROVIDER as EmbeddingProviderType) || 'hash';
    const dimension = config?.dimension || parseInt(process.env.VECTOR_DIMENSION || '1536');

    console.error(`Initializing embedding provider: ${providerType}`);

    switch (providerType) {
      case 'llamacpp':
        try {
          const llamacppProvider = await createLlamaCppEmbeddingProvider({
            serverUrl: process.env.LLAMA_SERVER_URL || 'http://127.0.0.1:8080',
            apiPrefix: process.env.LLAMA_API_PREFIX || '',
            ...config?.llamacppConfig,
          });
          
          console.error(`Llama.cpp provider initialized with server: ${llamacppProvider.modelName}`);
          return llamacppProvider;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error('Failed to initialize llama.cpp provider, falling back to hash-based:', errorMsg);
          // Fall through to hash-based provider
        }
        break;

      case 'transformers':
        try {
          // Dynamically import transformers only when needed to avoid loading native binaries
          const { createTransformersEmbeddingProvider } = await import('./transformers-embeddings.js');
          const transformersProvider = await createTransformersEmbeddingProvider({
            modelName: 'Xenova/all-MiniLM-L6-v2',
            quantized: true,
            ...config?.transformersConfig,
          });
          
          console.error(`Transformers.js provider initialized with model: ${transformersProvider.modelName}`);
          return transformersProvider;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          // Check if it's a native binding error (common with Node v22 and onnxruntime-node)
          if (errorMsg.includes('onnxruntime') || errorMsg.includes('native') || errorMsg.includes('Win32')) {
            console.warn('Transformers.js native bindings incompatible with Node v22. WASM backend should be used automatically.');
          }
          console.error('Failed to initialize transformers.js provider, falling back to hash-based:', errorMsg);
          // Fall through to hash-based provider
        }
        break;

      case 'hash':
      default:
        console.error('Using hash-based embedding provider');
        const hashEmbedding = new AdvancedHashEmbedding(dimension);
        
        return {
          dim: dimension,
          async embed(text: string) {
            // Use n-gram enhanced embedding for better semantic understanding
            return await hashEmbedding.embedWithNgrams(text, [1, 2, 3]);
          },
        };
    }

    // Fallback to hash-based if transformers fails
    console.error('Falling back to hash-based embedding provider');
    const hashEmbedding = new AdvancedHashEmbedding(dimension);
    
    return {
      dim: dimension,
      async embed(text: string) {
        return await hashEmbedding.embedWithNgrams(text, [1, 2, 3]);
      },
    };
  },

  // Convenience methods for different provider types
  async initHash(dimension: number = 1536): Promise<EmbeddingProvider> {
    return this.init({ type: 'hash', dimension });
  },

  async initTransformers(config?: TransformersEmbeddingConfig): Promise<EmbeddingProvider> {
    return this.init({ type: 'transformers', transformersConfig: config });
  },

  async initLlamaCpp(config?: LlamaCppEmbeddingConfig): Promise<EmbeddingProvider> {
    return this.init({ type: 'llamacpp', llamacppConfig: config });
  },
};
