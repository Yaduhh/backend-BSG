const { sequelize } = require('../config/database');

async function removeNamaDivisiPosisiFromTimTables() {
  try {
    console.log('🔄 Removing nama, divisi, and posisi columns from tim_merah and tim_biru tables...');

    // Remove columns from tim_merah table
    await sequelize.query(`
      ALTER TABLE tim_merah 
      DROP COLUMN nama
    `);

    console.log('✅ Removed nama column from tim_merah table');

    await sequelize.query(`
      ALTER TABLE tim_merah 
      DROP COLUMN divisi
    `);

    console.log('✅ Removed divisi column from tim_merah table');

    await sequelize.query(`
      ALTER TABLE tim_merah 
      DROP COLUMN posisi
    `);

    console.log('✅ Removed posisi column from tim_merah table');

    // Remove columns from tim_biru table
    await sequelize.query(`
      ALTER TABLE tim_biru 
      DROP COLUMN nama
    `);

    console.log('✅ Removed nama column from tim_biru table');

    await sequelize.query(`
      ALTER TABLE tim_biru 
      DROP COLUMN divisi
    `);

    console.log('✅ Removed divisi column from tim_biru table');

    await sequelize.query(`
      ALTER TABLE tim_biru 
      DROP COLUMN posisi
    `);

    console.log('✅ Removed posisi column from tim_biru table');

    console.log('🎉 Successfully removed nama, divisi, and posisi columns from tim tables!');
    
  } catch (error) {
    console.error('❌ Error updating tim tables:', error);
    
    // Check if columns don't exist
    if (error.message.includes("Can't DROP")) {
      console.log('ℹ️  Columns already removed, skipping...');
    } else {
      throw error;
    }
  }
}

// Run the script
removeNamaDivisiPosisiFromTimTables()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
