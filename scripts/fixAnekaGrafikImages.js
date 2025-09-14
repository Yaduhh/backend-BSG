const mysql = require('mysql2/promise');
const path = require('path');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'sistem_bosgil_group'
};

async function fixAnekaGrafikImages() {
  let connection;

  try {
    console.log('🔧 Starting to fix Aneka Grafik images...');

    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Get all aneka_grafik records
    const [rows] = await connection.execute(
      'SELECT id, images FROM aneka_grafik WHERE images IS NOT NULL AND images != ""'
    );

    console.log(`📊 Found ${rows.length} records with images to fix`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      try {
        console.log(`\n🔍 Processing record ID: ${row.id}`);
        console.log(`📸 Original images: ${row.images}`);

        let images = [];

        try {
          // Parse the images JSON
          if (typeof row.images === 'string') {
            images = JSON.parse(row.images);
          } else {
            images = row.images;
          }
        } catch (parseError) {
          console.log(`⚠️ Failed to parse images JSON for ID ${row.id}:`, parseError.message);
          continue;
        }

        if (!Array.isArray(images)) {
          console.log(`⚠️ Images is not an array for ID ${row.id}`);
          continue;
        }

        let hasChanges = false;

        // Fix each image
        const fixedImages = images.map(img => {
          if (!img || typeof img !== 'object') {
            console.log(`⚠️ Invalid image object in ID ${row.id}:`, img);
            return img;
          }

          let fixedImg = { ...img };

          // Fix URL field
          if (img.url) {
            let fixedUrl = img.url;

            // Remove duplicate http://
            if (fixedUrl.startsWith('http://http://')) {
              fixedUrl = fixedUrl.replace('http://http://', 'http://');
              console.log(`🔧 Fixed double http://: ${img.url} -> ${fixedUrl}`);
              hasChanges = true;
            }

            // Fix old IP addresses
            if (fixedUrl.includes('192.168.23.223:3000')) {
              fixedUrl = fixedUrl.replace('http://192.168.23.223:3000', '');
              console.log(`🔧 Fixed old IP: ${img.url} -> ${fixedUrl}`);
              hasChanges = true;
            }

            // Ensure URL starts with /uploads/
            if (!fixedUrl.startsWith('/uploads/') && !fixedUrl.startsWith('http')) {
              if (img.serverPath) {
                fixedUrl = `/${img.serverPath}`;
                console.log(`🔧 Fixed URL using serverPath: ${img.url} -> ${fixedUrl}`);
                hasChanges = true;
              }
            }

            fixedImg.url = fixedUrl;
          }

          // Fix serverPath field
          if (img.serverPath) {
            let fixedServerPath = img.serverPath;

            // Remove old IP addresses from serverPath
            if (fixedServerPath.includes('192.168.23.223:3000')) {
              fixedServerPath = fixedServerPath.replace('http://192.168.23.223:3000', '');
              console.log(`🔧 Fixed serverPath: ${img.serverPath} -> ${fixedServerPath}`);
              hasChanges = true;
            }

            // Ensure serverPath doesn't start with /
            if (fixedServerPath.startsWith('/')) {
              fixedServerPath = fixedServerPath.substring(1);
              console.log(`🔧 Fixed serverPath leading slash: ${img.serverPath} -> ${fixedServerPath}`);
              hasChanges = true;
            }

            fixedImg.serverPath = fixedServerPath;
          }

          return fixedImg;
        });

        if (hasChanges) {
          // Update the database
          const fixedImagesJson = JSON.stringify(fixedImages);
          console.log(`💾 Updating record ID ${row.id} with fixed images:`, fixedImagesJson);

          await connection.execute(
            'UPDATE aneka_grafik SET images = ? WHERE id = ?',
            [fixedImagesJson, row.id]
          );

          console.log(`✅ Successfully updated record ID ${row.id}`);
          fixedCount++;
        } else {
          console.log(`ℹ️ No changes needed for record ID ${row.id}`);
        }

      } catch (error) {
        console.error(`❌ Error processing record ID ${row.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n🎉 Fix completed!`);
    console.log(`✅ Fixed: ${fixedCount} records`);
    console.log(`❌ Errors: ${errorCount} records`);
    console.log(`📊 Total processed: ${rows.length} records`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
if (require.main === module) {
  fixAnekaGrafikImages()
    .then(() => {
      console.log('🏁 Script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixAnekaGrafikImages };


