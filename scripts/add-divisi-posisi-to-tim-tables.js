const { sequelize } = require('../config/database');

async function addDivisiPosisiToTimTables() {
  try {
    console.log('🔄 Adding divisi and posisi columns to tim_merah and tim_biru tables...');

    // Add divisi and posisi columns to tim_merah table
    await sequelize.query(`
      ALTER TABLE tim_merah 
      ADD COLUMN divisi VARCHAR(255) NOT NULL 
      COMMENT 'Divisi/cabang tempat kerja'
      AFTER nama
    `);

    console.log('✅ Added divisi column to tim_merah table');

    await sequelize.query(`
      ALTER TABLE tim_merah 
      ADD COLUMN posisi VARCHAR(255) NOT NULL 
      COMMENT 'Posisi/jabatan karyawan'
      AFTER divisi
    `);

    console.log('✅ Added posisi column to tim_merah table');

    // Add divisi and posisi columns to tim_biru table
    await sequelize.query(`
      ALTER TABLE tim_biru 
      ADD COLUMN divisi VARCHAR(255) NOT NULL 
      COMMENT 'Divisi/cabang tempat kerja'
      AFTER nama
    `);

    console.log('✅ Added divisi column to tim_biru table');

    await sequelize.query(`
      ALTER TABLE tim_biru 
      ADD COLUMN posisi VARCHAR(255) NOT NULL 
      COMMENT 'Posisi/jabatan karyawan'
      AFTER divisi
    `);

    console.log('✅ Added posisi column to tim_biru table');

    // Add indexes for divisi and posisi
    await sequelize.query(`
      ALTER TABLE tim_merah 
      ADD INDEX idx_tim_merah_divisi (divisi)
    `);

    console.log('✅ Added index for tim_merah.divisi');

    await sequelize.query(`
      ALTER TABLE tim_merah 
      ADD INDEX idx_tim_merah_posisi (posisi)
    `);

    console.log('✅ Added index for tim_merah.posisi');

    await sequelize.query(`
      ALTER TABLE tim_biru 
      ADD INDEX idx_tim_biru_divisi (divisi)
    `);

    console.log('✅ Added index for tim_biru.divisi');

    await sequelize.query(`
      ALTER TABLE tim_biru 
      ADD INDEX idx_tim_biru_posisi (posisi)
    `);

    console.log('✅ Added index for tim_biru.posisi');

    console.log('🎉 Successfully added divisi and posisi columns to tim tables!');
    
  } catch (error) {
    console.error('❌ Error updating tim tables:', error);
    
    // Check if columns already exist
    if (error.message.includes('Duplicate column name')) {
      console.log('ℹ️  Columns already exist, skipping...');
    } else if (error.message.includes('Duplicate key name')) {
      console.log('ℹ️  Indexes already exist, skipping...');
    } else {
      throw error;
    }
  }
}

// Run the script
addDivisiPosisiToTimTables()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
