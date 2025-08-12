const { sequelize } = require('../config/database');

const rebuildMessagesTable = async () => {
    try {
        console.log('🔧 Rebuilding messages table to fix auto-increment...\n');

        // Step 1: Backup existing messages
        console.log('📦 Step 1: Backing up existing messages...');
        const existingMessages = await sequelize.query(`
            SELECT * FROM messages WHERE status_deleted = 0
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log(`   - Found ${existingMessages.length} messages to backup`);

        // Step 2: Drop and recreate messages table
        console.log('\n🗑️ Step 2: Dropping messages table...');
        await sequelize.query(`DROP TABLE IF EXISTS messages`);
        console.log('✅ Messages table dropped');

        // Step 3: Create new messages table
        console.log('\n🏗️ Step 3: Creating new messages table...');
        await sequelize.query(`
            CREATE TABLE messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                room_id VARCHAR(255) NOT NULL,
                sender_id INT NOT NULL,
                message TEXT NOT NULL,
                message_type VARCHAR(50) DEFAULT 'text',
                is_group_message BOOLEAN DEFAULT FALSE,
                is_read BOOLEAN DEFAULT FALSE,
                status_deleted BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_room_id (room_id),
                INDEX idx_sender_id (sender_id),
                INDEX idx_created_at (created_at)
            )
        `);
        console.log('✅ New messages table created');

        // Step 4: Restore messages with new IDs
        console.log('\n📥 Step 4: Restoring messages...');
        let restoredCount = 0;
        
        for (const message of existingMessages) {
            try {
                await sequelize.query(`
                    INSERT INTO messages (room_id, sender_id, message, message_type, is_group_message, is_read, status_deleted, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, {
                    replacements: [
                        message.room_id,
                        message.sender_id,
                        message.message,
                        message.message_type || 'text',
                        message.is_group_message || false,
                        message.is_read || false,
                        message.status_deleted || false,
                        message.created_at,
                        message.updated_at
                    ]
                });
                restoredCount++;
            } catch (error) {
                console.error(`   - Error restoring message: ${error.message}`);
            }
        }
        
        console.log(`✅ Restored ${restoredCount} messages`);

        // Step 5: Verify auto-increment
        console.log('\n🔍 Step 5: Verifying auto-increment...');
        const autoIncrementResult = await sequelize.query(`
            SELECT AUTO_INCREMENT 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'sistem_bosgil_group' 
            AND TABLE_NAME = 'messages'
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log(`   - AUTO_INCREMENT: ${autoIncrementResult[0].AUTO_INCREMENT}`);

        // Step 6: Test insert
        console.log('\n🧪 Step 6: Testing insert...');
        try {
            const testInsert = await sequelize.query(`
                INSERT INTO messages (room_id, sender_id, message, message_type, is_read, status_deleted)
                VALUES ('test_room', 1, 'Test message after rebuild', 'text', false, false)
            `);
            
            const testId = testInsert[0].insertId;
            console.log(`✅ Test insert successful with ID: ${testId}`);
            
            // Delete test message
            await sequelize.query(`
                DELETE FROM messages WHERE id = ?
            `, { replacements: [testId] });
            console.log('✅ Test message deleted');
            
        } catch (testError) {
            console.error('❌ Test insert failed:', testError.message);
        }

        // Step 7: Final summary
        console.log('\n📊 Step 7: Final summary...');
        const finalCount = await sequelize.query(`
            SELECT COUNT(*) as count FROM messages WHERE status_deleted = 0
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log(`   - Total messages: ${finalCount[0].count}`);
        console.log(`   - Next message ID: ${autoIncrementResult[0].AUTO_INCREMENT}`);

        console.log('\n🎉 Messages table rebuild completed successfully!');
        console.log('💡 Auto-increment should now work correctly');

    } catch (error) {
        console.error('❌ Error rebuilding messages table:', error);
    } finally {
        await sequelize.close();
    }
};

// Run the rebuild
rebuildMessagesTable(); 