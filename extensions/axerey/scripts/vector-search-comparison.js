#!/usr/bin/env node

/**
 * Performance comparison between HNSW and linear search for vector similarity
 */

import { EmbeddingProvider } from '../dist/providers/embeddings.js';
import { HNSWVectorSearch, createHNSWSearch } from '../dist/providers/hnsw-search.js';

// Test texts of varying lengths and complexity
const testTexts = [
  "Hello world",
  "The quick brown fox jumps over the lazy dog",
  "Machine learning is a subset of artificial intelligence that focuses on algorithms and statistical models that enable computer systems to improve their performance on a specific task through experience.",
  "In the realm of quantum computing, researchers are exploring the potential of quantum algorithms to solve problems that are intractable for classical computers. Quantum entanglement and superposition offer new computational paradigms that could revolutionize cryptography, optimization, and scientific simulation.",
  "The development of large language models has transformed the field of natural language processing, enabling unprecedented capabilities in text generation, translation, summarization, and question answering. These models, trained on vast corpora of text data, demonstrate emergent behaviors and reasoning abilities that continue to surprise researchers and practitioners alike.",
  "Artificial intelligence and machine learning are rapidly evolving fields that combine computer science, mathematics, and domain expertise to create systems that can learn and make decisions.",
  "Natural language processing is a branch of artificial intelligence that helps computers understand, interpret and manipulate human language in a valuable way.",
  "Deep learning is a subset of machine learning that uses neural networks with multiple layers to model and understand complex patterns in data.",
  "Computer vision is a field of artificial intelligence that trains computers to interpret and understand the visual world using digital images and videos.",
  "Data science is an interdisciplinary field that uses scientific methods, processes, algorithms and systems to extract knowledge and insights from data."
];

// Additional texts for larger dataset testing
const additionalTexts = [
  "Blockchain technology is a distributed ledger system that maintains a continuously growing list of records, called blocks, which are linked and secured using cryptography.",
  "Cloud computing is the delivery of computing services including servers, storage, databases, networking, software, analytics, and intelligence over the Internet.",
  "Cybersecurity is the practice of protecting systems, networks, and programs from digital attacks that are usually aimed at accessing, changing, or destroying sensitive information.",
  "Internet of Things (IoT) refers to the network of physical objects that are embedded with sensors, software, and other technologies for the purpose of connecting and exchanging data with other devices and systems over the Internet.",
  "Augmented reality (AR) is an interactive experience of a real-world environment where the objects that reside in the real world are enhanced by computer-generated perceptual information.",
  "Virtual reality (VR) is a computer-generated simulation of a three-dimensional image or environment that can be interacted with in a seemingly real or physical way by a person using special electronic equipment.",
  "Edge computing is a distributed computing paradigm that brings computation and data storage closer to the sources of data, improving response times and saving bandwidth.",
  "5G is the fifth generation of cellular network technology that provides faster data speeds, lower latency, and greater capacity than previous generations.",
  "Quantum computing is a type of computation that harnesses the collective properties of quantum states, such as superposition, interference, and entanglement, to perform calculations.",
  "Robotics is an interdisciplinary branch of engineering and science that includes mechanical engineering, electrical engineering, computer science, and others."
];

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
  
  // Sort by similarity (descending) and return top k
  similarities.sort((a, b) => b.similarity - a.similarity);
  
  return {
    neighbors: similarities.slice(0, k).map(item => item.index),
    distances: similarities.slice(0, k).map(item => 1 - item.similarity) // Convert similarity to distance
  };
}

async function measureSearchPerformance(searchFn, queryEmbedding, iterations = 10) {
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

async function compareVectorSearch() {
  console.log('🚀 Starting vector search performance comparison...\n');
  
  // Initialize embedding provider
  console.log('📊 Initializing embedding provider...');
  const embeddingProvider = await EmbeddingProvider.initTransformers({
    modelName: 'Xenova/all-MiniLM-L6-v2',
    quantized: true
  });
  
  const dimension = embeddingProvider.dim;
  console.log(`Using ${dimension}-dimensional embeddings\n`);
  
  // Generate embeddings for all test texts
  console.log('🔄 Generating embeddings...');
  const allTexts = [...testTexts, ...additionalTexts];
  const embeddings = [];
  
  for (let i = 0; i < allTexts.length; i++) {
    const text = allTexts[i];
    console.log(`  Generating embedding ${i + 1}/${allTexts.length}: "${text.substring(0, 50)}..."`);
    const embedding = await embeddingProvider.embed(text);
    embeddings.push(embedding);
  }
  
  console.log(`\n✅ Generated ${embeddings.length} embeddings\n`);
  
  // Initialize HNSW index
  console.log('🌐 Initializing HNSW index...');
  const hnswSearch = await createHNSWSearch(dimension, {
    maxElements: allTexts.length * 2, // Allow for growth
    M: 16,
    efConstruction: 200,
    ef: 100,
    space: 'cosine'
  });
  
  // Add all embeddings to HNSW index
  console.log('📝 Adding embeddings to HNSW index...');
  for (let i = 0; i < embeddings.length; i++) {
    hnswSearch.addPoint(embeddings[i], i);
  }
  
  console.log(`✅ Added ${hnswSearch.getCurrentCount()} points to HNSW index\n`);
  
  // Test with different dataset sizes
  const testSizes = [10, 20, 50, 100, 200];
  const results = [];
  
  for (const size of testSizes) {
    if (size > allTexts.length) continue;
    
    console.log(`🔍 Testing with ${size} vectors...`);
    
    // Prepare test data
    const testEmbeddings = embeddings.slice(0, size);
    const queryEmbedding = testEmbeddings[Math.floor(Math.random() * testEmbeddings.length)];
    
    // Linear search performance
    const linearSearchFn = (query, k) => linearSearch(testEmbeddings, query, k);
    const linearPerf = await measureSearchPerformance(linearSearchFn, queryEmbedding);
    
    // HNSW search performance (recreate index for fair comparison)
    const hnswTest = await createHNSWSearch(dimension, {
      maxElements: size * 2,
      M: 16,
      efConstruction: 200,
      ef: 100,
      space: 'cosine'
    });
    
    for (let i = 0; i < size; i++) {
      hnswTest.addPoint(testEmbeddings[i], i);
    }
    
    const hnswSearchFn = (query, k) => hnswTest.searchKnn(query, k);
    const hnswPerf = await measureSearchPerformance(hnswSearchFn, queryEmbedding);
    
    // Compare results quality
    const linearResult = await linearSearchFn(queryEmbedding, 5);
    const hnswResult = await hnswSearchFn(queryEmbedding, 5);
    
    // Calculate overlap in results
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
    
    console.log(`  Linear search: ${linearPerf.avgTime}ms avg`);
    console.log(`  HNSW search: ${hnswPerf.avgTime}ms avg`);
    console.log(`  Speedup: ${result.speedup}x`);
    console.log(`  Result overlap: ${overlapPercent}%`);
    console.log('');
  }
  
  // Display comprehensive results
  console.log('📈 VECTOR SEARCH PERFORMANCE RESULTS');
  console.log('=' .repeat(80));
  
  console.log('\n📊 PERFORMANCE BY DATASET SIZE:');
  console.log('Size | Linear (ms) | HNSW (ms) | Speedup | Overlap');
  console.log('-'.repeat(60));
  
  results.forEach(result => {
    console.log(`${result.size.toString().padStart(4)} | ${result.linear.avgTime.toString().padStart(11)} | ${result.hnsw.avgTime.toString().padStart(9)} | ${result.speedup.toString().padStart(7)}x | ${result.overlap.toString().padStart(6)}%`);
  });
  
  // Summary statistics
  console.log('\n📊 SUMMARY STATISTICS:');
  console.log('=' .repeat(50));
  
  const avgSpeedup = results.reduce((sum, r) => sum + r.speedup, 0) / results.length;
  const maxSpeedup = Math.max(...results.map(r => r.speedup));
  const minSpeedup = Math.min(...results.map(r => r.speedup));
  const avgOverlap = results.reduce((sum, r) => sum + r.overlap, 0) / results.length;
  
  console.log(`Average speedup: ${Math.round(avgSpeedup * 100) / 100}x`);
  console.log(`Maximum speedup: ${Math.round(maxSpeedup * 100) / 100}x`);
  console.log(`Minimum speedup: ${Math.round(minSpeedup * 100) / 100}x`);
  console.log(`Average result overlap: ${Math.round(avgOverlap)}%`);
  
  // Performance trend analysis
  console.log('\n📈 PERFORMANCE TRENDS:');
  console.log('=' .repeat(50));
  
  if (results.length >= 2) {
    const firstResult = results[0];
    const lastResult = results[results.length - 1];
    
    const linearGrowth = lastResult.linear.avgTime / firstResult.linear.avgTime;
    const hnswGrowth = lastResult.hnsw.avgTime / firstResult.hnsw.avgTime;
    
    console.log(`Linear search time growth: ${Math.round(linearGrowth * 100) / 100}x`);
    console.log(`HNSW search time growth: ${Math.round(hnswGrowth * 100) / 100}x`);
    console.log(`HNSW scales better by: ${Math.round((linearGrowth / hnswGrowth) * 100) / 100}x`);
  }
  
  // Memory usage estimation
  console.log('\n💾 MEMORY USAGE ESTIMATION:');
  console.log('=' .repeat(50));
  
  const embeddingSize = dimension * 4; // 4 bytes per float32
  const linearMemory = embeddings.length * embeddingSize;
  const hnswMemory = linearMemory * 1.5; // Rough estimate for HNSW overhead
  
  console.log(`Linear search memory: ${Math.round(linearMemory / 1024)} KB`);
  console.log(`HNSW memory (estimated): ${Math.round(hnswMemory / 1024)} KB`);
  console.log(`Memory overhead: ${Math.round(((hnswMemory / linearMemory) - 1) * 100)}%`);
  
  console.log('\n✅ Vector search comparison complete!');
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('=' .repeat(50));
  
  if (avgSpeedup > 2) {
    console.log('🚀 HNSW provides significant speedup - recommended for production use');
  } else if (avgSpeedup > 1.5) {
    console.log('⚡ HNSW provides moderate speedup - consider for larger datasets');
  } else {
    console.log('🤔 HNSW speedup is minimal - linear search may be sufficient for small datasets');
  }
  
  if (avgOverlap > 80) {
    console.log('✅ HNSW results are highly accurate compared to linear search');
  } else if (avgOverlap > 60) {
    console.log('⚠️  HNSW results are reasonably accurate but may miss some relevant items');
  } else {
    console.log('❌ HNSW results have low overlap - consider tuning parameters');
  }
  
  console.log('\n🎯 Use HNSW when:');
  console.log('  - Dataset size > 1000 vectors');
  console.log('  - Search speed is critical');
  console.log('  - You can accept slight accuracy trade-offs');
  console.log('\n🎯 Use linear search when:');
  console.log('  - Dataset size < 1000 vectors');
  console.log('  - Perfect accuracy is required');
  console.log('  - Memory usage is a concern');
}

// Run the comparison
compareVectorSearch().catch(console.error);
