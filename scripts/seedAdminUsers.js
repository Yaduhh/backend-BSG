const { sequelize } = require('../config/database');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedAdminUsers = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful.');

    // Check if admin users already exist
    const existingAdmins = await User.findAll({
      where: {
        role: 'admin',
        status_deleted: false
      }
    });

    if (existingAdmins.length > 0) {
      console.log(`✅ Found ${existingAdmins.length} existing admin users:`);
      existingAdmins.forEach(admin => {
        console.log(`   - ${admin.nama} (${admin.email}) - ${admin.status}`);
      });
      return;
    }

    // Create admin users
    const adminUsers = [
      {
        nama: 'Admin Keuangan',
        username: 'admin_keuangan',
        email: 'admin.keuangan@bosgil.com',
        password: 'password123',
        role: 'admin',
        status: 'active'
      },
      {
        nama: 'Admin SDM',
        username: 'admin_sdm',
        email: 'admin.sdm@bosgil.com',
        password: 'password123',
        role: 'admin',
        status: 'active'
      },
      {
        nama: 'Admin Operasional',
        username: 'admin_operasional',
        email: 'admin.operasional@bosgil.com',
        password: 'password123',
        role: 'admin',
        status: 'active'
      },
      {
        nama: 'Admin Marketing',
        username: 'admin_marketing',
        email: 'admin.marketing@bosgil.com',
        password: 'password123',
        role: 'admin',
        status: 'active'
      }
    ];

    console.log('🌱 Creating admin users...');
    
    for (const userData of adminUsers) {
      const existingUser = await User.findOne({
        where: {
          [require('sequelize').Op.or]: [
            { username: userData.username },
            { email: userData.email }
          ],
          status_deleted: false
        }
      });

      if (!existingUser) {
        const user = await User.create(userData);
        console.log(`✅ Created admin user: ${user.nama} (${user.email})`);
      } else {
        console.log(`⚠️  Admin user already exists: ${existingUser.nama} (${existingUser.email})`);
      }
    }

    console.log('✅ Admin users seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding admin users:', error);
  } finally {
    await sequelize.close();
  }
};

// Run the seeding
seedAdminUsers(); 