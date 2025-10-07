const { sequelize } = require('../config/database');

const createNotificationsTables = async () => {
  try {
    console.log('Creating notification tables...');

    // Create notifications table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        description TEXT NULL,
        sender_id INT NOT NULL,
        sender_name VARCHAR(100) NOT NULL,
        sender_role ENUM('owner', 'admin', 'leader', 'divisi') NOT NULL DEFAULT 'owner',
        
        -- Target information
        target_type ENUM('all_users', 'specific_users', 'role_based') NOT NULL DEFAULT 'all_users',
        target_users JSON NULL COMMENT 'Array of user IDs for specific_users target type',
        target_role VARCHAR(50) NULL COMMENT 'Role name for role_based target type',
        
        -- Notification settings
        priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
        category VARCHAR(50) NOT NULL DEFAULT 'general',
        metadata JSON NULL COMMENT 'Additional data for the notification',
        
        -- Status tracking
        status ENUM('draft', 'sent', 'failed', 'cancelled') NOT NULL DEFAULT 'draft',
        scheduled_at DATETIME NULL COMMENT 'For scheduled notifications',
        sent_at DATETIME NULL,
        sent_count INT NOT NULL DEFAULT 0 COMMENT 'Number of users who received the notification',
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Indexes
        INDEX idx_sender_id (sender_id),
        INDEX idx_target_type (target_type),
        INDEX idx_status (status),
        INDEX idx_priority (priority),
        INDEX idx_created_at (created_at),
        
        -- Foreign key constraint
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ notifications table created successfully');

    // Create user_notifications table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        notification_id INT NOT NULL,
        user_id INT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        read_at DATETIME NULL,
        device_token VARCHAR(500) NULL COMMENT 'Firebase device token for push notification',
        push_sent BOOLEAN NOT NULL DEFAULT FALSE,
        push_sent_at DATETIME NULL,
        push_failed BOOLEAN NOT NULL DEFAULT FALSE,
        push_error TEXT NULL COMMENT 'Error message if push notification failed',
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Indexes
        INDEX idx_notification_id (notification_id),
        INDEX idx_user_id (user_id),
        INDEX idx_is_read (is_read),
        INDEX idx_user_read (user_id, is_read),
        
        -- Unique constraint to prevent duplicate notifications
        UNIQUE KEY unique_notification_user (notification_id, user_id),
        
        -- Foreign key constraints
        FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ user_notifications table created successfully');

    console.log('\n🎉 All notification tables created successfully!');
    console.log('\nTables created:');
    console.log('- notifications: Main notification records');
    console.log('- user_notifications: Individual user notification tracking');

  } catch (error) {
    console.error('❌ Error creating notification tables:', error);
    throw error;
  }
};

// Run the migration
if (require.main === module) {
  createNotificationsTables()
    .then(() => {
      console.log('\n✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = createNotificationsTables;
