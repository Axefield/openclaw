# Embedding Provider Guide

This guide explains the different embedding providers available in this project and helps you choose the best option for your needs.

## Available Providers

### 1. Hash-based Embeddings (Default)
- **Type**: `hash`
- **Dimension**: 1536 (configurable)
- **Speed**: ⚡ Very fast (~1ms)
- **Memory**: 💾 Low
- **Quality**: 🟡 Good for basic similarity
- **Dependencies**: None (built-in)

### 2. Transformers.js Embeddings
- **Type**: `transformers`
- **Dimension**: 384 (all-MiniLM-L6-v2)
- **Speed**: 🐌 Slower (~4ms)
- **Memory**: 💾 Medium
- **Quality**: 🟢 Excellent semantic understanding
- **Dependencies**: `@xenova/transformers`

## Performance Comparison

Based on our benchmarks:

| Provider | Avg Time | Dimension | Speed | Quality |
|----------|----------|-----------|-------|---------|
| Hash-based | 1.12ms | 1536 | ⚡⚡⚡ | 🟡 |
| Transformers.js | 4.00ms | 384 | ⚡ | 🟢 |

### Semantic Similarity Results

**Hash-based similarities:**
- "The cat sat on the mat" vs "A feline rested on the rug": 0.894
- "The cat sat on the mat" vs "The dog ran in the park": 0.835

**Transformers.js similarities:**
- "The cat sat on the mat" vs "A feline rested on the rug": 0.545
- "The cat sat on the mat" vs "The dog ran in the park": 0.051

*Note: Lower similarity scores in transformers.js actually indicate better semantic understanding - it correctly identifies that "cat" and "dog" are different animals.*

## Usage

### Basic Usage

```typescript
import { EmbeddingProvider } from './providers/embeddings.js';

// Use hash-based (default)
const hashProvider = await EmbeddingProvider.init();

// Use transformers.js
const transformersProvider = await EmbeddingProvider.init({
  type: 'transformers',
  transformersConfig: {
    modelName: 'Xenova/all-MiniLM-L6-v2',
    quantized: true
  }
});

// Generate embeddings
const embedding = await provider.embed("Your text here");
```

### Environment Configuration

Set the provider type via environment variable:

```bash
# Use hash-based embeddings (default)
EMBEDDING_PROVIDER=hash

# Use transformers.js embeddings
EMBEDDING_PROVIDER=transformers
VECTOR_DIMENSION=384
```

### Available Models

#### all-MiniLM-L6-v2 (Recommended)
- **Size**: ~23MB
- **Dimension**: 384
- **Speed**: Fast
- **Quality**: Good balance

#### all-mpnet-base-v2
- **Size**: ~420MB
- **Dimension**: 768
- **Speed**: Slower
- **Quality**: Better

#### paraphrase-multilingual-MiniLM-L12-v2
- **Size**: ~470MB
- **Dimension**: 384
- **Speed**: Medium
- **Quality**: Multilingual support

## When to Use Each Provider

### Use Hash-based When:
- ✅ Speed is critical
- ✅ Memory is limited
- ✅ You need consistent, deterministic embeddings
- ✅ Basic similarity matching is sufficient
- ✅ No external dependencies preferred

### Use Transformers.js When:
- ✅ Semantic understanding is important
- ✅ You need high-quality embeddings
- ✅ You can afford slightly slower performance
- ✅ You want state-of-the-art NLP capabilities
- ✅ You're building semantic search or RAG systems

## Model Recommendations

### For Most Use Cases: all-MiniLM-L6-v2
```typescript
const provider = await EmbeddingProvider.initTransformers({
  modelName: 'Xenova/all-MiniLM-L6-v2',
  quantized: true
});
```

### For Better Quality: all-mpnet-base-v2
```typescript
const provider = await EmbeddingProvider.initTransformers({
  modelName: 'Xenova/all-mpnet-base-v2',
  quantized: true
});
```

### For Multilingual: paraphrase-multilingual-MiniLM-L12-v2
```typescript
const provider = await EmbeddingProvider.initTransformers({
  modelName: 'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
  quantized: true
});
```

## Running Comparisons

Test the performance yourself:

```bash
# Run performance comparison
npm run compare-embeddings

# Run usage demonstration
node examples/embedding-usage.js
```

## Migration Guide

### From Hash-based to Transformers.js

1. Install dependencies:
```bash
npm install @xenova/transformers
```

2. Update your code:
```typescript
// Before
const provider = await EmbeddingProvider.init();

// After
const provider = await EmbeddingProvider.init({
  type: 'transformers',
  transformersConfig: {
    modelName: 'Xenova/all-MiniLM-L6-v2',
    quantized: true
  }
});
```

3. Update dimension expectations:
```typescript
// Hash-based: 1536 dimensions
// Transformers.js: 384 dimensions (for MiniLM)
```

## Troubleshooting

### Transformers.js Issues

1. **Model download fails**: Check internet connection and disk space
2. **Memory errors**: Use quantized models or smaller models
3. **Slow performance**: Ensure you're using quantized models

### Hash-based Issues

1. **Inconsistent results**: Hash-based embeddings are deterministic by design
2. **Poor semantic similarity**: Consider switching to transformers.js

## Future Considerations

- **Nomic Embed**: While not natively supported by transformers.js, it offers excellent performance for specialized use cases
- **Custom Models**: You can add support for other sentence-transformers models
- **Hybrid Approach**: Consider using both providers for different use cases

## Conclusion

- **Start with all-MiniLM-L6-v2** for most applications
- **Use hash-based** only when speed is absolutely critical
- **Consider all-mpnet-base-v2** for better quality when performance allows
- **Test both** with your specific use case to make the final decision
