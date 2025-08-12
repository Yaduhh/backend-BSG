const { sequelize } = require('../config/database');

const testChatMessage = async () => {
    try {
        console.log('🧪 Testing chat message functionality...\n');

        // Get all users
        const users = await sequelize.query(`
      SELECT id, nama, username, email 
      FROM users 
      WHERE status_deleted = 0
    `, { type: sequelize.QueryTypes.SELECT });

        console.log('👥 Available users:');
        users.forEach(user => {
            console.log(`   - ID: ${user.id}, Name: ${user.nama || user.username}, Email: ${user.email}`);
        });

        if (users.length < 2) {
            console.log('❌ Need at least 2 users to test chat');
            return;
        }

        const user1 = users[0];
        const user2 = users[1];

        console.log(`\n🔍 Testing chat between ${user1.nama || user1.username} and ${user2.nama || user2.username}`);

        // Create or find chat room
        const roomId = `${Math.min(user1.id, user2.id)}_${Math.max(user1.id, user2.id)}`;

        const existingRoom = await sequelize.query(`
      SELECT * FROM chat_rooms WHERE room_id = ?
    `, {
            replacements: [roomId],
            type: sequelize.QueryTypes.SELECT
        });

        let chatRoom;
        if (existingRoom.length === 0) {
            console.log('📝 Creating new chat room...');
            await sequelize.query(`
        INSERT INTO chat_rooms (room_id, user1_id, user2_id, last_message, last_message_time, status_deleted, unread_count_user1, unread_count_user2, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, {
                replacements: [
                    roomId,
                    Math.min(user1.id, user2.id),
                    Math.max(user1.id, user2.id),
                    'Test message',
                    new Date(),
                    0,
                    0,
                    0
                ]
            });
            console.log('✅ Chat room created');
        } else {
            console.log('✅ Chat room already exists');
            chatRoom = existingRoom[0];
        }

        // Send test message
        console.log('\n💬 Sending test message...');
        const testMessage = `Test message from ${user1.nama || user1.username} at ${new Date().toLocaleString()}`;

        const insertResult = await sequelize.query(`
      INSERT INTO messages (room_id, sender_id, message, message_type, is_read, status_deleted, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, {
            replacements: [
                roomId,
                user1.id,
                testMessage,
                'text',
                false,
                0
            ]
        });

        console.log('✅ Test message created');

        // Get the inserted message ID
        const messageId = insertResult[0].insertId;
        console.log('✅ Message ID:', messageId);

        if (!messageId) {
            console.log('❌ Failed to get message ID, trying to get the latest message...');
            const latestMessage = await sequelize.query(`
        SELECT id FROM messages WHERE room_id = ? ORDER BY created_at DESC LIMIT 1
      `, {
                replacements: [roomId],
                type: sequelize.QueryTypes.SELECT
            });

            if (latestMessage.length > 0) {
                const actualMessageId = latestMessage[0].id;
                console.log('✅ Found latest message ID:', actualMessageId);

                // Update chat room last message
                await sequelize.query(`
          UPDATE chat_rooms 
          SET last_message = ?, last_message_time = NOW()
          WHERE room_id = ?
        `, {
                    replacements: [testMessage, roomId]
                });

                console.log('✅ Chat room updated with last message');

                // Verify message was saved
                const savedMessage = await sequelize.query(`
          SELECT m.*, u.nama as sender_nama, u.username as sender_username
          FROM messages m
          LEFT JOIN users u ON m.sender_id = u.id
          WHERE m.id = ?
        `, {
                    replacements: [actualMessageId],
                    type: sequelize.QueryTypes.SELECT
                });

                if (savedMessage.length > 0) {
                    const msg = savedMessage[0];
                    console.log('\n✅ Message verification:');
                    console.log(`   - ID: ${msg.id}`);
                    console.log(`   - Room: ${msg.room_id}`);
                    console.log(`   - Sender: ${msg.sender_nama || msg.sender_username} (ID: ${msg.sender_id})`);
                    console.log(`   - Message: ${msg.message}`);
                    console.log(`   - Created: ${msg.created_at}`);
                } else {
                    console.log('❌ Message not found after creation');
                }

                // Get all messages for this room
                const roomMessages = await sequelize.query(`
          SELECT m.*, u.nama as sender_nama, u.username as sender_username
          FROM messages m
          LEFT JOIN users u ON m.sender_id = u.id
          WHERE m.room_id = ? AND m.status_deleted = 0
          ORDER BY m.created_at ASC
        `, {
                    replacements: [roomId],
                    type: sequelize.QueryTypes.SELECT
                });

                console.log(`\n📊 Room ${roomId} has ${roomMessages.length} messages:`);
                roomMessages.forEach((msg, index) => {
                    console.log(`   ${index + 1}. [${new Date(msg.created_at).toLocaleString()}] ${msg.sender_nama || msg.sender_username}: ${msg.message}`);
                });

                // Test auto-increment
                console.log('\n🔄 Testing auto-increment...');
                const maxIdResult = await sequelize.query(`
          SELECT MAX(id) as max_id FROM messages
        `, { type: sequelize.QueryTypes.SELECT });

                const maxId = maxIdResult[0].max_id;
                console.log(`   - Current max message ID: ${maxId}`);
                console.log(`   - Next message ID will be: ${maxId + 1}`);

                console.log('\n🎉 Chat message test completed successfully!');
                console.log('💡 You can now test sending messages from the frontend');
            } else {
                console.log('❌ No messages found in room');
            }
        } else {
            // Update chat room last message
            await sequelize.query(`
        UPDATE chat_rooms 
        SET last_message = ?, last_message_time = NOW()
        WHERE room_id = ?
      `, {
                replacements: [testMessage, roomId]
            });

            console.log('✅ Chat room updated with last message');

            // Verify message was saved
            const savedMessage = await sequelize.query(`
        SELECT m.*, u.nama as sender_nama, u.username as sender_username
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.id
        WHERE m.id = ?
      `, {
                replacements: [messageId],
                type: sequelize.QueryTypes.SELECT
            });

            if (savedMessage.length > 0) {
                const msg = savedMessage[0];
                console.log('\n✅ Message verification:');
                console.log(`   - ID: ${msg.id}`);
                console.log(`   - Room: ${msg.room_id}`);
                console.log(`   - Sender: ${msg.sender_nama || msg.sender_username} (ID: ${msg.sender_id})`);
                console.log(`   - Message: ${msg.message}`);
                console.log(`   - Created: ${msg.created_at}`);
            } else {
                console.log('❌ Message not found after creation');
            }

            // Get all messages for this room
            const roomMessages = await sequelize.query(`
        SELECT m.*, u.nama as sender_nama, u.username as sender_username
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.id
        WHERE m.room_id = ? AND m.status_deleted = 0
        ORDER BY m.created_at ASC
      `, {
                replacements: [roomId],
                type: sequelize.QueryTypes.SELECT
            });

            console.log(`\n📊 Room ${roomId} has ${roomMessages.length} messages:`);
            roomMessages.forEach((msg, index) => {
                console.log(`   ${index + 1}. [${new Date(msg.created_at).toLocaleString()}] ${msg.sender_nama || msg.sender_username}: ${msg.message}`);
            });

            // Test auto-increment
            console.log('\n🔄 Testing auto-increment...');
            const maxIdResult = await sequelize.query(`
        SELECT MAX(id) as max_id FROM messages
      `, { type: sequelize.QueryTypes.SELECT });

            const maxId = maxIdResult[0].max_id;
            console.log(`   - Current max message ID: ${maxId}`);
            console.log(`   - Next message ID will be: ${maxId + 1}`);

            console.log('\n🎉 Chat message test completed successfully!');
            console.log('💡 You can now test sending messages from the frontend');
        }

    } catch (error) {
        console.error('❌ Error testing chat message:', error);
    } finally {
        await sequelize.close();
    }
};

// Run the test
testChatMessage(); 