const mysql = require('mysql2/promise');

// Database configuration - UPDATE THESE VALUES
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // FILL IN YOUR DATABASE PASSWORD HERE
  database: 'sistem_bosgil_group',
  port: 3306
};

async function updateAnekaGrafikTable() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully');

    // Check current table structure
    console.log('\n📋 Current table structure:');
    const [currentStructure] = await connection.execute('DESCRIBE aneka_grafik');
    console.table(currentStructure);

    // Check if parent_id column exists
    const hasParentId = currentStructure.some(col => col.Field === 'parent_id');
    
    if (!hasParentId) {
      console.log('\n➕ Adding parent_id column...');
      await connection.execute(`
        ALTER TABLE aneka_grafik 
        ADD COLUMN parent_id INT(11) DEFAULT NULL AFTER category
      `);
      console.log('✅ parent_id column added successfully');
    } else {
      console.log('✅ parent_id column already exists');
    }

    // Check if foreign key exists
    const [foreignKeys] = await connection.execute(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = '${dbConfig.database}' 
      AND TABLE_NAME = 'aneka_grafik' 
      AND REFERENCED_TABLE_NAME = 'aneka_grafik'
    `);

    if (foreignKeys.length === 0) {
      console.log('\n🔗 Adding foreign key constraint...');
      await connection.execute(`
        ALTER TABLE aneka_grafik 
        ADD CONSTRAINT fk_aneka_grafik_parent 
        FOREIGN KEY (parent_id) REFERENCES aneka_grafik(id) 
        ON DELETE SET NULL
      `);
      console.log('✅ Foreign key constraint added successfully');
    } else {
      console.log('✅ Foreign key constraint already exists');
    }

    // Update category enum
    console.log('\n🔄 Updating category enum...');
    try {
      await connection.execute(`
        ALTER TABLE aneka_grafik 
        MODIFY COLUMN category ENUM('omzet', 'bahan_baku', 'gaji_bonus_ops', 'gaji', 'bonus', 'operasional') NOT NULL
      `);
      console.log('✅ Category enum updated successfully');
    } catch (error) {
      if (error.message.includes('ER_WARN_DATA_TRUNCATED')) {
        console.log('⚠️  Warning: Some existing data may be truncated due to enum change');
        console.log('   Please check your data before proceeding');
      } else {
        throw error;
      }
    }

    // Show final table structure
    console.log('\n📋 Final table structure:');
    const [finalStructure] = await connection.execute('DESCRIBE aneka_grafik');
    console.table(finalStructure);

    console.log('\n🎉 Table update completed successfully!');
    console.log('✅ parent_id column added');
    console.log('✅ Foreign key constraint added');
    console.log('✅ Category enum updated');

  } catch (error) {
    console.error('\n❌ Error updating table:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('🔐 Access denied. Please check your database credentials:');
      console.error(`   Host: ${dbConfig.host}`);
      console.error(`   User: ${dbConfig.user}`);
      console.error(`   Password: ${dbConfig.password ? '***' : 'EMPTY'}`);
      console.error(`   Database: ${dbConfig.database}`);
      console.error('\n💡 Make sure to update the password in this script!');
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Connection refused. Please check if MySQL server is running.');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the update
updateAnekaGrafikTable();
