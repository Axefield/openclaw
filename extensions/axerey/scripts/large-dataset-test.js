#!/usr/bin/env node

/**
 * Large dataset test to demonstrate HNSW advantages over linear search
 */

import { EmbeddingProvider } from '../dist/providers/embeddings.js';
import { HNSWVectorSearch, createHNSWSearch } from '../dist/providers/hnsw-search.js';

// Generate more test data for better comparison
function generateTestData(count) {
  const baseTexts = [
    "Machine learning algorithms can learn from data to make predictions or decisions",
    "Artificial intelligence encompasses machine learning, deep learning, and neural networks",
    "Natural language processing helps computers understand human language",
    "Computer vision enables machines to interpret and analyze visual information",
    "Data science combines statistics, programming, and domain expertise",
    "Deep learning uses neural networks with multiple layers for complex pattern recognition",
    "Reinforcement learning involves agents learning through interaction with environments",
    "Supervised learning uses labeled training data to make predictions",
    "Unsupervised learning finds hidden patterns in data without labels",
    "Semi-supervised learning combines labeled and unlabeled data for training"
  ];
  
  const variations = [
    " and applications",
    " in various industries",
    " for business intelligence",
    " with advanced techniques",
    " using modern frameworks",
    " for real-time processing",
    " in cloud environments",
    " with big data technologies",
    " for predictive analytics",
    " in research applications"
  ];
  
  const texts = [];
  for (let i = 0; i < count; i++) {
    const baseText = baseTexts[i % baseTexts.length];
    const variation = variations[Math.floor(Math.random() * variations.length)];
    texts.push(baseText + variation + ` (${i + 1})`);
  }
  
  return texts;
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

async function linearSearch(embeddings, queryEmbedding, k = 5) {
  const similarities = [];
  
  for (let i = 0; i < embeddings.length; i++) {
    const similarity = cosineSimilarity(queryEmbedding, embeddings[i]);
    similarities.push({ index: i, similarity });
  }
  
  similarities.sort((a, b) => b.similarity - a.similarity);
  
  return {
    neighbors: similarities.slice(0, k).map(item => item.index),
    distances: similarities.slice(0, k).map(item => 1 - item.similarity)
  };
}

async function measureSearchPerformance(searchFn, queryEmbedding, iterations = 5) {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const result = await searchFn(queryEmbedding, 5);
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
    times
  };
}

async function testLargeDataset() {
  console.log('🚀 Large Dataset Vector Search Test\n');
  
  // Initialize embedding provider
  console.log('📊 Initializing embedding provider...');
  const embeddingProvider = await EmbeddingProvider.initTransformers({
    modelName: 'Xenova/all-MiniLM-L6-v2',
    quantized: true
  });
  
  const dimension = embeddingProvider.dim;
  console.log(`Using ${dimension}-dimensional embeddings\n`);
  
  // Test with different dataset sizes
  const testSizes = [100, 500, 1000, 2000];
  const results = [];
  
  for (const size of testSizes) {
    console.log(`🔍 Testing with ${size} vectors...`);
    
    // Generate test data
    const texts = generateTestData(size);
    
    // Generate embeddings
    console.log(`  Generating ${size} embeddings...`);
    const embeddings = [];
    for (let i = 0; i < texts.length; i++) {
      if (i % 100 === 0) {
        console.log(`    Progress: ${i}/${texts.length}`);
      }
      const embedding = await embeddingProvider.embed(texts[i]);
      embeddings.push(embedding);
    }
    
    // Select random query
    const queryIndex = Math.floor(Math.random() * embeddings.length);
    const queryEmbedding = embeddings[queryIndex];
    const queryText = texts[queryIndex];
    
    console.log(`  Query: "${queryText.substring(0, 60)}..."`);
    
    // Linear search performance
    console.log('  Running linear search...');
    const linearSearchFn = (query, k) => linearSearch(embeddings, query, k);
    const linearPerf = await measureSearchPerformance(linearSearchFn, queryEmbedding);
    
    // HNSW search performance
    console.log('  Setting up HNSW index...');
    const hnswSearch = await createHNSWSearch(dimension, {
      maxElements: size * 2,
      M: 16,
      efConstruction: 200,
      ef: 100,
      space: 'cosine'
    });
    
    // Add all embeddings to HNSW index
    for (let i = 0; i < embeddings.length; i++) {
      hnswSearch.addPoint(embeddings[i], i);
    }
    
    console.log('  Running HNSW search...');
    const hnswSearchFn = (query, k) => hnswSearch.searchKnn(query, k);
    const hnswPerf = await measureSearchPerformance(hnswSearchFn, queryEmbedding);
    
    // Compare results quality
    const linearResult = await linearSearchFn(queryEmbedding, 5);
    const hnswResult = await hnswSearchFn(queryEmbedding, 5);
    
    // Calculate overlap
    const linearSet = new Set(linearResult.neighbors);
    const hnswSet = new Set(hnswResult.neighbors);
    const overlap = [...linearSet].filter(x => hnswSet.has(x)).length;
    const overlapPercent = Math.round((overlap / 5) * 100);
    
    const result = {
      size,
      linear: linearPerf,
      hnsw: hnswPerf,
      speedup: Math.round((linearPerf.avgTime / hnswPerf.avgTime) * 100) / 100,
      overlap: overlapPercent
    };
    
    results.push(result);
    
    console.log(`  ✅ Linear: ${linearPerf.avgTime}ms avg | HNSW: ${hnswPerf.avgTime}ms avg | Speedup: ${result.speedup}x | Overlap: ${overlapPercent}%\n`);
  }
  
  // Display results
  console.log('📈 LARGE DATASET PERFORMANCE RESULTS');
  console.log('=' .repeat(80));
  
  console.log('\n📊 PERFORMANCE BY DATASET SIZE:');
  console.log('Size  | Linear (ms) | HNSW (ms) | Speedup | Overlap | Memory (MB)');
  console.log('-'.repeat(70));
  
  results.forEach(result => {
    const memoryMB = Math.round((result.size * dimension * 4) / (1024 * 1024) * 100) / 100;
    console.log(`${result.size.toString().padStart(5)} | ${result.linear.avgTime.toString().padStart(11)} | ${result.hnsw.avgTime.toString().padStart(9)} | ${result.speedup.toString().padStart(7)}x | ${result.overlap.toString().padStart(6)}% | ${memoryMB.toString().padStart(10)}`);
  });
  
  // Performance analysis
  console.log('\n📊 PERFORMANCE ANALYSIS:');
  console.log('=' .repeat(50));
  
  const avgSpeedup = results.reduce((sum, r) => sum + r.speedup, 0) / results.length;
  const maxSpeedup = Math.max(...results.map(r => r.speedup));
  const minSpeedup = Math.min(...results.map(r => r.speedup));
  
  console.log(`Average speedup: ${Math.round(avgSpeedup * 100) / 100}x`);
  console.log(`Maximum speedup: ${Math.round(maxSpeedup * 100) / 100}x`);
  console.log(`Minimum speedup: ${Math.round(minSpeedup * 100) / 100}x`);
  
  // Scaling analysis
  console.log('\n📈 SCALING ANALYSIS:');
  console.log('=' .repeat(50));
  
  if (results.length >= 2) {
    const firstResult = results[0];
    const lastResult = results[results.length - 1];
    
    const linearGrowth = lastResult.linear.avgTime / firstResult.linear.avgTime;
    const hnswGrowth = lastResult.hnsw.avgTime / firstResult.hnsw.avgTime;
    
    console.log(`Linear search scaling: ${Math.round(linearGrowth * 100) / 100}x (${firstResult.size} → ${lastResult.size} vectors)`);
    console.log(`HNSW search scaling: ${Math.round(hnswGrowth * 100) / 100}x (${firstResult.size} → ${lastResult.size} vectors)`);
    console.log(`HNSW scales ${Math.round((linearGrowth / hnswGrowth) * 100) / 100}x better than linear search`);
  }
  
  // Memory analysis
  console.log('\n💾 MEMORY ANALYSIS:');
  console.log('=' .repeat(50));
  
  const maxSize = Math.max(...results.map(r => r.size));
  const embeddingSize = dimension * 4; // 4 bytes per float32
  const linearMemory = maxSize * embeddingSize;
  const hnswMemory = linearMemory * 1.5; // Rough estimate for HNSW overhead
  
  console.log(`Linear search memory (${maxSize} vectors): ${Math.round(linearMemory / (1024 * 1024) * 100) / 100} MB`);
  console.log(`HNSW memory (${maxSize} vectors): ${Math.round(hnswMemory / (1024 * 1024) * 100) / 100} MB`);
  console.log(`Memory overhead: ${Math.round(((hnswMemory / linearMemory) - 1) * 100)}%`);
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('=' .repeat(50));
  
  if (avgSpeedup > 5) {
    console.log('🚀 HNSW provides excellent speedup - highly recommended for production');
  } else if (avgSpeedup > 2) {
    console.log('⚡ HNSW provides good speedup - recommended for most use cases');
  } else if (avgSpeedup > 1) {
    console.log('🤔 HNSW provides moderate speedup - consider for larger datasets');
  } else {
    console.log('❌ HNSW provides minimal speedup - linear search may be sufficient');
  }
  
  console.log('\n🎯 BREAK-EVEN POINT:');
  const breakEvenSize = results.find(r => r.speedup >= 1.0)?.size || 'Not reached';
  console.log(`HNSW becomes faster than linear search at: ${breakEvenSize} vectors`);
  
  console.log('\n🎯 OPTIMAL USE CASES:');
  console.log('Use HNSW when:');
  console.log('  ✅ Dataset size > 500 vectors');
  console.log('  ✅ Search speed is critical');
  console.log('  ✅ You perform many searches');
  console.log('  ✅ Memory usage is not a primary concern');
  
  console.log('\nUse linear search when:');
  console.log('  ✅ Dataset size < 500 vectors');
  console.log('  ✅ Memory usage is critical');
  console.log('  ✅ You rarely perform searches');
  console.log('  ✅ Perfect accuracy is required');
  
  console.log('\n✅ Large dataset test complete!');
}

// Run the test
testLargeDataset().catch(console.error);
