const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");

// Baca file .env secara manual
const envPath = path.join(__dirname, '../.env');
const configPath = path.join(__dirname, '../config.env');
let envConfig = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const cleanContent = envContent
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  cleanContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, value] = trimmedLine.split('=');
      if (key && value !== undefined) {
        const cleanKey = key.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, '');
        const cleanValue = value.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, '');
        envConfig[cleanKey] = cleanValue;
      }
    }
  });
} else if (fs.existsSync(configPath)) {
  const configContent = fs.readFileSync(configPath, 'utf8');
  const cleanContent = configContent
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  cleanContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value !== undefined) {
        const cleanKey = key.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, '');
        const cleanValue = value.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, '');
        envConfig[cleanKey] = cleanValue;
      }
    }
  });
}

require('dotenv').config();

const dbConfig = {
  host: envConfig.DB_HOST || process.env.DB_HOST,
  port: envConfig.DB_PORT || process.env.DB_PORT,
  user: envConfig.DB_USER || process.env.DB_USER,
  password: envConfig.DB_PASSWORD || process.env.DB_PASSWORD,
  database: envConfig.DB_NAME || process.env.DB_NAME
};

async function seedDataInvestorMenu() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log("Adding DATA INVESTOR menu to PIC menu...");
    
    // Get all admin users
    const [adminUsers] = await connection.execute(`
      SELECT id FROM users WHERE role = 'admin' AND status_deleted = 0
    `);
    
    if (adminUsers.length === 0) {
      console.log("No admin users found");
      return;
    }
    
    // Add DATA INVESTOR menu for each admin user
    for (const adminUser of adminUsers) {
      // Check if menu already exists
      const [existingMenu] = await connection.execute(`
        SELECT id FROM pic_menu 
        WHERE id_user = ? AND nama = 'DATA INVESTOR' AND status_deleted = 0
      `, [adminUser.id]);
      
      if (existingMenu.length === 0) {
        // Insert new menu
        await connection.execute(`
          INSERT INTO pic_menu (id_user, nama, link, status_deleted, created_at, updated_at)
          VALUES (?, 'DATA INVESTOR', 'AdminDataInvestor', 0, NOW(), NOW())
        `, [adminUser.id]);
        
        console.log(`Added DATA INVESTOR menu for admin user ID: ${adminUser.id}`);
      } else {
        console.log(`DATA INVESTOR menu already exists for admin user ID: ${adminUser.id}`);
      }
    }
    
    console.log("DATA INVESTOR menu seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding DATA INVESTOR menu:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the seeding function
seedDataInvestorMenu()
  .then(() => {
    console.log("Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
