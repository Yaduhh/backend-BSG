const mysql = require('mysql2/promise');
require('dotenv').config();

const removeStatusDeletedFromLeaderDivisiSafe = async () => {
  let connection;
  
  try {
    console.log('🔧 Connecting to database...');
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sistem_bosgil_group'
    });

    console.log('✅ Connected to database');

    // Check current table structure
    console.log('🔍 Checking current table structure...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'leader_divisi'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'sistem_bosgil_group']);

    console.log('📊 Current columns:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Check indexes
    console.log('🔍 Checking indexes...');
    const [indexes] = await connection.execute(`
      SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'leader_divisi'
      ORDER BY INDEX_NAME, SEQ_IN_INDEX
    `, [process.env.DB_NAME || 'sistem_bosgil_group']);

    console.log('📊 Current indexes:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.INDEX_NAME}: ${idx.COLUMN_NAME} (${idx.NON_UNIQUE === 0 ? 'unique' : 'non-unique'})`);
    });

    // Remove indexes that include status_deleted
    console.log('🗑️ Removing indexes that include status_deleted...');
    const indexesToRemove = indexes
      .filter(idx => idx.COLUMN_NAME === 'status_deleted')
      .map(idx => idx.INDEX_NAME)
      .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

    for (const indexName of indexesToRemove) {
      try {
        console.log(`  🗑️ Dropping index: ${indexName}`);
        await connection.execute(`
          ALTER TABLE leader_divisi 
          DROP INDEX ${indexName}
        `);
        console.log(`  ✅ Dropped index: ${indexName}`);
      } catch (error) {
        if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
          console.log(`  ℹ️ Index ${indexName} does not exist, continuing...`);
        } else {
          throw error;
        }
      }
    }

    // Check if status_deleted column exists
    const statusDeletedExists = columns.some(col => col.COLUMN_NAME === 'status_deleted');
    
    if (statusDeletedExists) {
      console.log('📊 Found status_deleted column, proceeding with removal...');

      // Check if there are any records with status_deleted = true
      console.log('🔍 Checking for soft-deleted records...');
      const [softDeletedRecords] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM leader_divisi 
        WHERE status_deleted = true
      `);

      if (softDeletedRecords[0].count > 0) {
        console.log(`📊 Found ${softDeletedRecords[0].count} soft-deleted records`);
        console.log('🗑️ Removing soft-deleted records...');
        
        await connection.execute(`
          DELETE FROM leader_divisi 
          WHERE status_deleted = true
        `);
        
        console.log('✅ Soft-deleted records removed');
      } else {
        console.log('✅ No soft-deleted records found');
      }

      // Remove status_deleted column
      console.log('🗑️ Removing status_deleted column...');
      await connection.execute(`
        ALTER TABLE leader_divisi 
        DROP COLUMN status_deleted
      `);
      console.log('✅ status_deleted column removed');
    } else {
      console.log('ℹ️ status_deleted column does not exist');
    }

    // Remove deleted_at column if it exists
    const deletedAtExists = columns.some(col => col.COLUMN_NAME === 'deleted_at');
    if (deletedAtExists) {
      console.log('🗑️ Removing deleted_at column...');
      await connection.execute(`
        ALTER TABLE leader_divisi 
        DROP COLUMN deleted_at
      `);
      console.log('✅ deleted_at column removed');
    } else {
      console.log('ℹ️ deleted_at column does not exist');
    }

    // Remove deleted_by column if it exists
    const deletedByExists = columns.some(col => col.COLUMN_NAME === 'deleted_by');
    if (deletedByExists) {
      console.log('🗑️ Removing deleted_by column...');
      await connection.execute(`
        ALTER TABLE leader_divisi 
        DROP COLUMN deleted_by
      `);
      console.log('✅ deleted_by column removed');
    } else {
      console.log('ℹ️ deleted_by column does not exist');
    }

    // Recreate the unique index without status_deleted
    console.log('🔨 Recreating unique index...');
    try {
      await connection.execute(`
        ALTER TABLE leader_divisi 
        ADD UNIQUE INDEX idx_leader_divisi_unique (id_user, id_divisi)
      `);
      console.log('✅ Unique index recreated');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ Unique index already exists');
      } else {
        throw error;
      }
    }

    console.log('🎉 Successfully removed soft delete fields from leader_divisi!');
    
  } catch (error) {
    console.error('❌ Error removing fields:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
};

// Run the script
if (require.main === module) {
  removeStatusDeletedFromLeaderDivisiSafe()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = removeStatusDeletedFromLeaderDivisiSafe;