# Testing and Performance Patterns

## Performance Testing

**Timing Method**: Use `performance.now()` for accurate measurements
```typescript
const start = performance.now();
await performOperation();
const duration = performance.now() - start;
```

**Iterations**: Run tests multiple times (5-10) for reliability
```typescript
async function measurePerformance(operation, iterations = 10) {
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await operation();
    times.push(performance.now() - start);
  }
  return {
    avg: times.reduce((a, b) => a + b) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    times
  };
}
```

**Statistics**: Calculate min, max, avg, median times
- Use for performance regression detection
- Track improvements over time
- Identify performance bottlenecks

**Reference**: See `scripts/vss-performance-test.js` for patterns

## Benchmark Methodology

**Compare Implementations**:
- HNSW vs linear search
- VSS vs fallback methods
- Different algorithm parameters
- Various dataset sizes

**Test Dataset Sizes**: 100, 500, 1000, 2000 items
- Start small for quick iteration
- Scale up to production-like sizes
- Measure performance degradation

**Representative Data**: Use realistic memory content
```typescript
const testMemories = [
  {
    text: "Machine learning algorithms can learn from data to make predictions",
    tags: ["ml", "ai", "algorithms"],
    type: "episodic",
    importance: 0.8
  },
  // More realistic test data...
];
```

**Reference**: See `scripts/vector-search-comparison.js`

## Test Data Generation

**Function Pattern**: `generateTestMemories(count)` or `generateTestData(count)`
```typescript
function generateTestMemories(count) {
  const baseTexts = [
    "Machine learning algorithms can learn from data",
    "Artificial intelligence encompasses many techniques",
    // Base templates...
  ];
  
  const variations = [
    " and applications",
    " in various industries",
    " for business intelligence"
    // Variations...
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    text: baseTexts[i % baseTexts.length] + 
          variations[Math.floor(Math.random() * variations.length)] + 
          ` (${i + 1})`,
    tags: generateRandomTags(),
    importance: Math.random(),
    // Other fields...
  }));
}
```

**Variation**: Add randomness to avoid cache effects
- Different text variations
- Random importance scores
- Varied tag combinations
- Time-based randomization

**Realistic**: Mirror actual use cases
- Real-world text content
- Typical tag patterns
- Common importance distributions
- Realistic memory metadata

**Reference**: See `scripts/large-dataset-test.js`

## Vector Search Optimization

**HNSW Parameters**:
- M=16 (connections per node)
- efConstruction=200 (construction search width)
- ef=100 (search width)
- space='cosine' (distance metric)

**Tuning Trade-offs**:
- Higher M: Better accuracy, more memory
- Higher efConstruction: Better quality, slower build
- Higher ef: Better accuracy, slower search

**Monitoring**: Track search times and result quality
```typescript
const searchResults = await vss.search(query, { k: 10 });
const searchTime = performance.now() - start;
const quality = calculateResultQuality(searchResults);
```

**Fallback Strategy**: Cosine similarity if VSS unavailable
```typescript
if (vssAvailable) {
  return await vssSearch(query, options);
} else {
  return await cosineSimilaritySearch(query, options);
}
```

## Integration Testing

**MCP Protocol Testing**:
- Verify tool registration
- Test tool execution
- Validate error handling
- Check response format

**Memory Operations Testing**:
- Store memories
- Recall by ID and query
- Search functionality
- Update operations
- Delete operations

**Database Testing**:
- Test migrations
- Verify queries
- Check transactions
- Validate constraints

**Configuration Testing**:
- Test loading
- Verify overrides
- Check encryption
- Validate schemas

## Performance Monitoring

**Key Metrics**:
- Search latency (ms)
- Memory usage (MB)
- Database query time
- Vector operation speed
- Cache hit rates

**Monitoring Setup**:
```typescript
const metrics = {
  searchLatency: [],
  memoryUsage: [],
  queryTime: [],
  cacheHits: 0,
  cacheMisses: 0
};

function recordMetric(name, value) {
  metrics[name].push(value);
  // Keep only last 100 measurements
  if (metrics[name].length > 100) {
    metrics[name].shift();
  }
}
```

**Alerting**: Set thresholds for performance degradation
- Search time > 100ms
- Memory usage > 1GB
- Cache hit rate < 80%

## Test Organization

**Scripts Directory**: `scripts/` for performance tests
- `vss-performance-test.js` - Vector search benchmarks
- `vector-search-comparison.js` - Algorithm comparisons
- `large-dataset-test.js` - Scale testing
- `embedding-comparison.js` - Provider testing

**Pattern**: Import from `dist/` compiled code
```typescript
import { MemoryStore } from '../dist/memory.js';
import { VSSMemoryStore } from '../dist/memory-vss.js';
```

**Naming**: Descriptive names indicating purpose
- `vss-performance-test.js`
- `memory-benchmark.js`
- `search-comparison.js`

## Key Principles

1. **Measure Before Optimizing**: Establish baseline performance
2. **Test Realistic Workloads**: Use production-like data
3. **Iterate and Improve**: Regular performance testing
4. **Monitor in Production**: Track real-world performance
5. **Document Performance**: Record optimization results
6. **Automate Testing**: Include performance in CI/CD
