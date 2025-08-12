const { sequelize } = require('../config/database');

const cleanDatabase = async () => {
    try {
        console.log('🧹 Comprehensive database cleaning...\n');

        // Step 1: Delete all messages with ID = 0
        console.log('🗑️ Step 1: Deleting messages with ID = 0...');
        const deleteResult = await sequelize.query(`
            DELETE FROM messages WHERE id = 0
        `);
        console.log(`✅ Deleted ${deleteResult[0].affectedRows} messages with ID = 0`);

        // Step 2: Get current max ID
        console.log('\n📊 Step 2: Checking current max message ID...');
        const maxIdResult = await sequelize.query(`
            SELECT MAX(id) as max_id FROM messages
        `, { type: sequelize.QueryTypes.SELECT });

        const maxId = maxIdResult[0].max_id || 0;
        const nextId = maxId + 1;
        console.log(`   - Current max ID: ${maxId}`);
        console.log(`   - Next ID should be: ${nextId}`);

        // Step 3: Reset auto-increment to next ID
        console.log('\n🔄 Step 3: Resetting auto-increment...');
        await sequelize.query(`
            ALTER TABLE messages AUTO_INCREMENT = ?
        `, { replacements: [nextId] });
        console.log(`✅ Auto-increment reset to ${nextId}`);

        // Step 4: Verify no messages with ID = 0
        console.log('\n🔍 Step 4: Verifying no messages with ID = 0...');
        const checkResult = await sequelize.query(`
            SELECT COUNT(*) as count FROM messages WHERE id = 0
        `, { type: sequelize.QueryTypes.SELECT });

        if (checkResult[0].count === 0) {
            console.log('✅ No messages with ID = 0 found');
        } else {
            console.log(`❌ Still found ${checkResult[0].count} messages with ID = 0`);
        }

        // Step 5: Get final summary
        console.log('\n📊 Step 5: Final database summary...');
        const totalMessages = await sequelize.query(`
            SELECT COUNT(*) as count FROM messages WHERE status_deleted = 0
        `, { type: sequelize.QueryTypes.SELECT });

        const totalRooms = await sequelize.query(`
            SELECT COUNT(*) as count FROM chat_rooms WHERE status_deleted = 0
        `, { type: sequelize.QueryTypes.SELECT });

        console.log(`   - Total Messages: ${totalMessages[0].count}`);
        console.log(`   - Total Chat Rooms: ${totalRooms[0].count}`);
        console.log(`   - Next Message ID: ${nextId}`);

        // Step 6: Test insert to verify auto-increment
        console.log('\n🧪 Step 6: Testing auto-increment...');
        try {
            const testInsert = await sequelize.query(`
                INSERT INTO messages (room_id, sender_id, message, message_type, is_read, status_deleted, created_at, updated_at)
                VALUES ('test_room', 1, 'Test message for auto-increment', 'text', false, 0, NOW(), NOW())
            `);

            const testId = testInsert[0].insertId;
            console.log(`✅ Test insert successful with ID: ${testId}`);

            // Delete the test message
            await sequelize.query(`
                DELETE FROM messages WHERE id = ?
            `, { replacements: [testId] });
            console.log('✅ Test message deleted');

        } catch (testError) {
            console.error('❌ Test insert failed:', testError.message);
        }

        console.log('\n🎉 Database cleaning completed successfully!');
        console.log('💡 Auto-increment should now work correctly');

    } catch (error) {
        console.error('❌ Error cleaning database:', error);
    } finally {
        await sequelize.close();
    }
};

// Run the cleaning script
cleanDatabase(); 