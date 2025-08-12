const { sequelize } = require('../config/database');

const fixChatData = async () => {
    try {
        console.log('🔧 Fixing chat data issues...\n');

        // Check for messages with ID = 0
        console.log('🔍 Checking for messages with ID = 0...');
        const messagesWithZeroId = await sequelize.query(`
      SELECT * FROM messages WHERE id = 0
    `, { type: sequelize.QueryTypes.SELECT });

        if (messagesWithZeroId.length > 0) {
            console.log(`❌ Found ${messagesWithZeroId.length} messages with ID = 0`);
            messagesWithZeroId.forEach(msg => {
                console.log(`   - Room: ${msg.room_id}, Sender: ${msg.sender_id}, Message: ${msg.message}`);
            });

            // Delete messages with ID = 0
            console.log('\n🗑️ Deleting messages with ID = 0...');
            await sequelize.query(`
        DELETE FROM messages WHERE id = 0
      `);
            console.log('✅ Messages with ID = 0 deleted successfully');
        } else {
            console.log('✅ No messages with ID = 0 found');
        }

        // Check for duplicate room IDs
        console.log('\n🔍 Checking for duplicate room IDs...');
        const duplicateRooms = await sequelize.query(`
      SELECT room_id, COUNT(*) as count
      FROM chat_rooms 
      GROUP BY room_id 
      HAVING COUNT(*) > 1
    `, { type: sequelize.QueryTypes.SELECT });

        if (duplicateRooms.length > 0) {
            console.log(`❌ Found ${duplicateRooms.length} duplicate room IDs`);
            duplicateRooms.forEach(room => {
                console.log(`   - Room ID: ${room.room_id} (${room.count} duplicates)`);
            });

            // Keep only the most recent room for each duplicate
            console.log('\n🔧 Fixing duplicate rooms...');
            for (const duplicate of duplicateRooms) {
                await sequelize.query(`
          DELETE cr1 FROM chat_rooms cr1
          INNER JOIN chat_rooms cr2 
          WHERE cr1.room_id = cr2.room_id 
          AND cr1.id < cr2.id
          AND cr1.room_id = ?
        `, { replacements: [duplicate.room_id] });
            }
            console.log('✅ Duplicate rooms fixed');
        } else {
            console.log('✅ No duplicate room IDs found');
        }

        // Reset auto-increment for messages table
        console.log('\n🔄 Resetting auto-increment for messages table...');
        const maxMessageId = await sequelize.query(`
      SELECT MAX(id) as max_id FROM messages
    `, { type: sequelize.QueryTypes.SELECT });

        const nextId = (maxMessageId[0].max_id || 0) + 1;
        await sequelize.query(`
      ALTER TABLE messages AUTO_INCREMENT = ?
    `, { replacements: [nextId] });
        console.log(`✅ Messages auto-increment reset to ${nextId}`);

        // Reset auto-increment for chat_rooms table
        console.log('\n🔄 Resetting auto-increment for chat_rooms table...');
        const maxRoomId = await sequelize.query(`
      SELECT MAX(id) as max_id FROM chat_rooms
    `, { type: sequelize.QueryTypes.SELECT });

        const nextRoomId = (maxRoomId[0].max_id || 0) + 1;
        await sequelize.query(`
      ALTER TABLE chat_rooms AUTO_INCREMENT = ?
    `, { replacements: [nextRoomId] });
        console.log(`✅ Chat rooms auto-increment reset to ${nextRoomId}`);

        // Clean up orphaned messages (messages without corresponding rooms)
        console.log('\n🧹 Cleaning up orphaned messages...');
        const orphanedMessages = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM messages m
      LEFT JOIN chat_rooms cr ON m.room_id = cr.room_id
      WHERE cr.room_id IS NULL
    `, { type: sequelize.QueryTypes.SELECT });

        if (orphanedMessages[0].count > 0) {
            console.log(`❌ Found ${orphanedMessages[0].count} orphaned messages`);
            await sequelize.query(`
        DELETE m FROM messages m
        LEFT JOIN chat_rooms cr ON m.room_id = cr.room_id
        WHERE cr.room_id IS NULL
      `);
            console.log('✅ Orphaned messages cleaned up');
        } else {
            console.log('✅ No orphaned messages found');
        }

        // Final summary
        console.log('\n📊 FINAL SUMMARY:');
        console.log('='.repeat(50));

        const finalRooms = await sequelize.query('SELECT COUNT(*) as count FROM chat_rooms WHERE status_deleted = 0', { type: sequelize.QueryTypes.SELECT });
        const finalMessages = await sequelize.query('SELECT COUNT(*) as count FROM messages WHERE status_deleted = 0', { type: sequelize.QueryTypes.SELECT });

        console.log(`Total Chat Rooms: ${finalRooms[0].count}`);
        console.log(`Total Messages: ${finalMessages[0].count}`);
        console.log('');

        console.log('✅ Chat data fix completed successfully!');
        console.log('🎉 Database is now clean and ready for chat operations');

    } catch (error) {
        console.error('❌ Error fixing chat data:', error);
    } finally {
        await sequelize.close();
    }
};

// Run the script
fixChatData(); 