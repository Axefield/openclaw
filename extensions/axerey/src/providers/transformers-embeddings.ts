// Configure transformers.js to use WASM backend BEFORE importing
// This prevents attempts to load native onnxruntime-node bindings that are incompatible with Node v22
if (typeof process !== 'undefined' && process.env) {
  // Force WASM backend; disable native bindings
  process.env.TRANSFORMERS_JS_BACKEND = 'wasm';
  // Disable native ONNX Runtime Node bindings
  process.env.ONNXRUNTIME_NODE_DISABLE_NATIVE = '1';
}

import { pipeline, FeatureExtractionPipeline, env } from '@xenova/transformers';
import os from 'node:os';

export interface TransformersEmbeddingConfig {
  modelName?: string;
  quantized?: boolean;
  cacheDir?: string;
}

// Transformers.js-based embedding provider using sentence-transformers models
export class TransformersEmbeddingProvider {
  private pipeline: FeatureExtractionPipeline | null = null;
  private dimension: number;
  private modelName: string;
  private quantized: boolean;
  private cacheDir?: string;

  constructor(config: TransformersEmbeddingConfig = {}) {
    this.modelName = config.modelName || 'Xenova/all-MiniLM-L6-v2';
    this.quantized = config.quantized ?? true; // Use quantized models by default for better performance
    this.cacheDir = config.cacheDir;
    this.dimension = this.getModelDimension(this.modelName);
  }

  async init(): Promise<{ embed: (text: string) => Promise<number[]>; dim: number; modelName: string }> {
    try {
      console.error(`Initializing transformers.js with model: ${this.modelName}`);
      
      // Configure transformers.js environment for Node.js runtime
      // Force WASM backend in Node to avoid native binding issues with onnxruntime-node
      // Enable threads/SIMD (Node 22 supports them by default) and set cache directory
      try {
        // Use filesystem cache in Node instead of browser caches
        env.useBrowserCache = false;
        env.allowLocalModels = true;
        
        // Force WASM backend instead of native onnxruntime-node bindings
        // This avoids compatibility issues with Node v22 native bindings
        // Disable native backend if available
        try {
          const backends = env.backends as any;
          if (backends?.onnx?.node) {
            // Disable native Node.js bindings
            backends.onnx.node = null;
            delete backends.onnx.node;
          }
        } catch (e) {
          // Ignore if native backend doesn't exist
        }
        
        // Access via type assertion to avoid TypeScript errors
        const wasmBackend = (env.backends as any)?.onnx?.wasm;
        if (wasmBackend) {
          wasmBackend.proxy = false;
          wasmBackend.wasmPaths = undefined; // Use default WASM paths
          
          // Tune ONNX Runtime Web WASM settings for Node
          const cpuCount = Math.max(1, (os.cpus()?.length || 1) - 1);
          wasmBackend.numThreads = cpuCount;
          wasmBackend.simd = true;
        }
        
        if (this.cacheDir) {
          env.cacheDir = this.cacheDir;
        }
      } catch (e) {
        // Non-fatal; continue with defaults
        console.warn('Transformers.js environment configuration warning:', e instanceof Error ? e.message : 'Unknown error');
      }

      // Initialize the feature extraction pipeline
      this.pipeline = await pipeline(
        'feature-extraction',
        this.modelName,
        {
          quantized: this.quantized,
          cache_dir: this.cacheDir,
        }
      ) as FeatureExtractionPipeline;

      console.error(`Transformers.js pipeline initialized successfully`);
      
      return {
        dim: this.dimension,
        modelName: this.modelName,
        embed: this.embed.bind(this),
      };
    } catch (error) {
      console.error('Failed to initialize transformers.js pipeline:', error);
      throw new Error(`Transformers.js initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async embed(text: string): Promise<number[]> {
    if (!this.pipeline) {
      throw new Error('Transformers.js pipeline not initialized. Call init() first.');
    }

    try {
      // Clean and prepare text
      const cleanText = this.preprocessText(text);
      
      // Generate embeddings
      const result = await this.pipeline(cleanText, {
        pooling: 'mean', // Use mean pooling for sentence embeddings
        normalize: true,  // Normalize embeddings
      });

      // Extract the embedding vector and ensure it's a number array
      let embedding: number[];
      if (Array.isArray(result.data)) {
        embedding = result.data.map((x: any) => typeof x === 'number' ? x : parseFloat(x));
      } else {
        // Handle typed arrays by converting to regular array first
        const dataArray = Array.from(result.data as any);
        embedding = dataArray.map((x: any) => typeof x === 'number' ? x : parseFloat(x));
      }
      
      // Ensure we have the expected dimension
      if (embedding.length !== this.dimension) {
        console.warn(`Expected dimension ${this.dimension}, got ${embedding.length}. Truncating or padding.`);
        
        if (embedding.length > this.dimension) {
          return embedding.slice(0, this.dimension);
        } else {
          // Pad with zeros if needed
          const padding = new Array(this.dimension - embedding.length).fill(0);
          return [...embedding, ...padding];
        }
      }

      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private preprocessText(text: string): string {
    // Basic text preprocessing
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 512); // Limit to model's max length
  }

  private getModelDimension(modelName: string): number {
    // Map model names to their embedding dimensions
    const modelDimensions: Record<string, number> = {
      'Xenova/all-MiniLM-L6-v2': 384,
      'Xenova/all-mpnet-base-v2': 768,
      'Xenova/paraphrase-multilingual-MiniLM-L12-v2': 384,
      'Xenova/all-distilroberta-v1': 768,
      'Xenova/sentence-transformers/all-MiniLM-L6-v2': 384,
      'Xenova/sentence-transformers/all-mpnet-base-v2': 768,
    };

    // Check for exact match first
    if (modelDimensions[modelName]) {
      return modelDimensions[modelName];
    }

    // Check for partial matches
    for (const [key, dim] of Object.entries(modelDimensions)) {
      if (modelName.includes(key.split('/').pop() || '')) {
        return dim;
      }
    }

    // Default to 384 for MiniLM models
    if (modelName.toLowerCase().includes('minilm')) {
      return 384;
    }

    // Default to 768 for other models
    return 768;
  }

  // Method to get model info
  getModelInfo() {
    return {
      modelName: this.modelName,
      dimension: this.dimension,
      quantized: this.quantized,
      cacheDir: this.cacheDir,
    };
  }

  // Method to switch models (requires reinitialization)
  async switchModel(newModelName: string, config: TransformersEmbeddingConfig = {}) {
    this.modelName = newModelName;
    this.dimension = this.getModelDimension(newModelName);
    this.quantized = config.quantized ?? this.quantized;
    this.cacheDir = config.cacheDir ?? this.cacheDir;
    
    // Reinitialize with new model
    await this.init();
  }
}

// Factory function for easy initialization
export const createTransformersEmbeddingProvider = async (
  config: TransformersEmbeddingConfig = {}
): Promise<{ embed: (text: string) => Promise<number[]>; dim: number; modelName: string }> => {
  const provider = new TransformersEmbeddingProvider(config);
  return await provider.init();
};

// Pre-configured providers for common models
export const TransformersEmbeddingProviders = {
  // Fast and lightweight - recommended for most use cases
  async miniLM(config: TransformersEmbeddingConfig = {}) {
    return createTransformersEmbeddingProvider({
      modelName: 'Xenova/all-MiniLM-L6-v2',
      quantized: true,
      ...config,
    });
  },

  // Better performance but larger
  async mpnet(config: TransformersEmbeddingConfig = {}) {
    return createTransformersEmbeddingProvider({
      modelName: 'Xenova/all-mpnet-base-v2',
      quantized: true,
      ...config,
    });
  },

  // Multilingual support
  async multilingual(config: TransformersEmbeddingConfig = {}) {
    return createTransformersEmbeddingProvider({
      modelName: 'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
      quantized: true,
      ...config,
    });
  },

  // Distilled RoBERTa - good balance
  async distilroberta(config: TransformersEmbeddingConfig = {}) {
    return createTransformersEmbeddingProvider({
      modelName: 'Xenova/all-distilroberta-v1',
      quantized: true,
      ...config,
    });
  },
};