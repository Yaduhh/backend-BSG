const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Read .env manually to avoid requiring the whole app
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
  host: envConfig.DB_HOST || '202.10.45.115',
  port: envConfig.DB_PORT ? Number(envConfig.DB_PORT) : 3306,
  user: envConfig.DB_USER || 'root',
  password: envConfig.DB_PASSWORD || '',
  database: envConfig.DB_NAME || 'sistem_bosgil_group'
};

async function columnExists(connection, tableName, columnName, database) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [database, tableName, columnName]
  );
  return rows[0].cnt > 0;
}

async function fkExists(connection, tableName, constraintName, database) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS cnt FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?`,
    [database, tableName, constraintName]
  );
  return rows[0].cnt > 0;
}

async function indexExists(connection, tableName, indexName, database) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS cnt FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [database, tableName, indexName]
  );
  return rows[0].cnt > 0;
}

async function migrate() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL');

    // Helper to print engine info
    const tablesToCheck = ['users', 'tim_merah', 'tim_biru'];
    for (const t of tablesToCheck) {
      try {
        const [rows] = await connection.execute(
          `SELECT ENGINE, TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
          [config.database, t]
        );
        if (rows.length) {
          console.log(`ℹ️ Table ${t} -> ENGINE=${rows[0].ENGINE}, COLLATION=${rows[0].TABLE_COLLATION}`);
          if (rows[0].ENGINE !== 'InnoDB') {
            console.warn(`⚠️ Table ${t} is not InnoDB. Foreign keys require InnoDB. Consider: ALTER TABLE ${t} ENGINE=InnoDB;`);
          }
        }
      } catch (e) {
        console.warn(`⚠️ Unable to read table info for ${t}:`, e.message);
      }
    }

    // Detect parent type for users.id (to align signedness)
    let parentColumnType = 'INT';
    let parentUnsigned = false;
    try {
      const [userIdInfo] = await connection.execute(
        `SELECT DATA_TYPE, COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'id'`,
        [config.database]
      );
      if (userIdInfo.length) {
        parentColumnType = String(userIdInfo[0].DATA_TYPE || 'int').toUpperCase();
        const colType = String(userIdInfo[0].COLUMN_TYPE || '').toUpperCase();
        parentUnsigned = colType.includes('UNSIGNED');
        console.log(`ℹ️ users.id -> DATA_TYPE=${parentColumnType}, COLUMN_TYPE=${colType}`);
      }
    } catch (e) {
      console.warn('⚠️ Unable to detect users.id type:', e.message);
    }

    // tim_merah
    if (!(await columnExists(connection, 'tim_merah', 'user_id', config.database))) {
      await connection.execute(`ALTER TABLE tim_merah ADD COLUMN user_id ${parentColumnType}${parentUnsigned ? ' UNSIGNED' : ''} NULL AFTER keterangan`);
      console.log('✅ Added tim_merah.user_id');
    } else {
      console.log('ℹ️ tim_merah.user_id already exists');
      // Ensure type matches parent
      try {
        await connection.execute(`ALTER TABLE tim_merah MODIFY COLUMN user_id ${parentColumnType}${parentUnsigned ? ' UNSIGNED' : ''} NULL`);
        console.log('✅ Aligned tim_merah.user_id type with users.id');
      } catch (e) {
        console.warn('⚠️ Unable to align tim_merah.user_id type:', e.message);
      }
    }

    if (!(await indexExists(connection, 'tim_merah', 'idx_user_id', config.database))) {
      await connection.execute(`CREATE INDEX idx_user_id ON tim_merah (user_id)`);
      console.log('✅ Created index idx_user_id on tim_merah(user_id)');
    } else {
      console.log('ℹ️ Index idx_user_id on tim_merah already exists');
    }

    if (!(await fkExists(connection, 'tim_merah', 'fk_tim_merah_user', config.database))) {
      try {
        await connection.execute(`ALTER TABLE tim_merah ADD CONSTRAINT fk_tim_merah_user FOREIGN KEY (user_id) REFERENCES users(id)`);
        console.log('✅ Added FK fk_tim_merah_user on tim_merah(user_id)');
      } catch (e) {
        console.warn('⚠️ Skipping FK fk_tim_merah_user due to error:', e.message);
      }
    } else {
      console.log('ℹ️ FK fk_tim_merah_user already exists');
    }

    // tim_biru
    if (!(await columnExists(connection, 'tim_biru', 'user_id', config.database))) {
      await connection.execute(`ALTER TABLE tim_biru ADD COLUMN user_id ${parentColumnType}${parentUnsigned ? ' UNSIGNED' : ''} NULL AFTER keterangan`);
      console.log('✅ Added tim_biru.user_id');
    } else {
      console.log('ℹ️ tim_biru.user_id already exists');
      // Ensure type matches parent
      try {
        await connection.execute(`ALTER TABLE tim_biru MODIFY COLUMN user_id ${parentColumnType}${parentUnsigned ? ' UNSIGNED' : ''} NULL`);
        console.log('✅ Aligned tim_biru.user_id type with users.id');
      } catch (e) {
        console.warn('⚠️ Unable to align tim_biru.user_id type:', e.message);
      }
    }

    if (!(await indexExists(connection, 'tim_biru', 'idx_user_id', config.database))) {
      await connection.execute(`CREATE INDEX idx_user_id ON tim_biru (user_id)`);
      console.log('✅ Created index idx_user_id on tim_biru(user_id)');
    } else {
      console.log('ℹ️ Index idx_user_id on tim_biru already exists');
    }

    if (!(await fkExists(connection, 'tim_biru', 'fk_tim_biru_user', config.database))) {
      try {
        await connection.execute(`ALTER TABLE tim_biru ADD CONSTRAINT fk_tim_biru_user FOREIGN KEY (user_id) REFERENCES users(id)`);
        console.log('✅ Added FK fk_tim_biru_user on tim_biru(user_id)');
      } catch (e) {
        console.warn('⚠️ Skipping FK fk_tim_biru_user due to error:', e.message);
      }
    } else {
      console.log('ℹ️ FK fk_tim_biru_user already exists');
    }

    console.log('🎉 Migration completed successfully.');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
