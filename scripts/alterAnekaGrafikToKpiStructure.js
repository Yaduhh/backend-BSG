const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Konfigurasi database - sesuaikan dengan setting database lu
function loadDatabaseConfig() {
    // Default config - sesuaikan dengan database lu
    return {
        host: 'localhost',
        user: 'root',
        password: '', // Isi password database lu di sini jika ada
        database: 'sistem_bosgil_group',
        port: 3306
    };
}

async function alterAnekaGrafikToKpiStructure() {
    let connection;
    
    try {
        console.log('🚀 Starting aneka_grafik table structure alteration...');
        
        // Load database config
        const dbConfig = loadDatabaseConfig();
        console.log('🔧 Database config:', {
            host: dbConfig.host,
            user: dbConfig.user,
            database: dbConfig.database,
            port: dbConfig.port,
            password: dbConfig.password ? '***' : '(empty)'
        });
        
        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        
        console.log('🔌 Connected to database successfully');
        
        // Backup existing data first
        console.log('💾 Backing up existing data...');
        const [existingData] = await connection.execute('SELECT * FROM aneka_grafik');
        console.log(`📊 Found ${existingData.length} existing records to backup`);
        
        // Create backup table
        await connection.execute('CREATE TABLE IF NOT EXISTS aneka_grafik_backup LIKE aneka_grafik');
        await connection.execute('INSERT INTO aneka_grafik_backup SELECT * FROM aneka_grafik');
        console.log('✅ Backup table created successfully');
        
        // Drop existing table
        console.log('🗑️ Dropping existing aneka_grafik table...');
        await connection.execute('DROP TABLE aneka_grafik');
        
        // Create new table with KPI structure
        console.log('🏗️ Creating new aneka_grafik table with KPI structure...');
                 const createTableQuery = `
             CREATE TABLE aneka_grafik (
                 id int(11) NOT NULL AUTO_INCREMENT,
                 name varchar(255) NOT NULL,
                 category enum('omzet', 'bahan_baku', 'gaji_bonus_ops', 'gaji', 'bonus', 'operasional') NOT NULL,
                 photo_url varchar(500) DEFAULT NULL,
                 parent_id int(11) DEFAULT NULL,
                 status_deleted tinyint(1) DEFAULT '0',
                 created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                 updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                 PRIMARY KEY (id),
                 KEY idx_aneka_grafik_category (category),
                 KEY idx_aneka_grafik_parent (parent_id),
                 KEY idx_aneka_grafik_created (created_at),
                 KEY idx_aneka_grafik_status (status_deleted),
                 FOREIGN KEY (parent_id) REFERENCES aneka_grafik(id) ON DELETE SET NULL
             ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1
         `;
        
        await connection.execute(createTableQuery);
        console.log('✅ New table structure created successfully');
        
        // Migrate data from backup (if possible)
        console.log('🔄 Migrating data from backup...');
        if (existingData.length > 0) {
            // Try to map existing data to new structure
            for (const record of existingData) {
                try {
                    // Extract name from isi_grafik (take first line as name)
                    const lines = record.isi_grafik.split('\n');
                    const name = lines[0] || `Grafik ${record.id}`;
                    
                    // Determine category based on content or default to 'divisi'
                    let category = 'divisi';
                    if (record.isi_grafik.toLowerCase().includes('leader') || record.isi_grafik.toLowerCase().includes('kepala')) {
                        category = 'leader';
                    } else if (record.isi_grafik.toLowerCase().includes('individu') || record.isi_grafik.toLowerCase().includes('personal')) {
                        category = 'individu';
                    }
                    
                    // Convert images to photo_url if exists
                    let photo_url = null;
                    if (record.images && record.images !== '') {
                        try {
                            const imagesData = JSON.parse(record.images);
                            if (Array.isArray(imagesData) && imagesData.length > 0) {
                                photo_url = imagesData[0]; // Take first image
                            }
                        } catch (e) {
                            // If not JSON, treat as direct string
                            photo_url = record.images;
                        }
                    }
                    
                                         // Insert into new structure
                     const insertQuery = `
                         INSERT INTO aneka_grafik (name, category, photo_url, parent_id, status_deleted, created_at, updated_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?)
                     `;
                     
                     await connection.execute(insertQuery, [
                         name.substring(0, 255), // Ensure name fits in varchar(255)
                         category,
                         photo_url,
                         null, // parent_id
                         record.status_deleted || 0,
                         record.created_at || new Date(),
                         record.updated_at || new Date()
                     ]);
                    
                } catch (migrationError) {
                    console.log(`⚠️ Could not migrate record ID ${record.id}: ${migrationError.message}`);
                }
            }
            console.log('✅ Data migration completed');
        }
        
                 // Insert sample data in new structure
         console.log('📝 Inserting sample data with new structure...');
         
         // Insert parent categories first
         const parentCategories = [
             { name: 'OMZET', category: 'omzet' },
             { name: 'BAHAN BAKU', category: 'bahan_baku' },
             { name: 'GAJI BONUS OPS', category: 'gaji_bonus_ops' },
             { name: 'GAJI', category: 'gaji' },
             { name: 'BONUS', category: 'bonus' },
             { name: 'OPERASIONAL', category: 'operasional' }
         ];
         
         for (const parent of parentCategories) {
             const insertQuery = `
                 INSERT INTO aneka_grafik (name, category, photo_url, parent_id, status_deleted, created_at, updated_at)
                 VALUES (?, ?, NULL, NULL, 0, NOW(), NOW())
             `;
             
             await connection.execute(insertQuery, [parent.name, parent.category]);
         }
         
         // Get parent IDs for child items
         const [parentRows] = await connection.execute('SELECT id, category FROM aneka_grafik WHERE parent_id IS NULL');
         
         // Insert child items
         const childItems = [
             { name: 'TOTAL OZ GROUP', category: 'omzet' },
             { name: 'OZ T. TEPUNG', category: 'omzet' },
             { name: 'TOTAL OZ BSG', category: 'omzet' },
             { name: 'OZ BSG PER OUTLET', category: 'omzet' },
             { name: 'OZ KARANG', category: 'omzet' },
             { name: 'OZ PERMATA', category: 'omzet' },
             
             { name: 'TOTAL BB GROUP', category: 'bahan_baku' },
             { name: 'BB T. TEPUNG', category: 'bahan_baku' },
             { name: 'TOTAL BB BSG', category: 'bahan_baku' },
             { name: 'BB BSG PER OUTLET', category: 'bahan_baku' },
             { name: 'BB KARANG', category: 'bahan_baku' },
             { name: 'BB PERMATA', category: 'bahan_baku' }
         ];
         
         for (const child of childItems) {
             const parent = parentRows.find(p => p.category === child.category);
             if (parent) {
                 const insertQuery = `
                     INSERT INTO aneka_grafik (name, category, photo_url, parent_id, status_deleted, created_at, updated_at)
                     VALUES (?, ?, NULL, ?, 0, NOW(), NOW())
                 `;
                 
                 await connection.execute(insertQuery, [child.name, child.category, parent.id]);
             }
         }
        
        console.log('✅ Sample data inserted successfully');
        
        // Verify new table structure
        const [columns] = await connection.execute('DESCRIBE aneka_grafik');
        console.log('📋 New table structure:');
        columns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
        });
        
        // Verify data
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM aneka_grafik');
        console.log(`📊 Total records in new table: ${rows[0].count}`);
        
        // Show sample data
        const [sampleRows] = await connection.execute('SELECT id, name, category, created_at FROM aneka_grafik ORDER BY created_at DESC LIMIT 5');
        console.log('📝 Sample data in new structure:');
        sampleRows.forEach(row => {
            console.log(`  - ID ${row.id}: ${row.name} (${row.category}) - ${row.created_at}`);
        });
        
        console.log('🎉 Aneka Grafik table structure alteration completed successfully!');
        console.log('💡 Note: Old data has been backed up in aneka_grafik_backup table');
        
    } catch (error) {
        console.error('❌ Error altering aneka_grafik table:', error);
        
        // If error occurs, try to restore from backup
        if (connection) {
            try {
                console.log('🔄 Attempting to restore from backup...');
                const [backupExists] = await connection.execute('SHOW TABLES LIKE "aneka_grafik_backup"');
                
                if (backupExists.length > 0) {
                    // Drop current table if exists
                    await connection.execute('DROP TABLE IF EXISTS aneka_grafik');
                    
                    // Restore from backup
                    await connection.execute('CREATE TABLE aneka_grafik LIKE aneka_grafik_backup');
                    await connection.execute('INSERT INTO aneka_grafik SELECT * FROM aneka_grafik_backup');
                    console.log('✅ Table restored from backup successfully');
                }
            } catch (restoreError) {
                console.error('❌ Failed to restore from backup:', restoreError);
            }
        }
        
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the script
if (require.main === module) {
    alterAnekaGrafikToKpiStructure()
        .then(() => {
            console.log('✅ Script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { alterAnekaGrafikToKpiStructure };
