const { sequelize } = require('../config/database');
const { Notification, UserNotification, User } = require('../models');

const testNotificationAPI = async () => {
  try {
    console.log('🧪 Testing Notification API...\n');

    // Test 1: Check if tables exist
    console.log('1️⃣ Checking if notification tables exist...');
    
    const [notificationsTable] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'notifications'
    `);
    
    const [userNotificationsTable] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'user_notifications'
    `);

    if (notificationsTable.length > 0) {
      console.log('✅ notifications table exists');
    } else {
      console.log('❌ notifications table does not exist');
    }

    if (userNotificationsTable.length > 0) {
      console.log('✅ user_notifications table exists');
    } else {
      console.log('❌ user_notifications table does not exist');
    }

    // Test 2: Check if we have users to test with
    console.log('\n2️⃣ Checking available users...');
    const users = await User.findAll({
      where: {
        status: 'active',
        status_deleted: false
      },
      attributes: ['id', 'nama', 'role'],
      limit: 5
    });

    console.log(`Found ${users.length} active users:`);
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, Name: ${user.nama}, Role: ${user.role}`);
    });

    if (users.length === 0) {
      console.log('❌ No active users found. Cannot test notification sending.');
      return;
    }

    // Test 3: Create a test notification
    console.log('\n3️⃣ Creating test notification...');
    
    const testNotification = await Notification.create({
      title: 'Test Notification',
      message: 'This is a test notification from the API test script',
      description: 'Testing the notification system functionality',
      sender_id: users[0].id,
      sender_name: users[0].nama,
      sender_role: users[0].role,
      target_type: 'all_users',
      priority: 'medium',
      category: 'test',
      status: 'sent',
      sent_at: new Date()
    });

    console.log(`✅ Test notification created with ID: ${testNotification.id}`);

    // Test 4: Create user notification records
    console.log('\n4️⃣ Creating user notification records...');
    
    const userNotifications = users.map(user => ({
      notification_id: testNotification.id,
      user_id: user.id,
      is_read: false,
      push_sent: false
    }));

    await UserNotification.bulkCreate(userNotifications);
    console.log(`✅ Created ${userNotifications.length} user notification records`);

    // Test 5: Update notification sent count
    console.log('\n5️⃣ Updating notification sent count...');
    await testNotification.update({
      sent_count: users.length
    });
    console.log(`✅ Updated sent_count to ${users.length}`);

    // Test 6: Test queries
    console.log('\n6️⃣ Testing queries...');
    
    // Get notification history
    const notificationHistory = await Notification.findAll({
      where: { status: 'sent' },
      order: [['created_at', 'DESC']],
      limit: 5,
      attributes: ['id', 'title', 'message', 'sender_name', 'sent_count', 'created_at']
    });
    
    console.log(`✅ Found ${notificationHistory.length} sent notifications`);

    // Get user notifications for first user
    const firstUserNotifications = await UserNotification.findAll({
      where: { user_id: users[0].id },
      include: [{
        model: Notification,
        as: 'notification',
        attributes: ['id', 'title', 'message', 'sender_name']
      }],
      order: [['created_at', 'DESC']]
    });

    console.log(`✅ Found ${firstUserNotifications.length} notifications for user ${users[0].nama}`);

    // Test 7: Mark notification as read
    console.log('\n7️⃣ Testing mark as read...');
    const userNotification = await UserNotification.findOne({
      where: {
        notification_id: testNotification.id,
        user_id: users[0].id
      }
    });

    if (userNotification) {
      await userNotification.update({
        is_read: true,
        read_at: new Date()
      });
      console.log('✅ Successfully marked notification as read');
    }

    // Test 8: Get statistics
    console.log('\n8️⃣ Testing statistics...');
    
    const totalNotifications = await Notification.count();
    const sentNotifications = await Notification.count({ where: { status: 'sent' } });
    const userNotificationStats = await UserNotification.findAll({
      where: { user_id: users[0].id },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN is_read = true THEN 1 END')), 'read'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN is_read = false THEN 1 END')), 'unread']
      ],
      raw: true
    });

    console.log('📊 Statistics:');
    console.log(`  - Total notifications: ${totalNotifications}`);
    console.log(`  - Sent notifications: ${sentNotifications}`);
    console.log(`  - User notifications for ${users[0].nama}:`, userNotificationStats[0]);

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Database tables created');
    console.log('✅ Models working correctly');
    console.log('✅ CRUD operations working');
    console.log('✅ Associations working');
    console.log('✅ Statistics queries working');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
};

// Run the test
if (require.main === module) {
  testNotificationAPI()
    .then(() => {
      console.log('\n✅ API test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ API test failed:', error);
      process.exit(1);
    });
}

module.exports = testNotificationAPI;
