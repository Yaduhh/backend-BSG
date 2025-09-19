const { sequelize } = require('../config/database');
const { KPI } = require('../models/KPI');
const { SdmDivisi } = require('../models');

async function updateKpiWithDivisiId() {
  try {
    console.log('🔄 Updating KPI data with divisi_id...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Get all divisi
    const divisiList = await SdmDivisi.findAll({
      where: { status_deleted: false },
      attributes: ['id', 'nama_divisi']
    });
    
    console.log(`📊 Found ${divisiList.length} divisions:`);
    divisiList.forEach(divisi => {
      console.log(`  - ${divisi.nama_divisi} (ID: ${divisi.id})`);
    });
    
    // Update KPI divisi dengan divisi_id berdasarkan nama
    const kpiDivisiUpdates = [
      { name: 'KPI DIVISI TEPUNG BOSGIL', divisi_name: 'TEPUNG BOSGIL' },
      { name: 'KPI DIVISI PRODUKSI', divisi_name: 'PRODUKSI' },
      { name: 'KPI DIVISI KEUANGAN', divisi_name: 'KEUANGAN' },
      { name: 'KPI DIVISI HR', divisi_name: 'HR' },
      { name: 'KPI DIVISI BRANDING & MARKETING', divisi_name: 'BRANDING & MARKETING' },
      { name: 'KPI DIVISI DIGITAL MARKETING', divisi_name: 'DIGITAL MARKETING' }
    ];
    
    console.log('🔄 Updating KPI divisi...');
    for (const update of kpiDivisiUpdates) {
      const divisi = divisiList.find(d => 
        d.nama_divisi.toUpperCase().includes(update.divisi_name.toUpperCase()) ||
        update.divisi_name.toUpperCase().includes(d.nama_divisi.toUpperCase())
      );
      
      if (divisi) {
        const updated = await KPI.update(
          { divisi_id: divisi.id },
          { where: { name: update.name, category: 'divisi' } }
        );
        
        if (updated[0] > 0) {
          console.log(`✅ Updated ${update.name} → ${divisi.nama_divisi} (ID: ${divisi.id})`);
        } else {
          console.log(`⚠️ No KPI found for ${update.name}`);
        }
      } else {
        console.log(`❌ Divisi not found for ${update.name}`);
      }
    }
    
    // Update KPI individu dengan divisi_id berdasarkan nama
    const kpiIndividuUpdates = [
      { name: 'KPI TIM TEPUNG BOSGIL', divisi_name: 'TEPUNG BOSGIL' },
      { name: 'KPI TIM PRODUKSI', divisi_name: 'PRODUKSI' },
      { name: 'KPI TIM KEUANGAN', divisi_name: 'KEUANGAN' },
      { name: 'KPI TIM HR', divisi_name: 'HR' },
      { name: 'KPI TIM BRANDING & MARKETING', divisi_name: 'BRANDING & MARKETING' },
      { name: 'KPI TIM DIGITAL MARKETING', divisi_name: 'DIGITAL MARKETING' }
    ];
    
    console.log('🔄 Updating KPI individu...');
    for (const update of kpiIndividuUpdates) {
      const divisi = divisiList.find(d => 
        d.nama_divisi.toUpperCase().includes(update.divisi_name.toUpperCase()) ||
        update.divisi_name.toUpperCase().includes(d.nama_divisi.toUpperCase())
      );
      
      if (divisi) {
        const updated = await KPI.update(
          { divisi_id: divisi.id },
          { where: { name: update.name, category: 'individu' } }
        );
        
        if (updated[0] > 0) {
          console.log(`✅ Updated ${update.name} → ${divisi.nama_divisi} (ID: ${divisi.id})`);
        } else {
          console.log(`⚠️ No KPI found for ${update.name}`);
        }
      } else {
        console.log(`❌ Divisi not found for ${update.name}`);
      }
    }
    
    // Verify the updates
    console.log('🔍 Verifying updates...');
    const updatedKPIs = await KPI.findAll({
      where: {
        divisi_id: { [require('sequelize').Op.ne]: null }
      },
      include: [
        {
          model: SdmDivisi,
          as: 'divisi',
          attributes: ['id', 'nama_divisi']
        }
      ],
      order: [['category', 'ASC'], ['name', 'ASC']]
    });
    
    console.log('📋 Updated KPIs:');
    updatedKPIs.forEach(kpi => {
      console.log(`  - ${kpi.name} (${kpi.category}) → ${kpi.divisi?.nama_divisi || 'No divisi'} (ID: ${kpi.divisi_id})`);
    });
    
    console.log('🎉 KPI divisi_id update completed!');
    
  } catch (error) {
    console.error('❌ Error updating KPI with divisi_id:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script
if (require.main === module) {
  updateKpiWithDivisiId();
}

module.exports = updateKpiWithDivisiId;
