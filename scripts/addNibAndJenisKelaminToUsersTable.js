const { sequelize } = require('../config/database');

async function addNibAndJenisKelaminToUsersTable() {
  try {
    console.log('🚀 Starting users table alteration to add nib and jenis_kelamin fields...');
    
    // Check if users table exists
    console.log('🔍 Checking if users table exists...');
    const [tables] = await sequelize.query(
      "SHOW TABLES LIKE 'users'"
    );
    
    if (tables.length === 0) {
      console.log('❌ Table users does not exist. Please create it first.');
      return;
    }
    
    console.log('✅ Table users exists');
    
    // Check if nib column already exists
    console.log('🔍 Checking if nib column already exists...');
    const [nibColumns] = await sequelize.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'nib'"
    );
    
    if (nibColumns.length > 0) {
      console.log('⚠️ Column nib already exists in users table');
    } else {
      // Add nib column after id
      console.log('➕ Adding nib column to users table...');
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN nib INT NULL COMMENT 'Nomor Induk Berusaha' 
        AFTER id
      `);
      console.log('✅ Column nib added successfully');
    }
    
    // Check if jenis_kelamin column already exists
    console.log('🔍 Checking if jenis_kelamin column already exists...');
    const [jkColumns] = await sequelize.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'jenis_kelamin'"
    );
    
    if (jkColumns.length > 0) {
      console.log('⚠️ Column jenis_kelamin already exists in users table');
    } else {
      // Add jenis_kelamin column after nib
      console.log('➕ Adding jenis_kelamin column to users table...');
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN jenis_kelamin ENUM('L', 'P') NULL COMMENT 'Jenis Kelamin: L=Laki-laki, P=Perempuan' 
        AFTER nib
      `);
      console.log('✅ Column jenis_kelamin added successfully');
    }
    
    // Verify the changes
    console.log('🔍 Verifying table structure...');
    const [newColumns] = await sequelize.query(
      "DESCRIBE users"
    );
    
    console.log('📋 Updated users table structure:');
    newColumns.forEach(column => {
      console.log(`  - ${column.Field}: ${column.Type} ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Key ? `(${column.Key})` : ''}`);
    });
    
    console.log('✅ Users table alteration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during users table alteration:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run the script
if (require.main === module) {
  addNibAndJenisKelaminToUsersTable()
    .then(() => {
      console.log('🎉 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addNibAndJenisKelaminToUsersTable };
