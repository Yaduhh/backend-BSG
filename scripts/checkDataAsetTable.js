const mysql = require('mysql2/promise');
require('dotenv').config();

const checkDataAsetTable = async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sistem_bosgil_group'
    });
    
    console.log('✅ Connected to database successfully');
    
    // Check if data_aset table exists
    const [tables] = await connection.execute("SHOW TABLES LIKE 'data_aset'");
    if (tables.length > 0) {
      console.log('✅ Table data_aset exists');
      
      // Show table structure
      const [columns] = await connection.execute("DESCRIBE data_aset");
      console.log('\n📋 Table structure:');
      columns.forEach(col => {
        console.log(`   ${col.Field} - ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      
      // Check if table has data
      const [countResult] = await connection.execute("SELECT COUNT(*) as total FROM data_aset");
      console.log(`\n📊 Total records: ${countResult[0].total}`);
      
    } else {
      console.log('❌ Table data_aset does not exist');
    }
    
  } catch (error) {
    console.error('❌ Error checking data_aset table:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
};

checkDataAsetTable();
