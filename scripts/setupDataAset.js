const createDataAsetTable = require('./createDataAsetTable');
const seedDataAset = require('./seedDataAset');

const setupDataAset = async () => {
  try {
    console.log('🚀 Starting DataAset setup...\n');

    // Step 1: Create table
    console.log('📋 Step 1: Creating data_aset table...');
    await createDataAsetTable();
    console.log('✅ Table creation completed!\n');

    // Step 2: Seed data
    console.log('🌱 Step 2: Seeding data...');
    await seedDataAset();
    console.log('✅ Data seeding completed!\n');

    console.log('🎉 DataAset setup completed successfully!');
    console.log('\n📊 Available API endpoints:');
    console.log('   GET    /api/admin/data-aset                    - Get all data aset with pagination');
    console.log('   GET    /api/admin/data-aset/:id                - Get data aset by ID');
    console.log('   POST   /api/admin/data-aset                    - Create new data aset');
    console.log('   PUT    /api/admin/data-aset/:id                - Update data aset');
    console.log('   DELETE /api/admin/data-aset/:id                - Soft delete data aset');
    console.log('   GET    /api/admin/data-aset/category/:category - Filter by category');
    console.log('   GET    /api/admin/data-aset/statistics/overview - Get statistics');

  } catch (error) {
    console.error('❌ Error in DataAset setup:', error);
    throw error;
  }
};

// Run if this file is executed directly
if (require.main === module) {
  setupDataAset()
    .then(() => {
      console.log('\n🎯 Setup process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Setup process failed:', error);
      process.exit(1);
    });
}

module.exports = setupDataAset;
