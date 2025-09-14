const { sequelize } = require('../config/database');

async function fixLampiranDataBinaLingkungan() {
  try {
    console.log('🚀 Starting fix for lampiran data in data_bina_lingkungan...');
    
    // Get all records with lampiran field
    const [results] = await sequelize.query(`
      SELECT id, lampiran 
      FROM data_bina_lingkungan 
      WHERE lampiran IS NOT NULL
    `);
    
    console.log(`📊 Found ${results.length} records with lampiran field`);
    
    let fixedCount = 0;
    
    for (const record of results) {
      const { id, lampiran } = record;
      
      // Check if lampiran is empty, null, or invalid JSON
      if (!lampiran || lampiran.trim() === '' || lampiran === 'null') {
        // Set to empty array JSON
        await sequelize.query(`
          UPDATE data_bina_lingkungan 
          SET lampiran = '[]' 
          WHERE id = ?
        `, [id]);
        
        console.log(`✅ Fixed record ${id}: Set to empty array`);
        fixedCount++;
        continue;
      }
      
      // Try to parse JSON
      try {
        const parsed = JSON.parse(lampiran);
        if (!Array.isArray(parsed)) {
          // If it's not an array, convert to empty array
          await sequelize.query(`
            UPDATE data_bina_lingkungan 
            SET lampiran = '[]' 
            WHERE id = ?
          `, [id]);
          
          console.log(`✅ Fixed record ${id}: Converted to empty array`);
          fixedCount++;
        }
      } catch (error) {
        // If JSON parsing fails, set to empty array
        await sequelize.query(`
          UPDATE data_bina_lingkungan 
          SET lampiran = '[]' 
          WHERE id = ?
        `, [id]);
        
        console.log(`✅ Fixed record ${id}: Invalid JSON, set to empty array`);
        fixedCount++;
      }
    }
    
    console.log(`🎉 Fix completed! Fixed ${fixedCount} records`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

fixLampiranDataBinaLingkungan();
