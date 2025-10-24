const { sequelize } = require('./database');
const User = require('../models/User');
const PicMenu = require('../models/PicMenu');
const { updateRoles } = require('../scripts/updateRoles');
const { createChatTables } = require('../scripts/createChatTables');

const syncDatabase = async () => {
  try {
    // Syncing database silently

    // Pastikan tabel chat & user_devices dibuat/diperbaiki dulu (panjang kolom & index aman)
    await createChatTables();

    // Sync semua model - tanpa alter untuk menghindari error "too many keys"
    await sequelize.sync({ force: false, alter: false });

    console.log('✅ Database synced successfully!');
    
    // Cek apakah ada user admin default
    const adminUser = await User.findOne({
      where: {
        username: 'admin',
        status_deleted: false
      }
    });
    
    if (!adminUser) {
      try {
        // Buat user admin default
        await User.create({
          nama: 'Administrator',
          username: 'admin',
          email: 'admin@bosgilgroup.com',
          password: 'admin123',
          role: 'admin',
          status: 'active'
        });
        
        console.log('👤 Default admin user created');
      } catch (createError) {
        if (createError.name === 'SequelizeUniqueConstraintError') {
          console.log('👤 Admin user already exists, skipping creation');
        } else {
          throw createError;
        }
      }
    }
    
    // Update role lama ke role baru
    await updateRoles();
    
  } catch (error) {
    console.error('❌ Error syncing database:', error);
    throw error;
  }
};

module.exports = { syncDatabase }; 