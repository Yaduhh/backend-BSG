const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Read .env manually (same approach as previous migration)
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

async function migrate() {
  let conn;
  try {
    conn = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL');

    // tim_merah: drop divisi, posisi
    await dropColumnIfExists(conn, 'tim_merah', 'divisi', config.database);
    await dropColumnIfExists(conn, 'tim_merah', 'posisi', config.database);

    // tim_biru: drop divisi, posisi
    await dropColumnIfExists(conn, 'tim_biru', 'divisi', config.database);
    await dropColumnIfExists(conn, 'tim_biru', 'posisi', config.database);

    console.log('🎉 Migration to drop divisi/posisi completed.');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

migrate();
