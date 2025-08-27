const { sequelize } = require('./config/database');
const KPI = require('./models/KPI');

async function initKPIData() {
  try {
    console.log('🔄 Initializing KPI data...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Sync KPI model (create table if not exists)
    await KPI.sync({ force: false });
    console.log('✅ KPI table synced');
    
    // Check if KPI data already exists
    const existingCount = await KPI.count();
    console.log(`📊 Existing KPI records: ${existingCount}`);
    
    if (existingCount === 0) {
      console.log('📝 Creating sample KPI data...');
      
      const sampleKPIs = [
        // KPI Divisi
        { name: 'KPI DIVISI TEPUNG BOSGIL', category: 'divisi', photo_url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800' },
        { name: 'KPI DIVISI PRODUKSI', category: 'divisi', photo_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800' },
        { name: 'KPI DIVISI KEUANGAN', category: 'divisi', photo_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800' },
        { name: 'KPI DIVISI HR', category: 'divisi', photo_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800' },
        { name: 'KPI DIVISI BRANDING & MARKETING', category: 'divisi', photo_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800' },
        { name: 'KPI DIVISI DIGITAL MARKETING', category: 'divisi', photo_url: 'https://images.unsplash.com/photo-1557838923-2985c318be48?w=800' },
        
        // KPI Leader
        { name: 'KPI LEADER TEPUNG BOSGIL', category: 'leader', photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800' },
        { name: 'KPI LEADER PRODUKSI', category: 'leader', photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800' },
        { name: 'KPI LEADER KEUANGAN', category: 'leader', photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800' },
        { name: 'KPI LEADER HR', category: 'leader', photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800' },
        { name: 'KPI LEADER BRANDING & MARKETING', category: 'leader', photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800' },
        { name: 'KPI LEADER DIGITAL MARKETING', category: 'leader', photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800' },
        
        // KPI Individu
        { name: 'KPI TIM TEPUNG BOSGIL', category: 'individu', photo_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800' },
        { name: 'KPI TIM PRODUKSI', category: 'individu', photo_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800' },
        { name: 'KPI TIM KEUANGAN', category: 'individu', photo_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800' },
        { name: 'KPI TIM HR', category: 'individu', photo_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800' },
        { name: 'KPI TIM BRANDING & MARKETING', category: 'individu', photo_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800' },
        { name: 'KPI TIM DIGITAL MARKETING', category: 'individu', photo_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800' }
      ];
      
      await KPI.bulkCreate(sampleKPIs);
      console.log(`✅ Created ${sampleKPIs.length} KPI records`);
    }
    
    // Verify data by category
    const divisiCount = await KPI.count({ where: { category: 'divisi' } });
    const leaderCount = await KPI.count({ where: { category: 'leader' } });
    const individuCount = await KPI.count({ where: { category: 'individu' } });
    
    console.log('📋 KPI Data Summary:');
    console.log(`  - Divisi: ${divisiCount} records`);
    console.log(`  - Leader: ${leaderCount} records`);
    console.log(`  - Individu: ${individuCount} records`);
    console.log('🎉 KPI data initialization completed!');
    
  } catch (error) {
    console.error('❌ Error initializing KPI data:', error);
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  initKPIData();
}

module.exports = initKPIData;
