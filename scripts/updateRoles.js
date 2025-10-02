const { sequelize } = require('../config/database');
const User = require('../models/User');

const updateRoles = async () => {
  try {
    // Updating user roles silently
    
    // Update role lama ke role baru
    const updates = [
      // manager -> leader
      { oldRole: 'manager', newRole: 'leader' },
      // supervisor -> leader  
      { oldRole: 'supervisor', newRole: 'leader' },
      // user -> divisi
      { oldRole: 'user', newRole: 'divisi' }
    ];
    
    for (const update of updates) {
      const result = await User.update(
        { role: update.newRole },
        { 
          where: { 
            role: update.oldRole,
            status_deleted: false
          }
        }
      );
      
      // Role update processed silently
    }
    
    console.log('✅ Role update completed!');
    
  } catch (error) {
    console.error('❌ Error updating roles:', error);
    throw error;
  }
};

// Jalankan script jika file ini dijalankan langsung
if (require.main === module) {
  updateRoles()
    .then(() => {
      console.log('🎉 Role migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Role migration failed:', error);
      process.exit(1);
    });
}

module.exports = { updateRoles }; 