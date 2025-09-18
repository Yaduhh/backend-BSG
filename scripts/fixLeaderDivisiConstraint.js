const mysql = require('mysql2/promise');
require('dotenv').config();

const fixLeaderDivisiConstraint = async () => {
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

    // Drop existing unique constraint
    console.log('🗑️ Dropping existing unique constraint...');
    try {
      await connection.execute(`
        ALTER TABLE leader_divisi 
        DROP INDEX idx_leader_divisi_unique
      `);
      console.log('✅ Dropped existing unique constraint');
    } catch (error) {
      if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('ℹ️ Constraint does not exist, continuing...');
      } else {
        throw error;
      }
    }

    // Create new unique constraint without status_deleted
    console.log('🔨 Creating new unique constraint...');
    await connection.execute(`
      ALTER TABLE leader_divisi 
      ADD UNIQUE INDEX idx_leader_divisi_unique (id_user, id_divisi)
    `);
    console.log('✅ Created new unique constraint');

    console.log('🎉 Successfully fixed leader_divisi constraint!');
    
  } catch (error) {
    console.error('❌ Error fixing constraint:', error);
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
  fixLeaderDivisiConstraint()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = fixLeaderDivisiConstraint;