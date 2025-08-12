const { sequelize } = require('../config/database');

const fixAutoIncrement = async () => {
    try {
        console.log('🔧 Fixing auto-increment issue...\n');

        // Step 1: Check current auto-increment value
        console.log('📊 Step 1: Checking current auto-increment...');
        const autoIncrementResult = await sequelize.query(`
            SELECT AUTO_INCREMENT 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'sistem_bosgil_group' 
            AND TABLE_NAME = 'messages'
        `, { type: sequelize.QueryTypes.SELECT });

        console.log(`   - Current AUTO_INCREMENT: ${autoIncrementResult[0].AUTO_INCREMENT}`);

        // Step 2: Get max ID
        console.log('\n📊 Step 2: Getting max message ID...');
        const maxIdResult = await sequelize.query(`
            SELECT MAX(id) as max_id FROM messages
        `, { type: sequelize.QueryTypes.SELECT });

        const maxId = maxIdResult[0].max_id || 0;
        console.log(`   - Max ID: ${maxId}`);

        // Step 3: Check for any messages with ID = 0
        console.log('\n🔍 Step 3: Checking for messages with ID = 0...');
        const zeroIdResult = await sequelize.query(`
            SELECT COUNT(*) as count FROM messages WHERE id = 0
        `, { type: sequelize.QueryTypes.SELECT });

        if (zeroIdResult[0].count > 0) {
            console.log(`   - Found ${zeroIdResult[0].count} messages with ID = 0`);

            // Delete messages with ID = 0
            console.log('   - Deleting messages with ID = 0...');
            await sequelize.query(`
                DELETE FROM messages WHERE id = 0
            `);
            console.log('   - Messages with ID = 0 deleted');
        } else {
            console.log('   - No messages with ID = 0 found');
        }

        // Step 4: Set auto-increment to max ID + 1
        const nextId = maxId + 1;
        console.log(`\n🔄 Step 4: Setting auto-increment to ${nextId}...`);

        await sequelize.query(`
            ALTER TABLE messages AUTO_INCREMENT = ?
        `, { replacements: [nextId] });

        console.log(`✅ Auto-increment set to ${nextId}`);

        // Step 5: Verify the fix
        console.log('\n🔍 Step 5: Verifying the fix...');
        const verifyResult = await sequelize.query(`
            SELECT AUTO_INCREMENT 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'sistem_bosgil_group' 
            AND TABLE_NAME = 'messages'
        `, { type: sequelize.QueryTypes.SELECT });

        console.log(`   - New AUTO_INCREMENT: ${verifyResult[0].AUTO_INCREMENT}`);

        // Step 6: Test insert
        console.log('\n🧪 Step 6: Testing insert...');
        try {
            const testInsert = await sequelize.query(`
                INSERT INTO messages (room_id, sender_id, message, message_type, is_read, status_deleted, created_at, updated_at)
                VALUES ('test_room', 1, 'Test message', 'text', false, 0, NOW(), NOW())
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

        console.log('\n🎉 Auto-increment fix completed!');
        console.log('💡 Next message will have ID:', nextId);

    } catch (error) {
        console.error('❌ Error fixing auto-increment:', error);
    } finally {
        await sequelize.close();
    }
};

// Run the fix
fixAutoIncrement(); 