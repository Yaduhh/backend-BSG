const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Baca file .env secara manual (pola sama seperti script lain)
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
      if (key && value !== undefined) envConfig[key.trim()] = value.trim();
    }
  });
}

const config = {
  host: envConfig.DB_HOST || 'localhost',
  port: envConfig.DB_PORT ? Number(envConfig.DB_PORT) : 3306,
  user: envConfig.DB_USER || 'root',
  password: envConfig.DB_PASSWORD || '',
  database: envConfig.DB_NAME || 'sistem_bosgil_group',
};

async function createAturanTable() {
  const connection = await mysql.createConnection(config);
  try {
    console.log('🔧 Membuat tabel `aturan` (AUTO_INCREMENT id)...');

    const createTable = `
      CREATE TABLE IF NOT EXISTS \`aturan\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`id_user\` INT NOT NULL,
        \`tanggal_aturan\` DATETIME NOT NULL,
        \`judul_aturan\` VARCHAR(255) NOT NULL,
        \`isi_aturan\` LONGTEXT NULL,
        \`images\` LONGTEXT NULL,
        \`status_deleted\` TINYINT(1) DEFAULT 0,
        \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_aturan_user\` (\`id_user\`),
        KEY \`idx_aturan_tanggal\` (\`tanggal_aturan\`),
        KEY \`idx_aturan_status\` (\`status_deleted\`),
        KEY \`idx_aturan_created\` (\`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createTable);
    console.log('✅ Tabel `aturan` siap!');

    // Pastikan kolom id AUTO_INCREMENT kalau tabel sudah ada sebelumnya
    try {
      await connection.execute('ALTER TABLE `aturan` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT');
      console.log('✅ Kolom `id` diset AUTO_INCREMENT (atau sudah sesuai).');
    } catch (err) {
      console.log('ℹ️  Skip ALTER AUTO_INCREMENT:', err.message);
    }

    // (Opsional) FK ke users
    // try {
    //   await connection.execute('ALTER TABLE `aturan` ADD CONSTRAINT `fk_aturan_users` FOREIGN KEY (`id_user`) REFERENCES `users`(`id`) ON DELETE CASCADE');
    //   console.log('✅ Foreign key ke `users` ditambahkan.');
    // } catch (err) {
    //   console.log('ℹ️  Skip add FK (mungkin sudah ada):', err.message);
    // }
  } catch (error) {
    console.error('❌ Error membuat tabel `aturan`:', error.message);
  } finally {
    await connection.end();
  }
}

createAturanTable();
