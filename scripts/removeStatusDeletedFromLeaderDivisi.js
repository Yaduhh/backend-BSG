const mysql = require('mysql2/promise');
require('dotenv').config();

const removeStatusDeletedFromLeaderDivisi = async () => {
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

    // Check if status_deleted column exists
    console.log('🔍 Checking if status_deleted column exists...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'leader_divisi' 
      AND COLUMN_NAME = 'status_deleted'
    `, [process.env.DB_NAME || 'sistem_bosgil_group']);

    if (columns.length === 0) {
      console.log('ℹ️ status_deleted column does not exist, nothing to do');
      return;
    }

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

    // Remove deleted_at column if it exists
    console.log('🔍 Checking if deleted_at column exists...');
    const [deletedAtColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'leader_divisi' 
      AND COLUMN_NAME = 'deleted_at'
    `, [process.env.DB_NAME || 'sistem_bosgil_group']);

    if (deletedAtColumns.length > 0) {
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
    console.log('🔍 Checking if deleted_by column exists...');
    const [deletedByColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'leader_divisi' 
      AND COLUMN_NAME = 'deleted_by'
    `, [process.env.DB_NAME || 'sistem_bosgil_group']);

    if (deletedByColumns.length > 0) {
      console.log('🗑️ Removing deleted_by column...');
      await connection.execute(`
        ALTER TABLE leader_divisi 
        DROP COLUMN deleted_by
      `);
      console.log('✅ deleted_by column removed');
    } else {
      console.log('ℹ️ deleted_by column does not exist');
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
  removeStatusDeletedFromLeaderDivisi()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = removeStatusDeletedFromLeaderDivisi;