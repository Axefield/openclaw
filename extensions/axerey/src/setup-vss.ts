#!/usr/bin/env node
/**
 * VSS Setup Script for Stickygon
 * 
 * This script helps set up vector similarity search (VSS) for the Stickygon memory system.
 * It provides instructions and utilities for installing the vectorlite extension.
 */

import { VSSMemoryStore } from "./memory-vss.js";
import { EmbeddingProvider } from "./providers/embeddings.js";
import { randomUUID } from "node:crypto";

async function checkVSSAvailability() {
  console.error("🔍 Checking VSS availability...");
  
  try {
    const vssStore = await VSSMemoryStore.init({ 
      path: process.env.PCM_DB || "./pcm.db",
      vectorDimension: 1536
    });
    
    const stats = vssStore.getVSSStats();
    
    if (stats.available) {
      console.error("✅ VSS is available and working!");
      console.error(`📊 VSS Stats:`, stats);
      return true;
    } else {
      console.error("❌ VSS is not available");
      return false;
    }
  } catch (error) {
    console.error("❌ VSS setup failed:", error);
    return false;
  }
}

async function migrateExistingData() {
  console.error("🔄 Migrating existing data to VSS...");
  
  try {
    const vssStore = await VSSMemoryStore.init({ 
      path: process.env.PCM_DB || "./pcm.db",
      vectorDimension: 1536
    });
    
    const stats = vssStore.getVSSStats();
    console.error(`📊 Migrated ${stats.totalVectors} vectors to VSS`);
    
    return true;
  } catch (error) {
    console.error("❌ Migration failed:", error);
    return false;
  }
}

async function testVSSPerformance() {
  console.error("🧪 Testing VSS performance...");
  
  try {
    const vssStore = await VSSMemoryStore.init({ 
      path: process.env.PCM_DB || "./pcm.db",
      vectorDimension: 1536
    });
    
    const embeddings = await EmbeddingProvider.init();
    
    // Create test memories
    const testMemories = [
      "This is a test memory about machine learning",
      "Another memory about artificial intelligence",
      "A memory about database systems and SQL",
      "Testing vector similarity search capabilities",
      "Memory about TypeScript and JavaScript development"
    ];
    
    console.error("📝 Creating test memories...");
    for (const text of testMemories) {
      const vector = await embeddings.embed(text);
      await vssStore.create({
        text,
        tags: ['test', 'vss'],
        importance: 0.5,
        type: 'episodic',
        source: 'plan',
        confidence: 1.0,
        embedding: vector,
        belief: false,
        mergedFrom: [],
        expiresAt: null,
        sessionId: null,
        lastUsed: Date.now(),
        decay: 0.01
      });
    }
    
    // Test search performance
    console.error("🔍 Testing search performance...");
    const queryVector = await embeddings.embed("machine learning and AI");
    
    const startTime = Date.now();
    const results = await vssStore.vectorSearch(queryVector, { limit: 5 });
    const endTime = Date.now();
    
    console.error(`⚡ Search completed in ${endTime - startTime}ms`);
    console.error(`📋 Found ${results.length} results:`);
    results.forEach((mem, i) => {
      console.error(`  ${i + 1}. ${mem.text.substring(0, 50)}...`);
    });
    
    // Clean up test data
    console.error("🧹 Cleaning up test data...");
    for (const mem of results) {
      await vssStore.delete(mem.id);
    }
    
    return true;
  } catch (error) {
    console.error("❌ Performance test failed:", error);
    return false;
  }
}

function printInstallationInstructions() {
  console.error(`
📋 VSS Installation Instructions
===============================

To enable vector similarity search (VSS) in Stickygon, you need to install the vectorlite extension.

Option 1: Using pre-built binaries (Recommended)
-----------------------------------------------
1. Download the vectorlite extension for your platform:
   - Windows: https://github.com/asg017/vectorlite/releases
   - macOS: https://github.com/asg017/vectorlite/releases  
   - Linux: https://github.com/asg017/vectorlite/releases

2. Place the vectorlite.so (or .dll on Windows) file in your project directory

3. Update your environment to point to the extension:
   export VECTORLITE_PATH="./vectorlite.so"  # Linux/macOS
   set VECTORLITE_PATH=./vectorlite.dll      # Windows

Option 2: Build from source
---------------------------
1. Install Rust: https://rustup.rs/
2. Clone vectorlite: git clone https://github.com/asg017/vectorlite.git
3. Build: cd vectorlite && cargo build --release
4. Copy the built extension to your project directory

Option 3: Use without VSS (Fallback mode)
------------------------------------------
If you can't install vectorlite, Stickygon will automatically fall back to
cosine similarity search. This works but is slower for large datasets.

After installation, run this script again to test VSS functionality.
`);
}

async function main() {
  console.error("🚀 Stickygon VSS Setup Script");
  console.error("==============================\n");
  
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    printInstallationInstructions();
    return;
  }
  
  if (args.includes('--install-instructions')) {
    printInstallationInstructions();
    return;
  }
  
  // Check VSS availability
  const vssAvailable = await checkVSSAvailability();
  
  if (!vssAvailable) {
    console.error("\n❌ VSS is not available. Please install vectorlite extension.");
    printInstallationInstructions();
    process.exit(1);
  }
  
  // Migrate existing data
  const migrationSuccess = await migrateExistingData();
  if (!migrationSuccess) {
    console.error("\n❌ Data migration failed.");
    process.exit(1);
  }
  
  // Test performance
  const testSuccess = await testVSSPerformance();
  if (!testSuccess) {
    console.error("\n❌ Performance test failed.");
    process.exit(1);
  }
  
  console.error("\n🎉 VSS setup completed successfully!");
  console.error("Your Stickygon memory system now has optimized vector search capabilities.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { checkVSSAvailability, migrateExistingData, testVSSPerformance };
