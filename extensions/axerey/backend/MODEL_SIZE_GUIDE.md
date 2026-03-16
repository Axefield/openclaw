# Ollama Model Size Guide for Memory-Constrained Systems

## Available Memory: 4.7GB

This guide helps you choose the smallest thinking-capable model that fits your memory constraints.

## Thinking-Capable Models (Smallest to Largest)

### 1. Qwen2.5:1.5B (~1GB) ⭐ RECOMMENDED for 4.7GB
- **Size**: ~1GB RAM
- **Speed**: Fastest
- **Quality**: Good for basic tasks
- **Use Case**: Best for memory-constrained systems
- **Command**: `ollama pull qwen2.5:1.5b`

### 2. Qwen2.5:3B (~2GB)
- **Size**: ~2GB RAM
- **Speed**: Fast
- **Quality**: Better than 1.5B
- **Use Case**: Good balance for 4.7GB systems
- **Command**: `ollama pull qwen2.5:3b`

### 3. Qwen2.5:7B (~4GB)
- **Size**: ~4GB RAM
- **Speed**: Moderate
- **Quality**: Best quality in Qwen2.5 series
- **Use Case**: Fits in 4.7GB but leaves little headroom
- **Command**: `ollama pull qwen2.5:7b`

### 4. Qwen3 (varies by variant)
- **Size**: 7B+ variants typically 4-8GB
- **Speed**: Moderate to slow
- **Quality**: High
- **Use Case**: Requires 8GB+ RAM
- **Note**: May not fit in 4.7GB

### 5. DeepSeek R1 / DeepSeek-v3.1 (7B+)
- **Size**: 7B+ models, typically 4-8GB
- **Speed**: Moderate to slow
- **Quality**: Very high
- **Use Case**: Requires 8GB+ RAM
- **Note**: May not fit in 4.7GB

## Embedding Models

### Nomic-Embed-Text (~274MB) ⭐ RECOMMENDED
- **Size**: ~274MB
- **Quality**: Good for semantic search
- **Use Case**: Default embedding model, very efficient
- **Command**: `ollama pull nomic-embed-text`

## Recommended Configuration for 4.7GB

```env
# Use smallest thinking model
OLLAMA_DEFAULT_MODEL=qwen2.5:1.5b

# Use efficient embedding model
OLLAMA_EMBED_MODEL=nomic-embed-text
```

## Installation Commands

```bash
# Pull the smallest thinking model
ollama pull qwen2.5:1.5b

# Pull the embedding model
ollama pull nomic-embed-text

# Verify installation
ollama list
```

## Memory Usage Tips

1. **Close other applications** when running models
2. **Use quantized models** (they're already quantized in Ollama)
3. **Monitor memory usage**: `ollama ps` shows running models
4. **Stop unused models**: `ollama stop <model-name>`
5. **Consider upgrading** to 8GB+ if you need better quality

## Model Comparison

| Model | Size | Speed | Quality | Fits 4.7GB? |
|-------|------|-------|---------|-------------|
| qwen2.5:1.5b | ~1GB | ⚡⚡⚡ | ⭐⭐⭐ | ✅ Yes (best fit) |
| qwen2.5:3b | ~2GB | ⚡⚡ | ⭐⭐⭐⭐ | ✅ Yes |
| qwen2.5:7b | ~4GB | ⚡ | ⭐⭐⭐⭐⭐ | ⚠️ Tight fit |
| qwen3 | 4-8GB | ⚡ | ⭐⭐⭐⭐⭐ | ❌ May not fit |
| deepseek-r1 | 4-8GB | ⚡ | ⭐⭐⭐⭐⭐ | ❌ May not fit |

## Current Configuration

The system is configured to use `qwen2.5:1.5b` by default, which is the smallest thinking-capable model and perfect for your 4.7GB constraint.

To change models, update your `.env` file:
```env
OLLAMA_DEFAULT_MODEL=qwen2.5:1.5b  # or qwen2.5:3b for better quality
```

