const { sequelize } = require('./config/database');
const KPI = require('./models/KPI');

async function testKPIConnection() {
  try {
    console.log('🔄 Testing database connection...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Sync KPI model
    await KPI.sync({ force: false });
    console.log('✅ KPI model synced');
    
    // Check if KPI data exists
    const kpiCount = await KPI.count();
    console.log(`📊 Total KPIs in database: ${kpiCount}`);
    
    if (kpiCount === 0) {
      console.log('⚠️  No KPI data found. Creating sample data...');
      
      // Create sample KPI data
      const sampleKPIs = [
        { name: 'Produktivitas Tim Marketing', category: 'divisi', photo_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800' },
        { name: 'Efisiensi Operasional', category: 'divisi', photo_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800' },
        { name: 'Kepuasan Pelanggan Divisi', category: 'divisi', photo_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800' },
        
        { name: 'Leadership Effectiveness', category: 'leader', photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800' },
        { name: 'Team Engagement Score', category: 'leader', photo_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800' },
        { name: 'Decision Making Speed', category: 'leader', photo_url: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800' },
        
        { name: 'Personal Productivity', category: 'individu', photo_url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800' },
        { name: 'Skill Development Progress', category: 'individu', photo_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800' },
        { name: 'Goal Achievement Rate', category: 'individu', photo_url: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800' }
      ];
      
      await KPI.bulkCreate(sampleKPIs);
      console.log('✅ Sample KPI data created');
    }
    
    // Test fetching KPIs by category
    const divisiKPIs = await KPI.findAll({ where: { category: 'divisi' } });
    const leaderKPIs = await KPI.findAll({ where: { category: 'leader' } });
    const individuKPIs = await KPI.findAll({ where: { category: 'individu' } });
    
    console.log(`📋 Divisi KPIs: ${divisiKPIs.length}`);
    console.log(`👑 Leader KPIs: ${leaderKPIs.length}`);
    console.log(`👤 Individu KPIs: ${individuKPIs.length}`);
    
    console.log('🎉 KPI database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await sequelize.close();
  }
}

testKPIConnection();
