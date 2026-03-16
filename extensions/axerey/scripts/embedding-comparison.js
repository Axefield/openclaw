#!/usr/bin/env node

/**
 * Performance comparison between hash-based and transformers.js embeddings
 */

import { EmbeddingProvider } from '../dist/providers/embeddings.js';

// Test texts of varying lengths and complexity
const testTexts = [
  "Hello world",
  "The quick brown fox jumps over the lazy dog",
  "Machine learning is a subset of artificial intelligence that focuses on algorithms and statistical models that enable computer systems to improve their performance on a specific task through experience.",
  "In the realm of quantum computing, researchers are exploring the potential of quantum algorithms to solve problems that are intractable for classical computers. Quantum entanglement and superposition offer new computational paradigms that could revolutionize cryptography, optimization, and scientific simulation.",
  "The development of large language models has transformed the field of natural language processing, enabling unprecedented capabilities in text generation, translation, summarization, and question answering. These models, trained on vast corpora of text data, demonstrate emergent behaviors and reasoning abilities that continue to surprise researchers and practitioners alike."
];

async function measurePerformance(provider, text, iterations = 5) {
  const times = [];
  let embedding = null;
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    embedding = await provider.embed(text);
    const end = performance.now();
    
    times.push(end - start);
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  return {
    avgTime: Math.round(avgTime * 100) / 100,
    minTime: Math.round(minTime * 100) / 100,
    maxTime: Math.round(maxTime * 100) / 100,
    dimension: embedding ? embedding.length : 0,
    times
  };
}

async function compareEmbeddings() {
  console.log('🚀 Starting embedding performance comparison...\n');
  
  // Test hash-based provider
  console.log('📊 Testing Hash-based Embeddings...');
  const hashProvider = await EmbeddingProvider.initHash(1536);
  
  const hashResults = [];
  for (let i = 0; i < testTexts.length; i++) {
    const text = testTexts[i];
    console.log(`  Testing text ${i + 1}/${testTexts.length} (${text.length} chars)`);
    
    const result = await measurePerformance(hashProvider, text);
    hashResults.push({
      textIndex: i + 1,
      textLength: text.length,
      ...result
    });
  }
  
  console.log('\n🤖 Testing Transformers.js Embeddings...');
  let transformersResults = [];
  let transformersError = null;
  
  try {
    const transformersProvider = await EmbeddingProvider.initTransformers({
      modelName: 'Xenova/all-MiniLM-L6-v2',
      quantized: true
    });
    
    for (let i = 0; i < testTexts.length; i++) {
      const text = testTexts[i];
      console.log(`  Testing text ${i + 1}/${testTexts.length} (${text.length} chars)`);
      
      const result = await measurePerformance(transformersProvider, text);
      transformersResults.push({
        textIndex: i + 1,
        textLength: text.length,
        ...result
      });
    }
  } catch (error) {
    console.error('❌ Transformers.js initialization failed:', error.message);
    transformersError = error.message;
  }
  
  // Display results
  console.log('\n📈 PERFORMANCE COMPARISON RESULTS');
  console.log('=' .repeat(80));
  
  console.log('\n🔢 HASH-BASED EMBEDDINGS:');
  console.log('Text | Length | Avg Time | Min Time | Max Time | Dimension');
  console.log('-'.repeat(70));
  hashResults.forEach(result => {
    console.log(`${result.textIndex.toString().padStart(4)} | ${result.textLength.toString().padStart(6)} | ${result.avgTime.toString().padStart(8)}ms | ${result.minTime.toString().padStart(8)}ms | ${result.maxTime.toString().padStart(8)}ms | ${result.dimension}`);
  });
  
  if (transformersResults.length > 0) {
    console.log('\n🤖 TRANSFORMERS.JS EMBEDDINGS:');
    console.log('Text | Length | Avg Time | Min Time | Max Time | Dimension');
    console.log('-'.repeat(70));
    transformersResults.forEach(result => {
      console.log(`${result.textIndex.toString().padStart(4)} | ${result.textLength.toString().padStart(6)} | ${result.avgTime.toString().padStart(8)}ms | ${result.minTime.toString().padStart(8)}ms | ${result.maxTime.toString().padStart(8)}ms | ${result.dimension}`);
    });
  } else {
    console.log('\n❌ TRANSFORMERS.JS EMBEDDINGS: Not available');
    console.log(`Error: ${transformersError}`);
  }
  
  // Summary
  console.log('\n📊 SUMMARY:');
  console.log('=' .repeat(50));
  
  const hashAvgTime = hashResults.reduce((sum, r) => sum + r.avgTime, 0) / hashResults.length;
  console.log(`Hash-based average time: ${Math.round(hashAvgTime * 100) / 100}ms`);
  console.log(`Hash-based dimension: ${hashResults[0]?.dimension || 'N/A'}`);
  
  if (transformersResults.length > 0) {
    const transformersAvgTime = transformersResults.reduce((sum, r) => sum + r.avgTime, 0) / transformersResults.length;
    console.log(`Transformers.js average time: ${Math.round(transformersAvgTime * 100) / 100}ms`);
    console.log(`Transformers.js dimension: ${transformersResults[0]?.dimension || 'N/A'}`);
    
    const speedRatio = transformersAvgTime / hashAvgTime;
    console.log(`Speed ratio (Transformers/Hash): ${Math.round(speedRatio * 100) / 100}x`);
    
    if (speedRatio > 1) {
      console.log(`🏃 Hash-based is ${Math.round(speedRatio * 100) / 100}x faster`);
    } else {
      console.log(`🚀 Transformers.js is ${Math.round((1/speedRatio) * 100) / 100}x faster`);
    }
  }
  
  // Semantic similarity test
  console.log('\n🧠 SEMANTIC SIMILARITY TEST:');
  console.log('=' .repeat(50));
  
  const similarTexts = [
    "The cat sat on the mat",
    "A feline rested on the rug",
    "The dog ran in the park"
  ];
  
  console.log('Testing semantic similarity between:');
  similarTexts.forEach((text, i) => console.log(`  ${i + 1}. "${text}"`));
  
  // Hash-based similarity
  console.log('\nHash-based embeddings similarity:');
  const hashEmbeddings = await Promise.all(similarTexts.map(text => hashProvider.embed(text)));
  
  for (let i = 0; i < similarTexts.length; i++) {
    for (let j = i + 1; j < similarTexts.length; j++) {
      const similarity = cosineSimilarity(hashEmbeddings[i], hashEmbeddings[j]);
      console.log(`  Texts ${i + 1} & ${j + 1}: ${Math.round(similarity * 1000) / 1000}`);
    }
  }
  
  if (transformersResults.length > 0) {
    console.log('\nTransformers.js embeddings similarity:');
    const transformersProvider = await EmbeddingProvider.initTransformers();
    const transformersEmbeddings = await Promise.all(similarTexts.map(text => transformersProvider.embed(text)));
    
    for (let i = 0; i < similarTexts.length; i++) {
      for (let j = i + 1; j < similarTexts.length; j++) {
        const similarity = cosineSimilarity(transformersEmbeddings[i], transformersEmbeddings[j]);
        console.log(`  Texts ${i + 1} & ${j + 1}: ${Math.round(similarity * 1000) / 1000}`);
      }
    }
  }
  
  console.log('\n✅ Comparison complete!');
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

// Run the comparison
compareEmbeddings().catch(console.error);
