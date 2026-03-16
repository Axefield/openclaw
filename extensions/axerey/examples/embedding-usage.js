#!/usr/bin/env node

/**
 * Example usage of both hash-based and transformers.js embedding providers
 */

import { EmbeddingProvider } from '../dist/providers/embeddings.js';

async function demonstrateEmbeddings() {
  console.log('🔍 Embedding Provider Demonstration\n');

  // Example texts
  const texts = [
    "The quick brown fox jumps over the lazy dog",
    "A fast brown canine leaps above a sleepy hound",
    "Machine learning is fascinating",
    "Artificial intelligence and data science are exciting fields"
  ];

  console.log('📝 Test texts:');
  texts.forEach((text, i) => console.log(`  ${i + 1}. "${text}"`));
  console.log();

  // 1. Hash-based embeddings
  console.log('🔢 Using Hash-based Embeddings:');
  console.log('-'.repeat(50));
  
  const hashProvider = await EmbeddingProvider.initHash(1536);
  console.log(`Dimension: ${hashProvider.dim}`);
  
  for (let i = 0; i < texts.length; i++) {
    const start = performance.now();
    const embedding = await hashProvider.embed(texts[i]);
    const time = performance.now() - start;
    
    console.log(`Text ${i + 1}: ${Math.round(time * 100) / 100}ms`);
    console.log(`  First 5 values: [${embedding.slice(0, 5).map(v => Math.round(v * 1000) / 1000).join(', ')}...]`);
  }

  console.log();

  // 2. Transformers.js embeddings
  console.log('🤖 Using Transformers.js Embeddings:');
  console.log('-'.repeat(50));
  
  try {
    const transformersProvider = await EmbeddingProvider.initTransformers({
      modelName: 'Xenova/all-MiniLM-L6-v2',
      quantized: true
    });
    
    console.log(`Model: ${transformersProvider.modelName}`);
    console.log(`Dimension: ${transformersProvider.dim}`);
    
    for (let i = 0; i < texts.length; i++) {
      const start = performance.now();
      const embedding = await transformersProvider.embed(texts[i]);
      const time = performance.now() - start;
      
      console.log(`Text ${i + 1}: ${Math.round(time * 100) / 100}ms`);
      console.log(`  First 5 values: [${embedding.slice(0, 5).map(v => Math.round(v * 1000) / 1000).join(', ')}...]`);
    }
  } catch (error) {
    console.log(`❌ Transformers.js failed: ${error.message}`);
    console.log('   This is expected if the model needs to be downloaded first.');
  }

  console.log();

  // 3. Semantic similarity comparison
  console.log('🧠 Semantic Similarity Analysis:');
  console.log('-'.repeat(50));
  
  const similarPairs = [
    [0, 1], // fox vs canine
    [2, 3]  // machine learning vs AI
  ];

  // Hash-based similarity
  console.log('Hash-based similarities:');
  for (const [i, j] of similarPairs) {
    const emb1 = await hashProvider.embed(texts[i]);
    const emb2 = await hashProvider.embed(texts[j]);
    const similarity = cosineSimilarity(emb1, emb2);
    
    console.log(`  "${texts[i]}" vs "${texts[j]}"`);
    console.log(`  Similarity: ${Math.round(similarity * 1000) / 1000}`);
  }

  // Transformers.js similarity (if available)
  try {
    const transformersProvider = await EmbeddingProvider.initTransformers();
    
    console.log('\nTransformers.js similarities:');
    for (const [i, j] of similarPairs) {
      const emb1 = await transformersProvider.embed(texts[i]);
      const emb2 = await transformersProvider.embed(texts[j]);
      const similarity = cosineSimilarity(emb1, emb2);
      
      console.log(`  "${texts[i]}" vs "${texts[j]}"`);
      console.log(`  Similarity: ${Math.round(similarity * 1000) / 1000}`);
    }
  } catch (error) {
    console.log('\n❌ Transformers.js similarity test skipped');
  }

  console.log('\n✅ Demonstration complete!');
}

function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Run the demonstration
demonstrateEmbeddings().catch(console.error);
