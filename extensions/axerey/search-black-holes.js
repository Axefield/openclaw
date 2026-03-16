const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'pcm.db');
const db = new Database(dbPath, { readonly: true });

console.log('Searching for black hole memories...\n');

// Search for memories containing "black hole" or related terms
const query = `
  SELECT 
    id, 
    text, 
    tags, 
    source, 
    type,
    datetime(created_at/1000, 'unixepoch') as created,
    importance
  FROM memories 
  WHERE 
    LOWER(text) LIKE '%black hole%' OR 
    LOWER(text) LIKE '%black-hole%' OR
    LOWER(tags) LIKE '%black%' OR
    LOWER(text) LIKE '%internet%source%' OR
    LOWER(text) LIKE '%url%' OR
    LOWER(text) LIKE '%link%'
  ORDER BY created_at DESC 
  LIMIT 50;
`;

const memories = db.prepare(query).all();

if (memories.length === 0) {
  console.log('No memories found containing "black hole" information.');
} else {
  console.log(`Found ${memories.length} memories:\n`);
  memories.forEach((mem, idx) => {
    console.log(`\n========== Memory ${idx + 1} ==========`);
    console.log(`ID: ${mem.id}`);
    console.log(`Created: ${mem.created}`);
    console.log(`Source: ${mem.source}`);
    console.log(`Type: ${mem.type}`);
    console.log(`Tags: ${mem.tags}`);
    console.log(`Importance: ${mem.importance}`);
    console.log(`\nText:\n${mem.text}`);
    console.log('=====================================');
  });
}

db.close();










