const { sequelize } = require('../config/database');

async function addUserIdToTimTables() {
  try {
    console.log('🔄 Adding user_id column to tim_merah and tim_biru tables...');

    // Add user_id column to tim_merah table
    await sequelize.query(`
      ALTER TABLE tim_merah 
      ADD COLUMN user_id INT NULL 
      COMMENT 'ID user pegawai yang masuk tim merah'
      AFTER keterangan
    `);

    console.log('✅ Added user_id column to tim_merah table');

    // Add user_id column to tim_biru table
    await sequelize.query(`
      ALTER TABLE tim_biru 
      ADD COLUMN user_id INT NULL 
      COMMENT 'ID user pegawai yang masuk tim biru'
      AFTER keterangan
    `);

    console.log('✅ Added user_id column to tim_biru table');

    // Add foreign key constraints
    await sequelize.query(`
      ALTER TABLE tim_merah 
      ADD CONSTRAINT fk_tim_merah_user_id 
      FOREIGN KEY (user_id) REFERENCES users(id) 
      ON DELETE SET NULL ON UPDATE CASCADE
    `);

    console.log('✅ Added foreign key constraint for tim_merah.user_id');

    await sequelize.query(`
      ALTER TABLE tim_biru 
      ADD CONSTRAINT fk_tim_biru_user_id 
      FOREIGN KEY (user_id) REFERENCES users(id) 
      ON DELETE SET NULL ON UPDATE CASCADE
    `);

    console.log('✅ Added foreign key constraint for tim_biru.user_id');

    // Add indexes
    await sequelize.query(`
      ALTER TABLE tim_merah 
      ADD INDEX idx_tim_merah_user_id (user_id)
    `);

    console.log('✅ Added index for tim_merah.user_id');

    await sequelize.query(`
      ALTER TABLE tim_biru 
      ADD INDEX idx_tim_biru_user_id (user_id)
    `);

    console.log('✅ Added index for tim_biru.user_id');

    console.log('🎉 Successfully updated tim_merah and tim_biru tables!');
    
  } catch (error) {
    console.error('❌ Error updating tim tables:', error);
    
    // Check if columns already exist
    if (error.message.includes('Duplicate column name')) {
      console.log('ℹ️  Columns already exist, skipping...');
    } else if (error.message.includes('Duplicate key name')) {
      console.log('ℹ️  Indexes already exist, skipping...');
    } else if (error.message.includes('Duplicate key name')) {
      console.log('ℹ️  Foreign keys already exist, skipping...');
    } else {
      throw error;
    }
  }
}

// Run the script
addUserIdToTimTables()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
