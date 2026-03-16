const Database = require('better-sqlite3');
const db = new Database('./pcm.db', { readonly: true });

// Search for black hole related memories
const stmt = db.prepare(`
  SELECT id, text, tags, source, type, created_at, importance
  FROM memories 
  WHERE LOWER(text) LIKE ?
  ORDER BY created_at DESC
`);

const results = stmt.all('%black%hole%');

console.log(JSON.stringify(results, null, 2));

db.close();



