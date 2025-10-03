const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Load .env manually (compatible with project style)
const envPath = path.join(__dirname, '../.env');
let envConfig = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    envConfig[key] = val;
  });
}

const config = {
  host: envConfig.DB_HOST || '127.0.0.1',
  port: envConfig.DB_PORT ? Number(envConfig.DB_PORT) : 3306,
  user: envConfig.DB_USER || 'root',
  password: envConfig.DB_PASSWORD || '',
  database: envConfig.DB_NAME || 'sistem_bosgil_group'
};

async function colExists(conn, db, table, col) {
  const [rows] = await conn.execute(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?`,
    [db, table, col]
  );
  return rows[0].cnt > 0;
}

async function idxExists(conn, db, table, idx) {
  const [rows] = await conn.execute(
    `SELECT COUNT(*) AS cnt FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND INDEX_NAME=?`,
    [db, table, idx]
  );
  return rows[0].cnt > 0;
}

async function migrate() {
  let conn;
  try {
    conn = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL');

    const db = config.database;
    const table = 'sop_categories';
    const col = 'sdm_divisi_id';
    const idx = 'sop_categories_sdm_divisi_id';

    // 1) Tambah kolom jika belum ada (nullable untuk backfill)
    if (!(await colExists(conn, db, table, col))) {
      await conn.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` INT NULL AFTER \`id\``);
      console.log(`✅ Added column ${table}.${col} (INT NULL)`);
    } else {
      console.log(`ℹ️ Column ${table}.${col} already exists, skipping add`);
    }

    // 2) Tambah index untuk kolom jika belum ada
    if (!(await idxExists(conn, db, table, idx))) {
      await conn.execute(`ALTER TABLE \`${table}\` ADD INDEX \`${idx}\` (\`${col}\`)`);
      console.log(`✅ Added index ${idx} on ${table}.${col}`);
    } else {
      console.log(`ℹ️ Index ${idx} already exists, skipping add`);
    }

    console.log('🎉 Migration completed successfully.');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

migrate();
