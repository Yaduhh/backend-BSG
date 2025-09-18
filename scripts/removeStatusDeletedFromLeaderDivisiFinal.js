const mysql = require('mysql2/promise');
require('dotenv').config();

const removeStatusDeletedFromLeaderDivisiFinal = async () => {
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

    // Check foreign key constraints
    console.log('🔍 Checking foreign key constraints...');
    const [foreignKeys] = await connection.execute(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'leader_divisi'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [process.env.DB_NAME || 'sistem_bosgil_group']);

    console.log('📊 Foreign key constraints:');
    foreignKeys.forEach(fk => {
      console.log(`  - ${fk.CONSTRAINT_NAME}: ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
    });

    // Drop foreign key constraints that involve deleted_by
    const deletedByConstraints = foreignKeys.filter(fk => fk.COLUMN_NAME === 'deleted_by');
    
    for (const constraint of deletedByConstraints) {
      console.log(`🗑️ Dropping foreign key constraint: ${constraint.CONSTRAINT_NAME}`);
      await connection.execute(`
        ALTER TABLE leader_divisi 
        DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}
      `);
      console.log(`✅ Dropped foreign key constraint: ${constraint.CONSTRAINT_NAME}`);
    }

    // Now remove the deleted_by column
    console.log('🗑️ Removing deleted_by column...');
    await connection.execute(`
      ALTER TABLE leader_divisi 
      DROP COLUMN deleted_by
    `);
    console.log('✅ deleted_by column removed');

    // Check final table structure
    console.log('🔍 Final table structure:');
    const [finalColumns] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'leader_divisi'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'sistem_bosgil_group']);

    console.log('📊 Final columns:');
    finalColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
    });

    console.log('🎉 Successfully removed all soft delete fields from leader_divisi!');
    
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
  removeStatusDeletedFromLeaderDivisiFinal()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = removeStatusDeletedFromLeaderDivisiFinal;