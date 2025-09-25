const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Read .env manually
const envPath = path.join(__dirname, '../.env');
let envConfig = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, value] = trimmedLine.split('=');
      if (key && value !== undefined) {
        envConfig[key.trim()] = value.trim();
      }
    }
  });
}

const config = {
  host: envConfig.DB_HOST || '127.0.0.1',
  port: envConfig.DB_PORT ? Number(envConfig.DB_PORT) : 3306,
  user: envConfig.DB_USER || 'root',
  password: envConfig.DB_PASSWORD || '',
  database: envConfig.DB_NAME || 'sistem_bosgil_group'
};

async function columnExists(conn, table, column, db) {
  const [rows] = await conn.execute(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?`,
    [db, table, column]
  );
  return rows[0].cnt > 0;
}

async function dropColumnIfExists(conn, table, column, db) {
  if (await columnExists(conn, table, column, db)) {
    await conn.execute(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``);
    console.log(`✅ Dropped ${table}.${column}`);
  } else {
    console.log(`ℹ️ Column ${table}.${column} not found, skipping`);
  }
}

async function addColumnIfNotExists(conn, table, column, definition, db) {
  if (!(await columnExists(conn, table, column, db))) {
    await conn.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`✅ Added ${table}.${column}`);
  } else {
    console.log(`ℹ️ Column ${table}.${column} already exists, skipping`);
  }
}

async function migrate() {
  let conn;
  try {
    conn = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL');

    // Drop id_divisi column if exists
    await dropColumnIfExists(conn, 'tugas_saya', 'id_divisi', config.database);

    // Add id_user column if not exists
    await addColumnIfNotExists(conn, 'tugas_saya', 'id_user', 'INT NULL COMMENT "Relasi ke tabel users"', config.database);

    console.log('🎉 Migration to update tugas_saya table completed.');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

migrate();
