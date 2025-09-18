const mysql = require('mysql2/promise');
require('dotenv').config();

const cleanDuplicateLeaderDivisi = async () => {
  let connection;
  
  try {
    console.log('🔧 Connecting to database...');
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sistem_bosgil_group'
    });

    console.log('✅ Connected to database');

    // Check for duplicates
    console.log('🔍 Checking for duplicate records...');
    const [duplicates] = await connection.execute(`
      SELECT id_user, id_divisi, COUNT(*) as count
      FROM leader_divisi 
      WHERE status_deleted = false
      GROUP BY id_user, id_divisi 
      HAVING COUNT(*) > 1
    `);

    if (duplicates.length > 0) {
      console.log(`📊 Found ${duplicates.length} duplicate combinations:`);
      duplicates.forEach(dup => {
        console.log(`  - User ${dup.id_user} - Divisi ${dup.id_divisi}: ${dup.count} records`);
      });

      // Keep only the latest record for each duplicate combination
      console.log('🧹 Cleaning duplicates...');
      for (const dup of duplicates) {
        const [records] = await connection.execute(`
          SELECT id, created_at 
          FROM leader_divisi 
          WHERE id_user = ? AND id_divisi = ? AND status_deleted = false
          ORDER BY created_at DESC
        `, [dup.id_user, dup.id_divisi]);

        // Keep the first (latest) record, delete the rest
        if (records.length > 1) {
          const idsToDelete = records.slice(1).map(r => r.id);
          console.log(`  🗑️ Deleting ${idsToDelete.length} duplicate records for User ${dup.id_user} - Divisi ${dup.id_divisi}`);
          
          await connection.execute(`
            UPDATE leader_divisi 
            SET status_deleted = true, deleted_at = NOW(), deleted_by = 1
            WHERE id IN (${idsToDelete.map(() => '?').join(',')})
          `, idsToDelete);
        }
      }
      console.log('✅ Duplicates cleaned');
    } else {
      console.log('✅ No duplicates found');
    }

    // Also clean up any records where status_deleted = true but there are active records
    console.log('🔍 Checking for conflicting soft-deleted records...');
    const [conflicts] = await connection.execute(`
      SELECT ld1.id_user, ld1.id_divisi
      FROM leader_divisi ld1
      WHERE ld1.status_deleted = true
      AND EXISTS (
        SELECT 1 FROM leader_divisi ld2 
        WHERE ld2.id_user = ld1.id_user 
        AND ld2.id_divisi = ld1.id_divisi 
        AND ld2.status_deleted = false
      )
    `);

    if (conflicts.length > 0) {
      console.log(`📊 Found ${conflicts.length} conflicting soft-deleted records`);
      for (const conflict of conflicts) {
        console.log(`  🗑️ Removing soft-deleted record for User ${conflict.id_user} - Divisi ${conflict.id_divisi}`);
        await connection.execute(`
          DELETE FROM leader_divisi 
          WHERE id_user = ? AND id_divisi = ? AND status_deleted = true
        `, [conflict.id_user, conflict.id_divisi]);
      }
      console.log('✅ Conflicting records removed');
    } else {
      console.log('✅ No conflicting records found');
    }

    console.log('🎉 Database cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
};

// Run the script
if (require.main === module) {
  cleanDuplicateLeaderDivisi()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = cleanDuplicateLeaderDivisi;