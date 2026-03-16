import HNSWLib from 'hnswlib-node';

export interface HNSWSearchResult {
  neighbors: number[];
  distances: number[];
}

export interface HNSWSearchConfig {
  maxElements?: number;
  M?: number;
  efConstruction?: number;
  ef?: number;
  space?: 'cosine' | 'ip' | 'l2';
}

export class HNSWVectorSearch {
  private index: HNSWLib.HierarchicalNSW | null = null;
  private dimension: number;
  private maxElements: number;
  private M: number;
  private efConstruction: number;
  private ef: number;
  private space: 'cosine' | 'ip' | 'l2';
  private isInitialized: boolean = false;

  constructor(dimension: number, config: HNSWSearchConfig = {}) {
    this.dimension = dimension;
    this.maxElements = config.maxElements || 10000;
    this.M = config.M || 16;
    this.efConstruction = config.efConstruction || 200;
    this.ef = config.ef || 100;
    this.space = config.space || 'cosine';
  }

  async init(): Promise<void> {
    try {
      console.error(`Initializing HNSW index with dimension ${this.dimension}, max elements ${this.maxElements}`);
      
      this.index = new HNSWLib.HierarchicalNSW(this.space, this.dimension);
      this.index.initIndex(this.maxElements, this.M, this.efConstruction);
      
      this.isInitialized = true;
      console.error('HNSW index initialized successfully');
    } catch (error) {
      console.error('Failed to initialize HNSW index:', error);
      throw new Error(`HNSW initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  addPoint(embedding: number[], id: number): void {
    if (!this.index || !this.isInitialized) {
      throw new Error('HNSW index not initialized. Call init() first.');
    }

    if (embedding.length !== this.dimension) {
      throw new Error(`Embedding dimension mismatch. Expected ${this.dimension}, got ${embedding.length}`);
    }

    this.index.addPoint(embedding, id);
  }

  searchKnn(queryEmbedding: number[], k: number): HNSWSearchResult {
    if (!this.index || !this.isInitialized) {
      throw new Error('HNSW index not initialized. Call init() first.');
    }

    if (queryEmbedding.length !== this.dimension) {
      throw new Error(`Query embedding dimension mismatch. Expected ${this.dimension}, got ${queryEmbedding.length}`);
    }

    // Set ef parameter for search
    this.index.setEf(this.ef);
    
    const result = this.index.searchKnn(queryEmbedding, k);
    
    return {
      neighbors: result.neighbors,
      distances: result.distances
    };
  }

  getCurrentCount(): number {
    if (!this.index || !this.isInitialized) {
      return 0;
    }
    return this.index.getCurrentCount();
  }

  getMaxElements(): number {
    return this.maxElements;
  }

  getDimension(): number {
    return this.dimension;
  }

  // Save and load functionality
  async saveIndex(filePath: string): Promise<void> {
    if (!this.index || !this.isInitialized) {
      throw new Error('HNSW index not initialized. Call init() first.');
    }
    
    this.index.writeIndex(filePath);
  }

  async loadIndex(filePath: string): Promise<void> {
    try {
      this.index = new HNSWLib.HierarchicalNSW(this.space, this.dimension);
      this.index.readIndex(filePath);
      this.isInitialized = true;
      console.error(`HNSW index loaded from ${filePath}`);
    } catch (error) {
      console.error('Failed to load HNSW index:', error);
      throw new Error(`HNSW index loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get index statistics
  getStats() {
    return {
      dimension: this.dimension,
      maxElements: this.maxElements,
      currentCount: this.getCurrentCount(),
      M: this.M,
      efConstruction: this.efConstruction,
      ef: this.ef,
      space: this.space,
      isInitialized: this.isInitialized
    };
  }
}

// Factory function for easy initialization
export const createHNSWSearch = async (
  dimension: number,
  config: HNSWSearchConfig = {}
): Promise<HNSWVectorSearch> => {
  const search = new HNSWVectorSearch(dimension, config);
  await search.init();
  return search;
};

// Pre-configured search instances
export const HNSWSearchPresets = {
  // Fast search, good for most use cases
  async fast(dimension: number) {
    return createHNSWSearch(dimension, {
      maxElements: 10000,
      M: 16,
      efConstruction: 200,
      ef: 50,
      space: 'cosine'
    });
  },

  // High precision search, slower but more accurate
  async precise(dimension: number) {
    return createHNSWSearch(dimension, {
      maxElements: 10000,
      M: 32,
      efConstruction: 400,
      ef: 200,
      space: 'cosine'
    });
  },

  // Large dataset optimized
  async large(dimension: number, maxElements: number = 100000) {
    return createHNSWSearch(dimension, {
      maxElements,
      M: 32,
      efConstruction: 400,
      ef: 100,
      space: 'cosine'
    });
  }
};
