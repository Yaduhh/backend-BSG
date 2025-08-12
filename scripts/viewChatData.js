const { sequelize } = require('../config/database');

const viewChatData = async () => {
    try {
        console.log('🔍 Fetching chat data from database...\n');

        // Get all chat rooms
        console.log('📋 CHAT ROOMS:');
        console.log('='.repeat(80));

        const chatRooms = await sequelize.query(`
      SELECT 
        cr.*,
        u1.nama as user1_nama, u1.username as user1_username, u1.email as user1_email,
        u2.nama as user2_nama, u2.username as user2_username, u2.email as user2_email
      FROM chat_rooms cr
      LEFT JOIN users u1 ON cr.user1_id = u1.id
      LEFT JOIN users u2 ON cr.user2_id = u2.id
      ORDER BY cr.last_message_time DESC
    `, { type: sequelize.QueryTypes.SELECT });

        if (chatRooms.length === 0) {
            console.log('❌ No chat rooms found in database');
        } else {
            chatRooms.forEach((room, index) => {
                console.log(`${index + 1}. Room ID: ${room.room_id}`);
                console.log(`   User 1: ${room.user1_nama || room.user1_username || 'Unknown'} (ID: ${room.user1_id})`);
                console.log(`   User 2: ${room.user2_nama || room.user2_username || 'Unknown'} (ID: ${room.user2_id})`);
                console.log(`   Last Message: ${room.last_message || 'No message'}`);
                console.log(`   Last Message Time: ${room.last_message_time || 'Never'}`);
                console.log(`   Unread Count User1: ${room.unread_count_user1 || 0}`);
                console.log(`   Unread Count User2: ${room.unread_count_user2 || 0}`);
                console.log(`   Status Deleted: ${room.status_deleted ? 'Yes' : 'No'}`);
                console.log(`   Created: ${room.created_at}`);
                console.log(`   Updated: ${room.updated_at}`);
                console.log('');
            });
        }

        // Get all messages
        console.log('💬 MESSAGES:');
        console.log('='.repeat(80));

        const messages = await sequelize.query(`
      SELECT 
        m.*,
        u.nama as sender_nama, u.username as sender_username, u.email as sender_email
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      ORDER BY m.created_at DESC
      LIMIT 50
    `, { type: sequelize.QueryTypes.SELECT });

        if (messages.length === 0) {
            console.log('❌ No messages found in database');
        } else {
            console.log(`📊 Total messages found: ${messages.length} (showing last 50)`);
            console.log('');

            messages.forEach((message, index) => {
                console.log(`${index + 1}. Message ID: ${message.id}`);
                console.log(`   Room ID: ${message.room_id}`);
                console.log(`   Sender: ${message.sender_nama || message.sender_username || 'Unknown'} (ID: ${message.sender_id})`);
                console.log(`   Message: ${message.message}`);
                console.log(`   Type: ${message.message_type || 'text'}`);
                console.log(`   Is Read: ${message.is_read ? 'Yes' : 'No'}`);
                console.log(`   Is Group Message: ${message.is_group_message ? 'Yes' : 'No'}`);
                console.log(`   Status Deleted: ${message.status_deleted ? 'Yes' : 'No'}`);
                console.log(`   Created: ${message.created_at}`);
                console.log(`   Updated: ${message.updated_at}`);
                console.log('');
            });
        }

        // Get message count by room
        console.log('📈 MESSAGE COUNT BY ROOM:');
        console.log('='.repeat(80));

        const messageCounts = await sequelize.query(`
      SELECT 
        room_id,
        COUNT(*) as message_count,
        MAX(created_at) as last_message_time
      FROM messages 
      WHERE status_deleted = 0
      GROUP BY room_id 
      ORDER BY last_message_time DESC
    `, { type: sequelize.QueryTypes.SELECT });

        if (messageCounts.length === 0) {
            console.log('❌ No message counts found');
        } else {
            messageCounts.forEach((count, index) => {
                console.log(`${index + 1}. Room: ${count.room_id}`);
                console.log(`   Messages: ${count.message_count}`);
                console.log(`   Last Message: ${count.last_message_time}`);
                console.log('');
            });
        }

        // Get user statistics
        console.log('👥 USER CHAT STATISTICS:');
        console.log('='.repeat(80));

        const userStats = await sequelize.query(`
      SELECT 
        m.sender_id,
        COUNT(*) as message_count,
        MAX(m.created_at) as last_message_time,
        u.nama as user_nama,
        u.username as user_username
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.status_deleted = 0
      GROUP BY m.sender_id, u.nama, u.username
      ORDER BY message_count DESC
    `, { type: sequelize.QueryTypes.SELECT });

        if (userStats.length === 0) {
            console.log('❌ No user statistics found');
        } else {
            console.log(`📊 Total users with messages: ${userStats.length}`);
            console.log('');

            userStats.forEach((stat, index) => {
                const userName = stat.user_nama || stat.user_username || 'Unknown User';
                console.log(`${index + 1}. User: ${userName} (ID: ${stat.sender_id})`);
                console.log(`   Messages: ${stat.message_count}`);
                console.log(`   Last Message: ${stat.last_message_time}`);
                console.log('');
            });
        }

        // Get total counts
        console.log('📊 DATABASE SUMMARY:');
        console.log('='.repeat(80));

        const totalRooms = await sequelize.query('SELECT COUNT(*) as count FROM chat_rooms WHERE status_deleted = 0', { type: sequelize.QueryTypes.SELECT });
        const totalMessages = await sequelize.query('SELECT COUNT(*) as count FROM messages WHERE status_deleted = 0', { type: sequelize.QueryTypes.SELECT });
        const totalUsers = await sequelize.query('SELECT COUNT(*) as count FROM users WHERE status_deleted = 0', { type: sequelize.QueryTypes.SELECT });

        console.log(`Total Chat Rooms: ${totalRooms[0].count}`);
        console.log(`Total Messages: ${totalMessages[0].count}`);
        console.log(`Total Users: ${totalUsers[0].count}`);
        console.log('');

        console.log('✅ Chat data analysis complete!');

    } catch (error) {
        console.error('❌ Error viewing chat data:', error);
    } finally {
        await sequelize.close();
    }
};

// Run the script
viewChatData(); 