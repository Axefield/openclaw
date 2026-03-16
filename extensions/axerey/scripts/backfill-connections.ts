/**
 * Backfill Memory Connections from Existing Data
 * 
 * Infers connections from:
 * - Shared tags (associates)
 * - Same sessionId (associates/extends)
 * - Similar embeddings (associates/supports)
 * - Same type/source (associates)
 * - mergedFrom relationships (derives)
 * - Sequential creation times (extends/refines)
 */

import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { cosine } from "../src/ranker.js";

interface Memory {
  id: string;
  text: string;
  tags: string[];
  type: string;
  source: string;
  sessionId: string | null;
  embedding: number[];
  createdAt: number;
  mergedFrom: string[];
  importance: number;
  confidence: number;
  belief?: boolean;
  outcome?: 'success' | 'failure' | 'neutral' | null;
  score?: number | null;
  efficiency?: number | null;
  helpful?: boolean | null;
  servedContextId?: string | null;
  features?: { [key: string]: any };
}

interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  connectionType: string;
  strength: number;
  inferred: boolean;
  inferenceConfidence: number;
  description: string;
  createdAt: number;
}

export async function backfillConnections(dbPath: string): Promise<void> {
  const db = new Database(dbPath);
  
  console.log('Starting connection backfill...');
  
  // Ensure connection table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS memory_connections (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      connection_type TEXT NOT NULL,
      strength REAL DEFAULT 0.5,
      inferred INTEGER DEFAULT 1,
      inference_confidence REAL,
      description TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (source_id) REFERENCES memories(id),
      FOREIGN KEY (target_id) REFERENCES memories(id)
    );
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_connections_source ON memory_connections(source_id);
    CREATE INDEX IF NOT EXISTS idx_connections_target ON memory_connections(target_id);
    CREATE INDEX IF NOT EXISTS idx_connections_type ON memory_connections(connection_type);
  `);
  
  // Get all memories with all Axerey-specific fields
  const memories = db.prepare(`
    SELECT id, text, tags, type, source, session_id, embedding, created_at, merged_from, 
           importance, confidence, belief, outcome, score, efficiency, helpful, 
           served_context_id, features
    FROM memories
    ORDER BY created_at ASC
  `).all() as any[];
  
  console.log(`Found ${memories.length} memories to process`);
  
  const connections: Connection[] = [];
  const processedPairs = new Set<string>();
  
  // Helper to create pair key
  const pairKey = (id1: string, id2: string) => {
    return id1 < id2 ? `${id1}:${id2}` : `${id2}:${id1}`;
  };
  
  // Helper to parse JSON fields
  const parseMemory = (m: any): Memory => ({
    id: m.id,
    text: m.text,
    tags: JSON.parse(m.tags || '[]'),
    type: m.type || 'episodic',
    source: m.source || 'plan',
    sessionId: m.session_id,
    embedding: JSON.parse(m.embedding || '[]'),
    createdAt: m.created_at,
    mergedFrom: JSON.parse(m.merged_from || '[]'),
    importance: m.importance || 0.5,
    confidence: m.confidence || 1.0,
    belief: !!m.belief,
    outcome: m.outcome || null,
    score: m.score ?? null,
    efficiency: m.efficiency ?? null,
    helpful: m.helpful === 1 ? true : m.helpful === 0 ? false : null,
    servedContextId: m.served_context_id || null,
    features: JSON.parse(m.features || '{}')
  });
  
  const parsedMemories = memories.map(parseMemory);
  
  // 1. Process mergedFrom relationships (derives)
  for (const memory of parsedMemories) {
    for (const mergedId of memory.mergedFrom) {
      const key = pairKey(memory.id, mergedId);
      if (!processedPairs.has(key)) {
        connections.push({
          id: randomUUID(),
          sourceId: memory.id,
          targetId: mergedId,
          connectionType: 'derives',
          strength: 0.9,
          inferred: true,
          inferenceConfidence: 0.95,
          description: 'Inferred from mergedFrom relationship',
          createdAt: Date.now()
        });
        processedPairs.add(key);
      }
    }
  }
  
  console.log(`Created ${connections.length} derives connections from mergedFrom`);
  
  // 2. Process argument-related memories (steelman, strawman, pipeline)
  const argumentMemories = parsedMemories.filter(m => 
    m.tags.includes('argument') || 
    (m.features && (m.features.argumentType === 'steelman' || m.features.argumentType === 'strawman' || m.features.argumentType === 'pipeline'))
  );
  
  if (argumentMemories.length > 0) {
    console.log(`Processing ${argumentMemories.length} argument-related memories...`);
    
    // Group by original claim (normalized)
    const claimMap = new Map<string, typeof argumentMemories>();
    
    for (const mem of argumentMemories) {
      const originalClaim = mem.features?.originalClaim || mem.text;
      // Normalize claim for matching (simple approach - in production might use embeddings)
      const normalizedClaim = originalClaim.toLowerCase().trim().substring(0, 100);
      
      if (!claimMap.has(normalizedClaim)) {
        claimMap.set(normalizedClaim, []);
      }
      claimMap.get(normalizedClaim)!.push(mem);
    }
    
    // Connect memories analyzing the same claim
    for (const [claim, mems] of claimMap.entries()) {
      if (mems.length < 2) continue;
      
      const steelmanMems = mems.filter(m => 
        m.tags.includes('steelman') || m.features?.argumentType === 'steelman'
      );
      const strawmanMems = mems.filter(m => 
        m.tags.includes('strawman') || m.features?.argumentType === 'strawman'
      );
      const pipelineMems = mems.filter(m => 
        m.tags.includes('pipeline') || m.features?.argumentType === 'pipeline'
      );
      
      // Connect steelman to strawman (steelman refines strawman)
      for (const steelman of steelmanMems) {
        for (const strawman of strawmanMems) {
          const key = pairKey(steelman.id, strawman.id);
          if (!processedPairs.has(key)) {
            connections.push({
              id: randomUUID(),
              sourceId: steelman.id,
              targetId: strawman.id,
              connectionType: 'refines',
              strength: 0.85,
              inferred: true,
              inferenceConfidence: 0.9,
              description: 'Steelman refines strawman analysis of same claim',
              createdAt: Date.now()
            });
            processedPairs.add(key);
          }
        }
      }
      
      // Connect pipeline to related memories
      for (const pipeline of pipelineMems) {
        const distortedClaim = pipeline.features?.distortedClaim;
        const steelmannedClaim = pipeline.features?.steelmannedClaim;
        
        // Connect pipeline to strawman (if pipeline has distorted claim)
        if (distortedClaim) {
          for (const strawman of strawmanMems) {
            const key = pairKey(pipeline.id, strawman.id);
            if (!processedPairs.has(key)) {
              connections.push({
                id: randomUUID(),
                sourceId: pipeline.id,
                targetId: strawman.id,
                connectionType: 'derives',
                strength: 0.8,
                inferred: true,
                inferenceConfidence: 0.85,
                description: 'Pipeline derives from strawman analysis',
                createdAt: Date.now()
              });
              processedPairs.add(key);
            }
          }
        }
        
        // Connect pipeline to steelman (if pipeline has steelmanned claim)
        if (steelmannedClaim) {
          for (const steelman of steelmanMems) {
            const key = pairKey(pipeline.id, steelman.id);
            if (!processedPairs.has(key)) {
              connections.push({
                id: randomUUID(),
                sourceId: pipeline.id,
                targetId: steelman.id,
                connectionType: 'supports',
                strength: 0.85,
                inferred: true,
                inferenceConfidence: 0.9,
                description: 'Pipeline supports steelman analysis',
                createdAt: Date.now()
              });
              processedPairs.add(key);
            }
          }
        }
      }
      
      // Connect all argument memories analyzing same claim (associates)
      for (let i = 0; i < mems.length; i++) {
        for (let j = i + 1; j < mems.length; j++) {
          const mem1 = mems[i];
          const mem2 = mems[j];
          const key = pairKey(mem1.id, mem2.id);
          
          if (!processedPairs.has(key)) {
            // Check if they contradict (steelman vs strawman of same claim)
            const isContradiction = (
              (steelmanMems.includes(mem1) && strawmanMems.includes(mem2)) ||
              (strawmanMems.includes(mem1) && steelmanMems.includes(mem2))
            );
            
            connections.push({
              id: randomUUID(),
              sourceId: mem1.id,
              targetId: mem2.id,
              connectionType: isContradiction ? 'contradicts' : 'associates',
              strength: isContradiction ? 0.7 : 0.6,
              inferred: true,
              inferenceConfidence: isContradiction ? 0.8 : 0.7,
              description: isContradiction 
                ? 'Steelman and strawman analysis of same claim (contradictory perspectives)'
                : 'Both analyze the same claim',
              createdAt: Date.now()
            });
            processedPairs.add(key);
          }
        }
      }
    }
    
    const argumentConnectionsCount = connections.filter(c => 
      c.description?.includes('Steelman') || 
      c.description?.includes('strawman') ||
      c.description?.includes('Pipeline') ||
      c.description?.includes('analyze the same claim')
    ).length;
    console.log(`Created ${argumentConnectionsCount} argument-related connections`);
  }
  
  // 3. Process shared tags (associates) - OPTIMIZED for 1444 tags / 620 memories
  console.log('Analyzing tag distribution...');
  
  // Calculate tag frequency
  const tagFrequency = new Map<string, number>();
  for (const memory of parsedMemories) {
    for (const tag of memory.tags) {
      tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
    }
  }
  
  const totalMemories = parsedMemories.length;
  const commonTagThreshold = Math.max(10, totalMemories * 0.15); // Tags in >15% of memories are "common"
  const rareTagThreshold = Math.max(2, totalMemories * 0.02); // Tags in <2% are "rare"
  
  // Categorize tags
  const commonTags = new Set<string>();
  const rareTags = new Set<string>();
  const mediumTags = new Set<string>();
  
  for (const [tag, count] of tagFrequency.entries()) {
    if (count >= commonTagThreshold) {
      commonTags.add(tag);
    } else if (count <= rareTagThreshold) {
      rareTags.add(tag);
    } else {
      mediumTags.add(tag);
    }
  }
  
  console.log(`Tag distribution: ${commonTags.size} common, ${mediumTags.size} medium, ${rareTags.size} rare`);
  
  // Build tag-to-memory map (only for non-common tags to avoid over-connecting)
  const tagMap = new Map<string, Memory[]>();
  for (const memory of parsedMemories) {
    // Only index meaningful tags (not common ones)
    const meaningfulTags = memory.tags.filter(t => !commonTags.has(t));
    for (const tag of meaningfulTags) {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, []);
      }
      tagMap.get(tag)!.push(memory);
    }
  }
  
  // Strategy 1: Connect memories with rare tag combinations (high specificity)
  const tagCombinationMap = new Map<string, Memory[]>();
  for (const memory of parsedMemories) {
    // Get tag combinations of 2-3 tags (excluding common tags)
    const meaningfulTags = memory.tags.filter(t => !commonTags.has(t)).sort();
    if (meaningfulTags.length >= 2) {
      // Create combinations of 2 tags
      for (let i = 0; i < meaningfulTags.length; i++) {
        for (let j = i + 1; j < meaningfulTags.length; j++) {
          const combo = `${meaningfulTags[i]}+${meaningfulTags[j]}`;
          if (!tagCombinationMap.has(combo)) {
            tagCombinationMap.set(combo, []);
          }
          tagCombinationMap.get(combo)!.push(memory);
        }
      }
    }
  }
  
  // Connect memories with rare tag combinations (high specificity)
  let tagComboConnections = 0;
  for (const [combo, mems] of tagCombinationMap.entries()) {
    if (mems.length >= 2 && mems.length <= 10) { // Only connect if 2-10 memories share this combo
      for (let i = 0; i < mems.length; i++) {
        for (let j = i + 1; j < mems.length; j++) {
          const mem1 = mems[i];
          const mem2 = mems[j];
          const key = pairKey(mem1.id, mem2.id);
          
          if (!processedPairs.has(key)) {
            const sharedTags = mem1.tags.filter(t => mem2.tags.includes(t) && !commonTags.has(t));
            const sharedCount = sharedTags.length;
            const strength = Math.min(0.85, 0.5 + (sharedCount * 0.1));
            
            connections.push({
              id: randomUUID(),
              sourceId: mem1.id,
              targetId: mem2.id,
              connectionType: 'associates',
              strength,
              inferred: true,
              inferenceConfidence: 0.75,
              description: `Rare tag combination: ${sharedTags.slice(0, 3).join(', ')}`,
              createdAt: Date.now()
            });
            processedPairs.add(key);
            tagComboConnections++;
          }
        }
      }
    }
  }
  
  console.log(`Created ${tagComboConnections} connections from rare tag combinations`);
  
  // Strategy 2: Connect memories with multiple shared medium-frequency tags
  let multiTagConnections = 0;
  for (let i = 0; i < parsedMemories.length; i++) {
    const mem1 = parsedMemories[i];
    const mem1MeaningfulTags = new Set(mem1.tags.filter(t => !commonTags.has(t)));
    
    if (mem1MeaningfulTags.size === 0) continue;
    
    // Only check a limited number of other memories to avoid O(n²) explosion
    const maxChecks = Math.min(50, parsedMemories.length - i - 1);
    for (let j = i + 1; j < i + 1 + maxChecks; j++) {
      const mem2 = parsedMemories[j];
      const mem2MeaningfulTags = new Set(mem2.tags.filter(t => !commonTags.has(t)));
      
      // Count shared meaningful tags
      const sharedTags = [...mem1MeaningfulTags].filter(t => mem2MeaningfulTags.has(t));
      
      if (sharedTags.length >= 2) { // Require at least 2 shared meaningful tags
        const key = pairKey(mem1.id, mem2.id);
        
        if (!processedPairs.has(key)) {
          const strength = Math.min(0.8, 0.4 + (sharedTags.length * 0.15));
          
          connections.push({
            id: randomUUID(),
            sourceId: mem1.id,
            targetId: mem2.id,
            connectionType: 'associates',
            strength,
            inferred: true,
            inferenceConfidence: 0.7,
            description: `Multiple shared tags: ${sharedTags.slice(0, 3).join(', ')}`,
            createdAt: Date.now()
          });
          processedPairs.add(key);
          multiTagConnections++;
        }
      }
    }
  }
  
  console.log(`Created ${multiTagConnections} connections from multiple shared tags`);
  
  // Strategy 3: Connect memories with single rare tags (high specificity)
  let rareTagConnections = 0;
  for (const [tag, mems] of tagMap.entries()) {
    if (rareTags.has(tag) && mems.length >= 2 && mems.length <= 5) {
      // Connect memories sharing a rare tag (but limit connections)
      for (let i = 0; i < mems.length; i++) {
        for (let j = i + 1; j < mems.length; j++) {
          const mem1 = mems[i];
          const mem2 = mems[j];
          const key = pairKey(mem1.id, mem2.id);
          
          if (!processedPairs.has(key)) {
            connections.push({
              id: randomUUID(),
              sourceId: mem1.id,
              targetId: mem2.id,
              connectionType: 'associates',
              strength: 0.7,
              inferred: true,
              inferenceConfidence: 0.8,
              description: `Rare shared tag: ${tag}`,
              createdAt: Date.now()
            });
            processedPairs.add(key);
            rareTagConnections++;
          }
        }
      }
    }
  }
  
  console.log(`Created ${rareTagConnections} connections from rare tags`);
  
  // 4. Process same sessionId (associates/extends) - OPTIMIZED
  const sessionMap = new Map<string | null, Memory[]>();
  for (const memory of parsedMemories) {
    const sessionId = memory.sessionId;
    if (!sessionMap.has(sessionId)) {
      sessionMap.set(sessionId, []);
    }
    sessionMap.get(sessionId)!.push(memory);
  }
  
  let sessionConnections = 0;
  for (const [sessionId, sessionMemories] of sessionMap.entries()) {
    if (!sessionId || sessionMemories.length < 2) continue;
    
    // Sort by creation time
    sessionMemories.sort((a, b) => a.createdAt - b.createdAt);
    
    // Connect sequential memories (extends) - but limit to avoid long chains
    // Only connect adjacent pairs, not all-to-all
    for (let i = 0; i < sessionMemories.length - 1; i++) {
      const mem1 = sessionMemories[i];
      const mem2 = sessionMemories[i + 1];
      const key = pairKey(mem1.id, mem2.id);
      
      if (!processedPairs.has(key)) {
        const timeDiff = mem2.createdAt - mem1.createdAt;
        // Only connect if created within reasonable time (24 hours)
        if (timeDiff < 24 * 3600000) {
          const strength = Math.min(0.7, 0.5 + (1 / (1 + timeDiff / 3600000))); // Decay over hours
          
          connections.push({
            id: randomUUID(),
            sourceId: mem1.id,
            targetId: mem2.id,
            connectionType: 'extends',
            strength,
            inferred: true,
            inferenceConfidence: 0.75,
            description: `Same session, sequential creation (${Math.round(timeDiff / 60000)}min apart)`,
            createdAt: Date.now()
          });
          processedPairs.add(key);
          sessionConnections++;
        }
      }
    }
  }
  
  console.log(`Created ${sessionConnections} extends connections from sessions`);
  
  // 4.5. Process Axerey-specific memory type relationships
  console.log('Processing Axerey memory type relationships...');
  let typeRelationshipConnections = 0;
  
  // Episodic → Semantic: generalizes (consolidation pattern)
  const episodicMemories = parsedMemories.filter(m => m.type === 'episodic');
  const semanticMemories = parsedMemories.filter(m => m.type === 'semantic');
  
  for (const episodic of episodicMemories.slice(0, 100)) { // Limit processing
    // Find semantic memories that might generalize this episodic memory
    const episodicTags = new Set(episodic.tags.filter(t => !commonTags.has(t)));
    if (episodicTags.size === 0) continue;
    
    for (const semantic of semanticMemories.slice(0, 20)) {
      const semanticTags = new Set(semantic.tags.filter(t => !commonTags.has(t)));
      const sharedTags = [...episodicTags].filter(t => semanticTags.has(t));
      
      if (sharedTags.length >= 2 && semantic.confidence > episodic.confidence) {
        const key = pairKey(episodic.id, semantic.id);
        if (!processedPairs.has(key)) {
          connections.push({
            id: randomUUID(),
            sourceId: episodic.id,
            targetId: semantic.id,
            connectionType: 'generalizes',
            strength: 0.75,
            inferred: true,
            inferenceConfidence: 0.8,
            description: `Semantic memory generalizes episodic experience (shared tags: ${sharedTags.slice(0, 2).join(', ')})`,
            createdAt: Date.now()
          });
          processedPairs.add(key);
          typeRelationshipConnections++;
        }
      }
    }
  }
  
  // Episodic → Procedural: derives (rule extraction)
  const proceduralMemories = parsedMemories.filter(m => m.type === 'procedural');
  
  for (const episodic of episodicMemories.slice(0, 50)) {
    if (episodic.outcome === 'success' && episodic.score && episodic.score > 0.7) {
      // High-success episodic memories might derive procedural rules
      for (const procedural of proceduralMemories.slice(0, 10)) {
        const sharedTags = episodic.tags.filter(t => procedural.tags.includes(t) && !commonTags.has(t));
        if (sharedTags.length >= 1) {
          const key = pairKey(episodic.id, procedural.id);
          if (!processedPairs.has(key)) {
            connections.push({
              id: randomUUID(),
              sourceId: episodic.id,
              targetId: procedural.id,
              connectionType: 'derives',
              strength: 0.8,
              inferred: true,
              inferenceConfidence: 0.75,
              description: `Procedural rule derived from successful episodic experience`,
              createdAt: Date.now()
            });
            processedPairs.add(key);
            typeRelationshipConnections++;
          }
        }
      }
    }
  }
  
  // Semantic → Procedural: applies (knowledge to procedure)
  for (const semantic of semanticMemories.slice(0, 50)) {
    if (semantic.belief) { // Only belief memories
      for (const procedural of proceduralMemories.slice(0, 10)) {
        const sharedTags = semantic.tags.filter(t => procedural.tags.includes(t) && !commonTags.has(t));
        if (sharedTags.length >= 1) {
          const key = pairKey(semantic.id, procedural.id);
          if (!processedPairs.has(key)) {
            connections.push({
              id: randomUUID(),
              sourceId: semantic.id,
              targetId: procedural.id,
              connectionType: 'applies',
              strength: 0.7,
              inferred: true,
              inferenceConfidence: 0.7,
              description: `Procedural rule applies semantic knowledge`,
              createdAt: Date.now()
            });
            processedPairs.add(key);
            typeRelationshipConnections++;
          }
        }
      }
    }
  }
  
  console.log(`Created ${typeRelationshipConnections} memory type relationship connections`);
  
  // 4.6. Process belief system relationships
  console.log('Processing belief system relationships...');
  let beliefConnections = 0;
  const beliefMemories = parsedMemories.filter(m => m.belief && m.type === 'semantic');
  
  // Belief memories supporting episodic memories
  for (const belief of beliefMemories.slice(0, 50)) {
    for (const episodic of episodicMemories.slice(0, 20)) {
      const sharedTags = belief.tags.filter(t => episodic.tags.includes(t) && !commonTags.has(t));
      if (sharedTags.length >= 1 && belief.confidence > 0.8) {
        const key = pairKey(belief.id, episodic.id);
        if (!processedPairs.has(key)) {
          connections.push({
            id: randomUUID(),
            sourceId: belief.id,
            targetId: episodic.id,
            connectionType: 'supports',
            strength: belief.confidence,
            inferred: true,
            inferenceConfidence: 0.85,
            description: `Belief supports episodic memory`,
            createdAt: Date.now()
          });
          processedPairs.add(key);
          beliefConnections++;
        }
      }
    }
  }
  
  // Contradicting beliefs (high confidence beliefs on same topic)
  for (let i = 0; i < beliefMemories.length; i++) {
    for (let j = i + 1; j < Math.min(i + 10, beliefMemories.length); j++) {
      const b1 = beliefMemories[i];
      const b2 = beliefMemories[j];
      const sharedTags = b1.tags.filter(t => b2.tags.includes(t) && !commonTags.has(t));
      
      if (sharedTags.length >= 2 && Math.abs(b1.confidence - b2.confidence) > 0.3) {
        const key = pairKey(b1.id, b2.id);
        if (!processedPairs.has(key)) {
          connections.push({
            id: randomUUID(),
            sourceId: b1.id,
            targetId: b2.id,
            connectionType: 'contradicts',
            strength: 0.6,
            inferred: true,
            inferenceConfidence: 0.7,
            description: `Contradicting beliefs on same topic (confidence diff: ${Math.abs(b1.confidence - b2.confidence).toFixed(2)})`,
            createdAt: Date.now()
          });
          processedPairs.add(key);
          beliefConnections++;
        }
      }
    }
  }
  
  console.log(`Created ${beliefConnections} belief system connections`);
  
  // 4.7. Process outcome-based relationships
  console.log('Processing outcome-based relationships...');
  let outcomeConnections = 0;
  const successMemories = parsedMemories.filter(m => m.outcome === 'success' && m.score && m.score > 0.7);
  const failureMemories = parsedMemories.filter(m => m.outcome === 'failure');
  
  // Success outcomes exemplify procedural memories
  for (const success of successMemories.slice(0, 50)) {
    for (const procedural of proceduralMemories.slice(0, 10)) {
      const sharedTags = success.tags.filter(t => procedural.tags.includes(t) && !commonTags.has(t));
      if (sharedTags.length >= 1) {
        const key = pairKey(success.id, procedural.id);
        if (!processedPairs.has(key)) {
          connections.push({
            id: randomUUID(),
            sourceId: success.id,
            targetId: procedural.id,
            connectionType: 'exemplifies',
            strength: success.score || 0.8,
            inferred: true,
            inferenceConfidence: 0.8,
            description: `Successful outcome exemplifies procedural rule`,
            createdAt: Date.now()
          });
          processedPairs.add(key);
          outcomeConnections++;
        }
      }
    }
  }
  
  // Failure outcomes question procedural memories
  for (const failure of failureMemories.slice(0, 30)) {
    for (const procedural of proceduralMemories.slice(0, 10)) {
      const sharedTags = failure.tags.filter(t => procedural.tags.includes(t) && !commonTags.has(t));
      if (sharedTags.length >= 1) {
        const key = pairKey(failure.id, procedural.id);
        if (!processedPairs.has(key)) {
          connections.push({
            id: randomUUID(),
            sourceId: failure.id,
            targetId: procedural.id,
            connectionType: 'questions',
            strength: 0.6,
            inferred: true,
            inferenceConfidence: 0.7,
            description: `Failed outcome questions procedural rule`,
            createdAt: Date.now()
          });
          processedPairs.add(key);
          outcomeConnections++;
        }
      }
    }
  }
  
  // High efficiency/score memories support related memories
  const highPerformanceMemories = parsedMemories.filter(m => 
    (m.efficiency && m.efficiency > 0.8) || (m.score && m.score > 0.8)
  );
  
  for (const highPerf of highPerformanceMemories.slice(0, 30)) {
    for (const related of parsedMemories.slice(0, 20)) {
      if (related.id === highPerf.id) continue;
      const sharedTags = highPerf.tags.filter(t => related.tags.includes(t) && !commonTags.has(t));
      if (sharedTags.length >= 2) {
        const key = pairKey(highPerf.id, related.id);
        if (!processedPairs.has(key)) {
          connections.push({
            id: randomUUID(),
            sourceId: highPerf.id,
            targetId: related.id,
            connectionType: 'supports',
            strength: Math.min(0.9, (highPerf.efficiency || highPerf.score || 0.8)),
            inferred: true,
            inferenceConfidence: 0.8,
            description: `High performance memory supports related memory`,
            createdAt: Date.now()
          });
          processedPairs.add(key);
          outcomeConnections++;
        }
      }
    }
  }
  
  console.log(`Created ${outcomeConnections} outcome-based connections`);
  
  // 4.8. Process context-based relationships (servedContextId)
  console.log('Processing context-based relationships...');
  let contextConnections = 0;
  const contextMap = new Map<string | null, typeof parsedMemories>();
  
  for (const memory of parsedMemories) {
    const ctxId = memory.servedContextId || null;
    if (!contextMap.has(ctxId)) {
      contextMap.set(ctxId, []);
    }
    contextMap.get(ctxId)!.push(memory);
  }
  
  for (const [ctxId, ctxMemories] of contextMap.entries()) {
    if (!ctxId || ctxMemories.length < 2) continue;
    
    // Connect memories that served the same context
    for (let i = 0; i < ctxMemories.length; i++) {
      for (let j = i + 1; j < Math.min(i + 5, ctxMemories.length); j++) {
        const mem1 = ctxMemories[i];
        const mem2 = ctxMemories[j];
        const key = pairKey(mem1.id, mem2.id);
        
        if (!processedPairs.has(key)) {
          connections.push({
            id: randomUUID(),
            sourceId: mem1.id,
            targetId: mem2.id,
            connectionType: 'associates',
            strength: 0.65,
            inferred: true,
            inferenceConfidence: 0.75,
            description: `Served same context (${ctxId.substring(0, 20)}...)`,
            createdAt: Date.now()
          });
          processedPairs.add(key);
          contextConnections++;
        }
      }
    }
  }
  
  console.log(`Created ${contextConnections} context-based connections`);
  
  // 4.9. Process helpful feedback relationships
  console.log('Processing helpful feedback relationships...');
  let helpfulConnections = 0;
  const helpfulMemories = parsedMemories.filter(m => m.helpful === true);
  const unhelpfulMemories = parsedMemories.filter(m => m.helpful === false);
  
  // Helpful memories support related memories
  for (const helpful of helpfulMemories.slice(0, 30)) {
    for (const related of parsedMemories.slice(0, 20)) {
      if (related.id === helpful.id || related.helpful === false) continue;
      const sharedTags = helpful.tags.filter(t => related.tags.includes(t) && !commonTags.has(t));
      if (sharedTags.length >= 1) {
        const key = pairKey(helpful.id, related.id);
        if (!processedPairs.has(key)) {
          connections.push({
            id: randomUUID(),
            sourceId: helpful.id,
            targetId: related.id,
            connectionType: 'supports',
            strength: 0.75,
            inferred: true,
            inferenceConfidence: 0.8,
            description: `Helpful memory supports related memory`,
            createdAt: Date.now()
          });
          processedPairs.add(key);
          helpfulConnections++;
        }
      }
    }
  }
  
  // Unhelpful memories contradict helpful ones on same topic
  for (const unhelpful of unhelpfulMemories.slice(0, 20)) {
    for (const helpful of helpfulMemories.slice(0, 10)) {
      const sharedTags = unhelpful.tags.filter(t => helpful.tags.includes(t) && !commonTags.has(t));
      if (sharedTags.length >= 2) {
        const key = pairKey(unhelpful.id, helpful.id);
        if (!processedPairs.has(key)) {
          connections.push({
            id: randomUUID(),
            sourceId: unhelpful.id,
            targetId: helpful.id,
            connectionType: 'contradicts',
            strength: 0.65,
            inferred: true,
            inferenceConfidence: 0.7,
            description: `Unhelpful memory contradicts helpful memory on same topic`,
            createdAt: Date.now()
          });
          processedPairs.add(key);
          helpfulConnections++;
        }
      }
    }
  }
  
  console.log(`Created ${helpfulConnections} helpful feedback connections`);
  
  // 4.10. Process source workflow relationships (plan → execution → account)
  console.log('Processing source workflow relationships...');
  let sourceWorkflowConnections = 0;
  
  // Plan → Execution: extends
  const planMemories = parsedMemories.filter(m => m.source === 'plan');
  const executionMemories = parsedMemories.filter(m => m.source === 'execution');
  
  for (const plan of planMemories.slice(0, 50)) {
    for (const execution of executionMemories.slice(0, 20)) {
      const sharedTags = plan.tags.filter(t => execution.tags.includes(t) && !commonTags.has(t));
      // Execution created after plan (within 7 days)
      const timeDiff = execution.createdAt - plan.createdAt;
      if (sharedTags.length >= 1 && timeDiff > 0 && timeDiff < 7 * 24 * 3600000) {
        const key = pairKey(plan.id, execution.id);
        if (!processedPairs.has(key)) {
          connections.push({
            id: randomUUID(),
            sourceId: plan.id,
            targetId: execution.id,
            connectionType: 'extends',
            strength: 0.7,
            inferred: true,
            inferenceConfidence: 0.75,
            description: `Execution extends plan (${Math.round(timeDiff / 3600000)}h later)`,
            createdAt: Date.now()
          });
          processedPairs.add(key);
          sourceWorkflowConnections++;
        }
      }
    }
  }
  
  // Execution → Account: derives (results from actions)
  const accountMemories = parsedMemories.filter(m => m.source === 'account');
  
  for (const execution of executionMemories.slice(0, 50)) {
    for (const account of accountMemories.slice(0, 20)) {
      const sharedTags = execution.tags.filter(t => account.tags.includes(t) && !commonTags.has(t));
      const timeDiff = account.createdAt - execution.createdAt;
      if (sharedTags.length >= 1 && timeDiff > 0 && timeDiff < 30 * 24 * 3600000) {
        const key = pairKey(execution.id, account.id);
        if (!processedPairs.has(key)) {
          connections.push({
            id: randomUUID(),
            sourceId: execution.id,
            targetId: account.id,
            connectionType: 'derives',
            strength: 0.75,
            inferred: true,
            inferenceConfidence: 0.8,
            description: `Account derives from execution results`,
            createdAt: Date.now()
          });
          processedPairs.add(key);
          sourceWorkflowConnections++;
        }
      }
    }
  }
  
  console.log(`Created ${sourceWorkflowConnections} source workflow connections`);
  
  // 4.11. Process confidence/quality relationships
  console.log('Processing confidence/quality relationships...');
  let confidenceConnections = 0;
  
  // High confidence memories support lower confidence ones (same topic)
  const highConfidenceMemories = parsedMemories.filter(m => m.confidence > 0.8);
  const lowConfidenceMemories = parsedMemories.filter(m => m.confidence < 0.6);
  
  for (const highConf of highConfidenceMemories.slice(0, 50)) {
    for (const lowConf of lowConfidenceMemories.slice(0, 20)) {
      const sharedTags = highConf.tags.filter(t => lowConf.tags.includes(t) && !commonTags.has(t));
      if (sharedTags.length >= 2) {
        const key = pairKey(highConf.id, lowConf.id);
        if (!processedPairs.has(key)) {
          connections.push({
            id: randomUUID(),
            sourceId: highConf.id,
            targetId: lowConf.id,
            connectionType: 'supports',
            strength: highConf.confidence,
            inferred: true,
            inferenceConfidence: 0.8,
            description: `High confidence (${(highConf.confidence * 100).toFixed(0)}%) supports lower confidence memory`,
            createdAt: Date.now()
          });
          processedPairs.add(key);
          confidenceConnections++;
        }
      }
    }
  }
  
  // High importance memories support related ones
  const highImportanceMemories = parsedMemories.filter(m => m.importance > 0.8);
  
  for (const highImp of highImportanceMemories.slice(0, 30)) {
    for (const related of parsedMemories.slice(0, 15)) {
      if (related.id === highImp.id) continue;
      const sharedTags = highImp.tags.filter(t => related.tags.includes(t) && !commonTags.has(t));
      if (sharedTags.length >= 1) {
        const key = pairKey(highImp.id, related.id);
        if (!processedPairs.has(key)) {
          connections.push({
            id: randomUUID(),
            sourceId: highImp.id,
            targetId: related.id,
            connectionType: 'supports',
            strength: highImp.importance,
            inferred: true,
            inferenceConfidence: 0.75,
            description: `High importance memory supports related memory`,
            createdAt: Date.now()
          });
          processedPairs.add(key);
          confidenceConnections++;
        }
      }
    }
  }
  
  console.log(`Created ${confidenceConnections} confidence/quality connections`);
  
  // 4.12. Process features-based relationships
  console.log('Processing features-based relationships...');
  let featuresConnections = 0;
  
  // Memories with same reasoningType
  const reasoningTypeMap = new Map<string, typeof parsedMemories>();
  for (const mem of parsedMemories) {
    const reasoningType = mem.features?.reasoningType || mem.features?.reasoningSession;
    if (reasoningType) {
      if (!reasoningTypeMap.has(reasoningType)) {
        reasoningTypeMap.set(reasoningType, []);
      }
      reasoningTypeMap.get(reasoningType)!.push(mem);
    }
  }
  
  for (const [reasoningType, mems] of reasoningTypeMap.entries()) {
    if (mems.length < 2) continue;
    for (let i = 0; i < mems.length; i++) {
      for (let j = i + 1; j < Math.min(i + 5, mems.length); j++) {
        const mem1 = mems[i];
        const mem2 = mems[j];
        const key = pairKey(mem1.id, mem2.id);
        
        if (!processedPairs.has(key)) {
          connections.push({
            id: randomUUID(),
            sourceId: mem1.id,
            targetId: mem2.id,
            connectionType: 'associates',
            strength: 0.65,
            inferred: true,
            inferenceConfidence: 0.7,
            description: `Same reasoning type: ${reasoningType}`,
            createdAt: Date.now()
          });
          processedPairs.add(key);
          featuresConnections++;
        }
      }
    }
  }
  
  console.log(`Created ${featuresConnections} features-based connections`);
  
  // 4.13. Process trading-specific relationships
  console.log('Processing trading-specific relationships...');
  let tradingConnections = 0;
  
  // Identify trading memories (by tags or features)
  const tradingTags = ['SPY', 'trading', 'trade', 'stock', 'option', 'forex', 'crypto'];
  const tradingMemories = parsedMemories.filter(m => 
    m.tags.some(tag => tradingTags.some(tt => tag.toLowerCase().includes(tt.toLowerCase()))) ||
    m.features?.setup || m.features?.entry || m.features?.exit || 
    m.features?.indicator || m.features?.strategy || m.features?.symbol
  );
  
  if (tradingMemories.length > 0) {
    console.log(`Found ${tradingMemories.length} trading-related memories`);
    
    // Group by symbol/ticker
    const symbolMap = new Map<string, typeof tradingMemories>();
    for (const mem of tradingMemories) {
      const symbol = mem.features?.symbol || 
                     mem.tags.find(t => /^[A-Z]{1,5}$/.test(t)) || 
                     mem.tags.find(t => t.includes('SPY') || t.includes('trading')) || 
                     'general';
      if (!symbolMap.has(symbol)) {
        symbolMap.set(symbol, []);
      }
      symbolMap.get(symbol)!.push(mem);
    }
    
    // 1. Connect trades with similar setups/features (exemplifies)
    for (const [symbol, trades] of symbolMap.entries()) {
      for (let i = 0; i < trades.length; i++) {
        for (let j = i + 1; j < trades.length && j < i + 20; j++) {
          const trade1 = trades[i];
          const trade2 = trades[j];
          
          // Check for similar features
          const similarFeatures: string[] = [];
          if (trade1.features && trade2.features) {
            for (const [key, val1] of Object.entries(trade1.features)) {
              if (key === 'symbol' || key === 'timestamp') continue;
              const val2 = trade2.features[key];
              if (val2 !== undefined && String(val1) === String(val2)) {
                similarFeatures.push(key);
              }
            }
          }
          
          if (similarFeatures.length >= 2) {
            const key = pairKey(trade1.id, trade2.id);
            if (!processedPairs.has(key)) {
              // Both successful trades with same setup → exemplifies
              if (trade1.outcome === 'success' && trade2.outcome === 'success' && 
                  trade1.score && trade2.score && trade1.score > 0.7 && trade2.score > 0.7) {
                connections.push({
                  id: randomUUID(),
                  sourceId: trade1.id,
                  targetId: trade2.id,
                  connectionType: 'exemplifies',
                  strength: 0.8,
                  inferred: true,
                  inferenceConfidence: 0.85,
                  description: `Both successful ${symbol} trades with similar setup: ${similarFeatures.slice(0, 3).join(', ')}`,
                  createdAt: Date.now()
                });
                processedPairs.add(key);
                tradingConnections++;
              } else if (similarFeatures.length >= 3) {
                // Similar setup regardless of outcome → associates
                connections.push({
                  id: randomUUID(),
                  sourceId: trade1.id,
                  targetId: trade2.id,
                  connectionType: 'associates',
                  strength: 0.7,
                  inferred: true,
                  inferenceConfidence: 0.75,
                  description: `Similar ${symbol} trading setup: ${similarFeatures.slice(0, 3).join(', ')}`,
                  createdAt: Date.now()
                });
                processedPairs.add(key);
                tradingConnections++;
              }
            }
          }
        }
      }
    }
    
    // 2. Connect successful trades to procedural rules (derives)
    const successfulTrades = tradingMemories.filter(m => 
      m.outcome === 'success' && m.score && m.score > 0.7
    );
    const proceduralRules = parsedMemories.filter(m => 
      m.type === 'procedural' && 
      (m.tags.some(t => tradingTags.some(tt => t.toLowerCase().includes(tt.toLowerCase()))) ||
       (m.text.toLowerCase().includes('if') && m.text.toLowerCase().includes('then'))
      )
    );
    
    for (const trade of successfulTrades.slice(0, 30)) {
      for (const rule of proceduralRules.slice(0, 10)) {
        // Check if trade features match rule pattern
        const ruleText = rule.text.toLowerCase();
        
        // Simple matching: if rule mentions features that trade has
        const featureMatch = Object.keys(trade.features || {}).some(feature => 
          ruleText.includes(feature.toLowerCase())
        );
        
        if (featureMatch || 
            trade.tags.some(t => rule.tags.includes(t)) ||
            (trade.features?.setup && ruleText.includes('setup')) ||
            (trade.features?.strategy && ruleText.includes('strategy'))) {
          const key = pairKey(trade.id, rule.id);
          if (!processedPairs.has(key)) {
            connections.push({
              id: randomUUID(),
              sourceId: trade.id,
              targetId: rule.id,
              connectionType: 'derives',
              strength: 0.75,
              inferred: true,
              inferenceConfidence: 0.7,
              description: `Successful trade derives/validates procedural rule`,
              createdAt: Date.now()
            });
            processedPairs.add(key);
            tradingConnections++;
          }
        }
      }
    }
    
    // 3. Connect trades by time patterns (same day/week) - extends
    const tradesByTime = new Map<number, typeof tradingMemories>();
    for (const trade of tradingMemories) {
      const dayKey = Math.floor(trade.createdAt / (24 * 3600000)); // Day bucket
      if (!tradesByTime.has(dayKey)) {
        tradesByTime.set(dayKey, []);
      }
      tradesByTime.get(dayKey)!.push(trade);
    }
    
    for (const [dayKey, dayTrades] of tradesByTime.entries()) {
      if (dayTrades.length >= 2) {
        // Connect trades on same day
        for (let i = 0; i < dayTrades.length; i++) {
          for (let j = i + 1; j < dayTrades.length && j < i + 5; j++) {
            const trade1 = dayTrades[i];
            const trade2 = dayTrades[j];
            const key = pairKey(trade1.id, trade2.id);
            
            if (!processedPairs.has(key)) {
              connections.push({
                id: randomUUID(),
                sourceId: trade1.id,
                targetId: trade2.id,
                connectionType: 'extends',
                strength: 0.6,
                inferred: true,
                inferenceConfidence: 0.65,
                description: `Trades executed on same day`,
                createdAt: Date.now()
              });
              processedPairs.add(key);
              tradingConnections++;
            }
          }
        }
      }
    }
    
    // 4. Connect winning trades to losing trades on same symbol (questions/contradicts)
    for (const [symbol, trades] of symbolMap.entries()) {
      const winners = trades.filter(t => t.outcome === 'success' && t.score && t.score > 0.7);
      const losers = trades.filter(t => t.outcome === 'failure' || (t.score && t.score < 0.3));
      
      for (const winner of winners.slice(0, 10)) {
        for (const loser of losers.slice(0, 10)) {
          // Check if they have similar features but different outcomes
          const winnerFeatures = Object.keys(winner.features || {}).sort().join(',');
          const loserFeatures = Object.keys(loser.features || {}).sort().join(',');
          
          if (winnerFeatures === loserFeatures && winnerFeatures.length > 0) {
            const key = pairKey(winner.id, loser.id);
            if (!processedPairs.has(key)) {
              connections.push({
                id: randomUUID(),
                sourceId: loser.id,
                targetId: winner.id,
                connectionType: 'questions',
                strength: 0.7,
                inferred: true,
                inferenceConfidence: 0.75,
                description: `Failed ${symbol} trade questions successful trade with same setup`,
                createdAt: Date.now()
              });
              processedPairs.add(key);
              tradingConnections++;
            }
          }
        }
      }
    }
    
    // 5. Pattern-based connections using extract_rules logic
    // Group execution memories by features and outcomes
    const executionTrades = tradingMemories.filter(m => m.source === 'execution' && m.outcome);
    const featurePatterns = new Map<string, { successes: number; failures: number; trades: typeof executionTrades }>();
    
    for (const trade of executionTrades) {
      if (trade.features) {
        for (const [feature, value] of Object.entries(trade.features)) {
          if (feature === 'symbol' || feature === 'timestamp') continue;
          const patternKey = `${feature}:${value}`;
          
          if (!featurePatterns.has(patternKey)) {
            featurePatterns.set(patternKey, { successes: 0, failures: 0, trades: [] });
          }
          
          const pattern = featurePatterns.get(patternKey)!;
          pattern.trades.push(trade);
          
          if (trade.outcome === 'success') pattern.successes++;
          else if (trade.outcome === 'failure') pattern.failures++;
        }
      }
    }
    
    // Connect trades that share successful patterns (supports)
    for (const [patternKey, pattern] of featurePatterns.entries()) {
      if (pattern.trades.length >= 3 && pattern.successes / pattern.trades.length > 0.6) {
        // This is a successful pattern - connect trades that share it
        for (let i = 0; i < pattern.trades.length; i++) {
          for (let j = i + 1; j < pattern.trades.length && j < i + 5; j++) {
            const trade1 = pattern.trades[i];
            const trade2 = pattern.trades[j];
            const key = pairKey(trade1.id, trade2.id);
            
            if (!processedPairs.has(key) && trade1.outcome === 'success' && trade2.outcome === 'success') {
              connections.push({
                id: randomUUID(),
                sourceId: trade1.id,
                targetId: trade2.id,
                connectionType: 'supports',
                strength: 0.8,
                inferred: true,
                inferenceConfidence: 0.85,
                description: `Both trades share successful pattern: ${patternKey}`,
                createdAt: Date.now()
              });
              processedPairs.add(key);
              tradingConnections++;
            }
          }
        }
      }
    }
  }
  
  console.log(`Created ${tradingConnections} trading-specific connections`);
  
  // 5. Process similar embeddings (supports/associates) - OPTIMIZED
  // Only process if embeddings are available and limit comparisons
  const memoriesWithEmbeddings = parsedMemories.filter(m => m.embedding && m.embedding.length > 0);
  
  if (memoriesWithEmbeddings.length > 0) {
    console.log(`Processing ${memoriesWithEmbeddings.length} memories with embeddings (limited comparisons)...`);
    
    let similarityConnections = 0;
    const maxComparisonsPerMemory = 20; // Limit to avoid O(n²) explosion
    
    for (let i = 0; i < memoriesWithEmbeddings.length; i++) {
      const mem1 = memoriesWithEmbeddings[i];
      
      // Find similar memories (only check a limited subset)
      const similarities: { memory: Memory; similarity: number }[] = [];
      const startIdx = i + 1;
      const endIdx = Math.min(startIdx + maxComparisonsPerMemory, memoriesWithEmbeddings.length);
      
      for (let j = startIdx; j < endIdx; j++) {
        const mem2 = memoriesWithEmbeddings[j];
        const similarity = cosine(mem1.embedding, mem2.embedding);
        
        // Only consider high similarity (>0.75) to avoid noise
        if (similarity > 0.75) {
          similarities.push({ memory: mem2, similarity });
        }
      }
      
      similarities.sort((a, b) => b.similarity - a.similarity);
      
      // Only keep top 3 most similar per memory
      for (const { memory: mem2, similarity } of similarities.slice(0, 3)) {
        const key = pairKey(mem1.id, mem2.id);
        
        if (!processedPairs.has(key)) {
          // Determine connection type based on similarity and content
          let connectionType = 'associates';
          if (similarity > 0.85) {
            connectionType = 'supports';
          } else if (mem1.type === mem2.type && mem1.source === mem2.source) {
            connectionType = 'refines';
          }
          
          connections.push({
            id: randomUUID(),
            sourceId: mem1.id,
            targetId: mem2.id,
            connectionType,
            strength: similarity,
            inferred: true,
            inferenceConfidence: similarity,
            description: `Semantic similarity: ${(similarity * 100).toFixed(0)}%`,
            createdAt: Date.now()
          });
          processedPairs.add(key);
          similarityConnections++;
        }
      }
    }
    
    console.log(`Created ${similarityConnections} similarity-based connections`);
  }
  
  // 6. Process same type/source (associates) - LIMITED to avoid over-connecting
  // Only connect if they also share at least one meaningful tag
  const typeSourceMap = new Map<string, Memory[]>();
  for (const memory of parsedMemories) {
    const key = `${memory.type}:${memory.source}`;
    if (!typeSourceMap.has(key)) {
      typeSourceMap.set(key, []);
    }
    typeSourceMap.get(key)!.push(memory);
  }
  
  let typeSourceConnections = 0;
  for (const [key, groupMemories] of typeSourceMap.entries()) {
    if (groupMemories.length < 2) continue;
    
    // Only connect if they share at least one meaningful tag (not common)
    for (let i = 0; i < groupMemories.length; i++) {
      const mem1 = groupMemories[i];
      const mem1Tags = new Set(mem1.tags.filter(t => !commonTags.has(t)));
      
      // Limit to 3 connections per memory to avoid graph bloat
      let connectionsForMem1 = 0;
      for (let j = i + 1; j < groupMemories.length && connectionsForMem1 < 3; j++) {
        const mem2 = groupMemories[j];
        const mem2Tags = new Set(mem2.tags.filter(t => !commonTags.has(t)));
        
        // Check if they share at least one meaningful tag
        const sharedMeaningfulTags = [...mem1Tags].filter(t => mem2Tags.has(t));
        
        if (sharedMeaningfulTags.length > 0) {
          const pair = pairKey(mem1.id, mem2.id);
          
          if (!processedPairs.has(pair)) {
            connections.push({
              id: randomUUID(),
              sourceId: mem1.id,
              targetId: mem2.id,
              connectionType: 'associates',
              strength: 0.4,
              inferred: true,
              inferenceConfidence: 0.6,
              description: `Same type/source + shared tag: ${sharedMeaningfulTags[0]}`,
              createdAt: Date.now()
            });
            processedPairs.add(pair);
            connectionsForMem1++;
            typeSourceConnections++;
          }
        }
      }
    }
  }
  
  console.log(`Created ${typeSourceConnections} connections from type/source + shared tags`);
  
  // Remove duplicates (keep highest strength)
  const uniqueConnections = new Map<string, Connection>();
  for (const conn of connections) {
    const key = pairKey(conn.sourceId, conn.targetId);
    const existing = uniqueConnections.get(key);
    if (!existing || conn.strength > existing.strength) {
      uniqueConnections.set(key, conn);
    }
  }
  
  const finalConnections = Array.from(uniqueConnections.values());
  
  console.log(`Total connections to create: ${finalConnections.length}`);
  
  // Insert connections
  const insertStmt = db.prepare(`
    INSERT INTO memory_connections 
    (id, source_id, target_id, connection_type, strength, inferred, inference_confidence, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const insertMany = db.transaction((conns: Connection[]) => {
    for (const conn of conns) {
      insertStmt.run(
        conn.id,
        conn.sourceId,
        conn.targetId,
        conn.connectionType,
        conn.strength,
        conn.inferred ? 1 : 0,
        conn.inferenceConfidence,
        conn.description,
        conn.createdAt
      );
    }
  });
  
  insertMany(finalConnections);
  
  console.log(`✅ Successfully created ${finalConnections.length} connections`);
  console.log(`\nConnection Type Breakdown:`);
  console.log(`   - Derives: ${finalConnections.filter(c => c.connectionType === 'derives').length}`);
  console.log(`   - Associates: ${finalConnections.filter(c => c.connectionType === 'associates').length}`);
  console.log(`   - Extends: ${finalConnections.filter(c => c.connectionType === 'extends').length}`);
  console.log(`   - Supports: ${finalConnections.filter(c => c.connectionType === 'supports').length}`);
  console.log(`   - Refines: ${finalConnections.filter(c => c.connectionType === 'refines').length}`);
  console.log(`   - Contradicts: ${finalConnections.filter(c => c.connectionType === 'contradicts').length}`);
  console.log(`   - Generalizes: ${finalConnections.filter(c => c.connectionType === 'generalizes').length}`);
  console.log(`   - Applies: ${finalConnections.filter(c => c.connectionType === 'applies').length}`);
  console.log(`   - Exemplifies: ${finalConnections.filter(c => c.connectionType === 'exemplifies').length}`);
  console.log(`   - Questions: ${finalConnections.filter(c => c.connectionType === 'questions').length}`);
  console.log(`\nDomain-Specific Connections:`);
  console.log(`   - Trading connections: ${tradingConnections}`);
  
  // Count argument connections from final list
  const argumentConnections = finalConnections.filter(c => 
    c.description?.includes('Steelman') || 
    c.description?.includes('strawman') ||
    c.description?.includes('Pipeline') ||
    c.description?.includes('analyze the same claim')
  ).length;
  console.log(`   - Argument connections: ${argumentConnections}`);
  
  db.close();
}

// Run if called directly
if (import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/')) || import.meta.url.includes('backfill-connections')) {
  const dbPath = process.argv[2] || './pcm.db';
  backfillConnections(dbPath).catch(console.error);
}

