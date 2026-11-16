const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

function findD1Files() {
  const d1Dir = path.resolve(__dirname, '../.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
  const d1Files = [];
  if (fs.existsSync(d1Dir)) {
    const files = fs.readdirSync(d1Dir);
    for (const f of files) {
      if (f.endsWith('.sqlite') && f !== 'metadata.sqlite') {
        d1Files.push(path.join(d1Dir, f));
      }
    }
  }
  const rootLocal = path.resolve(__dirname, '../local.sqlite');
  if (fs.existsSync(rootLocal)) {
    d1Files.push(rootLocal);
  }
  return d1Files;
}

function runMigration() {
  const d1Files = findD1Files();
  console.log(`Found ${d1Files.length} SQLite database(s) to check.`);

  for (const dbPath of d1Files) {
    console.log(`\nMigrating: ${dbPath}`);
    const db = new DatabaseSync(dbPath);

    db.exec(`
      CREATE TABLE IF NOT EXISTS custom_shapes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        file_url TEXT NOT NULL,
        r2_key TEXT,
        mime_type TEXT,
        file_size INTEGER,
        category TEXT NOT NULL DEFAULT 'custom',
        tags TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('  ✓ Created custom_shapes table.');
  }

  console.log('\nMigration completed successfully.');
}

runMigration();
